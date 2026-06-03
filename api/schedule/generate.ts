import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth-middleware';
import { db } from '../_lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { GoogleAuth } from 'google-auth-library';

const SOLVER_URL = process.env.CLOUD_RUN_SOLVER_URL!;

async function getCloudRunToken(targetUrl: string): Promise<string> {
  const gauth = new GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  });
  const client = await gauth.getIdTokenClient(targetUrl);
  const headers = await client.getRequestHeaders();
  return (headers['Authorization'] as string).replace('Bearer ', '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let ctx;
  try {
    ctx = await requireAuth(req);
  } catch (e: any) {
    return res.status(e.statusCode ?? 401).json({ error: e.message });
  }

  const { weekKey, workers, shifts, coverage, constraints, boundary } = req.body ?? {};

  if (!weekKey || !Array.isArray(workers) || workers.length === 0) {
    return res.status(400).json({ error: 'Se necesita al menos un trabajador para generar el horario.' });
  }
  if (!Array.isArray(shifts) || shifts.length === 0) {
    return res.status(400).json({ error: 'Se necesita al menos una franja horaria configurada.' });
  }
  if (!SOLVER_URL) {
    return res.status(503).json({ error: 'El solver no está configurado en este entorno.' });
  }

  try {
    // Rate limit: 1 active job per org at a time
    const activeJobs = await db
      .collection('organizations').doc(ctx.orgId)
      .collection('jobs')
      .where('status', 'in', ['pending', 'running'])
      .limit(1)
      .get();

    if (!activeJobs.empty) {
      return res.status(429).json({ error: 'Ya hay un cálculo en progreso. Espera a que termine antes de generar otro.' });
    }

    // Create job document in Firestore
    const jobRef = db
      .collection('organizations').doc(ctx.orgId)
      .collection('jobs').doc();

    const jobId = jobRef.id;

    await jobRef.set({
      org_id: ctx.orgId,
      status: 'pending',
      created_at: FieldValue.serverTimestamp(),
      completed_at: null,
      input: { week_key: weekKey, workers, shifts, coverage, constraints, boundary: boundary ?? {} },
      result: null,
      infeasibility_reasons: null,
      error: null,
    });

    // Fire-and-forget to Cloud Run (authenticated with service account)
    getCloudRunToken(SOLVER_URL).then((token) =>
      fetch(`${SOLVER_URL}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ job_id: jobId, org_id: ctx.orgId }),
      })
    ).catch((err) => {
      console.error('Cloud Run call failed:', err);
      db.collection('organizations').doc(ctx.orgId)
        .collection('jobs').doc(jobId)
        .update({ status: 'error', error: 'No se pudo contactar al solver.', completed_at: new Date() })
        .catch(() => {});
    });

    return res.status(202).json({ job_id: jobId });
  } catch (e: any) {
    console.error('generate error:', e);
    return res.status(500).json({ error: 'Error interno al crear el job. Intenta nuevamente.' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { waitUntil } from '@vercel/functions';
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

  const { weekKey, weekKeys, workers, shifts, coverage, constraints, boundary } = req.body ?? {};

  // One job covers the whole period: a list of ISO weeks (or a single legacy week).
  const weeks: string[] = Array.isArray(weekKeys) && weekKeys.length > 0
    ? weekKeys
    : (weekKey ? [weekKey] : []);

  if (weeks.length === 0 || !Array.isArray(workers) || workers.length === 0) {
    return res.status(400).json({ error: 'Se necesita al menos un trabajador y una semana para generar el horario.' });
  }
  if (!Array.isArray(shifts) || shifts.length === 0) {
    return res.status(400).json({ error: 'Se necesita al menos una franja horaria configurada.' });
  }
  if (!SOLVER_URL) {
    return res.status(503).json({ error: 'El solver no está configurado en este entorno.' });
  }

  try {
    // Fetch Cloud Run token early (in parallel with rate limit check) to minimize
    // the window where the job sits in 'pending' before Cloud Run is called.
    const tokenPromise = getCloudRunToken(SOLVER_URL);

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

    // Await token now — by the time job creation finishes it's usually ready
    let token: string;
    try {
      token = await tokenPromise;
    } catch (err) {
      console.error('Cloud Run token error:', err);
      return res.status(503).json({ error: 'El solver no está disponible temporalmente.' });
    }

    await jobRef.set({
      org_id: ctx.orgId,
      status: 'pending',
      created_at: FieldValue.serverTimestamp(),
      completed_at: null,
      input: { week_keys: weeks, workers, shifts, coverage, constraints, boundary: boundary ?? {} },
      result: null,
      infeasibility_reasons: null,
      error: null,
    });

    // waitUntil keeps the Vercel function alive until the fetch completes,
    // preventing Vercel from freezing the background task after the response is sent.
    waitUntil(
      fetch(`${SOLVER_URL}/solve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ job_id: jobId, org_id: ctx.orgId }),
      }).catch((err) => {
        console.error('Cloud Run call failed:', err);
        db.collection('organizations').doc(ctx.orgId)
          .collection('jobs').doc(jobId)
          .update({ status: 'error', error: 'No se pudo contactar al solver.', completed_at: new Date() })
          .catch(() => {});
      })
    );

    return res.status(202).json({ job_id: jobId });
  } catch (e: any) {
    console.error('generate error:', e);
    return res.status(500).json({ error: 'Error interno al crear el job. Intenta nuevamente.' });
  }
}

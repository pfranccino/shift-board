import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth-middleware';
import { db } from '../_lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const SOLVER_URL = process.env.CLOUD_RUN_SOLVER_URL!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let ctx;
  try {
    ctx = await requireAuth(req);
  } catch (e: any) {
    return res.status(e.statusCode ?? 401).json({ error: e.message });
  }

  const { weekKey, workers, shifts, coverage, constraints, boundary } = req.body ?? {};

  if (!weekKey || !workers || !shifts) {
    return res.status(400).json({ error: 'weekKey, workers and shifts are required' });
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

  // Fire-and-forget to Cloud Run — Vercel will end the function after responding
  // Cloud Run authenticates via IAM (service account attached to Cloud Run has invoker role)
  fetch(`${SOLVER_URL}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, org_id: ctx.orgId }),
  }).catch(() => { /* Cloud Run will update Firestore on its own */ });

  return res.status(202).json({ job_id: jobId });
}

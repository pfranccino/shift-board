import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../../_lib/auth-middleware';
import { db } from '../../_lib/firebase-admin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let ctx;
  try {
    ctx = await requireAuth(req);
  } catch (e: any) {
    return res.status(e.statusCode ?? 401).json({ error: e.message });
  }

  const { jobId } = req.query;
  if (!jobId || typeof jobId !== 'string') {
    return res.status(400).json({ error: 'jobId is required' });
  }

  const doc = await db
    .collection('organizations').doc(ctx.orgId)
    .collection('jobs').doc(jobId)
    .get();

  if (!doc.exists) return res.status(404).json({ error: 'Job not found' });

  const data = doc.data()!;
  return res.json({
    job_id: jobId,
    status: data.status,
    result: data.result ?? null,
    infeasibility_reasons: data.infeasibility_reasons ?? null,
    error: data.error ?? null,
  });
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAuth } from '../_lib/auth-middleware';
import { db } from '../_lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let ctx;
  try {
    ctx = await requireAuth(req);
  } catch (e: any) {
    return res.status(e.statusCode ?? 401).json({ error: e.message });
  }

  const col = db.collection('organizations').doc(ctx.orgId).collection('workers');

  if (req.method === 'GET') {
    const snap = await col.get();
    return res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  }

  if (req.method === 'POST') {
    const data = req.body;
    if (!data?.name) return res.status(400).json({ error: 'name is required' });
    const ref = col.doc();
    await ref.set({ ...data, created_at: FieldValue.serverTimestamp() });
    return res.status(201).json({ id: ref.id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

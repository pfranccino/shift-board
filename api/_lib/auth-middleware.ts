import type { IncomingMessage } from 'http';
import { auth, db } from './firebase-admin';

export interface AuthContext {
  uid: string;
  orgId: string;
}

export async function requireAuth(req: IncomingMessage): Promise<AuthContext> {
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw Object.assign(new Error('Missing Authorization header'), { statusCode: 401 });
  }

  const decoded = await auth.verifyIdToken(token);

  const snap = await db.collection('memberships')
    .where('userId', '==', decoded.uid)
    .limit(1)
    .get();

  if (snap.empty) {
    throw Object.assign(new Error('Usuario sin organización asignada'), { statusCode: 403 });
  }

  return { uid: decoded.uid, orgId: snap.docs[0].data().orgId as string };
}

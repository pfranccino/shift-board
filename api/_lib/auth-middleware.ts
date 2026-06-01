import type { IncomingMessage } from 'http';
import { auth } from './firebase-admin';

export interface AuthContext {
  uid: string;
  orgId: string; // for MVP: orgId === uid
}

export async function requireAuth(req: IncomingMessage): Promise<AuthContext> {
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw Object.assign(new Error('Missing Authorization header'), { statusCode: 401 });
  }

  const decoded = await auth.verifyIdToken(token);
  return { uid: decoded.uid, orgId: decoded.uid };
}

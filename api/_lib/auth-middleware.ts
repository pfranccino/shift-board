import type { IncomingMessage } from 'http';
import { auth, db } from './firebase-admin';

export interface AuthContext {
  uid: string;
  orgId: string;
  isSuperAdmin: boolean;
}

export async function requireAuth(req: IncomingMessage & { body?: any }): Promise<AuthContext> {
  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw Object.assign(new Error('Missing Authorization header'), { statusCode: 401 });
  }

  const decoded = await auth.verifyIdToken(token);

  const adminDoc = await db.doc(`superadmins/${decoded.uid}`).get();
  if (adminDoc.exists) {
    const orgId = (req.body?.orgId as string | undefined) ?? 'sa-sandbox';
    return { uid: decoded.uid, orgId, isSuperAdmin: true };
  }

  const snap = await db.collection('memberships')
    .where('userId', '==', decoded.uid)
    .limit(1)
    .get();

  if (snap.empty) {
    throw Object.assign(new Error('Usuario sin organización asignada'), { statusCode: 403 });
  }

  return { uid: decoded.uid, orgId: snap.docs[0].data().orgId as string, isSuperAdmin: false };
}

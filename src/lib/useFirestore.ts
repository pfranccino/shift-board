import { useEffect, useState } from 'react';
import {
  collection, doc, onSnapshot, setDoc, addDoc, deleteDoc, updateDoc,
  serverTimestamp, query, type Unsubscribe,
} from 'firebase/firestore';
import { fbDb } from './firebase';
import type { Worker, Config, SolverConfig, MockMember, MockOrg, WeekSchedules, DayKey } from '../types';

// ── Generic Firestore collection listener ─────────────────────────────────

function useCollection<T>(path: string): T[] {
  const [data, setData] = useState<T[]>([]);
  useEffect(() => {
    if (!fbDb) return;
    const unsub = onSnapshot(query(collection(fbDb, path)), (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...d.data() } as T)));
    });
    return unsub;
  }, [path]);
  return data;
}

function useDoc<T>(path: string): T | null {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    if (!fbDb) return;
    const unsub = onSnapshot(doc(fbDb, path), (snap) => {
      setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null);
    });
    return unsub;
  }, [path]);
  return data;
}

// ── Organization-scoped hooks ─────────────────────────────────────────────

export function useOrgWorkers(orgId: string) {
  return useCollection<Worker>(`organizations/${orgId}/workers`);
}

export function useOrgConfig(orgId: string) {
  return useDoc<Config>(`organizations/${orgId}/config/main`);
}

export function useOrgSolverConfig(orgId: string) {
  return useDoc<SolverConfig>(`organizations/${orgId}/config/solver`);
}

export function useOrgMembers(orgId: string) {
  return useCollection<MockMember>(`organizations/${orgId}/members`);
}

export function useJobStatus(orgId: string, jobId: string | null) {
  const [status, setStatus] = useState<{
    status: string;
    result: { assignments: Record<string, Record<DayKey, string>> } | null;
    infeasibility_reasons: any[] | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!fbDb || !jobId) return;
    const unsub = onSnapshot(
      doc(fbDb, `organizations/${orgId}/jobs/${jobId}`),
      (snap) => {
        if (snap.exists()) setStatus(snap.data() as any);
      }
    );
    return unsub;
  }, [orgId, jobId]);

  return status;
}

// ── Firestore write helpers ───────────────────────────────────────────────

export async function saveWorker(orgId: string, worker: Omit<Worker, 'id'>) {
  if (!fbDb) throw new Error('Firestore not initialized');
  return addDoc(collection(fbDb, `organizations/${orgId}/workers`), {
    ...worker,
    created_at: serverTimestamp(),
  });
}

export async function updateWorker(orgId: string, workerId: string, data: Partial<Worker>) {
  if (!fbDb) throw new Error('Firestore not initialized');
  return updateDoc(doc(fbDb, `organizations/${orgId}/workers/${workerId}`), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function deleteWorker(orgId: string, workerId: string) {
  if (!fbDb) throw new Error('Firestore not initialized');
  return deleteDoc(doc(fbDb, `organizations/${orgId}/workers/${workerId}`));
}

export async function saveConfig(orgId: string, config: Config) {
  if (!fbDb) throw new Error('Firestore not initialized');
  return setDoc(doc(fbDb, `organizations/${orgId}/config/main`), config);
}

export async function saveSolverConfig(orgId: string, config: SolverConfig) {
  if (!fbDb) throw new Error('Firestore not initialized');
  return setDoc(doc(fbDb, `organizations/${orgId}/config/solver`), config);
}

export async function saveOrg(orgId: string, org: MockOrg) {
  if (!fbDb) throw new Error('Firestore not initialized');
  return setDoc(doc(fbDb, `organizations/${orgId}`), {
    ...org,
    created_at: serverTimestamp(),
  });
}

export async function saveMembership(orgId: string, member: MockMember) {
  if (!fbDb) throw new Error('Firestore not initialized');
  const membershipId = `${member.id}_${orgId}`;
  await Promise.all([
    setDoc(doc(fbDb, `memberships/${membershipId}`), {
      userId: member.id,
      orgId,
      role: member.role,
      name: member.name,
      email: member.email,
      created_at: serverTimestamp(),
    }),
    setDoc(doc(fbDb, `organizations/${orgId}/members/${member.id}`), {
      ...member,
      created_at: serverTimestamp(),
    }),
  ]);
}

export async function saveWeekSchedule(
  orgId: string,
  weekKey: string,
  assignments: Record<string, Record<DayKey, string>>
) {
  if (!fbDb) throw new Error('Firestore not initialized');
  const writes = Object.entries(assignments).map(([workerId, shifts]) =>
    setDoc(
      doc(fbDb!, `organizations/${orgId}/schedules/${weekKey}/assignments/${workerId}`),
      { shifts, updated_at: serverTimestamp() }
    )
  );
  await Promise.all(writes);
}

export function useWeekSchedule(orgId: string, weekKey: string): WeekSchedules {
  const [schedules, setSchedules] = useState<WeekSchedules>({});

  useEffect(() => {
    if (!fbDb || !weekKey) return;
    const unsub = onSnapshot(
      collection(fbDb, `organizations/${orgId}/schedules/${weekKey}/assignments`),
      (snap) => {
        const week: Record<string, Record<DayKey, string>> = {};
        snap.docs.forEach((d) => { week[d.id] = d.data().shifts; });
        setSchedules((prev) => ({ ...prev, [weekKey]: week }));
      }
    );
    return unsub;
  }, [orgId, weekKey]);

  return schedules;
}

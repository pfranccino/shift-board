import { useState, useEffect, useMemo } from 'react';
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material';
import { createAppTheme } from './theme';
import {
  buildRegistry, summarize, statusColors,
  DEFAULT_CONFIG, DEFAULT_SOLVER_CONFIG, INITIAL_WORKERS,
  blankShifts, getCurrentWeekKey, prevWeekKey, nextWeekKey,
} from './data';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { isFirebaseConfigured, fbAuth, fbDb } from './lib/firebase';
import {
  useOrgWorkers, useWeekSchedule,
  saveWorker, updateWorker as fbUpdateWorker, deleteWorker as fbDeleteWorker,
  saveWeekSchedule, saveOrg, saveMembership, saveInvitation,
} from './lib/useFirestore';
import { Icon } from './components/Icon';
import { TurnosView } from './views/Turnos';
import { AsistenteView } from './views/Asistente';
import { TrabajadoresView } from './views/Trabajadores';
import { EstadisticasView } from './views/Estadisticas';
import { ConfiguracionView } from './views/Configuracion';
import { EquipoView } from './views/Equipo';
import { LoginView } from './views/Login';
import { OnboardingView } from './views/Onboarding';
import { WaitingView } from './views/Waiting';
import { JoinView } from './views/Join';
import { initials, avatarBg } from './data';
import type { Worker, Config, SolverConfig, MockUser, MockOrg, MockMember, MockInvitation, OrgRole, WeekSchedules, DayKey } from './types';

type Tab = 'turnos' | 'asistente' | 'trabajadores' | 'estadisticas' | 'configuracion' | 'equipo';

const NAV: { key: Tab; label: string; icon: string }[] = [
  { key: 'turnos', label: 'Turnos', icon: 'calendar' },
  { key: 'asistente', label: 'Asistente', icon: 'magic' },
  { key: 'trabajadores', label: 'Trabajadores', icon: 'users' },
  { key: 'estadisticas', label: 'Estadísticas', icon: 'chart' },
  { key: 'configuracion', label: 'Configuración', icon: 'sliders' },
  { key: 'equipo', label: 'Equipo', icon: 'shield' },
];

function loadJson<T>(key: string, fallback: T): T {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}

const globalCss = `
:root { --accent: #4664c9; }
[data-theme="light"] {
  --bg: oklch(0.975 0.003 250); --surface: oklch(1 0 0); --surface-2: oklch(0.985 0.003 250);
  --sidebar: oklch(0.992 0.003 250); --border: oklch(0.91 0.005 250); --border-strong: oklch(0.86 0.006 250);
  --hover: oklch(0.96 0.004 250); --text-1: oklch(0.23 0.012 260); --text-2: oklch(0.46 0.01 260);
  --text-3: oklch(0.62 0.008 260);
  --shadow-sm: 0 1px 2px oklch(0.4 0.02 260 / 0.06), 0 1px 3px oklch(0.4 0.02 260 / 0.05);
  --shadow-lg: 0 8px 30px oklch(0.3 0.02 260 / 0.14), 0 2px 8px oklch(0.3 0.02 260 / 0.08);
}
[data-theme="dark"] {
  --bg: oklch(0.18 0.008 260); --surface: oklch(0.225 0.009 260); --surface-2: oklch(0.255 0.009 260);
  --sidebar: oklch(0.205 0.009 260); --border: oklch(0.32 0.01 260); --border-strong: oklch(0.40 0.012 260);
  --hover: oklch(0.30 0.01 260); --text-1: oklch(0.95 0.005 260); --text-2: oklch(0.74 0.008 260);
  --text-3: oklch(0.58 0.008 260);
  --shadow-sm: 0 1px 2px oklch(0 0 0 / 0.3);
  --shadow-lg: 0 12px 40px oklch(0 0 0 / 0.5), 0 2px 8px oklch(0 0 0 / 0.3);
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body { font-family: "IBM Plex Sans", system-ui, sans-serif; background: var(--bg); color: var(--text-1); -webkit-font-smoothing: antialiased; font-size: 14px; letter-spacing: -0.005em; }
@keyframes pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }

/* App shell */
.app-grid { display: grid; grid-template-columns: 232px 1fr; height: 100vh; overflow: hidden; }

/* Responsive layout containers */
.asist-cols { display: grid; grid-template-columns: 350px 1fr; gap: 14px; align-items: start; }
.rules-panel { position: sticky; top: 0; }
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
.stat-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: start; }
.config-cols { display: grid; grid-template-columns: 1fr 1.2fr; gap: 14px; align-items: start; }
.worker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.view-pad { padding: 28px 32px 60px; max-width: 1320px; }

@media (max-width: 980px) {
  .asist-cols { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .stat-cols { grid-template-columns: 1fr; }
  .config-cols { grid-template-columns: 1fr; }
  .rules-panel { position: static; }
}
@media (max-width: 720px) {
  .app-grid { grid-template-columns: 64px 1fr; }
  .view-pad { padding: 20px 16px 50px; }
  .sb-name { display: none !important; }
  .sb-nav-text { display: none !important; }
  .sb-stat { display: none !important; }
  .sb-foot-text { display: none !important; }
  .sb-nav-btn { justify-content: center !important; gap: 0 !important; }
}
`;

export default function App() {
  const [dark, setDark] = useState(() => loadJson<boolean>('sb_dark', false));
  const [tab, setTab] = useState<Tab>(() => (loadJson<string>('sb_tab', 'turnos') as Tab));
  const [config, setConfig] = useState<Config>(() => loadJson('sb_config_v2', DEFAULT_CONFIG));
  const [solverConfig, setSolverConfig] = useState<SolverConfig>(() => loadJson('sb_solver_v1', DEFAULT_SOLVER_CONFIG));

  // Auth & org state — starts null in Firebase mode, loaded from localStorage in mock mode
  const [authUser, setAuthUser] = useState<MockUser | null>(
    () => isFirebaseConfigured ? null : loadJson('sb_user', null)
  );
  const [org, setOrg] = useState<MockOrg | null>(
    () => isFirebaseConfigured ? null : loadJson('sb_org', null)
  );
  const [members, setMembers] = useState<MockMember[]>(() => loadJson('sb_members', []));
  const [invitations, setInvitations] = useState<MockInvitation[]>(() => loadJson('sb_invites', []));
  const [isSuperAdmin, setIsSuperAdmin] = useState(() => !isFirebaseConfigured);
  const [inviteToken] = useState(() => new URLSearchParams(window.location.search).get('token'));
  const [selectedWeek, setSelectedWeek] = useState<string>(() => getCurrentWeekKey());

  // True while Firebase resolves the initial auth state (avoids login flash for returning users)
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);

  // Local (mock) state — used when isFirebaseConfigured is false
  const [localWorkers, setLocalWorkers] = useState<Worker[]>(() => {
    const raw = loadJson<any[]>('sb_workers_v2', INITIAL_WORKERS);
    return raw.map((w) => ({
      ...w,
      contracted_hours: w.contracted_hours ?? (w.role === 'part' ? 20 : 40),
    }));
  });
  const [localSchedules, setLocalSchedules] = useState<WeekSchedules>(
    () => loadJson('sb_schedules_v1', {})
  );

  // Firestore real-time hooks (no-ops when org.id is empty)
  const firestoreWorkers = useOrgWorkers(org?.id ?? '');
  const firestoreSchedules = useWeekSchedule(org?.id ?? '', selectedWeek);

  // Derived — use Firestore when configured and org is loaded, else local
  const workers: Worker[] = isFirebaseConfigured && org ? firestoreWorkers : localWorkers;
  const schedules: WeekSchedules = isFirebaseConfigured && org ? firestoreSchedules : localSchedules;

  buildRegistry(config);

  const theme = useMemo(() => createAppTheme(dark), [dark]);

  // ── Theme + UI persistence ──────────────────────────────────────────────
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('sb_dark', JSON.stringify(dark));
  }, [dark]);

  useEffect(() => { localStorage.setItem('sb_tab', tab); }, [tab]);
  useEffect(() => { localStorage.setItem('sb_config_v2', JSON.stringify(config)); }, [config]);
  useEffect(() => { localStorage.setItem('sb_solver_v1', JSON.stringify(solverConfig)); }, [solverConfig]);

  // ── Mock-only localStorage persistence ─────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured) localStorage.setItem('sb_user', JSON.stringify(authUser));
  }, [authUser]);
  useEffect(() => {
    if (!isFirebaseConfigured) localStorage.setItem('sb_org', JSON.stringify(org));
  }, [org]);
  useEffect(() => {
    if (!isFirebaseConfigured) localStorage.setItem('sb_members', JSON.stringify(members));
  }, [members]);
  useEffect(() => {
    if (!isFirebaseConfigured) localStorage.setItem('sb_invites', JSON.stringify(invitations));
  }, [invitations]);
  useEffect(() => {
    if (!isFirebaseConfigured) localStorage.setItem('sb_workers_v2', JSON.stringify(localWorkers));
  }, [localWorkers]);
  useEffect(() => {
    if (!isFirebaseConfigured) localStorage.setItem('sb_schedules_v1', JSON.stringify(localSchedules));
  }, [localSchedules]);

  // ── Firebase Auth listener ──────────────────────────────────────────────
  useEffect(() => {
    if (!isFirebaseConfigured || !fbAuth) return;
    return onAuthStateChanged(fbAuth, async (firebaseUser) => {
      if (firebaseUser) {
        setAuthUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email || 'Usuario',
          email: firebaseUser.email || '',
        });
        if (fbDb) {
          try {
            const [adminSnap, memberSnap] = await Promise.all([
              getDoc(doc(fbDb, `superadmins/${firebaseUser.uid}`)),
              getDocs(query(collection(fbDb, 'memberships'), where('userId', '==', firebaseUser.uid))),
            ]);
            setIsSuperAdmin(adminSnap.exists());
            if (!memberSnap.empty) {
              const mem = memberSnap.docs[0].data();
              const orgSnap = await getDoc(doc(fbDb, `organizations/${mem.orgId}`));
              if (orgSnap.exists()) {
                setOrg({ id: orgSnap.id, name: orgSnap.data().name });
              }
            }
          } catch {
            // silently fall through to onboarding/waiting
          }
        }
      } else {
        setAuthUser(null);
        setOrg(null);
        setIsSuperAdmin(!isFirebaseConfigured);
      }
      setAuthLoading(false);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Seed current week from workers.shifts on first load (mock mode only) ─
  useEffect(() => {
    if (isFirebaseConfigured) return;
    setLocalSchedules((prev) => {
      if (prev[selectedWeek]) return prev;
      const seed: Record<string, Record<DayKey, string>> = {};
      localWorkers.forEach((w) => { seed[w.id] = { ...(w.shifts as Record<DayKey, string>) }; });
      return { ...prev, [selectedWeek]: seed };
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayWorkers = workers.map((w) => ({
    ...w,
    shifts: (schedules[selectedWeek]?.[w.id] ?? blankShifts()) as Worker['shifts'],
  }));

  // ── Schedule mutations ──────────────────────────────────────────────────
  const handleAssign = (workerId: string, dayKey: string, shiftKey: string) => {
    if (isFirebaseConfigured && org) {
      const current = (schedules[selectedWeek]?.[workerId] ?? blankShifts()) as Record<DayKey, string>;
      const updated = { ...current, [dayKey]: shiftKey } as Record<DayKey, string>;
      saveWeekSchedule(org.id, selectedWeek, { [workerId]: updated });
    } else {
      setLocalSchedules((prev) => {
        const week = prev[selectedWeek] ?? {};
        const ws = week[workerId] ?? blankShifts();
        return { ...prev, [selectedWeek]: { ...week, [workerId]: { ...ws, [dayKey]: shiftKey } } };
      });
    }
  };

  const handleApplySchedule = (assignments: Record<string, Record<DayKey, string>>) => {
    if (isFirebaseConfigured && org) {
      saveWeekSchedule(org.id, selectedWeek, assignments);
    } else {
      setLocalSchedules((prev) => ({
        ...prev,
        [selectedWeek]: { ...(prev[selectedWeek] ?? {}), ...assignments },
      }));
    }
  };

  // ── Worker mutations (Firebase-aware setWorkers wrapper) ────────────────
  const handleSetWorkers: React.Dispatch<React.SetStateAction<Worker[]>> = (update) => {
    if (!isFirebaseConfigured || !org) {
      setLocalWorkers(update);
      return;
    }
    const prev = workers;
    const next = typeof update === 'function' ? update(prev) : update;
    if (next.length > prev.length) {
      const added = next.find((w) => !prev.find((p) => p.id === w.id));
      if (added) { const { id: _id, ...rest } = added; saveWorker(org.id, rest); }
    } else if (next.length < prev.length) {
      const removed = prev.find((w) => !next.find((n) => n.id === w.id));
      if (removed) fbDeleteWorker(org.id, removed.id);
    } else {
      const changed = next.find((nw) => {
        const pw = prev.find((p) => p.id === nw.id);
        return pw && JSON.stringify(pw) !== JSON.stringify(nw);
      });
      if (changed) { const { id, ...rest } = changed; fbUpdateWorker(org.id, id, rest); }
    }
  };

  // ── Auth handlers ───────────────────────────────────────────────────────
  const handleLogin = (user: MockUser) => setAuthUser(user);

  const handleCreateOrg = async (orgName: string): Promise<void> => {
    const newOrg: MockOrg = { id: `org_${Date.now()}`, name: orgName };
    const owner: MockMember = { id: authUser!.id, name: authUser!.name, email: authUser!.email, role: 'owner' };
    if (isFirebaseConfigured && authUser) {
      await saveOrg(newOrg.id, newOrg);
      await saveMembership(newOrg.id, owner);
    }
    setMembers([owner]);
    setOrg(newOrg);
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && fbAuth) await signOut(fbAuth);
    setAuthUser(null);
    setOrg(null);
    setMembers([]);
    setInvitations([]);
    if (!isFirebaseConfigured) {
      ['sb_user', 'sb_org', 'sb_members', 'sb_invites'].forEach((k) => localStorage.removeItem(k));
    }
  };

  const handleInvite = async (email: string, role: OrgRole): Promise<MockInvitation> => {
    const token = Math.random().toString(36).slice(2, 10).toUpperCase();
    const inv: MockInvitation = {
      id: `inv_${Date.now()}`, email, role, token,
      orgId: org!.id, orgName: org!.name,
      createdAt: new Date().toISOString(),
    };
    if (isFirebaseConfigured && org) {
      await saveInvitation(token, { email, role, orgId: org.id, orgName: org.name });
    }
    setInvitations((prev) => [...prev, inv]);
    return inv;
  };

  const handleJoinOrg = async (token: string): Promise<void> => {
    if (!fbDb || !authUser) throw new Error('No autenticado.');
    const invSnap = await getDoc(doc(fbDb, `invitations/${token}`));
    if (!invSnap.exists()) throw new Error('Invitación no válida o expirada.');
    const inv = invSnap.data();
    const member: MockMember = { id: authUser.id, name: authUser.name, email: authUser.email, role: inv.role as OrgRole };
    await saveMembership(inv.orgId, member);
    const orgSnap = await getDoc(doc(fbDb, `organizations/${inv.orgId}`));
    if (!orgSnap.exists()) throw new Error('La organización no existe.');
    setOrg({ id: orgSnap.id, name: orgSnap.data().name });
    setMembers([member]);
    window.history.replaceState({}, '', window.location.pathname);
  };

  const s = summarize(workers);
  const overC = statusColors('over', dark).fg;
  const underC = statusColors('under', dark).fg;

  const sidebarBg = dark ? 'oklch(0.205 0.009 260)' : 'oklch(0.992 0.003 250)';
  const borderColor = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const hoverBg = dark ? 'oklch(0.30 0.01 260)' : 'oklch(0.96 0.004 250)';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';
  const text2 = dark ? 'oklch(0.74 0.008 260)' : 'oklch(0.46 0.01 260)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const accent = '#4664c9';
  const accentBg = dark ? `color-mix(in oklch, ${accent} 22%, transparent)` : `color-mix(in oklch, ${accent} 12%, transparent)`;
  const trackBorderStrong = dark ? 'oklch(0.40 0.012 260)' : 'oklch(0.86 0.006 250)';

  const appPhase: 'loading' | 'login' | 'waiting' | 'join' | 'onboarding' | 'app' =
    authLoading ? 'loading' :
    !authUser ? 'login' :
    org ? 'app' :
    inviteToken ? 'join' :
    isSuperAdmin ? 'onboarding' :
    'waiting';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalCss} />

      {appPhase === 'loading' && (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '3px solid var(--border)', borderTopColor: accent,
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      {appPhase === 'login' && <LoginView dark={dark} onLogin={handleLogin} />}
      {appPhase === 'waiting' && <WaitingView user={authUser!} dark={dark} onLogout={handleLogout} />}
      {appPhase === 'join' && <JoinView token={inviteToken!} user={authUser!} dark={dark} onJoin={handleJoinOrg} onLogout={handleLogout} />}
      {appPhase === 'onboarding' && <OnboardingView user={authUser!} dark={dark} onCreateOrg={handleCreateOrg} onLogout={handleLogout} />}

      {appPhase !== 'app' ? null : <div className="app-grid">
        {/* Sidebar */}
        <aside style={{
          background: sidebarBg, borderRight: `1px solid ${borderColor}`,
          display: 'flex', flexDirection: 'column', padding: '18px 14px', gap: 6,
          overflow: 'hidden',
        }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 18px' }}>
            <span style={{
              width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center',
              background: accent, color: 'white', flexShrink: 0,
            }}>
              <Icon name="calendar" size={18} stroke={1.9} />
            </span>
            <div className="sb-name" style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: 'var(--text-1)', lineHeight: 1.2 }}>ShiftBoard</div>
              {org && <div style={{ fontSize: 11, color: text3, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</div>}
            </div>
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {NAV.map((n) => {
              const on = tab === n.key;
              return (
                <button key={n.key} onClick={() => setTab(n.key)} className="sb-nav-btn" style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px',
                  border: 'none', borderRadius: 9, cursor: 'pointer', width: '100%', textAlign: 'left',
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  fontWeight: 500, fontSize: 13.5, letterSpacing: '-0.005em',
                  background: on ? accentBg : 'transparent',
                  color: on ? accent : text2,
                  transition: 'background .12s, color .12s',
                }}
                  onMouseEnter={(e) => { if (!on) { e.currentTarget.style.background = hoverBg; e.currentTarget.style.color = 'var(--text-1)'; } }}
                  onMouseLeave={(e) => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = text2; } }}
                >
                  <Icon name={n.icon} size={17} />
                  <span className="sb-nav-text">{n.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Side stat */}
          <div className="sb-stat" style={{
            marginTop: 'auto', padding: 12, background: surface2,
            border: `1px solid ${borderColor}`, borderRadius: 11,
            display: 'flex', flexDirection: 'column', gap: 7,
          }}>
            {[
              { label: 'Asignadas', val: `${s.assigned}h`, color: 'var(--text-1)' },
              { label: 'Extra', val: `+${s.extra}h`, color: overC },
              { label: 'Faltantes', val: `−${s.missing}h`, color: underC },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: text2 }}>
                <span style={{ color }}>{label}</span>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600, color }}>{val}</span>
              </div>
            ))}
          </div>

          {/* User info */}
          {authUser && (
            <div style={{ paddingTop: 8, borderTop: `1px solid ${borderColor}`, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 4px' }}>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center',
                  fontSize: 10, fontWeight: 600, background: avatarBg(authUser.name, dark),
                  color: dark ? 'oklch(0.85 0.01 260)' : 'oklch(0.25 0.01 260)', flexShrink: 0,
                }}>{initials(authUser.name)}</span>
                <div className="sb-name" style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser.name}</div>
                  <div style={{ fontSize: 11, color: text3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{authUser.email}</div>
                </div>
                <button onClick={handleLogout} title="Cerrar sesión" style={{
                  width: 26, height: 26, borderRadius: 7, border: 'none', background: 'transparent',
                  color: text3, cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0,
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'; (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = text3; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <Icon name="logout" size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Theme toggle */}
          <div style={{ paddingTop: 12 }}>
            <button onClick={() => setDark(!dark)} style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'none', border: 'none', cursor: 'pointer', padding: 4,
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            }}>
              <span style={{
                width: 38, height: 22, borderRadius: 99, position: 'relative', flexShrink: 0,
                background: dark ? accent : trackBorderStrong,
                transition: 'background .2s',
              }}>
                <span style={{
                  position: 'absolute', top: 2, left: 2, width: 18, height: 18,
                  borderRadius: 99, background: 'white', display: 'grid', placeItems: 'center',
                  fontSize: 10, color: '#555', transition: 'transform .2s',
                  transform: dark ? 'translateX(16px)' : 'none',
                }}>{dark ? '☾' : '☀'}</span>
              </span>
              <span className="sb-foot-text" style={{ fontSize: 12.5, color: text2 }}>{dark ? 'Oscuro' : 'Claro'}</span>
            </button>
          </div>
        </aside>

        {/* Main */}
        <main style={{ overflowY: 'auto', overflowX: 'hidden', background: 'var(--bg)', minWidth: 0 }}>
          {tab === 'turnos' && <TurnosView workers={displayWorkers} selectedWeek={selectedWeek} onPrevWeek={() => setSelectedWeek(prevWeekKey(selectedWeek))} onNextWeek={() => setSelectedWeek(nextWeekKey(selectedWeek))} onAssign={handleAssign} dark={dark} />}
          {tab === 'asistente' && (
            <AsistenteView
              workers={displayWorkers}
              selectedWeek={selectedWeek}
              onApplySchedule={handleApplySchedule}
              dark={dark}
              goTab={(t) => setTab(t as Tab)}
              orgId={org?.id}
              solverConfig={solverConfig}
            />
          )}
          {tab === 'trabajadores' && <TrabajadoresView workers={displayWorkers} setWorkers={handleSetWorkers} dark={dark} />}
          {tab === 'estadisticas' && <EstadisticasView workers={displayWorkers} dark={dark} />}
          {tab === 'configuracion' && <ConfiguracionView config={config} setConfig={setConfig} solverConfig={solverConfig} setSolverConfig={setSolverConfig} workers={workers} setWorkers={handleSetWorkers} dark={dark} />}
          {tab === 'equipo' && authUser && org && (
            <EquipoView
              currentUser={authUser} org={org}
              members={members} invitations={invitations}
              onInvite={handleInvite}
              onRemoveMember={(id) => setMembers((prev) => prev.filter((m) => m.id !== id))}
              onCancelInvite={(id) => setInvitations((prev) => prev.filter((i) => i.id !== id))}
              isSuperAdmin={isSuperAdmin}
              dark={dark}
            />
          )}
        </main>
      </div>}
    </ThemeProvider>
  );
}

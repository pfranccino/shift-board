import { useState, useEffect, useMemo } from 'react';
import {
  DAYS, ROLES, getCatIds, getCat, getShiftIds, getShift, getCoverage,
  shiftColors, statusColors, coverageSummary, weeklyHours,
  initials, avatarBg, formatWeekRange,
} from '../data';
import { Icon } from '../components/Icon';
import { isFirebaseConfigured, fbAuth } from '../lib/firebase';
import { useJobStatus } from '../lib/useFirestore';
import type { Worker, SolverConfig } from '../types';

interface Props {
  workers: Worker[];
  selectedWeek: string;
  onApplySchedule: (assignments: Record<string, Record<string, string>>) => void;
  dark: boolean;
  goTab: (tab: string) => void;
  orgId?: string;
  solverConfig?: SolverConfig;
}

interface Rules {
  scope: string;
  respetarMeta: boolean;
  minLibres: number;
  incluirFinde: boolean;
  distribucion: 'compactar' | 'repartir';
  turnoBase: string;
}

interface InfeasibilityReason {
  type: 'coverage' | 'hours' | 'staff';
  title: string;
  detail: string;
  suggestion: string;
}

interface ProposalItem {
  worker: Worker;
  pref: string;
  workDays: number;
  hours: number;
  target: number;
  diff: number;
  status: 'exact' | 'over' | 'under';
  warning: string | null;
  newShifts: Record<string, string>;
}

type SolverPhase =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'polling'; jobId: string }
  | { kind: 'ready'; items: ProposalItem[] }
  | { kind: 'infeasible'; reasons: InfeasibilityReason[] }
  | { kind: 'error'; message: string };

function preferredShift(worker: Worker, base: string): string {
  if (base && base !== 'auto') return base;
  const counts: Record<string, number> = {};
  DAYS.forEach((d) => {
    const k = worker.shifts[d.key];
    if (k && k !== 'libre') counts[k] = (counts[k] || 0) + 1;
  });
  let best: string | null = null, n = 0;
  for (const k in counts) if (counts[k] > n) { n = counts[k]; best = k; }
  if (best) return best;
  const ids = getShiftIds();
  if (worker.role === 'part') return ids.find((id) => getShift(id).hours <= 4) || ids[0] || 'libre';
  return ids.find((id) => getShift(id).hours >= 8) || ids[0] || 'libre';
}

function pickDays(eligible: string[], n: number, mode: string): string[] {
  if (n >= eligible.length) return eligible.slice();
  if (n <= 0) return [];
  if (mode === 'compactar') return eligible.slice(0, n);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i * (eligible.length - 1)) / (n - 1 || 1));
    out.push(eligible[idx]);
  }
  return Array.from(new Set(out));
}

function detectInfeasibility(proposal: ProposalItem[], allWorkers: Worker[]): InfeasibilityReason[] {
  const reasons: InfeasibilityReason[] = [];

  const merged = allWorkers.map((w) => {
    const p = proposal.find((pp) => pp.worker.id === w.id);
    return p ? { ...w, shifts: p.newShifts as Worker['shifts'] } : w;
  });
  const cov = coverageSummary(merged);

  const gapsByShift: Record<string, { count: number; min: number }[]> = {};
  cov.gaps.forEach((g) => {
    if (!gapsByShift[g.shift]) gapsByShift[g.shift] = [];
    gapsByShift[g.shift].push({ count: g.count, min: g.min });
  });

  Object.entries(gapsByShift).forEach(([sid, gaps]) => {
    const s = getShift(sid);
    const maxGap = Math.max(...gaps.map((g) => g.min - g.count));
    reasons.push({
      type: 'coverage',
      title: `Turno ${s.name} — Cobertura insuficiente`,
      detail: `${gaps.length} día(s) no alcanzan el mínimo requerido. Falta hasta ${maxGap} persona(s) por día.`,
      suggestion: `Reduce la cobertura mínima del turno ${s.name} en Configuración, o habilita los fines de semana para distribuir la carga.`,
    });
  });

  proposal.forEach((p) => {
    if (p.target > 0 && p.hours < p.target * 0.5) {
      reasons.push({
        type: 'hours',
        title: `${p.worker.name} — Déficit crítico de horas`,
        detail: `Solo se pueden asignar ${p.hours}h de ${p.target}h contratadas con los parámetros actuales.`,
        suggestion: `Reduce los días libres mínimos, habilita los fines de semana, o cambia el turno base a uno de mayor duración.`,
      });
    }
  });

  if (proposal.length === 0) {
    reasons.push({
      type: 'staff',
      title: 'Sin trabajadores en el alcance seleccionado',
      detail: 'No hay trabajadores que cumplan los filtros de la propuesta.',
      suggestion: 'Cambia el alcance a "Todas" las categorías o agrega trabajadores.',
    });
  }

  return reasons;
}

function buildProposal(workers: Worker[], rules: Rules): ProposalItem[] {
  const weekdays = DAYS.filter((d) => !d.weekend).map((d) => d.key);
  const allDays = DAYS.map((d) => d.key);
  const eligible = rules.incluirFinde ? allDays : weekdays;

  return workers.map((w) => {
    const pref = preferredShift(w, rules.turnoBase);
    const sh = getShift(pref).hours;
    const target = w.contracted_hours;
    const idealDays = sh > 0 ? Math.round(target / sh) : 0;
    const capByRest = 7 - rules.minLibres;
    const workDays = Math.max(0, Math.min(idealDays, capByRest, eligible.length));
    const dayKeys = pickDays(eligible, workDays, rules.distribucion);

    const newShifts: Record<string, string> = {};
    DAYS.forEach((d) => { newShifts[d.key] = 'libre'; });
    dayKeys.forEach((k) => { newShifts[k] = pref; });

    const hours = workDays * sh;
    const diff = hours - target;
    const status: ProposalItem['status'] = diff === 0 ? 'exact' : diff > 0 ? 'over' : 'under';
    let warning: string | null = null;
    if (rules.respetarMeta && diff !== 0) {
      warning = diff < 0
        ? `No llega a la meta (faltan ${-diff}h).`
        : `Supera la meta (+${diff}h).`;
    }
    return { worker: w, pref, workDays, hours, target, diff, status, warning, newShifts };
  });
}

function buildProposalFromAssignments(
  assignments: Record<string, Record<string, string>>,
  allWorkers: Worker[]
): ProposalItem[] {
  return allWorkers
    .filter((w) => w.id in assignments)
    .map((w) => {
      const newShifts: Record<string, string> = {};
      DAYS.forEach((d) => { newShifts[d.key] = 'libre'; });
      Object.assign(newShifts, assignments[w.id]);

      const nonLibre = Object.values(newShifts).filter((s) => s && s !== 'libre');
      const pref = nonLibre[0] ?? 'libre';
      const sh = pref !== 'libre' ? (getShift(pref)?.hours ?? 0) : 0;
      const workDays = nonLibre.length;
      const hours = workDays * sh;
      const target = w.contracted_hours;
      const diff = hours - target;
      const status: ProposalItem['status'] = diff === 0 ? 'exact' : diff > 0 ? 'over' : 'under';
      return { worker: w, pref, workDays, hours, target, diff, status, warning: null, newShifts };
    });
}

function Seg({ options, value, onChange, wrap }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void; wrap?: boolean }) {
  return (
    <div style={{
      display: wrap ? 'flex' : 'inline-flex', flexWrap: wrap ? 'wrap' : 'nowrap',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 9, padding: 3, gap: 2,
    }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            padding: '6px 12px', border: 'none', borderRadius: 6, flex: wrap ? '1 0 auto' : undefined,
            background: on ? 'var(--surface)' : 'transparent',
            color: on ? 'var(--text-1)' : 'var(--text-2)',
            boxShadow: on ? 'var(--shadow-sm)' : 'none',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            transition: 'background .12s',
          }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function RuleToggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  const accent = '#4664c9';
  const trackBorderStrong = 'var(--border-strong)';
  return (
    <div onClick={() => onChange(!value)} role="button" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
      padding: 12, border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer',
      transition: 'border-color .12s',
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3, lineHeight: 1.4, maxWidth: 210 }}>{hint}</div>}
      </div>
      <span style={{
        width: 38, height: 22, borderRadius: 99, position: 'relative', flexShrink: 0,
        background: value ? accent : trackBorderStrong, transition: 'background .2s',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: 2, width: 18, height: 18,
          borderRadius: 99, background: 'white', transition: 'transform .2s',
          transform: value ? 'translateX(16px)' : 'none',
        }} />
      </span>
    </div>
  );
}

function WeekStrip({ shifts, dark }: { shifts: Record<string, string>; dark: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {DAYS.map((d) => {
        const k = shifts[d.key];
        const c = shiftColors(k, dark);
        const libre = k === 'libre';
        return (
          <span key={d.key} title={`${d.label}: ${getShift(k).name}`} style={{
            width: 23, height: 23, borderRadius: 6, display: 'grid', placeItems: 'center',
            fontFamily: '"IBM Plex Mono", monospace', fontSize: 9.5, fontWeight: 600,
            background: libre ? 'transparent' : c.bg, color: c.fg,
            border: `1px solid ${libre ? 'var(--border)' : c.border}`,
          }}>
            {libre ? '' : getShift(k).abbr}
          </span>
        );
      })}
    </div>
  );
}

export function AsistenteView({ workers, selectedWeek, onApplySchedule, dark, goTab, orgId, solverConfig }: Props) {
  const cats = [{ key: 'Todas', label: 'Todas' }, ...getCatIds().map((id) => ({ key: id, label: getCat(id).name }))];
  const shiftOpts = [{ key: 'auto', label: 'Automático' }, ...getShiftIds().map((id) => ({ key: id, label: getShift(id).name }))];
  const [rules, setRules] = useState<Rules>({
    scope: 'Todas', respetarMeta: true, minLibres: 2,
    incluirFinde: false, distribucion: 'compactar', turnoBase: 'auto',
  });
  const [solverPhase, setSolverPhase] = useState<SolverPhase>({ kind: 'idle' });
  const set = <K extends keyof Rules>(k: K, v: Rules[K]) => setRules((r) => ({ ...r, [k]: v }));

  const scoped = rules.scope === 'Todas' ? workers : workers.filter((w) => w.cat === rules.scope);

  // Firestore job polling (active only when phase is 'polling')
  const jobStatus = useJobStatus(
    orgId ?? '',
    solverPhase.kind === 'polling' ? solverPhase.jobId : null
  );

  useEffect(() => {
    if (!jobStatus) return;
    if (jobStatus.status === 'done' && jobStatus.result) {
      const items = buildProposalFromAssignments(jobStatus.result.assignments, workers);
      setSolverPhase({ kind: 'ready', items });
    } else if (jobStatus.status === 'infeasible') {
      setSolverPhase({ kind: 'infeasible', reasons: jobStatus.infeasibility_reasons ?? [] });
    } else if (jobStatus.status === 'error') {
      setSolverPhase({ kind: 'error', message: jobStatus.error ?? 'Error desconocido' });
    }
  }, [jobStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const generate = async () => {
    if (!isFirebaseConfigured || !fbAuth?.currentUser || !orgId) {
      // Local fallback
      const p = buildProposal(scoped, rules);
      const reasons = detectInfeasibility(p, workers);
      setSolverPhase(reasons.length > 0 ? { kind: 'infeasible', reasons } : { kind: 'ready', items: p });
      return;
    }

    setSolverPhase({ kind: 'submitting' });
    try {
      const token = await fbAuth.currentUser.getIdToken();
      const res = await fetch('/api/schedule/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          weekKey: selectedWeek,
          workers: scoped.map((w) => ({
            id: w.id,
            name: w.name,
            contracted_hours: w.contracted_hours,
            unavailable_dates: (w as any).unavailable_dates ?? [],
          })),
          shifts: getShiftIds().map((id) => getShift(id)).filter((s) => s.hue !== null),
          coverage: getCoverage(),
          constraints: solverConfig ?? {},
          boundary: {},
        }),
      });
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      const { job_id } = await res.json();
      setSolverPhase({ kind: 'polling', jobId: job_id });
    } catch (e: any) {
      setSolverPhase({ kind: 'error', message: e.message ?? 'Error al conectar con el solver' });
    }
  };

  const discard = () => setSolverPhase({ kind: 'idle' });

  const apply = () => {
    if (solverPhase.kind !== 'ready') return;
    const assignments: Record<string, Record<string, string>> = {};
    solverPhase.items.forEach((p) => { assignments[p.worker.id] = p.newShifts; });
    onApplySchedule(assignments);
    setSolverPhase({ kind: 'idle' });
    goTab('turnos');
  };

  const summary = useMemo(() => {
    if (solverPhase.kind !== 'ready') return null;
    const proposal = solverPhase.items;
    const map: Record<string, Record<string, string>> = {};
    proposal.forEach((p) => { map[p.worker.id] = p.newShifts; });
    const merged = workers.map((w) => (map[w.id] ? { ...w, shifts: map[w.id] as Worker['shifts'] } : w));
    return {
      n: proposal.length,
      exact: proposal.filter((p) => p.status === 'exact').length,
      warn: proposal.filter((p) => p.warning).length,
      cov: coverageSummary(merged),
    };
  }, [solverPhase, workers]);

  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const accent = '#4664c9';

  const btnPrimary: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '8px 14px', borderRadius: 9, border: 'none',
    background: accent, color: 'white', fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    fontWeight: 500, fontSize: 13, cursor: 'pointer',
  };
  const btnGhost: React.CSSProperties = {
    ...btnPrimary, background: 'transparent', color: 'var(--text-2)',
    border: '1px solid var(--border)',
  };

  const isWorking = solverPhase.kind === 'submitting' || solverPhase.kind === 'polling';
  const noWorkers = scoped.length === 0;
  const noShifts = getShiftIds().length === 0;
  const canGenerate = !isWorking && !noWorkers && !noShifts;

  return (
    <div className="view-pad">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Asistente de asignación</h1>
          <p style={{ margin: '5px 0 0', color: text3, fontSize: 13 }}>{formatWeekRange(selectedWeek)} · Define las restricciones y el sistema propone un cuadro. Puedes revisar antes de aplicar.</p>
        </div>
      </div>

      <div className="asist-cols">
        {/* Rules panel */}
        <div className="rules-panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="sliders" size={15} style={{ verticalAlign: '-2px' }} />Restricciones
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Aplicar a</span>
              <Seg options={cats} value={rules.scope} onChange={(v) => set('scope', v)} wrap />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Turno base</span>
              <Seg options={shiftOpts} value={rules.turnoBase} onChange={(v) => set('turnoBase', v)} wrap />
              <div style={{ fontSize: 11.5, color: text3, lineHeight: 1.4 }}>
                {rules.turnoBase === 'auto' ? 'Usa el turno habitual de cada trabajador según su historial.' : 'Asigna el mismo turno a todos los trabajadores del grupo.'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Días libres mínimos</span>
              <Seg
                options={[1, 2, 3].map((n) => ({ key: String(n), label: `${n} ${n === 1 ? 'día' : 'días'}` }))}
                value={String(rules.minLibres)}
                onChange={(v) => set('minLibres', Number(v))}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Distribución</span>
              <Seg
                options={[{ key: 'compactar', label: 'Compactar' }, { key: 'repartir', label: 'Repartir' }]}
                value={rules.distribucion}
                onChange={(v) => set('distribucion', v as Rules['distribucion'])}
              />
              <div style={{ fontSize: 11.5, color: text3, lineHeight: 1.4 }}>
                {rules.distribucion === 'compactar' ? 'Días de trabajo seguidos, descansos juntos.' : 'Descansos repartidos a lo largo de la semana.'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <RuleToggle label="Respetar meta de horas" hint="Avisa si no se alcanza la meta del contrato (40h / 20h)." value={rules.respetarMeta} onChange={(v) => set('respetarMeta', v)} />
              <RuleToggle label="Incluir fines de semana" hint="Permite asignar turnos en sábado y domingo." value={rules.incluirFinde} onChange={(v) => set('incluirFinde', v)} />
            </div>

            {(noWorkers || noShifts) && (
              <div style={{
                padding: '10px 12px', borderRadius: 9, fontSize: 12, lineHeight: 1.5,
                background: `color-mix(in oklch, oklch(0.6 0.12 28) 8%, transparent)`,
                border: `1px solid color-mix(in oklch, oklch(0.6 0.12 28) 22%, transparent)`,
                color: 'oklch(0.50 0.12 28)',
              }}>
                {noShifts
                  ? 'No hay franjas horarias configuradas. Ve a Configuración para agregar al menos una.'
                  : `No hay trabajadores en el alcance "${rules.scope}". Cambia el alcance o agrega trabajadores.`}
              </div>
            )}
            <button
              style={{ ...btnPrimary, width: '100%', justifyContent: 'center', padding: 11, marginTop: 2, opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}
              onClick={generate}
              disabled={!canGenerate}
            >
              <Icon name="magic" size={16} /> {isWorking ? 'Calculando…' : 'Generar propuesta'}
            </button>
          </div>
        </div>

        {/* Preview panel */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-sm)', minHeight: 420 }}>

          {/* Loading state */}
          {isWorking && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, height: 420, justifyContent: 'center' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                border: '3px solid var(--border)', borderTopColor: accent,
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontSize: 15, fontWeight: 600 }}>
                {solverPhase.kind === 'submitting' ? 'Enviando al solver…' : 'Calculando horario óptimo…'}
              </div>
              <p style={{ fontSize: 13, color: text3, maxWidth: 320, textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
                El algoritmo está evaluando {scoped.length} trabajadores y {Object.keys(getCoverage()).length} turnos.
                Esto puede tomar hasta 2 minutos.
              </p>
            </div>
          )}

          {/* Error state */}
          {solverPhase.kind === 'error' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: statusColors('under', dark).bg, color: statusColors('under', dark).fg, flexShrink: 0 }}>
                    <Icon name="warn" size={18} />
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Error al generar el horario</div>
                    <div style={{ fontSize: 12, color: text3, marginTop: 2 }}>{solverPhase.message}</div>
                  </div>
                </div>
                <button style={btnGhost} onClick={discard}>Volver</button>
              </div>
            </>
          )}

          {/* Infeasibility panel */}
          {solverPhase.kind === 'infeasible' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 9, display: 'grid', placeItems: 'center', background: statusColors('under', dark).bg, color: statusColors('under', dark).fg, flexShrink: 0 }}>
                    <Icon name="warn" size={18} />
                  </span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>Sin solución con las restricciones actuales</div>
                    <div style={{ fontSize: 12, color: text3, marginTop: 2 }}>{solverPhase.reasons.length} {solverPhase.reasons.length === 1 ? 'conflicto detectado' : 'conflictos detectados'}</div>
                  </div>
                </div>
                <button style={btnGhost} onClick={discard}>Volver</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {solverPhase.reasons.map((r, i) => {
                  const typeIcon = r.type === 'coverage' ? 'users' : r.type === 'hours' ? 'clock' : 'warn';
                  const typeBg = dark ? 'oklch(0.27 0.01 260)' : 'oklch(0.97 0.003 250)';
                  return (
                    <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: typeBg, borderBottom: '1px solid var(--border)' }}>
                        <span style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', background: statusColors('under', dark).bg, color: statusColors('under', dark).fg, flexShrink: 0 }}>
                          <Icon name={typeIcon} size={14} />
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{r.title}</span>
                      </div>
                      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.detail}</p>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, padding: '8px 10px', borderRadius: 8, background: `color-mix(in oklch, oklch(0.65 0.15 250) 8%, transparent)`, border: `1px solid color-mix(in oklch, oklch(0.65 0.15 250) 20%, transparent)` }}>
                          <Icon name="arrow" size={13} style={{ color: accent, flexShrink: 0, marginTop: 2 }} />
                          <p style={{ margin: 0, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>{r.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Empty state */}
          {(solverPhase.kind === 'idle') && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 420, gap: 12, textAlign: 'center' }}>
              <span style={{ width: 56, height: 56, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', border: '1px solid var(--border)', color: text3 }}>
                <Icon name="magic" size={26} stroke={1.4} />
              </span>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Sin propuesta todavía</div>
              <p style={{ fontSize: 13, color: text3, maxWidth: 320, lineHeight: 1.5, margin: 0 }}>
                Ajusta las restricciones a la izquierda y genera una propuesta. Podrás revisar cada cambio antes de aplicarlo al cuadro real.
              </p>
            </div>
          )}

          {/* Proposal ready */}
          {solverPhase.kind === 'ready' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 13, color: 'var(--text-2)', flexWrap: 'wrap' }}>
                  <span><b style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'var(--text-1)' }}>{summary!.n}</b> trabajadores</span>
                  <span style={{ width: 3, height: 3, borderRadius: 99, background: text3, opacity: 0.5 }} />
                  <span style={{ color: statusColors('exact', dark).fg }}><b style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{summary!.exact}</b> con meta exacta</span>
                  {summary!.warn > 0 && (
                    <><span style={{ width: 3, height: 3, borderRadius: 99, background: text3, opacity: 0.5 }} />
                    <span style={{ color: statusColors('under', dark).fg }}><Icon name="warn" size={13} style={{ verticalAlign: '-2px' }} /> <b style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{summary!.warn}</b> con aviso</span></>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 9 }}>
                  <button style={btnGhost} onClick={discard}>Descartar</button>
                  <button style={btnPrimary} onClick={apply}><Icon name="check" size={15} stroke={2.2} /> Aplicar al cuadro</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {solverPhase.items.map((p) => {
                  const sc = statusColors(p.status, dark);
                  const sc2 = shiftColors(p.pref, dark);
                  const warnBg = `color-mix(in oklch, oklch(0.6 0.12 28) 6%, transparent)`;
                  return (
                    <div key={p.worker.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px', borderRadius: 10,
                      transition: 'background .1s',
                      background: p.warning ? warnBg : 'transparent',
                    }}
                      onMouseEnter={(e) => { if (!p.warning) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'; }}
                      onMouseLeave={(e) => { if (!p.warning) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center',
                          fontSize: 10, fontWeight: 600, background: avatarBg(p.worker.name, dark),
                          color: dark ? 'oklch(0.85 0.01 260)' : 'oklch(0.25 0.01 260)', flexShrink: 0,
                        }}>{initials(p.worker.name)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-1)' }}>{p.worker.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: text3, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            <span>{ROLES[p.worker.role].short}</span>
                            <span style={{ opacity: 0.5 }}>·</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 500, color: sc2.fg }}>
                              <span style={{ width: 5, height: 5, borderRadius: 99, background: sc2.dot, flexShrink: 0 }} />
                              {getShift(p.pref).name}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <WeekStrip shifts={p.newShifts} dark={dark} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, color: text3 }}>{weeklyHours(p.worker)}h</span>
                        <Icon name="arrow" size={12} style={{ color: text3 }} />
                        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13.5, fontWeight: 600, color: sc.fg }}>{p.hours}h</span>
                        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: text3 }}>/ {p.target}h</span>
                      </div>
                      {p.warning
                        ? <span title={p.warning} style={{ flexShrink: 0, display: 'grid', placeItems: 'center', width: 24, height: 24, borderRadius: 7, background: statusColors('under', dark).bg, color: statusColors('under', dark).fg }}><Icon name="warn" size={13} /></span>
                        : <span style={{ flexShrink: 0, display: 'grid', placeItems: 'center', color: sc.fg, width: 24 }}><Icon name="check" size={15} stroke={2.4} /></span>}
                    </div>
                  );
                })}
              </div>

              {(summary!.warn > 0 || summary!.cov.gaps.length > 0) && (
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 18, padding: '12px 14px', borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
                  <Icon name="warn" size={14} style={{ flexShrink: 0, marginTop: 1, color: statusColors('under', dark).fg }} />
                  <span>
                    {summary!.warn > 0 && 'Algunos trabajadores no alcanzan su meta: reduce los días libres mínimos, cambia el turno base o habilita los fines de semana. '}
                    {summary!.cov.gaps.length > 0 && `Quedan ${summary!.cov.gaps.length} franja(s)-día por debajo del mínimo de cobertura.`}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

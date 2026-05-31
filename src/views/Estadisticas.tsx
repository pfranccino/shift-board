import {
  summarize, getShiftIds, getCatIds, getCat, getShift, shiftColors, catColors, statusColors,
  complianceStatus, initials, avatarBg,
} from '../data';
import { HoursBar } from '../components/HoursBar';
import { Icon } from '../components/Icon';
import type { Worker, ComplianceStatus } from '../types';

interface Props { workers: Worker[]; dark: boolean; }

function KpiCard({ label, value, unit, sub, accent, icon }: { label: string; value: string | number; unit?: string; sub?: string; accent?: string; icon?: string }) {
  const text3 = 'var(--text-3)';
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '16px 18px', boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: text3, fontWeight: 500 }}>{label}</span>
        {icon && <span style={{ color: accent || text3 }}><Icon name={icon} size={16} /></span>}
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 30, fontWeight: 600, letterSpacing: '-0.03em', color: accent }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: text3, fontWeight: 500 }}>{unit}</span>}
      </div>
      {sub && <div style={{ marginTop: 6, fontSize: 11.5, color: text3 }}>{sub}</div>}
    </div>
  );
}

function BarRow({ label, value, max, color, dark, dot }: { label: string; value: number; max: number; color: string; dark: boolean; dot?: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  const track = dark ? 'oklch(0.28 0 0)' : 'oklch(0.93 0.003 250)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '92px 1fr 44px', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: 99, background: dot }} />}
        {label}
      </span>
      <div style={{ height: 9, borderRadius: 99, overflow: 'hidden', background: track }}>
        <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: color, transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
      </div>
      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, textAlign: 'right', fontWeight: 600 }}>{value}h</span>
    </div>
  );
}

export function EstadisticasView({ workers, dark }: Props) {
  const s = summarize(workers);
  const accent = '#4664c9';
  const overC = statusColors('over', dark).solid;
  const underC = statusColors('under', dark).solid;
  const exactC = statusColors('exact', dark).solid;
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';

  const shiftIds = getShiftIds();
  const maxShift = Math.max(1, ...shiftIds.map((k) => s.byShift[k] || 0));
  const catIds = getCatIds();
  const maxCat = Math.max(1, ...catIds.map((k) => s.byCat[k]?.hours || 0));
  const cov = s.coverage;
  const covPct = cov.totalSlots ? Math.round((cov.metSlots / cov.totalSlots) * 100) : 100;

  const ranked = [...workers]
    .map((w) => ({ w, c: complianceStatus(w) }))
    .sort((a, b) => Math.abs(b.c.diff) - Math.abs(a.c.diff));

  const panel: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
    padding: 20, boxShadow: 'var(--shadow-sm)',
  };
  const panelHead: React.CSSProperties = {
    display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16,
  };

  return (
    <div className="view-pad">
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Estadísticas</h1>
        <p style={{ margin: '5px 0 0', color: text3, fontSize: 13 }}>Resumen de la semana en curso</p>
      </div>

      {/* KPI grid */}
      <div className="kpi-grid">
        <KpiCard label="Trabajadores" value={s.total} sub={`${s.full} completo · ${s.part} part time`} icon="users" />
        <KpiCard label="Horas asignadas" value={s.assigned} unit="h" sub={`de ${s.targetTotal}h objetivo · +${s.extra}h / −${s.missing}h`} accent={accent} icon="clock" />
        <KpiCard label="Cobertura cubierta" value={cov.totalSlots ? `${covPct}%` : '—'} sub={cov.totalSlots ? `${cov.metSlots}/${cov.totalSlots} franjas-día con el mínimo` : 'Sin mínimos definidos'} accent={covPct === 100 ? exactC : accent} icon="check" />
        <KpiCard label="Huecos de cobertura" value={cov.gaps.length} sub={cov.gaps.length ? 'turnos por debajo del mínimo' : 'todo cubierto'} accent={cov.gaps.length ? underC : exactC} icon="warn" />
      </div>

      {/* Stat columns */}
      <div className="stat-cols">
        <div style={panel}>
          <div style={panelHead}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Cumplimiento de horas</h3>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, color: text3 }}>{s.total} trabajadores</span>
          </div>
          <div style={{ display: 'flex', height: 14, borderRadius: 99, overflow: 'hidden', gap: 2, marginBottom: 14 }}>
            {s.exact > 0 && <div style={{ flex: s.exact, background: exactC }} title={`Exacto: ${s.exact}`} />}
            {s.over > 0 && <div style={{ flex: s.over, background: overC }} title={`Exceso: ${s.over}`} />}
            {s.under > 0 && <div style={{ flex: s.under, background: underC }} title={`Déficit: ${s.under}`} />}
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {([['Exacto', exactC, s.exact], ['Exceso', overC, s.over], ['Déficit', underC, s.under]] as [string, string, number][]).map(([lbl, c, n]) => (
              <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-2)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 99, background: c }} />
                {lbl} <b style={{ fontFamily: '"IBM Plex Mono", monospace', color: 'var(--text-1)', marginLeft: 2 }}>{n}</b>
              </span>
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '22px 0' }} />

          <div style={{ ...panelHead, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>Horas por franja</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shiftIds.map((k) => (
              <BarRow key={k} label={getShift(k).name} value={s.byShift[k] || 0} max={maxShift} color={shiftColors(k, dark).dot} dark={dark} />
            ))}
          </div>

          <div style={{ height: 1, background: 'var(--border)', margin: '22px 0' }} />

          <div style={{ ...panelHead, marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>Horas por categoría</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {catIds.map((k) => (
              <BarRow key={k} label={getCat(k).name} value={s.byCat[k]?.hours || 0} max={maxCat} color={catColors(k, dark).dot} dot={catColors(k, dark).dot} dark={dark} />
            ))}
          </div>
        </div>

        <div style={panel}>
          <div style={panelHead}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Desglose por trabajador</h3>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, color: text3 }}>ordenado por desvío</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {ranked.map(({ w, c }) => {
              const sc = statusColors(c.status as ComplianceStatus, dark);
              return (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center',
                    fontSize: 10, fontWeight: 600, background: avatarBg(w.name, dark),
                    color: dark ? 'oklch(0.85 0.01 260)' : 'oklch(0.25 0.01 260)', flexShrink: 0,
                  }}>{initials(w.name)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, fontWeight: 600, color: sc.fg, flexShrink: 0, marginLeft: 8 }}>
                        {c.hours}<span style={{ color: text3 }}>/{c.target}h</span>
                      </span>
                    </div>
                    <HoursBar hours={c.hours} target={c.target} dark={dark} height={6} />
                  </div>
                  <span style={{
                    fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, fontWeight: 600,
                    padding: '3px 7px', borderRadius: 6, minWidth: 38, textAlign: 'center',
                    color: c.diff === 0 ? text3 : sc.fg,
                    background: c.diff === 0 ? 'transparent' : sc.bg,
                  }}>
                    {c.diff > 0 ? '+' : ''}{c.diff === 0 ? '✓' : c.diff + 'h'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

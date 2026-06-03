import { useState } from 'react';
import { Icon } from '../components/Icon';
import { hueColors, kindColors } from '../data';
import { ME, MY_REQUESTS, SHIFT_DEFS, REQ_TYPE, REQ_STATUS, TEAM } from '../data/platform';
import type { DayKey } from '../types';

const DAYS: { key: DayKey; short: string; label: string; weekend?: boolean }[] = [
  { key: 'lun', short: 'Lun', label: 'Lunes' },
  { key: 'mar', short: 'Mar', label: 'Martes' },
  { key: 'mie', short: 'Mié', label: 'Miércoles' },
  { key: 'jue', short: 'Jue', label: 'Jueves' },
  { key: 'vie', short: 'Vie', label: 'Viernes' },
  { key: 'sab', short: 'Sáb', label: 'Sábado', weekend: true },
  { key: 'dom', short: 'Dom', label: 'Domingo', weekend: true },
];

// ─── Shared micro-components ───────────────────────────────────────────────

function Badge({ kind = 'neutral', hue, dark, dot, children }: { kind?: string; hue?: number; dark: boolean; dot?: boolean; children: React.ReactNode }) {
  const co = hue != null ? hueColors(hue, dark) : kindColors(kind, dark);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: co.bg, color: co.fg, border: `1px solid ${co.border}`, fontSize: 11.5, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap' }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: co.dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

function Bar({ pct, kind, hue = 250, dark, h = 8 }: { pct: number; kind?: string; hue?: number; dark: boolean; h?: number }) {
  const co = kind ? kindColors(kind, dark) : hueColors(hue, dark);
  const track = dark ? 'oklch(0.30 0 0)' : 'oklch(0.92 0.003 250)';
  return (
    <div style={{ width: '100%', height: h, background: track, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: co.dot, borderRadius: 99, transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

function Card({ children, pad = 18, style }: { children: React.ReactNode; pad?: number; style?: React.CSSProperties }) {
  return <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', padding: pad, ...style }}>{children}</div>;
}

function Kpi({ label, value, unit, sub, icon, kind, hue, dark }: { label: string; value: string | number; unit?: string; sub?: string; icon?: string; kind?: string; hue?: number; dark: boolean }) {
  const co = hue != null ? hueColors(hue, dark) : kind ? kindColors(kind, dark) : null;
  return (
    <Card pad={16}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500 }}>{label}</span>
        {icon && <span style={co ? { color: co.fg } : undefined}><Icon name={icon} size={17} /></span>}
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 5 }}>
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 28, fontWeight: 600, letterSpacing: '-0.03em' }}>{value}</span>
        {unit && <span style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 500 }}>{unit}</span>}
      </div>
      {sub && <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-3)' }}>{sub}</div>}
    </Card>
  );
}

function ViewHead({ title, sub, children }: { title: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>{title}</h1>
        {sub && <p style={{ margin: '5px 0 0', color: 'var(--text-3)', fontSize: 13 }}>{sub}</p>}
      </div>
      {children && <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>{children}</div>}
    </div>
  );
}

function BackBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'var(--text-3)', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 12.5, cursor: 'pointer', padding: 0, marginBottom: 16, alignSelf: 'flex-start' }}>
      <Icon name="chevL" size={15} /> {label}
    </button>
  );
}

function myHours(shifts: Record<DayKey, string>): number {
  return DAYS.reduce((s, d) => s + (SHIFT_DEFS[shifts[d.key]]?.hours ?? 0), 0);
}

// ─── 1. Mi semana ──────────────────────────────────────────────────────────
export function EmSemana({ dark, toast, goTab }: { dark: boolean; toast: (msg: string, k?: string) => void; goTab: (tab: string) => void }) {
  const me = ME;
  const h = myHours(me.shifts);
  const today: DayKey = 'mie';
  const accent = '#4664c9';
  void toast;

  return (
    <div className="view-pad">
      <ViewHead title="Mi semana" sub={`${me.org} · ${me.area} · Semana 23`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="chevL" size={16} /></button>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 13, fontWeight: 500, minWidth: 70, textAlign: 'center' }}>2–8 jun</span>
          <button style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="chevR" size={16} /></button>
        </div>
      </ViewHead>

      {/* Day cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10, marginBottom: 14 }}>
        {DAYS.map((d) => {
          const sid = me.shifts[d.key];
          const s = SHIFT_DEFS[sid];
          const co = s && s.hue != null ? hueColors(s.hue, dark) : null;
          const isToday = d.key === today;
          return (
            <div key={d.key} style={{
              background: d.weekend ? 'var(--surface-2)' : 'var(--surface)',
              border: isToday ? `1px solid ${accent}` : '1px solid var(--border)',
              boxShadow: isToday ? `0 0 0 1px ${accent}` : 'var(--shadow-sm)',
              borderRadius: 12, padding: '12px 10px', minHeight: 132,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>{d.short}</span>
                {isToday && <span style={{ fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', color: accent, background: `color-mix(in oklch, ${accent} 14%, transparent)`, padding: '2px 6px', borderRadius: 5 }}>Hoy</span>}
              </div>
              {sid === 'libre' || !co ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                  <Icon name="sun" size={18} /><span>Libre</span>
                </div>
              ) : (
                <div style={{ flex: 1, borderRadius: 9, padding: 10, display: 'flex', flexDirection: 'column', gap: 3, justifyContent: 'center', background: co.bg, color: co.fg, border: `1px solid ${co.border}` }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{s!.name}</span>
                  <span style={{ fontSize: 11, fontFamily: '"IBM Plex Mono", monospace', opacity: 0.8 }}>{s!.range}</span>
                  <span style={{ fontSize: 11, fontFamily: '"IBM Plex Mono", monospace', opacity: 0.7, marginTop: 'auto' }}>{s!.hours}h</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card>
          <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Esta semana</h3></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 42, fontWeight: 600, letterSpacing: '-0.03em' }}>
              {h}<small style={{ fontSize: 18, color: 'var(--text-3)' }}>h</small>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginBottom: 6 }}>de {me.target}h objetivo ({me.contract})</div>
              <Bar pct={(h / me.target) * 100} kind={h === me.target ? 'ok' : h > me.target ? 'warn' : 'bad'} dark={dark} h={9} />
            </div>
          </div>
        </Card>
        <Card>
          <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Acciones rápidas</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
            {[
              { tab: 'cambio', icon: 'swap', label: 'Solicitar cambio', hue: 250 },
              { tab: 'libre', icon: 'sun', label: 'Pedir día libre', hue: 35 },
              { tab: 'disponibilidad', icon: 'clock', label: 'Disponibilidad', hue: 180 },
              { tab: 'horas', icon: 'chart', label: 'Mis horas', hue: 145 },
            ].map(({ tab, icon, label, hue }) => (
              <button key={tab} onClick={() => goTab(tab)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: 12,
                border: '1px solid var(--border)', borderRadius: 11, background: 'var(--surface-2)',
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13, fontWeight: 500,
                color: 'var(--text-1)', cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap',
              }}>
                <span style={{ display: 'grid', placeItems: 'center', color: hueColors(hue, dark).dot }}><Icon name={icon} size={18} /></span>
                {label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Mis solicitudes</h3>
          <a href="#" onClick={(e) => { e.preventDefault(); goTab('cambio'); }} style={{ fontSize: 12, color: '#4664c9', textDecoration: 'none', fontWeight: 500 }}>Nueva</a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MY_REQUESTS.map((r) => {
            const rt = REQ_TYPE[r.type];
            const rs = REQ_STATUS[r.status];
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0' }}>
                <span style={{ display: 'grid', placeItems: 'center', color: hueColors(rt.hue, dark).dot, flexShrink: 0 }}><Icon name={rt.icon} size={16} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{r.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{r.detail}</div>
                </div>
                <Badge kind={rs.kind} dark={dark} dot>{rs.label}</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── 2. Mis horas ──────────────────────────────────────────────────────────
export function EmHoras({ dark }: { dark: boolean }) {
  const me = ME;
  const h = myHours(me.shifts);
  const weeks = [38, 40, 36, 40, 42, h];
  const byShift: Record<string, number> = {};
  DAYS.forEach((d) => {
    const sid = me.shifts[d.key];
    if (sid !== 'libre') byShift[sid] = (byShift[sid] ?? 0) + (SHIFT_DEFS[sid]?.hours ?? 0);
  });

  return (
    <div className="view-pad">
      <ViewHead title="Mis horas" sub="Tu carga horaria y cumplimiento." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
        <Kpi label="Esta semana" value={h} unit="h" icon="clock" dark={dark} hue={180} sub={`meta ${me.target}h`} />
        <Kpi label="Promedio 6 sem." value={Math.round(weeks.reduce((a, b) => a + b, 0) / weeks.length)} unit="h" icon="trend" dark={dark} hue={145} sub="por semana" />
        <Kpi label="Acumulado mes" value={weeks.slice(-4).reduce((a, b) => a + b, 0)} unit="h" icon="chart" dark={dark} kind="ok" sub="últimas 4 semanas" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Horas por semana</h3>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>meta {me.target}h</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 150, paddingTop: 8 }}>
            {weeks.map((w, i) => {
              const isNow = i === weeks.length - 1;
              const st = w === me.target ? 'ok' : w > me.target ? 'warn' : 'bad';
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                  <div style={{ flex: 1, width: '100%', maxWidth: 38, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: `${(w / 48) * 100}%`, background: kindColors(st, dark).dot, opacity: isNow ? 1 : 0.55, borderRadius: '6px 6px 0 0', transition: 'height .4s cubic-bezier(.4,0,.2,1)' }} />
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--text-3)', fontFamily: '"IBM Plex Mono", monospace' }}>{isNow ? 'Ahora' : `S${18 + i}`}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Por tipo de turno</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Object.entries(byShift).map(([sid, hrs]) => {
              const s = SHIFT_DEFS[sid];
              if (!s || s.hue == null) return null;
              return (
                <div key={sid} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 44px', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--text-2)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: hueColors(s.hue, dark).dot, flexShrink: 0 }} />
                    {s.name}
                  </span>
                  <Bar pct={(hrs / h) * 100} hue={s.hue} dark={dark} h={9} />
                  <span style={{ fontSize: 12, textAlign: 'right', fontFamily: '"IBM Plex Mono", monospace', fontWeight: 600 }}>{hrs}h</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── 3. Solicitar cambio ───────────────────────────────────────────────────
export function EmCambio({ dark, toast, goTab }: { dark: boolean; toast: (msg: string, k?: string) => void; goTab: (tab: string) => void }) {
  const me = ME;
  const workDays = DAYS.filter((d) => me.shifts[d.key] !== 'libre');
  const [day, setDay] = useState(workDays[0]?.key ?? 'lun');
  const [to, setTo] = useState('tarde');
  const [withWho, setWithWho] = useState('Lucas Vera');
  const [note, setNote] = useState('');
  const border = dark ? 'oklch(0.40 0.012 260)' : 'oklch(0.86 0.006 250)';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';
  const accent = '#4664c9';

  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 9, background: surface2, fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13.5, color: 'var(--text-1)', outline: 'none' };

  return (
    <div className="view-pad" style={{ maxWidth: 720 }}>
      <BackBtn label="Mi semana" onClick={() => goTab('semana')} />
      <ViewHead title="Solicitar cambio de turno" sub="Tu supervisor recibirá la solicitud para aprobarla." />
      <Card pad={20}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>¿Qué día querés cambiar?</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {workDays.map((d) => {
                const s = SHIFT_DEFS[me.shifts[d.key]];
                const on = day === d.key;
                return (
                  <button key={d.key} onClick={() => setDay(d.key)} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    padding: '9px 14px', border: `1px solid ${on ? accent : border}`, borderRadius: 10,
                    background: on ? `color-mix(in oklch, ${accent} 8%, ${surface2})` : surface2,
                    fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                    fontSize: 13, fontWeight: 600, color: on ? accent : 'var(--text-2)', cursor: 'pointer',
                  }}>
                    {d.short}
                    <small style={{ fontSize: 10.5, fontWeight: 500, color: on ? accent : 'var(--text-3)' }}>{s?.name ?? '—'}</small>
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Nuevo turno</span>
              <select value={to} onChange={(e) => setTo(e.target.value)} style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34 }}>
                {['manana', 'tarde', 'noche', 'medioDia'].map((s) => <option key={s} value={s}>{SHIFT_DEFS[s]?.name} ({SHIFT_DEFS[s]?.range})</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Intercambiar con</span>
              <select value={withWho} onChange={(e) => setWithWho(e.target.value)} style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34 }}>
                {TEAM.filter((t) => t.id !== 't2').map((t) => <option key={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Nota (opcional)</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Contale a tu supervisor el motivo…" style={{ ...inputStyle, resize: 'vertical', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 4 }}>
            <button onClick={() => goTab('semana')} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { toast('Solicitud de cambio enviada'); goTab('semana'); }} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: accent, color: 'white', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon name="swap" size={15} stroke={1.9} /> Enviar solicitud
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── 4. Pedir libre ────────────────────────────────────────────────────────
export function EmLibre({ dark, toast, goTab }: { dark: boolean; toast: (msg: string, k?: string) => void; goTab: (tab: string) => void }) {
  const [type, setType] = useState('dia');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('personal');
  const border = dark ? 'oklch(0.40 0.012 260)' : 'oklch(0.86 0.006 250)';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';
  const accent = '#4664c9';
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 9, background: surface2, fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13.5, color: 'var(--text-1)', outline: 'none' };
  const segOpts = [{ v: 'dia', l: 'Día puntual' }, { v: 'vacaciones', l: 'Vacaciones' }, { v: 'licencia', l: 'Licencia' }];

  return (
    <div className="view-pad" style={{ maxWidth: 720 }}>
      <BackBtn label="Mi semana" onClick={() => goTab('semana')} />
      <ViewHead title="Pedir días libres" sub="Vacaciones, día personal o licencia." />
      <Card pad={20}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Tipo</span>
            <div style={{ display: 'flex', background: 'var(--surface-2)', border: `1px solid ${border}`, borderRadius: 9, padding: 3, gap: 2 }}>
              {segOpts.map(({ v, l }) => {
                const on = type === v;
                return <button key={v} onClick={() => setType(v)} style={{ flex: 1, padding: '6px 12px', border: 'none', borderRadius: 6, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--text-1)' : 'var(--text-2)', boxShadow: on ? 'var(--shadow-sm)' : 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>{l}</button>;
              })}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Desde</span>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Hasta</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Motivo</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)} style={{ ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 34 }}>
              <option value="personal">Asunto personal</option>
              <option value="medico">Trámite médico</option>
              <option value="familiar">Motivo familiar</option>
              <option value="vacaciones">Vacaciones</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)' }}>
            <Icon name="clock" size={15} />
            <span>Tenés <b>9 días</b> disponibles este año. Esta solicitud descontaría del saldo si se aprueba.</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 4 }}>
            <button onClick={() => goTab('semana')} style={{ padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { toast('Solicitud de días libres enviada'); goTab('semana'); }} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: accent, color: 'white', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
              <Icon name="sun" size={15} stroke={1.9} /> Enviar solicitud
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── 5. Disponibilidad ─────────────────────────────────────────────────────
export function EmDisponibilidad({ dark, toast }: { dark: boolean; toast: (msg: string, k?: string) => void }) {
  const [avail, setAvail] = useState<Record<DayKey, boolean>>({ ...ME.availability });
  const toggle = (k: DayKey) => setAvail((p) => ({ ...p, [k]: !p[k] }));
  const accent = '#4664c9';
  const borderStrong = dark ? 'oklch(0.40 0.012 260)' : 'oklch(0.86 0.006 250)';

  return (
    <div className="view-pad" style={{ maxWidth: 720 }}>
      <ViewHead title="Mi disponibilidad" sub="Indicá qué días podés trabajar. Tu supervisor lo tendrá en cuenta al armar turnos." />
      <Card pad={20}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {DAYS.map((d) => (
            <div key={d.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{d.label}</span>
              <button onClick={() => toggle(d.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"IBM Plex Sans", system-ui, sans-serif' }}>
                <span style={{ width: 38, height: 22, borderRadius: 99, background: avail[d.key] ? accent : borderStrong, position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: 99, background: 'white', transition: 'transform .2s', transform: avail[d.key] ? 'translateX(16px)' : 'none' }} />
                </span>
                <span style={{ fontSize: 12.5, color: 'var(--text-2)', width: 96, textAlign: 'left' }}>{avail[d.key] ? 'Disponible' : 'No disponible'}</span>
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button onClick={() => toast('Disponibilidad actualizada')} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: accent, color: 'white', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <Icon name="check" size={15} stroke={2} /> Guardar cambios
          </button>
        </div>
      </Card>
    </div>
  );
}

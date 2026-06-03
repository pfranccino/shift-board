import { useState } from 'react';
import { Icon } from '../components/Icon';
import { hueColors, kindColors, initials, avatarBg } from '../data';
import { SHIFT_REQUESTS, REQ_TYPE, REQ_STATUS, TEAM, CAT_HUE, SHIFT_DEFS } from '../data/platform';
import type { ShiftRequest, UserRole } from '../types';

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

function Avatar({ name, size = 32, dark, hue }: { name: string; size?: number; dark: boolean; hue?: number }) {
  const bg = hue != null ? hueColors(hue, dark).bg : avatarBg(name, dark);
  const fg = hue != null ? hueColors(hue, dark).fg : (dark ? 'oklch(0.85 0.01 260)' : 'oklch(0.25 0.01 260)');
  return (
    <span style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), display: 'grid', placeItems: 'center', background: bg, color: fg, fontSize: size * 0.36, fontWeight: 600, flexShrink: 0 }}>
      {initials(name)}
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

function Btn({ children, variant = 'ghost', icon, iconRight, onClick, size }: { children: React.ReactNode; variant?: 'primary' | 'ghost'; icon?: string; iconRight?: string; onClick?: () => void; size?: 'sm' }) {
  const accent = '#4664c9';
  return (
    <button
      onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: size === 'sm' ? '6px 11px' : '8px 14px', borderRadius: 9, fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: size === 'sm' ? 12.5 : 13, cursor: 'pointer', border: variant === 'primary' ? 'none' : '1px solid var(--border)', background: variant === 'primary' ? accent : 'var(--surface)', color: variant === 'primary' ? 'white' : 'var(--text-2)', whiteSpace: 'nowrap' }}
    >
      {icon && <Icon name={icon} size={15} stroke={1.9} />}
      {children}
      {iconRight && <Icon name={iconRight} size={15} stroke={1.9} />}
    </button>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
function teamHours(member: typeof TEAM[0]) {
  return Object.values(member.shifts).reduce((s, sid) => s + (SHIFT_DEFS[sid]?.hours ?? 0), 0);
}
function statusOf(member: typeof TEAM[0]) {
  const h = teamHours(member);
  const d = h - member.target;
  return { h, d, kind: d === 0 ? 'ok' : d > 0 ? 'warn' : 'bad' };
}

// ─── 1. Inicio ─────────────────────────────────────────────────────────────
export function MgInicio({ dark, role, toast, goTab }: { dark: boolean; role: UserRole; toast: (msg: string, kind?: string) => void; goTab: (tab: string) => void }) {
  const isArea = role === 'supervisor';
  const team = isArea ? TEAM.filter((t) => t.cat === 'Bombero') : TEAM;
  const pending = SHIFT_REQUESTS.filter((r) => r.status === 'pending' && (!isArea || r.area === 'Bombero'));
  const totalH = team.reduce((s, w) => s + teamHours(w), 0);
  const targetH = team.reduce((s, w) => s + w.target, 0);
  const under = team.filter((w) => statusOf(w).kind === 'bad').length;
  void toast;

  return (
    <div className="view-pad">
      <ViewHead title={isArea ? 'Inicio — Supervisor' : 'Inicio'} sub={`Resumen de ${isArea ? 'tu área (Bombero)' : 'Estación Norte S.A.'} · Semana 23`}>
        <Btn variant="primary" icon="calendar" onClick={() => goTab('turnos')}>Ir al cuadro</Btn>
      </ViewHead>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
        <Kpi label={isArea ? 'Mi equipo' : 'Trabajadores'} value={team.length} icon="users" dark={dark} hue={250} sub={`${team.filter((t) => t.contract === 'full').length} full · ${team.filter((t) => t.contract === 'part').length} part`} />
        <Kpi label="Horas asignadas" value={totalH} unit="h" icon="clock" dark={dark} hue={180} sub={`meta ${targetH}h`} />
        <Kpi label="Cobertura" value="92" unit="%" icon="shield" dark={dark} kind="ok" sub="franjas cubiertas" />
        <Kpi label="Solicitudes" value={pending.length} icon="inbox" dark={dark} kind={pending.length ? 'warn' : 'ok'} sub="pendientes de aprobar" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Equipo</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); goTab('equipo'); }} style={{ fontSize: 12, color: '#4664c9', textDecoration: 'none', fontWeight: 500 }}>Ver todo</a>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {team.slice(0, 5).map((w) => {
              const st = statusOf(w);
              return (
                <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0' }}>
                  <Avatar name={w.name} size={30} hue={CAT_HUE[w.cat]} dark={dark} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{w.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{w.cat} · {w.contract === 'full' ? 'T. Completo' : 'Part Time'}</div>
                  </div>
                  <Badge kind={st.kind} dark={dark}>{st.h}h{st.d !== 0 ? (st.d > 0 ? ` +${st.d}` : ` ${st.d}`) : ''}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Solicitudes pendientes</h3>
            <a href="#" onClick={(e) => { e.preventDefault(); goTab('solicitudes'); }} style={{ fontSize: 12, color: '#4664c9', textDecoration: 'none', fontWeight: 500 }}>Gestionar</a>
          </div>
          {pending.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Sin solicitudes pendientes 🎉</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {pending.map((r) => {
                const rt = REQ_TYPE[r.type];
                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0' }}>
                    <span style={{ display: 'grid', placeItems: 'center', color: hueColors(rt.hue, dark).dot, flexShrink: 0 }}><Icon name={rt.icon} size={16} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.who}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.detail}</div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: '"IBM Plex Mono", monospace', flexShrink: 0 }}>{r.when}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {under > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '13px 16px', borderRadius: 12, background: `color-mix(in oklch, oklch(0.7 0.12 75) 10%, var(--surface))`, border: `1px solid color-mix(in oklch, oklch(0.7 0.12 75) 28%, transparent)`, fontSize: 13, color: 'var(--text-2)' }}>
          <Icon name="warn" size={16} style={{ color: kindColors('warn', dark).fg }} />
          <span><b>{under}</b> trabajador{under > 1 ? 'es' : ''} por debajo de su meta de horas. Revisa el cuadro.</span>
        </div>
      )}
    </div>
  );
}

// ─── 2. Equipo ─────────────────────────────────────────────────────────────
export function MgEquipo({ dark, role, toast }: { dark: boolean; role: UserRole; toast: (msg: string, kind?: string) => void }) {
  const isArea = role === 'supervisor';
  const team = isArea ? TEAM.filter((t) => t.cat === 'Bombero') : TEAM;
  const [q, setQ] = useState('');
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const list = team.filter((w) => w.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="view-pad">
      <ViewHead title={isArea ? 'Mi equipo' : 'Equipo'} sub={`${team.length} personas${isArea ? ' en tu área' : ' en la organización'}`}>
        {!isArea && <Btn variant="primary" icon="plus" onClick={() => toast('Nuevo trabajador')}>Añadir</Btn>}
      </ViewHead>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, border: `1px solid ${border}`, borderRadius: 9, background: 'var(--surface)', color: 'var(--text-3)', marginBottom: 16, width: 'fit-content' }}>
        <Icon name="search" size={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" style={{ border: 'none', background: 'none', outline: 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13, color: 'var(--text-1)', width: 160 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px,1fr))', gap: 14 }}>
        {list.map((w) => {
          const st = statusOf(w);
          const days = Object.values(w.shifts).filter((s) => s !== 'libre').length;
          return (
            <Card key={w.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={w.name} size={42} hue={CAT_HUE[w.cat]} dark={dark} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
                    <Badge hue={CAT_HUE[w.cat]} dark={dark} dot>{w.cat}</Badge>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{w.role}</span>
                  </div>
                </div>
                {!isArea && <button style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }} onClick={() => toast('Editar ' + w.name)}><Icon name="sliders" size={15} /></button>}
              </div>
              <div style={{ marginTop: 16, paddingTop: 15, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{st.h}h</div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>meta {w.target}h</div>
                  </div>
                  <Badge kind={st.kind} dark={dark}>{st.d === 0 ? 'Exacto' : st.d > 0 ? `Exceso +${st.d}h` : `Déficit ${st.d}h`}</Badge>
                </div>
                <div style={{ marginTop: 12 }}><Bar pct={(st.h / w.target) * 100} kind={st.kind} dark={dark} h={8} /></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: 'var(--text-3)' }}>
                  <span>{days} días con turno</span><span>{7 - days} libres</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── 3. Solicitudes ────────────────────────────────────────────────────────
export function MgSolicitudes({ dark, role, toast }: { dark: boolean; role: UserRole; toast: (msg: string, kind?: string) => void }) {
  const isArea = role === 'supervisor';
  const base = SHIFT_REQUESTS.filter((r) => !isArea || r.area === 'Bombero');
  const [items, setItems] = useState<ShiftRequest[]>(base);
  const [filter, setFilter] = useState('pending');
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';

  const list = items.filter((r) => filter === 'all' || r.status === filter);
  const pendingCount = items.filter((r) => r.status === 'pending').length;

  function act(id: string, status: 'approved' | 'rejected') {
    setItems((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    toast(status === 'approved' ? 'Solicitud aprobada' : 'Solicitud rechazada', status === 'approved' ? 'ok' : 'bad');
  }

  const filterOpts = [
    { v: 'pending', l: `Pendientes${pendingCount ? ` (${pendingCount})` : ''}` },
    { v: 'approved', l: 'Aprobadas' },
    { v: 'rejected', l: 'Rechazadas' },
    { v: 'all', l: 'Todas' },
  ];

  return (
    <div className="view-pad">
      <ViewHead title="Solicitudes" sub="Cambios de turno, días libres y disponibilidad de tu equipo." />

      <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: `1px solid ${border}`, borderRadius: 9, padding: 3, gap: 2, marginBottom: 16 }}>
        {filterOpts.map(({ v, l }) => {
          const on = filter === v;
          return <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--text-1)' : 'var(--text-2)', boxShadow: on ? 'var(--shadow-sm)' : 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>{l}</button>;
        })}
      </div>

      {list.length === 0 ? (
        <Card><div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No hay solicitudes en este estado.</div></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((r) => {
            const rt = REQ_TYPE[r.type];
            const rs = REQ_STATUS[r.status];
            const co = hueColors(rt.hue, dark);
            return (
              <Card key={r.id} pad={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', background: co.bg, color: co.fg, border: `1px solid ${co.border}`, flexShrink: 0 }}><Icon name={rt.icon} size={18} /></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                    <Avatar name={r.who} size={24} dark={dark} />
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.who}</span>
                    <Badge hue={rt.hue} dark={dark}>{rt.label}</Badge>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)', marginLeft: 'auto', fontFamily: '"IBM Plex Mono", monospace' }}>{r.when}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 5 }}>{r.detail}</div>
                </div>
                {r.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Btn variant="ghost" size="sm" icon="x" onClick={() => act(r.id, 'rejected')}>Rechazar</Btn>
                    <Btn variant="primary" size="sm" icon="check" onClick={() => act(r.id, 'approved')}>Aprobar</Btn>
                  </div>
                ) : <Badge kind={rs.kind} dark={dark} dot>{rs.label}</Badge>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 4. Turnos (compacto) ──────────────────────────────────────────────────
export function MgTurnos({ dark, role, goTab }: { dark: boolean; role: UserRole; goTab: (tab: string) => void }) {
  const isArea = role === 'supervisor';
  const team = isArea ? TEAM.filter((t) => t.cat === 'Bombero') : TEAM;
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const DAYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
  const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="view-pad">
      <ViewHead title={isArea ? 'Turnos de mi área' : 'Cuadro de turnos'} sub="Vista semanal · Lunes a Domingo">
        {!isArea && <Btn variant="ghost" icon="magic" onClick={() => goTab('asistente')}>Asistente</Btn>}
      </ViewHead>

      <div style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'auto', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 820 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, zIndex: 4, background: 'var(--surface-2)', borderBottom: `1px solid ${border}`, height: 42, textAlign: 'left', padding: '0 16px', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, minWidth: 200, borderRight: `1px solid ${border}` }}>Trabajador</th>
              {DAY_LABELS.map((d, i) => (
                <th key={d} style={{ background: i >= 5 ? `color-mix(in oklch, var(--bg) 60%, transparent)` : 'var(--surface-2)', borderBottom: `1px solid ${border}`, height: 42, textAlign: 'center', minWidth: 96, padding: 6, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600 }}>{d}</th>
              ))}
              <th style={{ position: 'sticky', right: 0, zIndex: 4, background: 'var(--surface-2)', borderBottom: `1px solid ${border}`, height: 42, textAlign: 'right', padding: '0 16px', fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', fontWeight: 600, minWidth: 124, borderLeft: `1px solid ${border}` }}>Semana</th>
            </tr>
          </thead>
          <tbody>
            {team.map((w) => {
              const st = statusOf(w);
              return (
                <tr key={w.id}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--surface)', borderBottom: `1px solid ${border}`, borderRight: `1px solid ${border}`, padding: '0 16px', height: 54, verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={w.name} size={30} hue={CAT_HUE[w.cat]} dark={dark} />
                      <div style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-3)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: 99, background: hueColors(CAT_HUE[w.cat], dark).dot }} />
                          {w.cat}
                        </span>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((dk, i) => {
                    const sid = w.shifts[dk as keyof typeof w.shifts];
                    const s = SHIFT_DEFS[sid];
                    const co = s && s.hue != null ? hueColors(s.hue, dark) : null;
                    return (
                      <td key={dk} style={{ borderBottom: `1px solid ${border}`, height: 54, textAlign: 'center', padding: 6, background: i >= 5 ? `color-mix(in oklch, var(--bg) 60%, transparent)` : '' }}>
                        {sid === 'libre' || !co ? (
                          <span style={{ fontSize: 13, color: 'var(--text-3)' }}>—</span>
                        ) : (
                          <span style={{ display: 'inline-block', padding: '5px 8px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: co.bg, color: co.fg, border: `1px solid ${co.border}`, minWidth: 56 }}>{s!.name}</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ position: 'sticky', right: 0, background: 'var(--surface)', borderBottom: `1px solid ${border}`, borderLeft: `1px solid ${border}`, padding: '0 16px', height: 54, verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <div style={{ width: 92, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, justifyContent: 'flex-end' }}>
                          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 15, fontWeight: 600 }}>{st.h}h</span>
                          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, color: 'var(--text-3)' }}>/{w.target}</span>
                        </div>
                        <Bar pct={(st.h / w.target) * 100} kind={st.kind} dark={dark} h={6} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 16, padding: '12px 14px', borderRadius: 11, background: 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 12.5, color: 'var(--text-2)' }}>
        <Icon name="bolt" size={14} />
        Edición completa de turnos, asistente automático y cobertura por franja disponibles en el módulo Turnos.
      </div>
    </div>
  );
}

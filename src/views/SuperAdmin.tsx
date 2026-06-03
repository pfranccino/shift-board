import React, { useState } from 'react';
import { Icon } from '../components/Icon';
import { hueColors, kindColors, initials, avatarBg } from '../data';
import {
  PLATFORM_ORGS, PLATFORM_PLANS, PLATFORM_USERS, AUDIT_EVENTS, PLATFORM_SERVICES,
  SUPPORT_TICKETS, ORG_STATUS, USER_STATUS, SERVICE_STATUS,
  PRIORITY_KIND, CAPABILITIES, PERMISSIONS, PLATFORM_ROLES, planById,
} from '../data/platform';

// ─── Shared primitives ─────────────────────────────────────────────────────

interface BadgeProps { kind?: string; hue?: number; dark: boolean; dot?: boolean; children: React.ReactNode }
function Badge({ kind = 'neutral', hue, dark, dot, children }: BadgeProps) {
  const co = hue != null ? hueColors(hue, dark) : kindColors(kind, dark);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px',
      borderRadius: 6, background: co.bg, color: co.fg, border: `1px solid ${co.border}`,
      fontSize: 11.5, fontWeight: 600, lineHeight: 1.4, whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: 99, background: co.dot, flexShrink: 0 }} />}
      {children}
    </span>
  );
}

function Avatar({ name, size = 32, dark, hue }: { name: string; size?: number; dark: boolean; hue?: number }) {
  const bg = hue != null ? hueColors(hue, dark).bg : avatarBg(name, dark);
  const fg = hue != null ? hueColors(hue, dark).fg : (dark ? 'oklch(0.85 0.01 260)' : 'oklch(0.25 0.01 260)');
  const r = Math.round(size * 0.28);
  return (
    <span style={{ width: size, height: size, borderRadius: r, display: 'grid', placeItems: 'center', background: bg, color: fg, fontSize: size * 0.36, fontWeight: 600, flexShrink: 0 }}>
      {initials(name)}
    </span>
  );
}


function Bar({ pct, hue = 250, kind, dark, h = 8 }: { pct: number; hue?: number; kind?: string; dark: boolean; h?: number }) {
  const co = kind ? kindColors(kind, dark) : hueColors(hue, dark);
  const track = dark ? 'oklch(0.30 0 0)' : 'oklch(0.92 0.003 250)';
  return (
    <div style={{ width: '100%', height: h, background: track, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min(100, pct)}%`, height: '100%', background: co.dot, borderRadius: 99, transition: 'width .4s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

function Card({ children, pad = 18, style }: { children: React.ReactNode; pad?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-sm)', padding: pad, ...style }}>
      {children}
    </div>
  );
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

function Btn({ children, variant = 'ghost', icon, iconRight, onClick, size }: { children: React.ReactNode; variant?: 'primary' | 'ghost' | 'danger'; icon?: string; iconRight?: string; onClick?: () => void; size?: 'sm' }) {
  const accent = '#4664c9';
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7, padding: size === 'sm' ? '6px 11px' : '8px 14px',
    borderRadius: 9, fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: size === 'sm' ? 12.5 : 13,
    cursor: 'pointer', border: '1px solid transparent', whiteSpace: 'nowrap',
    background: variant === 'primary' ? accent : variant === 'danger' ? 'oklch(0.58 0.12 28)' : 'var(--surface)',
    color: variant === 'primary' || variant === 'danger' ? 'white' : 'var(--text-2)',
    borderColor: variant === 'ghost' ? 'var(--border)' : 'transparent',
  };
  return (
    <button style={base} onClick={onClick}>
      {icon && <Icon name={icon} size={15} stroke={1.9} />}
      {children}
      {iconRight && <Icon name={iconRight} size={15} stroke={1.9} />}
    </button>
  );
}

// Toast hook
export function useToast() {
  const [toast, setToast] = useState<{ msg: string; kind: string; id: number } | null>(null);
  const show = (msg: string, kind = 'ok') => setToast({ msg, kind, id: Date.now() });
  const node = toast ? (
    <div style={{
      position: 'fixed', bottom: 22, left: '50%', transform: 'translateX(-50%)', zIndex: 400,
      background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 11,
      boxShadow: 'var(--shadow-lg)', padding: '11px 16px',
      display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 500,
      animation: 'toastin .25s ease-out',
    }}>
      <span style={{ color: kindColors(toast.kind, document.documentElement.dataset.theme === 'dark').fg }}>
        <Icon name={toast.kind === 'bad' ? 'warn' : 'check'} size={15} stroke={2.2} />
      </span>
      {toast.msg}
    </div>
  ) : null;
  return [node, show] as const;
}

// ─── Drawer ────────────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title?: string; children?: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0.2 0.01 260 / 0.4)', zIndex: 300, display: 'flex', justifyContent: 'flex-end', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <aside style={{ width: 460, maxWidth: '92vw', background: 'var(--surface)', borderLeft: '1px solid var(--border)', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)', animation: 'slidein .2s ease-out' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, padding: '16px 20px', borderTop: '1px solid var(--border)' }}>{footer}</div>}
      </aside>
    </div>
  );
}

// ─── 1. Resumen ────────────────────────────────────────────────────────────
export function SAResumen({ dark, toast }: { dark: boolean; toast: (msg: string, kind?: string) => void }) {
  const orgs = PLATFORM_ORGS;
  const active = orgs.filter((o) => o.status === 'active').length;
  const trial = orgs.filter((o) => o.status === 'trial').length;
  const suspended = orgs.filter((o) => o.status === 'suspended').length;
  const mrr = orgs.reduce((s, o) => s + o.mrr, 0);
  const totalUsers = orgs.reduce((s, o) => s + o.users, 0);
  void toast;

  return (
    <div className="view-pad">
      <ViewHead title="Resumen de la plataforma" sub="Estado general de todas las organizaciones de Turnos.">
        <Badge kind="ok" dark={dark} dot>Todos los servicios operativos</Badge>
      </ViewHead>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 14 }}>
        <Kpi label="Organizaciones" value={orgs.length} icon="building" dark={dark} hue={250} sub={`${active} activas · ${trial} en prueba · ${suspended} suspendidas`} />
        <Kpi label="MRR" value={`$${mrr.toLocaleString()}`} icon="dollar" dark={dark} kind="ok" sub="ingresos recurrentes mensuales" />
        <Kpi label="Usuarios" value={totalUsers} icon="users" dark={dark} hue={180} sub={`${PLATFORM_USERS.length} con acceso a backoffice`} />
        <Kpi label="Uso medio" value={orgs.length ? Math.round(orgs.reduce((s, o) => s + o.usagePct, 0) / orgs.length) : 0} unit="%" icon="trend" dark={dark} hue={70} sub="de los límites de plan consumidos" />
      </div>

      {orgs.length === 0 ? (
        <Card style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏢</div>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 8px' }}>Sin organizaciones todavía</h2>
          <p style={{ fontSize: 13.5, color: 'var(--text-3)', margin: 0, lineHeight: 1.6 }}>
            Las métricas, el MRR y la actividad aparecerán aquí cuando haya organizaciones registradas en la plataforma.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Distribución por plan</h3>
              <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{orgs.length} organizaciones</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PLATFORM_PLANS.map((p) => {
                const n = orgs.filter((o) => o.plan === p.id).length;
                const hue = p.id === 'enterprise' ? 300 : p.id === 'pro' ? 250 : 180;
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 44px', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{p.name}</span>
                    <Bar pct={orgs.length ? (n / orgs.length) * 100 : 0} hue={hue} dark={dark} h={9} />
                    <span style={{ fontSize: 12, textAlign: 'right', color: 'var(--text-1)', fontWeight: 600 }}>{n}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <div style={{ marginBottom: 16 }}><h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Actividad reciente</h3></div>
            {AUDIT_EVENTS.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Sin eventos registrados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {AUDIT_EVENTS.slice(0, 5).map((a) => (
                  <div key={a.id} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: kindColors(a.kind, dark).dot, marginTop: 5, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.4 }}>
                        <b style={{ color: 'var(--text-1)', fontWeight: 600 }}>{a.user}</b> {a.action.toLowerCase()} <b style={{ color: 'var(--text-1)', fontWeight: 600 }}>{a.target}</b>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: '"IBM Plex Mono", monospace' }}>{a.date} · {a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── 2. Organizaciones ──────────────────────────────────────────────────────
export function SAOrganizaciones({ dark, toast }: { dark: boolean; toast: (msg: string, kind?: string) => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const [sel, setSel] = useState<typeof PLATFORM_ORGS[0] | null>(null);
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';

  const orgs = PLATFORM_ORGS.filter((o) =>
    (filter === 'all' || o.status === filter) &&
    (o.name.toLowerCase().includes(q.toLowerCase()) || o.type.toLowerCase().includes(q.toLowerCase()))
  );

  const filterOpts = [
    { v: 'all', l: 'Todas' }, { v: 'active', l: 'Activas' },
    { v: 'trial', l: 'Prueba' }, { v: 'suspended', l: 'Suspendidas' },
  ];

  return (
    <div className="view-pad">
      <ViewHead title="Organizaciones" sub="Clientes de la plataforma y su estado de suscripción.">
        <Btn variant="primary" icon="plus" onClick={() => toast('Invitación de organización enviada')}>Nueva organización</Btn>
      </ViewHead>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, border: `1px solid ${border}`, borderRadius: 9, background: 'var(--surface)', color: 'var(--text-3)' }}>
          <Icon name="search" size={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar organización…" style={{ border: 'none', background: 'none', outline: 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13, color: 'var(--text-1)', width: 190 }} />
        </div>
        <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: `1px solid ${border}`, borderRadius: 9, padding: 3, gap: 2 }}>
          {filterOpts.map(({ v, l }) => {
            const on = filter === v;
            return (
              <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--text-1)' : 'var(--text-2)', boxShadow: on ? 'var(--shadow-sm)' : 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>{l}</button>
            );
          })}
        </div>
      </div>

      <div style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'auto', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 720 }}>
          <thead>
            <tr>
              {['Organización', 'Plan', 'Estado', 'Usuarios', 'Suc.', 'Uso', 'MRR', ''].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-2)', borderBottom: `1px solid ${border}`, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', height: 42, textAlign: ['Usuarios', 'Suc.', 'MRR'].includes(h) ? 'right' : 'left', padding: '0 14px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => {
              const plan = planById(o.plan);
              const ss = ORG_STATUS[o.status];
              const planHue = o.plan === 'enterprise' ? 300 : o.plan === 'pro' ? 250 : 180;
              return (
                <tr key={o.id} onClick={() => setSel(o)} style={{ cursor: 'pointer' }}
                  onMouseEnter={(e) => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach((td) => (td.style.background = 'var(--surface-2)')); }}
                  onMouseLeave={(e) => { Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach((td) => (td.style.background = '')); }}
                >
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', fontSize: 13, verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <Avatar name={o.name} size={34} dark={dark} />
                      <div><div style={{ fontWeight: 500, fontSize: 13.5 }}>{o.name}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{o.type} · {o.country}</div></div>
                    </div>
                  </td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}><Badge hue={planHue} dark={dark}>{plan.name}</Badge></td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}><Badge kind={ss.kind} dark={dark} dot>{ss.label}</Badge></td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', textAlign: 'right', fontFamily: '"IBM Plex Mono", monospace', fontSize: 13 }}>{o.users}</td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', textAlign: 'right', fontFamily: '"IBM Plex Mono", monospace', fontSize: 13 }}>{o.sucursales}</td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 130 }}>
                      <div style={{ flex: 1 }}><Bar pct={o.usagePct} hue={o.usagePct > 85 ? 35 : 250} dark={dark} h={6} /></div>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, color: 'var(--text-2)', width: 34 }}>{o.usagePct}%</span>
                    </div>
                  </td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', textAlign: 'right', fontFamily: '"IBM Plex Mono", monospace', fontSize: 13 }}>{o.mrr ? `$${o.mrr}` : '—'}</td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', textAlign: 'right' }}><Icon name="chevR" size={16} style={{ color: 'var(--text-3)' }} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name}
        footer={sel ? <>
          <Btn variant="ghost" onClick={() => setSel(null)}>Cerrar</Btn>
          <Btn variant={sel.status === 'suspended' ? 'primary' : 'danger'} icon={sel.status === 'suspended' ? 'check' : 'ban'}
            onClick={() => { toast(sel.status === 'suspended' ? 'Organización reactivada' : 'Organización suspendida', sel.status === 'suspended' ? 'ok' : 'bad'); setSel(null); }}>
            {sel.status === 'suspended' ? 'Reactivar' : 'Suspender'}
          </Btn>
        </> : undefined}
      >
        {sel && (() => {
          const plan = planById(sel.plan);
          const ss = ORG_STATUS[sel.status];
          const border2 = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar name={sel.name} size={48} dark={dark} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{sel.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sel.type} · Cliente desde {sel.since}</div>
                </div>
                <Badge kind={ss.kind} dark={dark} dot>{ss.label}</Badge>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: border2, border: `1px solid ${border2}`, borderRadius: 11, overflow: 'hidden' }}>
                {[['Plan', plan.name], ['MRR', sel.mrr ? `$${sel.mrr}` : '—'], ['Usuarios', sel.users], ['Sucursales', sel.sucursales]].map(([l, v]) => (
                  <div key={String(l)} style={{ background: 'var(--surface)', padding: '12px 10px' }}>
                    <div style={{ fontSize: 10.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Uso del plan</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-2)', marginBottom: 7 }}>
                  <span>Trabajadores</span><span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{sel.users} / {plan.limits.users === Infinity ? '∞' : plan.limits.users}</span>
                </div>
                <Bar pct={plan.limits.users === Infinity ? 40 : (sel.users / plan.limits.users) * 100} hue={250} dark={dark} h={7} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--text-2)', margin: '12px 0 7px' }}>
                  <span>Sucursales</span><span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{sel.sucursales} / {plan.limits.sucursales === Infinity ? '∞' : plan.limits.sucursales}</span>
                </div>
                <Bar pct={plan.limits.sucursales === Infinity ? 35 : (sel.sucursales / plan.limits.sucursales) * 100} hue={180} dark={dark} h={7} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Titular de la cuenta</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <Avatar name={sel.owner} size={32} dark={dark} />
                  <div><div style={{ fontWeight: 500, fontSize: 13.5 }}>{sel.owner}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Administrador</div></div>
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}

// ─── 3. Usuarios y roles ───────────────────────────────────────────────────
export function SAUsuarios({ dark, toast }: { dark: boolean; toast: (msg: string, kind?: string) => void }) {
  const [tab, setTab] = useState<'users' | 'perms'>('users');
  const [q, setQ] = useState('');
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';

  const users = PLATFORM_USERS.filter((u) =>
    [u.name, u.email, u.org].some((s) => s.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="view-pad">
      <ViewHead title="Usuarios y roles" sub="Personas con acceso y qué puede hacer cada rol.">
        <Btn variant="primary" icon="plus" onClick={() => toast('Invitación enviada por email')}>Invitar usuario</Btn>
      </ViewHead>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: `1px solid ${border}`, borderRadius: 9, padding: 3, gap: 2 }}>
          {([['users', 'Usuarios'], ['perms', 'Matriz de permisos']] as const).map(([v, l]) => {
            const on = tab === v;
            return <button key={v} onClick={() => setTab(v)} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--text-1)' : 'var(--text-2)', boxShadow: on ? 'var(--shadow-sm)' : 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }}>{l}</button>;
          })}
        </div>
        {tab === 'users' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, border: `1px solid ${border}`, borderRadius: 9, background: 'var(--surface)', color: 'var(--text-3)' }}>
            <Icon name="search" size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar usuario, email u org…" style={{ border: 'none', background: 'none', outline: 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13, color: 'var(--text-1)', width: 200 }} />
          </div>
        )}
      </div>

      {tab === 'users' ? (
        <div style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'auto', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 720 }}>
            <thead>
              <tr>
                {['Usuario', 'Organización', 'Rol', '2FA', 'Estado', 'Último acceso', ''].map((h) => (
                  <th key={h} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-2)', borderBottom: `1px solid ${border}`, fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', height: 42, textAlign: 'left', padding: '0 14px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const r = PLATFORM_ROLES[u.role] ?? PLATFORM_ROLES.admin;
                const us = USER_STATUS[u.status];
                return (
                  <tr key={u.id}>
                    <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <Avatar name={u.name} size={32} dark={dark} />
                        <div><div style={{ fontWeight: 500, fontSize: 13.5 }}>{u.name}</div><div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: '"IBM Plex Mono", monospace' }}>{u.email}</div></div>
                      </div>
                    </td>
                    <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', color: 'var(--text-3)', fontSize: 13 }}>{u.org}</td>
                    <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}><Badge hue={r.hue} dark={dark} dot>{r.name}</Badge></td>
                    <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}>{u.twofa ? <Badge kind="ok" dark={dark}><Icon name="shield" size={12} /> On</Badge> : <span style={{ color: 'var(--text-3)' }}>—</span>}</td>
                    <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}><Badge kind={us.kind} dark={dark} dot>{us.label}</Badge></td>
                    <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', color: 'var(--text-3)', fontSize: 13, fontFamily: '"IBM Plex Mono", monospace' }}>{u.last}</td>
                    <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', textAlign: 'right' }}><button style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }} onClick={() => toast('Abriendo ' + u.name)}><Icon name="sliders" size={15} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <PermMatrix dark={dark} border={border} />
      )}
    </div>
  );
}

function PermMatrix({ dark, border }: { dark: boolean; border: string }) {
  const roles = Object.values(PLATFORM_ROLES);
  const groups = [...new Set(CAPABILITIES.map((c) => c.group))];
  const cell = (v: boolean | 'scoped', hue: number) => {
    if (v === true) return <span style={{ display: 'inline-grid', placeItems: 'center', color: hueColors(hue, dark).dot }}><Icon name="check" size={15} stroke={2.4} /></span>;
    if (v === 'scoped') return <span style={{ display: 'inline-grid', placeItems: 'center', color: 'var(--text-3)' }} title="Limitado a su alcance"><Icon name="dot" size={9} /></span>;
    return <span style={{ display: 'inline-grid', placeItems: 'center', color: 'var(--border-strong)' }}><Icon name="x" size={13} stroke={2} /></span>;
  };
  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'auto', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 640 }}>
        <thead>
          <tr>
            <th style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-2)', borderBottom: `1px solid ${border}`, height: 42, textAlign: 'left', padding: '0 14px', fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)' }}>Capacidad</th>
            {roles.map((r) => (
              <th key={r.key} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-2)', borderBottom: `1px solid ${border}`, height: 42, textAlign: 'center', padding: '0 14px', fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: 99, marginRight: 6, background: hueColors(r.hue, dark).dot, verticalAlign: 'middle' }} />
                {r.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <React.Fragment key={g}>
              <tr><td colSpan={roles.length + 1} style={{ background: 'var(--surface-2)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', padding: '8px 14px', borderBottom: `1px solid ${border}` }}>{g}</td></tr>
              {CAPABILITIES.filter((c) => c.group === g).map((c) => (
                <tr key={c.id}>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '10px 14px', fontSize: 13, color: 'var(--text-1)', fontWeight: 450 }}>{c.label}</td>
                  {roles.map((r) => (
                    <td key={r.key} style={{ borderBottom: `1px solid ${border}`, padding: '10px 14px', textAlign: 'center' }}>{cell(PERMISSIONS[c.id][r.key] as boolean | 'scoped', r.hue)}</td>
                  ))}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', padding: '14px 18px', borderTop: `1px solid ${border}`, fontSize: 12, color: 'var(--text-2)' }}>
        {[['check', 'Permitido'], ['dot', 'Limitado a su alcance'], ['x', 'Sin acceso']].map(([icon, label]) => (
          <span key={icon} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon name={icon} size={13} stroke={2} /> {label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── 4. Planes y facturación ───────────────────────────────────────────────
export function SAPlanes({ dark, toast }: { dark: boolean; toast: (msg: string, kind?: string) => void }) {
  const orgs = PLATFORM_ORGS;
  const totalMrr = orgs.reduce((s, o) => s + o.mrr, 0);
  const paying = orgs.filter((o) => o.mrr > 0);
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';

  return (
    <div className="view-pad">
      <ViewHead title="Planes y facturación" sub="Definición de planes y suscripción por organización." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
        <Kpi label="MRR total" value={`$${totalMrr.toLocaleString()}`} icon="dollar" dark={dark} kind="ok" sub="ingresos recurrentes mensuales" />
        <Kpi label="Orgs pagas" value={paying.length} icon="building" dark={dark} hue={250} sub={`${orgs.length - paying.length} en prueba o suspendidas`} />
        <Kpi label="Ticket promedio" value={`$${Math.round(totalMrr / paying.length)}`} icon="card" dark={dark} hue={180} sub="por organización paga" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '26px 0 14px' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Planes disponibles</h3>
        <Btn variant="ghost" size="sm" icon="plus" onClick={() => toast('Nuevo plan')}>Añadir plan</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {PLATFORM_PLANS.map((p) => {
          const planOrgs = orgs.filter((o) => o.plan === p.id);
          const hue = p.id === 'enterprise' ? 300 : p.id === 'pro' ? 250 : 180;
          const co = hueColors(hue, dark);
          return (
            <Card key={p.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2, fontFamily: '"IBM Plex Mono", monospace' }}>{p.price == null ? 'A medida' : `$${p.price}/${p.period}`}</div>
                </div>
                <Badge hue={hue} dark={dark}>{planOrgs.length} orgs</Badge>
              </div>
              <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="users" size={13} /> {p.limits.users === Infinity ? 'Ilimitados' : p.limits.users} trab.</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="building" size={13} /> {p.limits.sucursales === Infinity ? 'Ilimitadas' : p.limits.sucursales} suc.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderTop: `1px solid ${border}`, borderBottom: `1px solid ${border}`, marginBottom: 12, fontSize: 12.5 }}>
                <span style={{ color: 'var(--text-3)' }}>Ingreso del plan</span>
                <span style={{ fontSize: 15, fontWeight: 600, fontFamily: '"IBM Plex Mono", monospace', color: co.fg }}>${planOrgs.reduce((s, o) => s + o.mrr, 0)}/mes</span>
              </div>
              <Btn variant="ghost" size="sm" icon="sliders" onClick={() => toast(`Editando plan ${p.name}`)}>Editar plan</Btn>
            </Card>
          );
        })}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 600, margin: '26px 0 14px' }}>Suscripciones por organización</h3>
      <div style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'auto', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 600 }}>
          <thead>
            <tr>
              {['Organización', 'Plan', 'Estado', 'MRR', 'Próx. cobro', ''].map((h) => (
                <th key={h} style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface-2)', borderBottom: `1px solid ${border}`, height: 42, textAlign: 'left', padding: '0 14px', fontWeight: 600, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => {
              const ss = ORG_STATUS[o.status];
              const planHue = o.plan === 'enterprise' ? 300 : o.plan === 'pro' ? 250 : 180;
              return (
                <tr key={o.id}>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}><Avatar name={o.name} size={30} dark={dark} /><span style={{ fontWeight: 500, fontSize: 13.5 }}>{o.name}</span></div>
                  </td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}><Badge hue={planHue} dark={dark}>{planById(o.plan).name}</Badge></td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', verticalAlign: 'middle' }}><Badge kind={ss.kind} dark={dark} dot>{ss.label}</Badge></td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', textAlign: 'right', fontFamily: '"IBM Plex Mono", monospace', fontSize: 13 }}>{o.mrr ? `$${o.mrr}` : '—'}</td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', color: 'var(--text-3)', fontFamily: '"IBM Plex Mono", monospace', fontSize: 13 }}>{o.status === 'trial' ? 'fin de prueba' : o.status === 'suspended' ? '—' : '1 jul 2026'}</td>
                  <td style={{ borderBottom: `1px solid ${border}`, padding: '11px 14px', textAlign: 'right' }}><button style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }} onClick={() => toast('Factura de ' + o.name)}><Icon name="card" size={15} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 5. Auditoría ──────────────────────────────────────────────────────────
export function SAAuditoria({ dark }: { dark: boolean }) {
  const [filter, setFilter] = useState('all');
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const items = AUDIT_EVENTS.filter((a) => filter === 'all' || a.role === filter);
  const dates = [...new Set(items.map((a) => a.date))];

  const filterOpts = [
    { v: 'all', l: 'Todo' }, { v: 'super', l: 'Superadmin' },
    { v: 'admin', l: 'Admin' }, { v: 'supervisor', l: 'Supervisor' }, { v: 'empleado', l: 'Empleado' },
  ];

  return (
    <div className="view-pad">
      <ViewHead title="Auditoría" sub="Registro de acciones sensibles en toda la plataforma." />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: `1px solid ${border}`, borderRadius: 9, padding: 3, gap: 2 }}>
          {filterOpts.map(({ v, l }) => {
            const on = filter === v;
            return <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 12px', border: 'none', borderRadius: 6, background: on ? 'var(--surface)' : 'transparent', color: on ? 'var(--text-1)' : 'var(--text-2)', boxShadow: on ? 'var(--shadow-sm)' : 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>{l}</button>;
          })}
        </div>
        <Btn variant="ghost" size="sm" icon="arrow">Exportar CSV</Btn>
      </div>
      <div style={{ border: `1px solid ${border}`, borderRadius: 14, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        {dates.map((d) => (
          <div key={d}>
            <div style={{ padding: '12px 18px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-3)', background: 'var(--surface-2)', borderBottom: `1px solid ${border}` }}>{d}</div>
            {items.filter((a) => a.date === d).map((a) => {
              const r = PLATFORM_ROLES[a.role] ?? PLATFORM_ROLES.admin;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 18px', borderBottom: `1px solid ${border}` }}>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', width: 42, flexShrink: 0, fontFamily: '"IBM Plex Mono", monospace' }}>{a.time}</span>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: kindColors(a.kind, dark).dot, flexShrink: 0 }} />
                  <Avatar name={a.user} size={26} dark={dark} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      <b style={{ color: 'var(--text-1)', fontWeight: 600 }}>{a.user}</b> {a.action.toLowerCase()} <b style={{ color: 'var(--text-1)', fontWeight: 600 }}>{a.target}</b>
                    </span>
                  </div>
                  <Badge hue={r.hue} dark={dark}>{r.short}</Badge>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 6. Configuración global ───────────────────────────────────────────────
export function SAConfig({ dark, toast }: { dark: boolean; toast: (msg: string, kind?: string) => void }) {
  const cats = [{ name: 'Bombero', hue: 250 }, { name: 'Administrador', hue: 70 }, { name: 'Cajero', hue: 35 }, { name: 'Enfermería', hue: 180 }, { name: 'Repositor', hue: 145 }];
  const shifts = [{ name: 'Mañana', range: '06–14', h: 8, hue: 70 }, { name: 'Tarde', range: '14–22', h: 8, hue: 35 }, { name: 'Noche', range: '22–06', h: 8, hue: 270 }, { name: 'Medio Día', range: '09–13', h: 4, hue: 180 }, { name: 'Turno Partido', range: '08–12 · 16–20', h: 8, hue: 300 }];

  return (
    <div className="view-pad">
      <ViewHead title="Configuración global" sub="Plantillas que las organizaciones pueden adoptar al crearse." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Categorías plantilla</h3>
            <Btn variant="ghost" size="sm" icon="plus" onClick={() => toast('Nueva categoría plantilla')}>Añadir</Btn>
          </div>
          {cats.map((c) => (
            <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 8px', borderRadius: 10 }}>
              <span style={{ width: 11, height: 11, borderRadius: 99, background: hueColors(c.hue, dark).dot, flexShrink: 0 }} />
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</div></div>
              <button style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }} onClick={() => toast('Editar ' + c.name)}><Icon name="sliders" size={14} /></button>
            </div>
          ))}
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Franjas plantilla</h3>
            <Btn variant="ghost" size="sm" icon="plus" onClick={() => toast('Nueva franja plantilla')}>Añadir</Btn>
          </div>
          {shifts.map((s) => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 8px', borderRadius: 10 }}>
              <span style={{ width: 11, height: 11, borderRadius: 99, background: hueColors(s.hue, dark).dot, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-3)', fontFamily: '"IBM Plex Mono", monospace', marginTop: 2 }}>{s.range} · {s.h}h</div>
              </div>
              <button style={{ width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center' }} onClick={() => toast('Editar ' + s.name)}><Icon name="sliders" size={14} /></button>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── 7. Soporte ────────────────────────────────────────────────────────────
export function SASoporte({ dark, toast }: { dark: boolean; toast: (msg: string, kind?: string) => void }) {
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const degraded = PLATFORM_SERVICES.filter((s) => s.status !== 'ok').length;

  return (
    <div className="view-pad">
      <ViewHead title="Soporte y estado" sub="Salud de los servicios y tickets de las organizaciones." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Estado del sistema</h3>
            {degraded > 0 && <Badge kind="warn" dark={dark} dot>{degraded} servicio{degraded > 1 ? 's' : ''} degradado{degraded > 1 ? 's' : ''}</Badge>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PLATFORM_SERVICES.map((s) => {
              const ss = SERVICE_STATUS[s.status];
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderBottom: `1px solid ${border}` }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: kindColors(ss.kind, dark).dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: '"IBM Plex Mono", monospace' }}>{s.uptime}</span>
                  <Badge kind={ss.kind} dark={dark}>{ss.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Tickets abiertos</h3>
            <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{SUPPORT_TICKETS.filter((t) => t.status === 'abierto').length} sin resolver</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {SUPPORT_TICKETS.map((t) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${border}`, cursor: 'pointer' }}
                onClick={() => toast('Abriendo ' + t.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{t.subject}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: '"IBM Plex Mono", monospace' }}>{t.id} · {t.org} · {t.age}</div>
                </div>
                <Badge kind={PRIORITY_KIND[t.priority]} dark={dark}>{t.priority}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

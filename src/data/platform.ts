// platform.ts — mock data for the multi-tenant platform layer
// (Superadmin panel, supervisor/employee portals)
import type {
  PlatformOrg, PlatformPlan, PlatformUser,
  ShiftRequest, AuditEvent, PlatformService, SupportTicket, DayKey,
} from '../types';

// ─── Plans ────────────────────────────────────────────────────────────────
export const PLATFORM_PLANS: PlatformPlan[] = [
  {
    id: 'starter', name: 'Starter', price: 29, period: 'mes',
    tagline: 'Para un único local que arranca con turnos digitales.',
    limits: { users: 15, sucursales: 1 },
    features: ['Hasta 15 trabajadores', '1 sucursal', 'Cuadro de turnos semanal', 'Control de cobertura mínima', 'Soporte por email'],
    notIncluded: ['Asistente automático', 'Multi-sucursal', 'Roles y permisos avanzados'],
  },
  {
    id: 'pro', name: 'Pro', price: 79, period: 'mes', popular: true,
    tagline: 'Para operaciones con varios turnos y un equipo que crece.',
    limits: { users: 60, sucursales: 5 },
    features: ['Hasta 60 trabajadores', 'Hasta 5 sucursales', 'Asistente automático de turnos', 'Roles: Admin, Supervisor, Empleado', 'Solicitudes y aprobaciones', 'Estadísticas y exportación', 'Soporte prioritario'],
    notIncluded: ['SSO / SAML', 'Auditoría avanzada'],
  },
  {
    id: 'enterprise', name: 'Enterprise', price: null, period: 'mes',
    tagline: 'Para cadenas con muchas sucursales y necesidades de seguridad.',
    limits: { users: Infinity, sucursales: Infinity },
    features: ['Trabajadores ilimitados', 'Sucursales ilimitadas', 'SSO / SAML + 2FA obligatorio', 'Auditoría avanzada y retención', 'Roles y permisos a medida', 'Gerente de cuenta dedicado', 'SLA 99.9%'],
    notIncluded: [],
  },
];

export function planById(id: string): PlatformPlan {
  return PLATFORM_PLANS.find((p) => p.id === id) ?? PLATFORM_PLANS[0];
}

// ─── Organizations ─────────────────────────────────────────────────────────
export const PLATFORM_ORGS: PlatformOrg[] = [
  { id: 'o1', name: 'Estación Norte S.A.', type: 'Estación de servicio', plan: 'pro', status: 'active', users: 38, sucursales: 3, mrr: 79, usagePct: 63, owner: 'Marina López', since: '2024-03', country: 'AR' },
  { id: 'o2', name: 'Shell Ruta 9', type: 'Estación de servicio', plan: 'enterprise', status: 'active', users: 142, sucursales: 11, mrr: 540, usagePct: 71, owner: 'Ricardo Paz', since: '2023-09', country: 'AR' },
  { id: 'o3', name: 'Café del Puerto', type: 'Gastronomía', plan: 'starter', status: 'trial', users: 9, sucursales: 1, mrr: 0, usagePct: 41, owner: 'Lucía Fernández', since: '2025-05', country: 'UY' },
  { id: 'o4', name: 'Clínica San Lucas', type: 'Salud', plan: 'pro', status: 'active', users: 54, sucursales: 2, mrr: 79, usagePct: 88, owner: 'Dr. Tomás Real', since: '2024-01', country: 'CL' },
  { id: 'o5', name: 'Supermercados Vega', type: 'Retail', plan: 'enterprise', status: 'active', users: 210, sucursales: 18, mrr: 720, usagePct: 66, owner: 'Vanesa Gómez', since: '2023-04', country: 'AR' },
  { id: 'o6', name: 'Logística Andes', type: 'Logística', plan: 'pro', status: 'suspended', users: 31, sucursales: 4, mrr: 0, usagePct: 12, owner: 'Hernán Díaz', since: '2024-07', country: 'PE' },
  { id: 'o7', name: 'Hotel Mirador', type: 'Hotelería', plan: 'starter', status: 'active', users: 12, sucursales: 1, mrr: 29, usagePct: 55, owner: 'Paula Ortiz', since: '2025-01', country: 'AR' },
  { id: 'o8', name: 'Farmacias Lux', type: 'Salud', plan: 'pro', status: 'trial', users: 22, sucursales: 3, mrr: 0, usagePct: 34, owner: 'Sergio Bravo', since: '2025-05', country: 'AR' },
];

export const ORG_STATUS: Record<string, { label: string; kind: string }> = {
  active:    { label: 'Activa',      kind: 'ok' },
  trial:     { label: 'Prueba',      kind: 'info' },
  suspended: { label: 'Suspendida',  kind: 'bad' },
};

// ─── Platform users ────────────────────────────────────────────────────────
export const PLATFORM_USERS: PlatformUser[] = [
  { id: 'u1', name: 'Marina López', email: 'marina@estacionnorte.com', org: 'Estación Norte S.A.', role: 'admin', status: 'active', last: 'hace 4 min', twofa: true },
  { id: 'u2', name: 'Carlos Núñez', email: 'carlos@estacionnorte.com', org: 'Estación Norte S.A.', role: 'supervisor', status: 'active', last: 'hace 1 h', twofa: false },
  { id: 'u3', name: 'Sofía Ibarra', email: 'sofia@estacionnorte.com', org: 'Estación Norte S.A.', role: 'empleado', status: 'active', last: 'ayer', twofa: false },
  { id: 'u4', name: 'Ricardo Paz', email: 'rpaz@shellruta9.com', org: 'Shell Ruta 9', role: 'admin', status: 'active', last: 'hace 20 min', twofa: true },
  { id: 'u5', name: 'Vanesa Gómez', email: 'vgomez@svega.com', org: 'Supermercados Vega', role: 'admin', status: 'active', last: 'hace 2 h', twofa: true },
  { id: 'u6', name: 'Dr. Tomás Real', email: 'treal@sanlucas.cl', org: 'Clínica San Lucas', role: 'admin', status: 'active', last: 'hace 5 h', twofa: true },
  { id: 'u7', name: 'Lucía Fernández', email: 'lucia@cafedelpuerto.uy', org: 'Café del Puerto', role: 'admin', status: 'invited', last: '—', twofa: false },
  { id: 'u8', name: 'Hernán Díaz', email: 'hdiaz@logandes.pe', org: 'Logística Andes', role: 'admin', status: 'suspended', last: 'hace 12 días', twofa: false },
  { id: 'u9', name: 'Ana Belmonte', email: 'ana@soporte.turnos.app', org: 'Turnos (interno)', role: 'super', status: 'active', last: 'ahora', twofa: true },
  { id: 'u10', name: 'Diego Ferreyra', email: 'diego@estacionnorte.com', org: 'Estación Norte S.A.', role: 'empleado', status: 'active', last: 'hace 3 h', twofa: false },
];

export const USER_STATUS: Record<string, { label: string; kind: string }> = {
  active:    { label: 'Activo',     kind: 'ok' },
  invited:   { label: 'Invitado',   kind: 'info' },
  suspended: { label: 'Suspendido', kind: 'bad' },
};

// ─── Role definitions for the platform ────────────────────────────────────
export const PLATFORM_ROLES: Record<string, { key: string; name: string; short: string; hue: number; scope: string }> = {
  super:      { key: 'super',      name: 'Superadmin',      short: 'Superadmin',  hue: 300, scope: 'Plataforma' },
  admin:      { key: 'admin',      name: 'Admin / Gerente', short: 'Admin',       hue: 250, scope: 'Organización' },
  supervisor: { key: 'supervisor', name: 'Supervisor',      short: 'Supervisor',  hue: 180, scope: 'Área' },
  empleado:   { key: 'empleado',   name: 'Empleado',        short: 'Empleado',    hue: 145, scope: 'Personal' },
};

// ─── Permissions matrix ────────────────────────────────────────────────────
export const CAPABILITIES = [
  { id: 'orgs',      label: 'Gestionar organizaciones',          group: 'Plataforma' },
  { id: 'billing_p', label: 'Planes y facturación globales',      group: 'Plataforma' },
  { id: 'audit',     label: 'Ver auditoría y logs',               group: 'Plataforma' },
  { id: 'users_all', label: 'Administrar todos los usuarios',     group: 'Plataforma' },
  { id: 'members',   label: 'Invitar y gestionar miembros',       group: 'Organización' },
  { id: 'config',    label: 'Configurar categorías y franjas',    group: 'Organización' },
  { id: 'billing_o', label: 'Ver y cambiar el plan de la org',    group: 'Organización' },
  { id: 'schedule',  label: 'Editar el cuadro de turnos',         group: 'Operación' },
  { id: 'approve',   label: 'Aprobar solicitudes del equipo',     group: 'Operación' },
  { id: 'stats',     label: 'Ver estadísticas del equipo',        group: 'Operación' },
  { id: 'ownshift',  label: 'Ver mis propios turnos',             group: 'Personal' },
  { id: 'request',   label: 'Pedir cambios, libres y disponibilidad', group: 'Personal' },
];

export const PERMISSIONS: Record<string, Record<string, boolean | 'scoped'>> = {
  orgs:      { super: true,  admin: false,    supervisor: false,    empleado: false },
  billing_p: { super: true,  admin: false,    supervisor: false,    empleado: false },
  audit:     { super: true,  admin: 'scoped', supervisor: false,    empleado: false },
  users_all: { super: true,  admin: false,    supervisor: false,    empleado: false },
  members:   { super: true,  admin: true,     supervisor: 'scoped', empleado: false },
  config:    { super: true,  admin: true,     supervisor: false,    empleado: false },
  billing_o: { super: true,  admin: true,     supervisor: false,    empleado: false },
  schedule:  { super: true,  admin: true,     supervisor: 'scoped', empleado: false },
  approve:   { super: true,  admin: true,     supervisor: true,     empleado: false },
  stats:     { super: true,  admin: true,     supervisor: 'scoped', empleado: false },
  ownshift:  { super: true,  admin: true,     supervisor: true,     empleado: true },
  request:   { super: false, admin: true,     supervisor: true,     empleado: true },
};

// ─── Shift requests ────────────────────────────────────────────────────────
export const SHIFT_REQUESTS: ShiftRequest[] = [
  { id: 'r1', who: 'Sofía Ibarra',    type: 'swap',         title: 'Intercambio de turno',      detail: 'Cambiar Mié Mañana por Tarde con Lucas Vera',    day: 'mié', status: 'pending',  when: 'hoy, 09:12',    area: 'Bombero' },
  { id: 'r2', who: 'Diego Ferreyra',  type: 'timeoff',      title: 'Día libre',                  detail: 'Solicita el Viernes libre por trámite médico',   day: 'vie', status: 'pending',  when: 'hoy, 08:40',    area: 'Bombero' },
  { id: 'r3', who: 'Tamara Ruiz',     type: 'availability', title: 'Cambio de disponibilidad',   detail: 'No disponible los Domingos a partir de junio',   day: 'dom', status: 'pending',  when: 'ayer, 19:05',   area: 'Bombero' },
  { id: 'r4', who: 'Gabriel Ortiz',   type: 'timeoff',      title: 'Vacaciones',                 detail: 'Del 14 al 21 de julio (7 días)',                  day: '—',   status: 'approved', when: 'hace 2 días',   area: 'Admin' },
  { id: 'r5', who: 'Nicolás Aguilar', type: 'swap',         title: 'Intercambio de turno',       detail: 'Cubrir Sáb Medio Día por Marcos Leiva',          day: 'sáb', status: 'rejected', when: 'hace 3 días',   area: 'Bombero' },
];

export const REQ_TYPE: Record<string, { label: string; icon: string; hue: number }> = {
  swap:         { label: 'Intercambio',    icon: 'swap',  hue: 250 },
  timeoff:      { label: 'Día libre',      icon: 'sun',   hue: 35 },
  availability: { label: 'Disponibilidad', icon: 'clock', hue: 180 },
};

export const REQ_STATUS: Record<string, { label: string; kind: string }> = {
  pending:  { label: 'Pendiente', kind: 'warn' },
  approved: { label: 'Aprobada',  kind: 'ok' },
  rejected: { label: 'Rechazada', kind: 'bad' },
};

// ─── Audit log ─────────────────────────────────────────────────────────────
export const AUDIT_EVENTS: AuditEvent[] = [
  { id: 'a1', time: '10:42', date: 'Hoy',  user: 'Ana Belmonte',   role: 'super',      action: 'Suspendió la organización',       target: 'Logística Andes',    kind: 'bad' },
  { id: 'a2', time: '10:31', date: 'Hoy',  user: 'Marina López',   role: 'admin',      action: 'Aprobó solicitud de vacaciones',   target: 'Gabriel Ortiz',      kind: 'ok' },
  { id: 'a3', time: '09:58', date: 'Hoy',  user: 'Ricardo Paz',    role: 'admin',      action: 'Cambió de plan Pro → Enterprise',  target: 'Shell Ruta 9',       kind: 'info' },
  { id: 'a4', time: '09:12', date: 'Hoy',  user: 'Sofía Ibarra',   role: 'empleado',   action: 'Solicitó intercambio de turno',    target: 'Mié · Mañana',       kind: 'neutral' },
  { id: 'a5', time: '18:20', date: 'Ayer', user: 'Ana Belmonte',   role: 'super',      action: 'Creó plantilla de franja',         target: 'Turno Partido',      kind: 'info' },
  { id: 'a6', time: '17:03', date: 'Ayer', user: 'Vanesa Gómez',   role: 'admin',      action: 'Invitó a 4 miembros',              target: 'Supermercados Vega', kind: 'neutral' },
  { id: 'a7', time: '16:44', date: 'Ayer', user: 'Carlos Núñez',   role: 'supervisor', action: 'Editó el cuadro de turnos',        target: 'Semana 22',          kind: 'neutral' },
  { id: 'a8', time: '11:10', date: 'Ayer', user: 'Hernán Díaz',    role: 'admin',      action: 'Intento de acceso bloqueado',      target: 'IP 190.2.x.x',       kind: 'bad' },
];

// ─── System services & tickets ─────────────────────────────────────────────
export const PLATFORM_SERVICES: PlatformService[] = [
  { id: 'api',  name: 'API principal',         status: 'ok',       uptime: '99.98%' },
  { id: 'web',  name: 'Aplicación web',         status: 'ok',       uptime: '99.99%' },
  { id: 'auth', name: 'Autenticación / SSO',    status: 'ok',       uptime: '100%' },
  { id: 'jobs', name: 'Asistente de turnos',    status: 'degraded', uptime: '99.4%' },
  { id: 'mail', name: 'Notificaciones email',   status: 'ok',       uptime: '99.95%' },
  { id: 'db',   name: 'Base de datos',          status: 'ok',       uptime: '99.99%' },
];

export const SERVICE_STATUS: Record<string, { label: string; kind: string }> = {
  ok:       { label: 'Operativo', kind: 'ok' },
  degraded: { label: 'Degradado', kind: 'warn' },
  down:     { label: 'Caído',     kind: 'bad' },
};

export const SUPPORT_TICKETS: SupportTicket[] = [
  { id: 'T-1042', org: 'Clínica San Lucas',    subject: 'El asistente no respeta días libres',     priority: 'alta',  status: 'abierto',    age: '2 h' },
  { id: 'T-1039', org: 'Supermercados Vega',   subject: 'Solicitan factura del mes anterior',       priority: 'media', status: 'abierto',    age: '5 h' },
  { id: 'T-1035', org: 'Hotel Mirador',        subject: '¿Cómo cambio el plan a Pro?',             priority: 'baja',  status: 'respondido', age: '1 día' },
  { id: 'T-1028', org: 'Estación Norte S.A.',  subject: 'Error al exportar estadísticas',           priority: 'media', status: 'abierto',    age: '1 día' },
];

export const PRIORITY_KIND: Record<string, string> = { alta: 'bad', media: 'warn', baja: 'neutral' };

// ─── Metrics series ────────────────────────────────────────────────────────
export const MRR_SERIES = [980, 1020, 1100, 1180, 1240, 1320, 1410, 1480, 1560, 1640, 1710, 1817];
export const USAGE_SERIES = [42, 48, 51, 49, 58, 63, 61, 68, 72, 70, 78, 84];

// ─── Team mock (for supervisor/admin views) ────────────────────────────────
export interface TeamMember {
  id: string; name: string; cat: string; role: string;
  contract: 'full' | 'part'; target: number;
  shifts: Record<DayKey, string>;
}

export const TEAM: TeamMember[] = [
  { id: 't1', name: 'Carlos Núñez',   cat: 'Bombero',        role: 'Supervisor', contract: 'full', target: 40, shifts: { lun: 'manana', mar: 'manana', mie: 'manana', jue: 'manana', vie: 'manana', sab: 'libre', dom: 'libre' } },
  { id: 't2', name: 'Sofía Ibarra',   cat: 'Bombero',        role: 'Empleado',   contract: 'full', target: 40, shifts: { lun: 'manana', mar: 'manana', mie: 'manana', jue: 'manana', vie: 'manana', sab: 'libre', dom: 'libre' } },
  { id: 't3', name: 'Diego Ferreyra', cat: 'Bombero',        role: 'Empleado',   contract: 'full', target: 40, shifts: { lun: 'noche',  mar: 'noche',  mie: 'noche',  jue: 'noche',  vie: 'noche',  sab: 'libre', dom: 'libre' } },
  { id: 't4', name: 'Pablo Sosa',     cat: 'Bombero',        role: 'Empleado',   contract: 'full', target: 40, shifts: { lun: 'tarde',  mar: 'tarde',  mie: 'tarde',  jue: 'tarde',  vie: 'tarde',  sab: 'libre', dom: 'libre' } },
  { id: 't5', name: 'Marina López',   cat: 'Administrador',  role: 'Admin',      contract: 'full', target: 40, shifts: { lun: 'manana', mar: 'manana', mie: 'manana', jue: 'manana', vie: 'manana', sab: 'libre', dom: 'libre' } },
  { id: 't6', name: 'Tamara Ruiz',    cat: 'Bombero',        role: 'Empleado',   contract: 'part', target: 20, shifts: { lun: 'medioDia', mar: 'medioDia', mie: 'medioDia', jue: 'medioDia', vie: 'medioDia', sab: 'libre', dom: 'libre' } },
];

export const CAT_HUE: Record<string, number> = { Bombero: 250, Administrador: 70 };

// ─── Employee "me" data ────────────────────────────────────────────────────
export const ME = {
  id: 'me', name: 'Sofía Ibarra', role: 'empleado', area: 'Bombero',
  contract: 'Tiempo Completo', target: 40, org: 'Estación Norte S.A.',
  shifts: { lun: 'manana', mar: 'manana', mie: 'manana', jue: 'manana', vie: 'manana', sab: 'libre', dom: 'libre' } as Record<DayKey, string>,
  availability: { lun: true, mar: true, mie: true, jue: true, vie: true, sab: true, dom: false } as Record<DayKey, boolean>,
};

export const MY_REQUESTS = [
  { id: 'mr1', type: 'swap',    title: 'Intercambio Mié',  detail: 'Mañana → Tarde con Lucas Vera', status: 'pending',  when: 'hoy' },
  { id: 'mr2', type: 'timeoff', title: 'Día libre 7 jun',  detail: 'Trámite personal',               status: 'approved', when: 'hace 2 días' },
  { id: 'mr3', type: 'timeoff', title: 'Vacaciones mayo',  detail: '5 días',                         status: 'rejected', when: 'hace 3 semanas' },
];

// Shift definitions for views that don't use the full shiftRegistry
export const SHIFT_DEFS: Record<string, { id: string; name: string; range: string; hours: number; hue: number | null }> = {
  manana:   { id: 'manana',   name: 'Mañana',    range: '06–14', hours: 8, hue: 70 },
  tarde:    { id: 'tarde',    name: 'Tarde',     range: '14–22', hours: 8, hue: 35 },
  noche:    { id: 'noche',    name: 'Noche',     range: '22–06', hours: 8, hue: 270 },
  medioDia: { id: 'medioDia', name: 'Medio Día', range: '09–13', hours: 4, hue: 180 },
  libre:    { id: 'libre',    name: 'Libre',     range: '—',     hours: 0, hue: null },
};

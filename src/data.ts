import type {
  Worker, Config, ShiftInfo, HueColors, ComplianceResult,
  ComplianceStatus, CoverageSummary, Summary, DayKey, Role, SolverConfig,
} from './types';

export const DAYS: { key: DayKey; label: string; short: string; weekend?: boolean }[] = [
  { key: 'lun', label: 'Lunes', short: 'Lun' },
  { key: 'mar', label: 'Martes', short: 'Mar' },
  { key: 'mie', label: 'Miércoles', short: 'Mié' },
  { key: 'jue', label: 'Jueves', short: 'Jue' },
  { key: 'vie', label: 'Viernes', short: 'Vie' },
  { key: 'sab', label: 'Sábado', short: 'Sáb', weekend: true },
  { key: 'dom', label: 'Domingo', short: 'Dom', weekend: true },
];

export const ROLES: Record<Role, { key: Role; label: string; short: string; target: number }> = {
  full: { key: 'full', label: 'Tiempo Completo', short: 'T. Completo', target: 40 },
  part: { key: 'part', label: 'Part Time', short: 'Part Time', target: 20 },
};

export const HUE_PALETTE = [250, 70, 35, 270, 180, 320, 145, 20, 300, 110];

export const STATUS_LABEL: Record<ComplianceStatus, string> = {
  exact: 'Exacto', over: 'Exceso', under: 'Déficit',
};

export const DEFAULT_SOLVER_CONFIG: SolverConfig = {
  min_rest_hours: 11,
  prevent_clopening: true,
  max_consecutive_days: 6,
  max_weekly_hours: 48,
  allow_split_shifts: false,
  group_days_off: true,
  fair_weekends: true,
  consistent_shifts: true,
  rotate_shifts_weekly: true,
};

export const DEFAULT_CONFIG: Config = {
  categories: [
    { id: 'bombero', name: 'Bombero', hue: 250 },
    { id: 'admin', name: 'Administrador', hue: 70 },
  ],
  shiftTypes: [
    { id: 'manana', name: 'Mañana', start: 6, end: 14, hue: 70 },
    { id: 'tarde', name: 'Tarde', start: 14, end: 22, hue: 35 },
    { id: 'noche', name: 'Noche', start: 22, end: 6, hue: 270 },
    { id: 'medioDia', name: 'Medio Día', start: 9, end: 13, hue: 180 },
  ],
  coverage: { manana: 2, tarde: 2, noche: 1, medioDia: 0 },
};

const pad2 = (n: number) => String(n).padStart(2, '0');

export function shiftHours(s: { start: number; end: number }): number {
  return (((s.end - s.start) % 24) + 24) % 24 || (s.start === s.end ? 0 : 24);
}

function shiftAbbr(name: string): string {
  const w = name.trim().split(/\s+/);
  if (w.length >= 2) return (w[0][0] + w[1][0]).toUpperCase();
  return w[0].slice(0, 1).toUpperCase();
}

const LIBRE: ShiftInfo = {
  id: 'libre', name: 'Libre', abbr: '—', range: '—',
  start: null, end: null, hours: 0, hue: null,
};

// Module-level registry (updated by buildRegistry on every config change)
let shiftRegistry: Record<string, ShiftInfo> = { libre: LIBRE };
let shiftIds: string[] = [];
let catRegistry: Record<string, { id: string; name: string; hue: number }> = {};
let catIds: string[] = [];
let coverageMap: Record<string, number> = {};

export function buildRegistry(config: Config) {
  const sm: Record<string, ShiftInfo> = {};
  const ids: string[] = [];
  (config.shiftTypes || []).forEach((s) => {
    sm[s.id] = {
      ...s,
      hours: shiftHours(s),
      abbr: shiftAbbr(s.name),
      range: `${pad2(s.start)}–${pad2(s.end)}`,
    };
    ids.push(s.id);
  });
  sm['libre'] = LIBRE;
  const cm: Record<string, { id: string; name: string; hue: number }> = {};
  (config.categories || []).forEach((c) => { cm[c.id] = c; });
  shiftRegistry = sm;
  shiftIds = ids;
  catRegistry = cm;
  catIds = (config.categories || []).map((c) => c.id);
  coverageMap = config.coverage || {};
}

export function getShift(id: string): ShiftInfo { return shiftRegistry[id] || LIBRE; }
export function getCat(id: string) { return catRegistry[id] || { id, name: id || '—', hue: 0 }; }
export function getShiftIds(): string[] { return shiftIds; }
export function getCatIds(): string[] { return catIds; }
export function getCoverage(): Record<string, number> { return coverageMap; }

// ---- Initial data ----
function mk(id: string, name: string, cat: string, role: Role, contracted_hours: number, shifts: Record<DayKey, string>): Worker {
  return { id, name, cat, role, contracted_hours, shifts };
}
const L = 'libre';
function sd(pairs: Partial<Record<DayKey, string>>): Record<DayKey, string> {
  const o: Record<DayKey, string> = { lun: L, mar: L, mie: L, jue: L, vie: L, sab: L, dom: L };
  return Object.assign(o, pairs);
}

export const INITIAL_WORKERS: Worker[] = [
  mk('w1', 'Carlos Núñez', 'bombero', 'full', 40, sd({ lun: 'manana', mar: 'manana', mie: 'manana', jue: 'manana', vie: 'manana' })),
  mk('w2', 'Andrés Rojas', 'bombero', 'full', 40, sd({ lun: 'manana', mar: 'manana', mie: 'manana', jue: 'manana', vie: 'manana' })),
  mk('w3', 'Sofía Ibarra', 'bombero', 'full', 40, sd({ mie: 'manana', jue: 'manana', vie: 'manana', sab: 'manana', dom: 'manana' })),
  mk('w4', 'Pablo Sosa', 'bombero', 'full', 40, sd({ lun: 'tarde', mar: 'tarde', mie: 'tarde', jue: 'tarde', vie: 'tarde' })),
  mk('w5', 'Marcos Leiva', 'bombero', 'full', 40, sd({ jue: 'tarde', vie: 'tarde', sab: 'tarde', dom: 'tarde', lun: 'tarde' })),
  mk('w6', 'Lucas Vera', 'bombero', 'full', 40, sd({ lun: 'tarde', mar: 'tarde', mie: 'tarde', sab: 'tarde' })),
  mk('w7', 'Diego Ferreyra', 'bombero', 'full', 40, sd({ lun: 'noche', mar: 'noche', mie: 'noche', jue: 'noche', vie: 'noche' })),
  mk('w8', 'Hernán Pérez', 'bombero', 'full', 40, sd({ vie: 'noche', sab: 'noche', dom: 'noche', lun: 'noche', mar: 'noche', mie: 'noche' })),
  mk('w9', 'Marina López', 'admin', 'full', 40, sd({ lun: 'manana', mar: 'manana', mie: 'manana', jue: 'manana', vie: 'manana' })),
  mk('w10', 'Gabriel Ortiz', 'admin', 'part', 20, sd({ lun: 'medioDia', mar: 'medioDia', mie: 'medioDia', jue: 'medioDia', vie: 'medioDia' })),
  mk('w11', 'Tamara Ruiz', 'bombero', 'part', 20, sd({ lun: 'medioDia', mar: 'medioDia', mie: 'medioDia', jue: 'medioDia', vie: 'medioDia' })),
  mk('w12', 'Nicolás Aguilar', 'bombero', 'part', 20, sd({ mie: 'medioDia', jue: 'medioDia', vie: 'medioDia', sab: 'medioDia', dom: 'medioDia' })),
];

// ---- Colors ----
export function hueColors(h: number, dark: boolean): HueColors {
  if (dark) return {
    fg: `oklch(0.82 0.06 ${h})`,
    bg: `oklch(0.42 0.05 ${h} / 0.30)`,
    dot: `oklch(0.70 0.10 ${h})`,
    border: `oklch(0.55 0.06 ${h} / 0.45)`,
    solid: `oklch(0.70 0.10 ${h})`,
  };
  return {
    fg: `oklch(0.42 0.07 ${h})`,
    bg: `oklch(0.95 0.035 ${h})`,
    dot: `oklch(0.68 0.11 ${h})`,
    border: `oklch(0.88 0.04 ${h})`,
    solid: `oklch(0.68 0.11 ${h})`,
  };
}

export function shiftColors(id: string, dark: boolean): HueColors {
  const s = getShift(id);
  if (s.hue === null || s.hue === undefined) {
    return dark
      ? { fg: 'oklch(0.72 0 0)', bg: 'oklch(0.30 0 0 / 0.5)', dot: 'oklch(0.55 0 0)', border: 'oklch(0.42 0 0)', solid: 'oklch(0.55 0 0)' }
      : { fg: 'oklch(0.55 0 0)', bg: 'oklch(0.95 0 0)', dot: 'oklch(0.78 0 0)', border: 'oklch(0.90 0 0)', solid: 'oklch(0.78 0 0)' };
  }
  return hueColors(s.hue, dark);
}

export function catColors(id: string, dark: boolean): HueColors {
  return hueColors(getCat(id).hue, dark);
}

export function statusColors(status: ComplianceStatus, dark: boolean): HueColors {
  const map: Record<ComplianceStatus, number> = { exact: 155, over: 75, under: 28 };
  return hueColors(map[status], dark);
}

// ---- Calculations ----
export function weeklyHours(worker: Worker): number {
  return DAYS.reduce((sum, d) => sum + getShift(worker.shifts[d.key]).hours, 0);
}

export function targetHours(worker: Worker): number {
  return worker.contracted_hours;
}

export function complianceStatus(worker: Worker): ComplianceResult {
  const h = weeklyHours(worker);
  const t = targetHours(worker);
  const diff = h - t;
  return { status: diff === 0 ? 'exact' : diff > 0 ? 'over' : 'under', diff, hours: h, target: t };
}

export function coverageMatrix(workers: Worker[]): Record<string, Record<DayKey, number>> {
  const m: Record<string, Record<DayKey, number>> = {};
  shiftIds.forEach((sid) => {
    m[sid] = {} as Record<DayKey, number>;
    DAYS.forEach((d) => { m[sid][d.key] = 0; });
  });
  workers.forEach((w) => DAYS.forEach((d) => {
    const sid = w.shifts[d.key];
    if (m[sid]) m[sid][d.key]++;
  }));
  return m;
}

export function coverageSummary(workers: Worker[]): CoverageSummary {
  const cov = coverageMap;
  const m = coverageMatrix(workers);
  let metSlots = 0, totalSlots = 0;
  const gaps: CoverageSummary['gaps'] = [];
  shiftIds.forEach((sid) => {
    const min = cov[sid] || 0;
    if (min <= 0) return;
    DAYS.forEach((d) => {
      totalSlots++;
      const c = m[sid]?.[d.key] ?? 0;
      if (c >= min) metSlots++;
      else gaps.push({ shift: sid, day: d.key, count: c, min });
    });
  });
  return { metSlots, totalSlots, gaps, matrix: m };
}

export function summarize(workers: Worker[]): Summary {
  let assigned = 0, extra = 0, missing = 0, targetTotal = 0, exact = 0, over = 0, under = 0;
  const byShift: Record<string, number> = {};
  const byCat: Record<string, { count: number; hours: number }> = {};
  shiftIds.forEach((k) => (byShift[k] = 0));
  catIds.forEach((k) => (byCat[k] = { count: 0, hours: 0 }));

  workers.forEach((w) => {
    const c = complianceStatus(w);
    assigned += c.hours; targetTotal += c.target;
    if (c.diff > 0) extra += c.diff;
    if (c.diff < 0) missing += -c.diff;
    if (c.status === 'exact') exact++; else if (c.status === 'over') over++; else under++;
    if (byCat[w.cat]) { byCat[w.cat].count++; byCat[w.cat].hours += c.hours; }
    DAYS.forEach((d) => {
      const sid = w.shifts[d.key];
      if (byShift[sid] !== undefined) byShift[sid] += getShift(sid).hours;
    });
  });

  return {
    total: workers.length, assigned, extra, missing, targetTotal,
    exact, over, under, byShift, byCat,
    full: workers.filter((w) => w.role === 'full').length,
    part: workers.filter((w) => w.role === 'part').length,
    coverage: coverageSummary(workers),
  };
}

// ---- Utils ----
export function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export function avatarBg(name: string, dark: boolean): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return dark ? `oklch(0.42 0.05 ${h})` : `oklch(0.90 0.04 ${h})`;
}

export function genId(name: string, existing: string[]): string {
  let base = (name || 'x').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '').slice(0, 12) || 'id';
  let id = base, i = 1;
  while (existing.includes(id)) id = base + String(i++);
  return id;
}

// Initialize registry with default config
buildRegistry(DEFAULT_CONFIG);

// ---- Week utilities ----
export function blankShifts(): Record<DayKey, string> {
  const b = {} as Record<DayKey, string>;
  DAYS.forEach((d) => { b[d.key] = 'libre'; });
  return b;
}

function weekKeyFromDate(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export function getCurrentWeekKey(): string { return weekKeyFromDate(new Date()); }

export function getWeekDates(weekKey: string): Record<DayKey, Date> {
  const [yearStr, weekStr] = weekKey.split('-W');
  const year = Number(yearStr);
  const week = Number(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dow + 1 + (week - 1) * 7);
  const keys: DayKey[] = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
  const result = {} as Record<DayKey, Date>;
  keys.forEach((key, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    result[key] = d;
  });
  return result;
}

export function prevWeekKey(weekKey: string): string {
  const { lun } = getWeekDates(weekKey);
  const d = new Date(lun); d.setUTCDate(d.getUTCDate() - 7);
  return weekKeyFromDate(d);
}

export function nextWeekKey(weekKey: string): string {
  const { lun } = getWeekDates(weekKey);
  const d = new Date(lun); d.setUTCDate(d.getUTCDate() + 7);
  return weekKeyFromDate(d);
}

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatWeekRange(weekKey: string): string {
  const { lun: mon, dom: sun } = getWeekDates(weekKey);
  const monD = mon.getUTCDate(), sunD = sun.getUTCDate();
  const monM = MONTHS_ES[mon.getUTCMonth()], sunM = MONTHS_ES[sun.getUTCMonth()];
  const year = sun.getUTCFullYear();
  return mon.getUTCMonth() === sun.getUTCMonth()
    ? `${monD}–${sunD} ${monM} ${year}`
    : `${monD} ${monM} – ${sunD} ${sunM} ${year}`;
}

export function isToday(date: Date): boolean {
  const now = new Date();
  return date.getUTCFullYear() === now.getFullYear()
    && date.getUTCMonth() === now.getMonth()
    && date.getUTCDate() === now.getDate();
}

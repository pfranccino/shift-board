export type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';
export type Role = 'full' | 'part';
export type ComplianceStatus = 'exact' | 'over' | 'under';

export interface Worker {
  id: string;
  name: string;
  cat: string;
  role: Role;
  contracted_hours: number;
  unavailable_dates?: string[];
  shifts: Record<DayKey, string>;
}

export interface Category {
  id: string;
  name: string;
  hue: number;
}

export interface ShiftType {
  id: string;
  name: string;
  start: number;
  end: number;
  hue: number;
}

export interface ShiftInfo {
  id: string;
  name: string;
  start: number | null;
  end: number | null;
  hue: number | null;
  hours: number;
  abbr: string;
  range: string;
}

export interface Config {
  categories: Category[];
  shiftTypes: ShiftType[];
  coverage: Record<string, number>;
}

export interface SolverConfig {
  // Hard constraints
  min_rest_hours: number;
  prevent_clopening: boolean;
  max_consecutive_days: number;
  max_weekly_hours: number;
  allow_split_shifts: boolean;
  // Soft constraints
  group_days_off: boolean;
  fair_weekends: boolean;
  consistent_shifts: boolean;
  rotate_shifts_weekly: boolean;
}

export type WeekSchedules = Record<string, Record<string, Record<DayKey, string>>>;

export type OrgRole = 'owner' | 'admin' | 'manager' | 'employee';

// ─── Platform / multi-role ─────────────────────────────────────────────────
export type UserRole = 'super' | 'admin' | 'supervisor' | 'empleado';

export interface PlatformOrg {
  id: string; name: string; type: string; plan: string;
  status: 'active' | 'trial' | 'suspended';
  users: number; sucursales: number; mrr: number; usagePct: number;
  owner: string; since: string; country: string;
}

export interface PlatformPlan {
  id: string; name: string; price: number | null; period: string;
  tagline: string; popular?: boolean;
  limits: { users: number; sucursales: number };
  features: string[]; notIncluded: string[];
}

export interface PlatformUser {
  id: string; name: string; email: string; org: string;
  role: string; status: 'active' | 'invited' | 'suspended';
  last: string; twofa: boolean;
}

export interface ShiftRequest {
  id: string; who: string; type: 'swap' | 'timeoff' | 'availability';
  title: string; detail: string; day: string;
  status: 'pending' | 'approved' | 'rejected'; when: string; area: string;
}

export interface AuditEvent {
  id: string; time: string; date: string; user: string; role: string;
  action: string; target: string; kind: string;
}

export interface PlatformService {
  id: string; name: string; status: 'ok' | 'degraded' | 'down'; uptime: string;
}

export interface SupportTicket {
  id: string; org: string; subject: string;
  priority: 'alta' | 'media' | 'baja'; status: string; age: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
}

export interface MockOrg {
  id: string;
  name: string;
}

export interface MockMember {
  id: string;
  name: string;
  email: string;
  role: OrgRole;
}

export interface MockInvitation {
  id: string;
  email: string;
  role: OrgRole;
  token: string;
  orgId: string;
  orgName: string;
  createdAt: string;
}

export interface HueColors {
  fg: string;
  bg: string;
  dot: string;
  border: string;
  solid: string;
}

export interface ComplianceResult {
  status: ComplianceStatus;
  diff: number;
  hours: number;
  target: number;
}

export interface CoverageSummary {
  metSlots: number;
  totalSlots: number;
  gaps: Array<{ shift: string; day: DayKey; count: number; min: number }>;
  matrix: Record<string, Record<DayKey, number>>;
}

export interface Summary {
  total: number;
  assigned: number;
  extra: number;
  missing: number;
  targetTotal: number;
  exact: number;
  over: number;
  under: number;
  byShift: Record<string, number>;
  byCat: Record<string, { count: number; hours: number }>;
  full: number;
  part: number;
  coverage: CoverageSummary;
}

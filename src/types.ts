export type DayKey = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom';
export type Role = 'full' | 'part';
export type ComplianceStatus = 'exact' | 'over' | 'under';

export interface Worker {
  id: string;
  name: string;
  cat: string;
  role: Role;
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

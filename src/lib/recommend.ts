import { getShiftIds, getShift, getCoverage } from '../data';
import type { Worker, SolverConfig } from '../types';

export interface Recommendation {
  id: string;
  severity: 'info' | 'warn';
  title: string;
  detail: string;
  suggestion: string;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function gcdAll(xs: number[]): number {
  return xs.reduce((g, x) => gcd(g, x), 0);
}

/** Durations (in hours) of every real shift, excluding "libre". */
export function shiftDurations(): number[] {
  return getShiftIds().map((id) => getShift(id).hours).filter((h) => h > 0);
}

/**
 * Max hours a worker can realistically reach for a given target, considering
 * both the shift-block granularity (every weekly total is a multiple of the
 * gcd of the shift durations) and the weekly/day caps.
 */
export function reachableTarget(target: number, durations: number[], cap: number): number {
  const ds = durations.filter((d) => d > 0);
  if (ds.length === 0 || target <= 0) return 0;
  const g = gcdAll(ds);
  const limit = Math.min(target, cap);
  if (limit <= 0) return 0;
  return Math.floor(limit / g) * g;
}

/** Upper bound of weekly hours allowed by the solver caps (legal + max days). */
export function weeklyCap(solverConfig: SolverConfig | undefined, durations: number[]): number {
  const maxShift = durations.length ? Math.max(...durations) : 0;
  const maxWeekly = solverConfig?.max_weekly_hours ?? 48;
  const maxDays = Math.min(7, solverConfig?.max_consecutive_days ?? 6);
  return Math.min(maxWeekly, maxDays * maxShift);
}

/**
 * Build actionable recommendations from the current configuration — everything
 * is pure arithmetic (no solver round-trip), so it runs instantly on every
 * "Generar" and works the same in Firebase and local modes. Nothing is forced:
 * these are suggestions to help the user reach a better schedule.
 */
export function buildRecommendations(
  workers: Worker[],
  solverConfig: SolverConfig | undefined
): Recommendation[] {
  const recs: Recommendation[] = [];
  const durations = shiftDurations();
  if (durations.length === 0 || workers.length === 0) return recs;

  const coverage = getCoverage();
  const g = gcdAll(durations);
  const maxWeekly = solverConfig?.max_weekly_hours ?? 48;
  const cap = weeklyCap(solverConfig, durations);

  // R1 — Hours reachability per distinct target (group so we don't repeat msgs)
  const targets = Array.from(new Set(workers.map((w) => w.contracted_hours))).sort((a, b) => a - b);
  targets.forEach((T) => {
    if (T <= 0) return;
    const count = workers.filter((w) => w.contracted_hours === T).length;
    const who = count === 1 ? '1 trabajador' : `${count} trabajadores`;

    if (T > maxWeekly) return; // handled by R3 below
    const reach = reachableTarget(T, durations, cap);
    if (reach >= T) return; // target is reachable, nothing to suggest

    if (T % g !== 0) {
      const remainder = T - Math.floor(T / g) * g;
      recs.push({
        id: `hours-${T}`,
        severity: 'warn',
        title: `Meta de ${T}h no alcanzable con las franjas actuales`,
        detail: `Tus franjas avanzan de a ${g}h, así que ${who} con meta de ${T}h llegarán como máximo a ${reach}h.`,
        suggestion: `Para alcanzar ${T}h exacto, agregá una franja de ${remainder}h, o ajustá la meta a ${reach}h o ${reach + g}h.`,
      });
    } else {
      // Multiple of the step but still short → blocked by weekly/day caps
      recs.push({
        id: `hours-cap-${T}`,
        severity: 'warn',
        title: `Meta de ${T}h limitada por los topes`,
        detail: `Con los topes actuales, ${who} con meta de ${T}h llegan a ${reach}h.`,
        suggestion: `Subí el "Límite de horas semanales" o los "Días máximos continuos" para acercarte a ${T}h.`,
      });
    }
  });

  // R2 — Capacity (hours) vs. minimum coverage demand
  const demand = getShiftIds().reduce(
    (sum, id) => sum + (coverage[id] || 0) * getShift(id).hours * 7,
    0
  );
  const supply = workers.reduce((sum, w) => sum + Math.min(w.contracted_hours, maxWeekly), 0);

  if (demand > 0 && demand > supply) {
    recs.push({
      id: 'capacity',
      severity: 'warn',
      title: 'No hay horas suficientes para cubrir la demanda',
      detail: `La cobertura mínima requiere ${demand}h por semana y tu equipo suma ${supply}h contratadas (sin sobrepasar metas).`,
      suggestion: 'Reducí la cobertura mínima de alguna franja, sumá trabajadores, o subí las horas contratadas.',
    });
  } else if (demand > 0 && demand > supply * 0.9) {
    recs.push({
      id: 'capacity-tight',
      severity: 'info',
      title: 'Cobertura ajustada al límite',
      detail: `La demanda (${demand}h) usa el ${Math.round((demand / supply) * 100)}% de las horas disponibles (${supply}h). Queda poco margen para descansos o ausencias.`,
      suggestion: 'Considerá sumar holgura: más trabajadores o una cobertura mínima un poco menor.',
    });
  }

  // R3 — Targets above the weekly legal cap (can never be met)
  const overCap = workers.filter((w) => w.contracted_hours > maxWeekly);
  if (overCap.length > 0) {
    const who = overCap.length === 1 ? '1 trabajador tiene una meta' : `${overCap.length} trabajadores tienen metas`;
    recs.push({
      id: 'target-over-cap',
      severity: 'warn',
      title: 'Metas por encima del tope semanal',
      detail: `${who} mayor al límite de ${maxWeekly}h/semana, así que nunca la alcanzarán.`,
      suggestion: 'Subí el "Límite de horas semanales" en Configuración, o bajá la meta de esos trabajadores.',
    });
  }

  return recs;
}

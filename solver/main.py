from datetime import datetime, timezone, date, timedelta
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from model import solve, DAYS, _rest_conflict, _hsc, HOURS_SCALE
from firestore import get_job, update_job

app = FastAPI(title="ShiftBoard Solver")


class SolveRequest(BaseModel):
    job_id: str
    org_id: str


def _week_key_to_monday(week_key: str) -> date:
    """Convert '2026-W23' to the Monday date of that ISO week."""
    year, week = week_key.split('-W')
    # ISO week: week 1 contains the first Thursday of the year
    jan4 = date(int(year), 1, 4)
    dow = jan4.isoweekday()  # 1=Mon..7=Sun
    return jan4 - timedelta(days=dow - 1) + timedelta(weeks=int(week) - 1)


def _week_keys(input_data: dict) -> list:
    """Accept the new multi-week field, falling back to the legacy single week."""
    keys = input_data.get('week_keys')
    if keys:
        return list(keys)
    single = input_data.get('week_key')
    return [single] if single else []


def _build_days(week_keys: list) -> list:
    """One 7-day block per ISO week, concatenated into a single period."""
    days = []
    for wi, _wk in enumerate(week_keys):
        for wd in range(7):
            days.append({'weekday': wd, 'week': wi})
    return days


def _resolve_unavailable(worker: dict, week_keys: list) -> list:
    """Map ISO date strings in unavailable_dates to GLOBAL day indices."""
    idxs = []
    for wi, wk in enumerate(week_keys):
        monday = _week_key_to_monday(wk)
        for iso_date in worker.get('unavailable_dates', []):
            try:
                d = date.fromisoformat(iso_date)
            except ValueError:
                continue
            off = (d - monday).days
            if 0 <= off <= 6:
                idxs.append(wi * 7 + off)
    return idxs


def _reshape(assignments: dict, week_keys: list) -> list:
    """Flat {worker: {global_day: shift}} → [{week_key, assignments: {worker: {day_key: shift}}}]."""
    weeks_out = []
    for wi, wk in enumerate(week_keys):
        wk_assign = {}
        for w, row in assignments.items():
            wk_assign[w] = {DAYS[wd]: row.get(wi * 7 + wd, 'libre') for wd in range(7)}
        weeks_out.append({'week_key': wk, 'assignments': wk_assign})
    return weeks_out


def _build_infeasibility_reasons(payload: dict) -> list:
    """
    Detect likely causes of infeasibility by relaxing coverage (adding slack)
    and re-solving — the slack pinpoints which shift-days can't be covered, and
    the hour deficits point at workers who can't reach their contract.
    """
    from ortools.sat.python import cp_model

    reasons = []
    workers = payload['workers']
    shifts = payload['shifts']
    coverage = payload.get('coverage', {})
    con = payload.get('constraints', {})
    days = payload.get('days') or [{'weekday': i, 'week': 0} for i in range(7)]

    sm = {s['id']: s for s in shifts}
    WIDs = [w['id'] for w in workers]
    SIDs = [s['id'] for s in shifts]
    N = len(days)
    D = list(range(N))
    week_of = [d['week'] for d in days]
    weeks = sorted(set(week_of))
    days_in_week = {g: [d for d in D if week_of[d] == g] for g in weeks}

    m = cp_model.CpModel()
    x = {(w, d, s): m.NewBoolVar(f'x_{w}_{d}_{s}') for w in WIDs for d in D for s in SIDs}

    slack = {}
    for s in SIDs:
        min_cov = coverage.get(s, 0)
        if min_cov > 0:
            for d in D:
                sv = m.NewIntVar(0, min_cov, f'slack_{s}_{d}')
                slack[(s, d)] = sv
                m.Add(sum(x[(w, d, s)] for w in WIDs) + sv >= min_cov)

    for w in WIDs:
        for d in D:
            m.Add(sum(x[(w, d, s)] for s in SIDs) <= 1)

    min_rest = con.get('min_rest_hours', 11)
    for s1 in shifts:
        for s2 in shifts:
            if _rest_conflict(s1, s2, min_rest):
                for w in WIDs:
                    for d in range(N - 1):
                        m.Add(x[(w, d, s1['id'])] + x[(w, d + 1, s2['id'])] <= 1)

    for w_data in workers:
        w = w_data['id']
        for d in w_data.get('unavailable_day_indices', []):
            if 0 <= d < N:
                for s in SIDs:
                    m.Add(x[(w, d, s)] == 0)

    max_consec = con.get('max_consecutive_days', 6)
    if 0 < max_consec < N:
        for w in WIDs:
            for t in range(N - max_consec):
                m.Add(sum(x[(w, d, s)] for d in range(t, t + max_consec + 1) for s in SIDs) <= max_consec)

    max_wh = con.get('max_weekly_hours', 48)
    under = {}
    for w_data in workers:
        w = w_data['id']
        target = w_data.get('contracted_hours', 40)
        cap_h = min(target, max_wh)
        for g in weeks:
            actual = sum(_hsc(sm[s]['hours']) * x[(w, d, s)] for d in days_in_week[g] for s in SIDs)
            m.Add(actual <= _hsc(cap_h))
            u = m.NewIntVar(0, _hsc(target), f'under_{w}_{g}')
            m.Add(u >= _hsc(target) - actual)
            under[(w, g)] = u

    m.Minimize(1000 * sum(slack.values()) + 100 * sum(under.values()))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 20.0
    solver.parameters.num_search_workers = 8
    status = solver.Solve(m)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        reasons.append({
            'type': 'staff',
            'title': 'Configuración incompatible',
            'detail': 'Las restricciones de descanso o disponibilidad hacen imposible cualquier asignación.',
            'suggestion': 'Revisá los días bloqueados de los trabajadores y el mínimo de descanso entre turnos.',
        })
        return reasons

    # Coverage gaps aggregated per shift
    gap_by_shift = {}
    for (sid, _d), sv in slack.items():
        v = solver.Value(sv)
        if v > 0:
            info = gap_by_shift.setdefault(sid, {'days': 0, 'max_gap': 0})
            info['days'] += 1
            info['max_gap'] = max(info['max_gap'], v)

    for sid, info in gap_by_shift.items():
        s_name = sm[sid]['name']
        reasons.append({
            'type': 'coverage',
            'title': f'Turno {s_name} — Cobertura insuficiente',
            'detail': f"{info['days']} día(s) no alcanzan el mínimo requerido. Falta hasta {info['max_gap']} persona(s) por día.",
            'suggestion': f"Reducí la cobertura mínima del turno {s_name} en Configuración, "
                          f"habilitá fines de semana, o agregá trabajadores disponibles en ese turno.",
        })

    # Severe hour deficits (summed across the period's weeks)
    for w_data in workers:
        w = w_data['id']
        target = w_data.get('contracted_hours', 40)
        total_target = target * len(weeks)
        deficit = sum(solver.Value(under[(w, g)]) for g in weeks) / HOURS_SCALE
        if total_target > 0 and deficit > total_target * 0.5:
            reasons.append({
                'type': 'hours',
                'title': f"{w_data['name']} — Déficit crítico de horas",
                'detail': f"Solo se pueden asignar {round(total_target - deficit)}h de {total_target}h en el período.",
                'suggestion': 'Reducí los días libres mínimos, habilitá fines de semana, '
                              'o cambiá el turno base a uno de mayor duración.',
            })

    if not reasons:
        reasons.append({
            'type': 'staff',
            'title': 'Sin personal suficiente',
            'detail': 'No hay suficientes trabajadores para cubrir los turnos requeridos.',
            'suggestion': 'Agregá más trabajadores o reducí los requerimientos de cobertura mínima.',
        })

    return reasons


@app.post('/solve')
async def solve_job(req: SolveRequest):
    org_id, job_id = req.org_id, req.job_id

    try:
        job = get_job(org_id, job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    update_job(org_id, job_id, {'status': 'running', 'started_at': datetime.now(timezone.utc)})

    try:
        input_data = job['input']
        week_keys = _week_keys(input_data)
        if not week_keys:
            raise ValueError('No week_keys provided')

        input_data['days'] = _build_days(week_keys)
        for w in input_data.get('workers', []):
            w['unavailable_day_indices'] = _resolve_unavailable(w, week_keys)

        result = solve(input_data)

        if result['status'] == 'feasible':
            update_job(org_id, job_id, {
                'status': 'done',
                'completed_at': datetime.now(timezone.utc),
                'result': {'weeks': _reshape(result['assignments'], week_keys)},
                'error': None,
            })
        else:
            reasons = _build_infeasibility_reasons(input_data)
            update_job(org_id, job_id, {
                'status': 'infeasible',
                'completed_at': datetime.now(timezone.utc),
                'result': None,
                'infeasibility_reasons': reasons,
                'error': None,
            })

    except Exception as e:
        update_job(org_id, job_id, {
            'status': 'error',
            'completed_at': datetime.now(timezone.utc),
            'error': str(e),
        })
        raise HTTPException(status_code=500, detail=str(e))

    return {'ok': True}


@app.get('/health')
async def health():
    return {'status': 'ok'}

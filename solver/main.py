from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from model import solve
from firestore import get_job, update_job

app = FastAPI(title="ShiftBoard Solver")


class SolveRequest(BaseModel):
    job_id: str
    org_id: str


def _week_key_to_monday(week_key: str):
    """Convert '2026-W23' to the Monday date of that week."""
    from datetime import date, timedelta
    year, week = week_key.split('-W')
    # ISO week: week 1 contains the first Thursday of the year
    jan4 = date(int(year), 1, 4)
    dow = jan4.isoweekday()  # 1=Mon..7=Sun
    monday = jan4 - timedelta(days=dow - 1) + timedelta(weeks=int(week) - 1)
    return monday


def _resolve_unavailable(worker: dict, week_key: str) -> list[int]:
    """Convert ISO date strings in unavailable_dates to day indices (0=Mon..6=Sun)."""
    from datetime import date
    monday = _week_key_to_monday(week_key)
    unavailable = []
    for iso_date in worker.get('unavailable_dates', []):
        try:
            d = date.fromisoformat(iso_date)
            idx = (d - monday).days
            if 0 <= idx <= 6:
                unavailable.append(idx)
        except ValueError:
            pass
    return unavailable


def _build_infeasibility_reasons(payload: dict) -> list[dict]:
    """
    Detect likely causes of infeasibility by relaxing coverage constraints
    and re-solving to find which ones are violated.
    """
    from pulp import LpProblem, LpMinimize, LpVariable, lpSum, value, PULP_CBC_CMD, LpStatus
    from model import DAYS, sm as _sm_unused, _end_effective, _rest_conflict

    reasons = []
    workers = payload['workers']
    shifts = payload['shifts']
    coverage = payload.get('coverage', {})
    con = payload.get('constraints', {})

    sm = {s['id']: s for s in shifts}
    WIDs = [w['id'] for w in workers]
    SIDs = [s['id'] for s in shifts]
    D = list(range(7))

    prob = LpProblem('DiagnosticRelaxed', LpMinimize)

    x = LpVariable.dicts('x', [(w, d, s) for w in WIDs for d in D for s in SIDs], cat='Binary')
    slack = LpVariable.dicts('slack', [(s, d) for s in SIDs for d in D], lowBound=0)

    for w in WIDs:
        for d in D:
            prob += lpSum(x[(w, d, s)] for s in SIDs) <= 1

    for s in SIDs:
        min_cov = coverage.get(s, 0)
        if min_cov > 0:
            for d in D:
                prob += lpSum(x[(w, d, s)] for w in WIDs) + slack[(s, d)] >= min_cov

    min_rest = con.get('min_rest_hours', 11)
    for s1 in shifts:
        for s2 in shifts:
            if _rest_conflict(s1, s2, min_rest):
                for w in WIDs:
                    for d in range(6):
                        prob += x[(w, d, s1['id'])] + x[(w, d + 1, s2['id'])] <= 1

    for w_data in workers:
        w = w_data['id']
        for d in w_data.get('unavailable_day_indices', []):
            for s in SIDs:
                prob += x[(w, d, s)] == 0

    max_consec = con.get('max_consecutive_days', 6)
    for w in WIDs:
        for t in range(7 - max_consec):
            prob += lpSum(lpSum(x[(w, d, s)] for s in SIDs) for d in range(t, t + max_consec + 1)) <= max_consec

    over = LpVariable.dicts('over', WIDs, lowBound=0)
    under = LpVariable.dicts('under', WIDs, lowBound=0)
    for w_data in workers:
        w = w_data['id']
        actual = lpSum(sm[s]['hours'] * x[(w, d, s)] for d in D for s in SIDs)
        target = w_data.get('contracted_hours', 40)
        prob += over[w] >= actual - target
        prob += under[w] >= target - actual

    wm = {w['id']: w for w in workers}
    prob += 1000 * lpSum(slack[(s, d)] for s in SIDs for d in D) + \
           lpSum(100 * (over[w] + under[w]) for w in WIDs)

    prob.solve(PULP_CBC_CMD(msg=0))

    if LpStatus[prob.status] != 'Optimal':
        reasons.append({
            'type': 'staff',
            'title': 'Configuración incompatible',
            'detail': 'Las restricciones de descanso o disponibilidad hacen imposible cualquier asignación.',
            'suggestion': 'Revisá los días bloqueados de los trabajadores y el mínimo de descanso entre turnos.',
        })
        return reasons

    # Check coverage gaps
    from model import DAYS as DAY_KEYS
    gap_by_shift = {}
    for s in SIDs:
        min_cov = coverage.get(s, 0)
        if min_cov <= 0:
            continue
        for d in D:
            sv = value(slack[(s, d)]) or 0
            if sv > 0.5:
                gap_by_shift.setdefault(s, {'days': 0, 'max_gap': 0})
                gap_by_shift[s]['days'] += 1
                gap_by_shift[s]['max_gap'] = max(gap_by_shift[s]['max_gap'], round(sv))

    for sid, info in gap_by_shift.items():
        s_name = sm[sid]['name']
        reasons.append({
            'type': 'coverage',
            'title': f'Turno {s_name} — Cobertura insuficiente',
            'detail': f"{info['days']} día(s) no alcanzan el mínimo requerido. Falta hasta {info['max_gap']} persona(s) por día.",
            'suggestion': f"Reducí la cobertura mínima del turno {s_name} en Configuración, "
                          f"habilitá fines de semana, o agregá trabajadores disponibles en ese turno.",
        })

    # Check severe hour deficits
    for w_data in workers:
        w = w_data['id']
        deficit = value(under[w]) or 0
        target = w_data.get('contracted_hours', 40)
        if deficit > target * 0.5:
            reasons.append({
                'type': 'hours',
                'title': f"{w_data['name']} — Déficit crítico de horas",
                'detail': f"Solo se pueden asignar {round(target - deficit)}h de {target}h contratadas.",
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

    # Load job from Firestore
    try:
        job = get_job(org_id, job_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    update_job(org_id, job_id, {'status': 'running', 'started_at': datetime.now(timezone.utc)})

    try:
        input_data = job['input']
        week_key = input_data.get('week_key', '')

        # Convert unavailable_dates to day indices
        for w in input_data.get('workers', []):
            w['unavailable_day_indices'] = _resolve_unavailable(w, week_key)

        result = solve(input_data)

        if result['status'] == 'feasible':
            update_job(org_id, job_id, {
                'status': 'done',
                'completed_at': datetime.now(timezone.utc),
                'result': {'assignments': result['assignments']},
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

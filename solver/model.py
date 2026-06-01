from pulp import (
    LpProblem, LpMinimize, LpVariable, LpStatus,
    lpSum, value, PULP_CBC_CMD,
)

DAYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
WEEKEND = {5, 6}  # sab=5, dom=6

# Penalty weights — higher = harder the soft constraint is enforced
W_HOURS = 100       # contracted hours deviation
W_CONSISTENT = 12   # shift type changes within week
W_GROUP_OFF = 6     # isolated free days
W_FAIR_WE = 18      # working weekend after working previous weekend
W_ROTATE = 10       # same shift as previous week


def _end_effective(shift: dict) -> float:
    """Hours shift ends relative to midnight of the assigned day (>24 if crosses midnight)."""
    s, e = shift['start'], shift['end']
    return e + 24 if e <= s else e


def _rest_conflict(s1: dict, s2: dict, min_rest: float) -> bool:
    """True if working s1 then s2 next day violates min_rest_hours."""
    return _end_effective(s1) + min_rest > 24 + s2['start']


def solve(payload: dict) -> dict:
    """
    Solve the shift scheduling MILP.

    payload keys:
      workers      list[{id, name, contracted_hours, unavailable_day_indices}]
      shifts       list[{id, name, start, end, hours}]
      coverage     {shift_id: min_persons_per_day}
      constraints  {min_rest_hours, prevent_clopening, max_consecutive_days,
                    max_weekly_hours, allow_split_shifts, group_days_off,
                    fair_weekends, consistent_shifts, rotate_shifts_weekly}
      boundary     {worker_id: {last_shift_id, worked_weekend}}  — previous week
    """
    workers = payload['workers']
    shifts = payload['shifts']
    coverage = payload.get('coverage', {})
    con = payload.get('constraints', {})
    boundary = payload.get('boundary', {})

    WIDs = [w['id'] for w in workers]
    SIDs = [s['id'] for s in shifts]
    D = list(range(7))

    sm = {s['id']: s for s in shifts}
    wm = {w['id']: w for w in workers}

    prob = LpProblem('ShiftScheduling', LpMinimize)

    # Binary decision: x[worker][day][shift] = 1 if assigned
    x = LpVariable.dicts('x',
        [(w, d, s) for w in WIDs for d in D for s in SIDs],
        cat='Binary')

    # ── Hard constraints ─────────────────────────────────────────────────────

    max_shifts_per_day = 2 if con.get('allow_split_shifts') else 1
    for w in WIDs:
        for d in D:
            prob += lpSum(x[(w, d, s)] for s in SIDs) <= max_shifts_per_day

    # Minimum coverage per shift per day
    for s in SIDs:
        min_cov = coverage.get(s, 0)
        if min_cov > 0:
            for d in D:
                prob += lpSum(x[(w, d, s)] for w in WIDs) >= min_cov, f"cov_{s}_{d}"

    # Max weekly legal hours
    max_wh = con.get('max_weekly_hours', 48)
    for w in WIDs:
        prob += lpSum(sm[s]['hours'] * x[(w, d, s)] for d in D for s in SIDs) <= max_wh

    # Unavailable dates (already converted to day indices by main.py)
    for w_data in workers:
        w = w_data['id']
        for d in w_data.get('unavailable_day_indices', []):
            for s in SIDs:
                prob += x[(w, d, s)] == 0

    # Max consecutive working days
    max_consec = con.get('max_consecutive_days', 6)
    for w in WIDs:
        for t in range(7 - max_consec):
            prob += lpSum(
                lpSum(x[(w, d, s)] for s in SIDs)
                for d in range(t, t + max_consec + 1)
            ) <= max_consec

    # Minimum rest between shifts on consecutive days
    min_rest = con.get('min_rest_hours', 11)
    conflicting_pairs = [
        (s1, s2) for s1 in shifts for s2 in shifts
        if _rest_conflict(s1, s2, min_rest)
    ]
    for s1, s2 in conflicting_pairs:
        for w in WIDs:
            for d in range(6):
                prob += x[(w, d, s1['id'])] + x[(w, d + 1, s2['id'])] <= 1

    # Previous-week boundary: apply rest from last Sunday's shift into Monday
    for w, b in boundary.items():
        prev_sid = b.get('last_shift_id')
        if not prev_sid or prev_sid not in sm:
            continue
        for s2 in shifts:
            if _rest_conflict(sm[prev_sid], s2, min_rest) and w in WIDs:
                prob += x[(w, 0, s2['id'])] == 0

    # Explicit clopening prevention (independent of min_rest_hours)
    if con.get('prevent_clopening'):
        # Identify close shifts (end >= 22 or crossing midnight) and open shifts (start <= 8)
        close_shifts = [s for s in shifts if s['start'] >= 20 or s['end'] <= s['start']]
        open_shifts = [s for s in shifts if s['start'] <= 8]
        for s1 in close_shifts:
            for s2 in open_shifts:
                for w in WIDs:
                    for d in range(6):
                        prob += x[(w, d, s1['id'])] + x[(w, d + 1, s2['id'])] <= 1

    # ── Soft constraints ─────────────────────────────────────────────────────

    penalty = []

    # S1 — Contracted hours deviation (highest priority)
    over = LpVariable.dicts('over', WIDs, lowBound=0)
    under = LpVariable.dicts('under', WIDs, lowBound=0)
    for w_data in workers:
        w = w_data['id']
        actual = lpSum(sm[s]['hours'] * x[(w, d, s)] for d in D for s in SIDs)
        target = w_data.get('contracted_hours', 40)
        prob += over[w] >= actual - target
        prob += under[w] >= target - actual
        penalty.append(W_HOURS * (over[w] + under[w]))

    # y[w][s] = 1 if worker w uses shift s at any point this week (for S2 and S5)
    y = None
    if con.get('consistent_shifts', True) or con.get('rotate_shifts_weekly', True):
        y = LpVariable.dicts('y', [(w, s) for w in WIDs for s in SIDs], cat='Binary')
        for w in WIDs:
            for s in SIDs:
                for d in D:
                    prob += y[(w, s)] >= x[(w, d, s)]

    # S2 — Consistent shifts within the week
    if con.get('consistent_shifts', True) and y:
        for w in WIDs:
            pen = LpVariable(f'pen_consist_{w}', lowBound=0)
            prob += pen >= lpSum(y[(w, s)] for s in SIDs) - 1
            penalty.append(W_CONSISTENT * pen)

    # S3 — Group consecutive free days
    if con.get('group_days_off', True):
        for w in WIDs:
            for d in range(6):
                work_d = lpSum(x[(w, d, s)] for s in SIDs)
                work_d1 = lpSum(x[(w, d + 1, s)] for s in SIDs)
                # adj_free = 1 if both d and d+1 are free (reward consecutive rest)
                adj = LpVariable(f'adj_{w}_{d}', 0, 1)
                prob += adj <= 1 - work_d
                prob += adj <= 1 - work_d1
                prob += adj >= 1 - work_d - work_d1
                penalty.append(-W_GROUP_OFF * adj)  # negative = reward

    # S4 — Fair weekends (penalise working this weekend if worked previous weekend)
    if con.get('fair_weekends', True):
        for w_data in workers:
            w = w_data['id']
            if boundary.get(w, {}).get('worked_weekend'):
                we_work = lpSum(x[(w, d, s)] for d in WEEKEND for s in SIDs)
                penalty.append(W_FAIR_WE * we_work)

    # S5 — Rotate shift block weekly
    if con.get('rotate_shifts_weekly', True) and y:
        for w_data in workers:
            w = w_data['id']
            prev_sid = boundary.get(w, {}).get('dominant_shift')
            if prev_sid and prev_sid in sm:
                # Penalise repeating the same dominant shift as last week
                penalty.append(W_ROTATE * y[(w, prev_sid)])

    # ── Objective & solve ────────────────────────────────────────────────────

    prob += lpSum(penalty) if penalty else 0

    prob.solve(PULP_CBC_CMD(msg=0, timeLimit=120))

    status = LpStatus[prob.status]

    if status != 'Optimal':
        return {'status': 'infeasible', 'assignments': None, 'objective': None}

    assignments = {}
    for w in WIDs:
        assignments[w] = {}
        for d_idx, day_key in enumerate(DAYS):
            assigned = 'libre'
            for s in SIDs:
                if (value(x[(w, d_idx, s)]) or 0) > 0.5:
                    assigned = s
                    break
            assignments[w][day_key] = assigned

    return {
        'status': 'feasible',
        'assignments': assignments,
        'objective': value(prob.objective),
    }

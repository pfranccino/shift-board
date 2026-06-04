from ortools.sat.python import cp_model

DAYS = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom']
WEEKEND = {5, 6}  # sab=5, dom=6

# Penalty weights — higher = harder the soft constraint is enforced
W_HOURS = 100       # weekly contracted-hours deficit
W_CONSISTENT = 12   # shift-type changes within a week
W_GROUP_OFF = 6     # isolated free days (reward for grouping rest)
W_FAIR_WE = 18      # working a weekend right after the previous one
W_ROTATE = 10       # repeating the same shift block across weeks

# The model is integer-only; scaling by 2 lets us support half-hour shifts.
HOURS_SCALE = 2


def _end_effective(shift: dict) -> float:
    """Hours shift ends relative to midnight of the assigned day (>24 if crosses midnight)."""
    s, e = shift['start'], shift['end']
    return e + 24 if e <= s else e


def _rest_conflict(s1: dict, s2: dict, min_rest: float) -> bool:
    """True if working s1 then s2 the next day violates min_rest_hours."""
    return _end_effective(s1) + min_rest > 24 + s2['start']


def _default_days() -> list:
    """Backward-compatible single ISO week (Mon..Sun)."""
    return [{'weekday': i, 'week': 0} for i in range(7)]


def _hsc(h: float) -> int:
    return int(round(h * HOURS_SCALE))


def solve(payload: dict) -> dict:
    """
    Solve the shift scheduling problem over an arbitrary period of days.

    payload keys:
      workers      list[{id, name, contracted_hours, unavailable_day_indices}]
      shifts       list[{id, name, start, end, hours}]
      coverage     {shift_id: min_persons_per_day}
      constraints  {min_rest_hours, prevent_clopening, max_consecutive_days,
                    max_weekly_hours, allow_split_shifts, group_days_off,
                    fair_weekends, consistent_shifts, rotate_shifts_weekly}
      days         list[{weekday(0=Mon..6=Sun), week(group index)}] — the period.
                   Defaults to a single 7-day week. For a month this is several
                   weeks concatenated, solved together so rest/rotation/weekend
                   fairness carry across week boundaries.
      boundary     {worker_id: {last_shift_id, worked_weekend, dominant_shift}}
                   — the schedule immediately before day 0, for continuity.

    Returns assignments keyed by worker → {global_day_index: shift_id}.
    """
    workers = payload['workers']
    shifts = payload['shifts']
    coverage = payload.get('coverage', {})
    con = payload.get('constraints', {})
    boundary = payload.get('boundary', {})
    days = payload.get('days') or _default_days()

    WIDs = [w['id'] for w in workers]
    SIDs = [s['id'] for s in shifts]
    sm = {s['id']: s for s in shifts}

    N = len(days)
    D = list(range(N))
    weekday = [d['weekday'] for d in days]
    week_of = [d['week'] for d in days]
    weeks = sorted(set(week_of))
    days_in_week = {g: [d for d in D if week_of[d] == g] for g in weeks}

    model = cp_model.CpModel()

    # Binary decision: x[worker][day][shift] = 1 if assigned
    x = {
        (w, d, s): model.NewBoolVar(f'x_{w}_{d}_{s}')
        for w in WIDs for d in D for s in SIDs
    }

    obj = []  # objective terms (minimised)

    # ── Hard constraints ─────────────────────────────────────────────────────

    max_shifts_per_day = 2 if con.get('allow_split_shifts') else 1
    for w in WIDs:
        for d in D:
            model.Add(sum(x[(w, d, s)] for s in SIDs) <= max_shifts_per_day)

    # Minimum coverage per shift per day
    for s in SIDs:
        min_cov = coverage.get(s, 0)
        if min_cov > 0:
            for d in D:
                model.Add(sum(x[(w, d, s)] for w in WIDs) >= min_cov)

    # Unavailable dates (already converted to global day indices by main.py)
    for w_data in workers:
        w = w_data['id']
        for d in w_data.get('unavailable_day_indices', []):
            if 0 <= d < N:
                for s in SIDs:
                    model.Add(x[(w, d, s)] == 0)

    # Max consecutive working days — sliding window over the WHOLE period
    max_consec = con.get('max_consecutive_days', 6)
    if 0 < max_consec < N:
        for w in WIDs:
            for t in range(N - max_consec):
                model.Add(
                    sum(x[(w, d, s)] for d in range(t, t + max_consec + 1) for s in SIDs)
                    <= max_consec
                )

    # Minimum rest between shifts on consecutive days (spans week boundaries)
    min_rest = con.get('min_rest_hours', 11)
    conflicting_pairs = [
        (s1, s2) for s1 in shifts for s2 in shifts
        if _rest_conflict(s1, s2, min_rest)
    ]
    for s1, s2 in conflicting_pairs:
        for w in WIDs:
            for d in range(N - 1):
                model.Add(x[(w, d, s1['id'])] + x[(w, d + 1, s2['id'])] <= 1)

    # Previous-period boundary: rest from the last applied shift into day 0
    for w, b in boundary.items():
        if w not in WIDs:
            continue
        prev_sid = b.get('last_shift_id')
        if prev_sid and prev_sid in sm:
            for s2 in shifts:
                if _rest_conflict(sm[prev_sid], s2, min_rest):
                    model.Add(x[(w, 0, s2['id'])] == 0)

    # Explicit clopening prevention (independent of min_rest_hours)
    if con.get('prevent_clopening'):
        close_shifts = [s for s in shifts if s['start'] >= 20 or s['end'] <= s['start']]
        open_shifts = [s for s in shifts if s['start'] <= 8]
        for s1 in close_shifts:
            for s2 in open_shifts:
                for w in WIDs:
                    for d in range(N - 1):
                        model.Add(x[(w, d, s1['id'])] + x[(w, d + 1, s2['id'])] <= 1)

    # ── Weekly hours: never exceed the target (hard) + close the gap (soft) ───
    max_wh = con.get('max_weekly_hours', 48)
    for w_data in workers:
        w = w_data['id']
        target = w_data.get('contracted_hours', 40)
        cap_h = min(target, max_wh)  # the binding ceiling for the week
        for g in weeks:
            actual = sum(_hsc(sm[s]['hours']) * x[(w, d, s)]
                         for d in days_in_week[g] for s in SIDs)
            model.Add(actual <= _hsc(cap_h))            # HARD: never go over
            under = model.NewIntVar(0, _hsc(target), f'under_{w}_{g}')
            model.Add(under >= _hsc(target) - actual)   # soft deficit
            obj.append(W_HOURS * under)

    # "worked that day" indicator (needed by group-days-off)
    worked = {}
    if con.get('group_days_off', True):
        for w in WIDs:
            for d in D:
                wv = model.NewBoolVar(f'worked_{w}_{d}')
                total = sum(x[(w, d, s)] for s in SIDs)
                model.Add(total >= 1).OnlyEnforceIf(wv)
                model.Add(total == 0).OnlyEnforceIf(wv.Not())
                worked[(w, d)] = wv

    # y[w][g][s] = worker w uses shift s at some point in week g (for S2 & S5)
    need_y = con.get('consistent_shifts', True) or con.get('rotate_shifts_weekly', True)
    y = {}
    if need_y:
        for w in WIDs:
            for g in weeks:
                for s in SIDs:
                    yv = model.NewBoolVar(f'y_{w}_{g}_{s}')
                    for d in days_in_week[g]:
                        model.Add(yv >= x[(w, d, s)])
                    y[(w, g, s)] = yv

    # ── Soft constraints ─────────────────────────────────────────────────────

    # S2 — Consistent shifts within each week
    if con.get('consistent_shifts', True):
        for w in WIDs:
            for g in weeks:
                pen = model.NewIntVar(0, len(SIDs), f'pc_{w}_{g}')
                model.Add(pen >= sum(y[(w, g, s)] for s in SIDs) - 1)
                obj.append(W_CONSISTENT * pen)

    # S3 — Group consecutive free days (reward adjacent rest)
    if con.get('group_days_off', True):
        for w in WIDs:
            for d in range(N - 1):
                adj = model.NewBoolVar(f'adj_{w}_{d}')
                model.Add(adj <= 1 - worked[(w, d)])
                model.Add(adj <= 1 - worked[(w, d + 1)])
                obj.append(-W_GROUP_OFF * adj)  # negative = reward

    # Weekend-worked indicator per week (for S4)
    we_work = {}
    if con.get('fair_weekends', True):
        for w in WIDs:
            for g in weeks:
                we_days = [d for d in days_in_week[g] if weekday[d] in WEEKEND]
                wv = model.NewBoolVar(f'we_{w}_{g}')
                if we_days:
                    total = sum(x[(w, d, s)] for d in we_days for s in SIDs)
                    model.Add(total >= 1).OnlyEnforceIf(wv)
                    model.Add(total == 0).OnlyEnforceIf(wv.Not())
                else:
                    model.Add(wv == 0)
                we_work[(w, g)] = wv

    # S4 — Fair weekends: penalise working a weekend after the previous one
    if con.get('fair_weekends', True):
        for w in WIDs:
            for i, g in enumerate(weeks):
                if i == 0:
                    if boundary.get(w, {}).get('worked_weekend'):
                        obj.append(W_FAIR_WE * we_work[(w, g)])
                else:
                    prev_g = weeks[i - 1]
                    both = model.NewBoolVar(f'we2_{w}_{g}')
                    model.AddBoolAnd([we_work[(w, prev_g)], we_work[(w, g)]]).OnlyEnforceIf(both)
                    model.AddBoolOr([we_work[(w, prev_g)].Not(), we_work[(w, g)].Not()]).OnlyEnforceIf(both.Not())
                    obj.append(W_FAIR_WE * both)

    # S5 — Rotate shift block weekly (penalise repeating the same shift)
    if con.get('rotate_shifts_weekly', True) and need_y:
        for w in WIDs:
            for i, g in enumerate(weeks):
                if i == 0:
                    prev_sid = boundary.get(w, {}).get('dominant_shift')
                    if prev_sid and prev_sid in sm:
                        obj.append(W_ROTATE * y[(w, g, prev_sid)])
                else:
                    prev_g = weeks[i - 1]
                    for s in SIDs:
                        same = model.NewBoolVar(f'rot_{w}_{g}_{s}')
                        model.AddBoolAnd([y[(w, prev_g, s)], y[(w, g, s)]]).OnlyEnforceIf(same)
                        model.AddBoolOr([y[(w, prev_g, s)].Not(), y[(w, g, s)].Not()]).OnlyEnforceIf(same.Not())
                        obj.append(W_ROTATE * same)

    # ── Objective & solve ────────────────────────────────────────────────────

    model.Minimize(sum(obj) if obj else 0)

    solver = cp_model.CpSolver()
    # CP-SAT returns a usable incumbent (FEASIBLE) even if it can't prove
    # optimality in time — no schedule is ever thrown away for timing out.
    # We don't need a proven optimum: stop once within 2% of the bound, and cap
    # wall-clock at a budget that scales with the period length.
    default_budget = min(60.0, max(12.0, N * 1.2))
    solver.parameters.max_time_in_seconds = float(con.get('max_solve_seconds', default_budget))
    solver.parameters.relative_gap_limit = 0.02
    solver.parameters.num_search_workers = 8

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {'status': 'infeasible', 'assignments': None, 'objective': None}

    assignments = {}
    for w in WIDs:
        row = {}
        for d in D:
            assigned = 'libre'
            for s in SIDs:
                if solver.Value(x[(w, d, s)]) > 0.5:
                    assigned = s
                    break
            row[d] = assigned
        assignments[w] = row

    return {
        'status': 'feasible',
        'assignments': assignments,
        'objective': solver.ObjectiveValue(),
    }

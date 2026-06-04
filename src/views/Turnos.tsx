import { useState, useEffect, useRef } from 'react';
import {
  getShift, getShiftIds, getCatIds, getCat, getCoverage,
  shiftColors, catColors, statusColors, complianceStatus, coverageMatrix,
  initials, avatarBg, DAYS, ROLES, getWeekDates, formatWeekRange, isToday,
  weekKeyFromDate, weekKeyToMonthYear, formatMonthYear, getMonthDays,
} from '../data';
import { ShiftChip } from '../components/ShiftChip';
import { HoursBar } from '../components/HoursBar';
import { Icon } from '../components/Icon';
import type { Worker, DayKey } from '../types';

interface Props {
  workers: Worker[];
  selectedWeek: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSelectWeek?: (weekKey: string) => void;
  onAssign: (workerId: string, dayKey: string, shiftKey: string) => void;
  dark: boolean;
}

interface ActiveCell {
  workerId: string;
  dayKey: string;
  anchorEl: HTMLElement;
}

function ShiftPicker({ anchorEl, current, dark, onPick, onClose }: {
  anchorEl: HTMLElement;
  current: string;
  dark: boolean;
  onPick: (k: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  const options = [...getShiftIds(), 'libre'];
  const W = 232;
  const rect = anchorEl.getBoundingClientRect();
  let left = rect.left;
  if (left + W > window.innerWidth - 12) left = window.innerWidth - W - 12;
  let top = rect.bottom + 6;
  const H = Math.min(360, options.length * 52 + 50);
  if (top + H > window.innerHeight - 12) top = Math.max(12, rect.top - H - 6);

  const surface = dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)';
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const shadow = dark ? '0 12px 40px oklch(0 0 0 / 0.5)' : '0 8px 30px oklch(0.3 0.02 260 / 0.14)';
  const hoverBg = dark ? 'oklch(0.30 0.01 260)' : 'oklch(0.96 0.004 250)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const accent = '#4664c9';

  return (
    <div ref={ref} style={{
      position: 'fixed', left, top, width: W, zIndex: 200,
      background: surface, border: `1px solid ${border}`,
      borderRadius: 12, boxShadow: shadow, padding: 6,
      animation: 'pop .12s ease-out', maxHeight: '70vh', overflowY: 'auto',
    }}>
      <div style={{ padding: '6px 8px 8px', fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', color: text3, fontWeight: 600 }}>
        Asignar turno
      </div>
      {options.map((k) => {
        const s = getShift(k);
        const c = shiftColors(k, dark);
        const active = current === k;
        return (
          <button key={k} onClick={() => onPick(k)} style={{
            display: 'flex', alignItems: 'center', gap: 10, width: '100%',
            padding: '8px 9px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: active ? hoverBg : 'transparent', textAlign: 'left',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = active ? hoverBg : 'transparent'; }}
          >
            <span style={{
              width: 9, height: 9, borderRadius: 99, background: c.dot, flexShrink: 0,
              outline: k === 'libre' ? `1px solid ${border}` : 'none',
            }} />
            <span style={{ flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{s.name}</span>
              <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, color: text3 }}>
                {s.range === '—' ? 'Sin asignar' : s.range}
              </span>
            </span>
            <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, color: 'var(--text-2)', fontWeight: 600 }}>{s.hours}h</span>
            {active && <Icon name="check" size={14} stroke={2.4} style={{ color: accent }} />}
          </button>
        );
      })}
    </div>
  );
}

function Seg({ options, value, onChange }: { options: { key: string; label: string }[]; value: string; onChange: (k: string) => void }) {
  const surface2 = 'var(--surface-2)';
  return (
    <div style={{
      display: 'inline-flex', background: surface2, border: '1px solid var(--border)',
      borderRadius: 9, padding: 3, gap: 2,
    }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            padding: '6px 12px', border: 'none', borderRadius: 6,
            background: on ? 'var(--surface)' : 'transparent',
            color: on ? 'var(--text-1)' : 'var(--text-2)',
            boxShadow: on ? 'var(--shadow-sm)' : 'none',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            transition: 'background .12s, color .12s',
          }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function CoveragePanel({ workers, days, dark }: { workers: Worker[]; days: typeof DAYS; dark: boolean }) {
  const cov = getCoverage();
  const tracked = getShiftIds().filter((sid) => (cov[sid] || 0) > 0);
  if (tracked.length === 0) return null;
  const matrix = coverageMatrix(workers);
  const underC = statusColors('under', dark);
  const okC = statusColors('exact', dark);
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';

  return (
    <div style={{
      marginTop: 18, border: `1px solid ${border}`, borderRadius: 14,
      background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Cobertura por turno</h3>
        <span style={{ fontSize: 11.5, color: text3 }}>Personas asignadas vs. mínimo requerido por día</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 560 }}>
          <thead>
            <tr>
              <th style={{ fontSize: 11, fontWeight: 600, color: text3, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 4px', textAlign: 'left', paddingLeft: 2 }}>Franja</th>
              {days.map((d) => (
                <th key={d.key} style={{ fontSize: 11, fontWeight: 600, color: text3, textTransform: 'uppercase', letterSpacing: '0.04em', padding: '6px 4px', textAlign: 'center' }}>{d.short}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tracked.map((sid) => {
              const s = getShift(sid);
              const c = shiftColors(sid, dark);
              const min = cov[sid];
              return (
                <tr key={sid}>
                  <td style={{ padding: '8px 8px 8px 2px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 99, background: c.dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 12.5, fontWeight: 500 }}>{s.name}</span>
                      <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 10.5, color: text3 }}>mín {min}</span>
                    </div>
                  </td>
                  {days.map((d) => {
                    const n = matrix[sid]?.[d.key] ?? 0;
                    const under = n < min;
                    const cl = under ? underC : okC;
                    return (
                      <td key={d.key} style={{ textAlign: 'center', padding: '5px 4px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 30, padding: '3px 6px', borderRadius: 6,
                          fontFamily: '"IBM Plex Mono", monospace', fontSize: 12.5, fontWeight: 600,
                          color: cl.fg, background: under ? cl.bg : 'transparent',
                        }}>
                          {n}{under && <Icon name="warn" size={11} style={{ marginLeft: 3, verticalAlign: '-1px' }} />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getDayKeyForDate(d: Date, weekDates: Record<DayKey, Date>): DayKey | null {
  const s = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  for (const [k, wd] of Object.entries(weekDates) as [DayKey, Date][]) {
    if (`${wd.getUTCFullYear()}-${wd.getUTCMonth()}-${wd.getUTCDate()}` === s) return k;
  }
  return null;
}

function MonthCalendar({ workers, selectedWeek, onSelectWeek, dark }: {
  workers: Worker[];
  selectedWeek: string;
  onSelectWeek: (wk: string) => void;
  dark: boolean;
}) {
  const [my, setMy] = useState(() => weekKeyToMonthYear(selectedWeek));

  useEffect(() => { setMy(weekKeyToMonthYear(selectedWeek)); }, [selectedWeek]);

  const { year, month } = my;
  const days = getMonthDays(year, month);
  const weekDates = getWeekDates(selectedWeek);

  const selectedDates = new Set(
    Object.values(weekDates).map((d) => `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`)
  );

  const firstDay = days[0];
  const dow = firstDay.getUTCDay() || 7;
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(firstDay.getUTCDate() - dow + 1);

  const grid: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart); d.setUTCDate(gridStart.getUTCDate() + i); return d;
  });
  const rows: Date[][] = [];
  for (let i = 0; i < 6; i++) {
    const row = grid.slice(i * 7, (i + 1) * 7);
    if (i === 5 && row.every((d) => d.getUTCMonth() !== month)) break;
    rows.push(row);
  }

  const prevMonth = () => setMy(({ year: y, month: m }) => m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 });
  const nextMonth = () => setMy(({ year: y, month: m }) => m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 });

  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';
  const accent = '#4664c9';

  const DAY_HEADERS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 14, background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${border}`, background: surface2 }}>
        <button onClick={prevMonth} style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 7, border: `1px solid ${border}`, background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer' }}>
          <Icon name="chevL" size={15} />
        </button>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{formatMonthYear(year, month)}</span>
        <button onClick={nextMonth} style={{ display: 'grid', placeItems: 'center', width: 30, height: 30, borderRadius: 7, border: `1px solid ${border}`, background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer' }}>
          <Icon name="chevR" size={15} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: `1px solid ${border}` }}>
        {DAY_HEADERS.map((h, i) => (
          <div key={h} style={{ textAlign: 'center', padding: '8px 4px', fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: i >= 5 ? accent + 'aa' : text3 }}>
            {h}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: ri < rows.length - 1 ? `1px solid ${border}` : 'none' }}>
          {row.map((d, ci) => {
            const inMonth = d.getUTCMonth() === month;
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
            const inSelected = selectedDates.has(key);
            const today = isToday(d);
            const weekend = ci >= 5;
            const dayKey = inSelected ? getDayKeyForDate(d, weekDates) : null;

            const shiftCounts: { sid: string; count: number }[] = [];
            if (dayKey) {
              const counts: Record<string, number> = {};
              workers.forEach((w) => {
                const sk = w.shifts[dayKey as DayKey];
                if (sk && sk !== 'libre') counts[sk] = (counts[sk] || 0) + 1;
              });
              Object.entries(counts).forEach(([sid, count]) => shiftCounts.push({ sid, count }));
            }

            return (
              <div
                key={ci}
                onClick={() => { if (!inSelected && inMonth) onSelectWeek(weekKeyFromDate(d)); }}
                style={{
                  minHeight: 76, padding: '8px 10px', cursor: (!inSelected && inMonth) ? 'pointer' : 'default',
                  background: inSelected ? `color-mix(in oklch, ${accent} 8%, var(--surface))` : weekend ? 'var(--surface-2)' : 'var(--surface)',
                  borderLeft: ci > 0 ? `1px solid ${border}` : 'none',
                  outline: inSelected ? `2px solid ${accent}33` : 'none',
                  outlineOffset: '-2px',
                  opacity: inMonth ? 1 : 0.35,
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) => { if (!inSelected && inMonth) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
                onMouseLeave={(e) => { if (!inSelected && inMonth) (e.currentTarget as HTMLElement).style.background = weekend ? 'var(--surface-2)' : 'var(--surface)'; }}
              >
                <div style={{
                  fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, fontWeight: today ? 700 : 500,
                  color: today ? accent : inMonth ? 'var(--text-1)' : text3,
                  marginBottom: 6,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {d.getUTCDate()}
                  {today && <span style={{ width: 5, height: 5, borderRadius: 99, background: accent }} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {shiftCounts.map(({ sid, count }) => {
                    const c = shiftColors(sid, dark);
                    return (
                      <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, borderRadius: 2, background: c.dot, flexShrink: 0 }} />
                        <span style={{ fontSize: 10.5, color: c.fg, fontFamily: '"IBM Plex Mono", monospace', whiteSpace: 'nowrap' }}>
                          {getShift(sid).abbr} {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function TurnosView({ workers, selectedWeek, onPrevWeek, onNextWeek, onSelectWeek, onAssign, dark }: Props) {
  const [active, setActive] = useState<ActiveCell | null>(null);
  const [catFilter, setCatFilter] = useState('Todas');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  const cats = [{ key: 'Todas', label: 'Todas' }, ...getCatIds().map((id) => ({ key: id, label: getCat(id).name }))];
  const days = DAYS;
  const weekDates = getWeekDates(selectedWeek);
  const visible = catFilter === 'Todas' ? workers : workers.filter((w) => w.cat === catFilter);

  const assign = (workerId: string, dayKey: string, shiftKey: string) => {
    onAssign(workerId, dayKey, shiftKey);
    setActive(null);
  };

  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const accent = '#4664c9';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';
  const weekendBg = dark ? 'oklch(0.20 0.008 260 / 0.6)' : 'oklch(0.95 0.003 250 / 0.6)';

  return (
    <div className="view-pad">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Cuadro de turnos</h1>
          <p style={{ margin: '5px 0 0', color: text3, fontSize: 13 }}>
            {viewMode === 'week' ? `${formatWeekRange(selectedWeek)} · Clic en una celda para asignar` : 'Vista mensual · Clic en una semana para cargar datos'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Vista toggle */}
          <Seg
            options={[{ key: 'week', label: 'Semana' }, { key: 'month', label: 'Mes' }]}
            value={viewMode}
            onChange={(v) => { setViewMode(v as 'week' | 'month'); setActive(null); }}
          />
          {viewMode === 'week' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <button onClick={onPrevWeek} style={{
                  display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${border}`, background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer',
                }} aria-label="Semana anterior"><Icon name="chevL" size={16} /></button>
                <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12, padding: '0 6px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{selectedWeek}</span>
                <button onClick={onNextWeek} style={{
                  display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${border}`, background: 'var(--surface)', color: 'var(--text-2)', cursor: 'pointer',
                }} aria-label="Semana siguiente"><Icon name="chevR" size={16} /></button>
              </div>
              <Seg options={cats} value={catFilter} onChange={setCatFilter} />
            </>
          )}
        </div>
      </div>

      {/* Month view */}
      {viewMode === 'month' && (
        <MonthCalendar
          workers={workers}
          selectedWeek={selectedWeek}
          onSelectWeek={(wk) => { onSelectWeek?.(wk); setViewMode('week'); }}
          dark={dark}
        />
      )}

      {/* Table (week view) */}
      {viewMode === 'week' && <div style={{ border: `1px solid ${border}`, borderRadius: 14, overflow: 'auto', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{
                position: 'sticky', left: 0, zIndex: 4, background: surface2,
                borderBottom: `1px solid ${border}`, fontWeight: 600, fontSize: 11,
                letterSpacing: '0.04em', textTransform: 'uppercase', color: text3,
                height: 44, textAlign: 'left', paddingLeft: 18, minWidth: 210,
                borderRight: `1px solid ${border}`,
              }}>Trabajador</th>
              {days.map((d) => {
                const date = weekDates[d.key];
                const today = isToday(date);
                return (
                  <th key={d.key} style={{
                    position: 'sticky', top: 0, zIndex: 3, background: surface2,
                    borderBottom: `1px solid ${border}`, fontWeight: 600, fontSize: 11,
                    letterSpacing: '0.04em', textTransform: 'uppercase', color: text3,
                    height: 52, textAlign: 'center', minWidth: 104,
                  }}>
                    <div style={{ color: today ? accent : text3 }}>{d.short}</div>
                    <div style={{
                      fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, fontWeight: today ? 700 : 500,
                      letterSpacing: 0, textTransform: 'none', marginTop: 2,
                      color: today ? accent : text3,
                    }}>
                      {date.getUTCDate()} {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][date.getUTCMonth()]}
                    </div>
                  </th>
                );
              })}
              <th style={{
                position: 'sticky', right: 0, zIndex: 4, background: surface2,
                borderBottom: `1px solid ${border}`, fontWeight: 600, fontSize: 11,
                letterSpacing: '0.04em', textTransform: 'uppercase', color: text3,
                height: 44, textAlign: 'right', paddingRight: 18, minWidth: 130,
                borderLeft: `1px solid ${border}`,
              }}>Semana</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((w, wi) => {
              const comp = complianceStatus(w);
              const sc = statusColors(comp.status, dark);
              const cc = catColors(w.cat, dark);
              const isLast = wi === visible.length - 1;
              return (
                <tr key={w.id} style={{ transition: 'background .1s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = surface2; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = ''; }}
                >
                  <td style={{
                    position: 'sticky', left: 0, zIndex: 2, background: 'var(--surface)',
                    borderBottom: isLast ? 'none' : `1px solid ${border}`,
                    borderRight: `1px solid ${border}`, height: 56, minWidth: 210,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '0 0 0 18px' }}>
                      <span style={{
                        width: 30, height: 30, borderRadius: 8, display: 'grid', placeItems: 'center',
                        fontSize: 11, fontWeight: 600, background: avatarBg(w.name, dark),
                        color: dark ? 'oklch(0.85 0.01 260)' : 'oklch(0.25 0.01 260)', flexShrink: 0,
                      }}>{initials(w.name)}</span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 500, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>
                        <span style={{ display: 'flex', alignItems: 'center', fontSize: 11.5, color: text3, marginTop: 1 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 500, color: cc.fg }}>
                            <span style={{ width: 6, height: 6, borderRadius: 99, background: cc.dot }} />
                            {getCat(w.cat).name}
                          </span>
                          <span style={{ opacity: 0.55 }}> · {ROLES[w.role].short}</span>
                        </span>
                      </span>
                    </div>
                  </td>

                  {days.map((d) => {
                    const sk = w.shifts[d.key];
                    const isActive = active?.workerId === w.id && active.dayKey === d.key;
                    return (
                      <td key={d.key} style={{
                        textAlign: 'center', height: 56,
                        borderBottom: isLast ? 'none' : `1px solid ${border}`,
                        ...(d.weekend ? { background: weekendBg } : {}),
                      }}>
                        <button
                          onClick={(e) => setActive({ workerId: w.id, dayKey: d.key, anchorEl: e.currentTarget })}
                          style={{
                            width: '100%', height: '100%', border: 'none', background: 'transparent',
                            cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 6,
                            transition: 'background .1s',
                            ...(isActive ? { boxShadow: `inset 0 0 0 2px ${accent}`, borderRadius: 8 } : {}),
                            ...(sk === 'libre' ? { opacity: 0.7 } : {}),
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--hover)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          <ShiftChip shiftKey={sk} dark={dark} size="sm" />
                        </button>
                      </td>
                    );
                  })}

                  <td style={{
                    position: 'sticky', right: 0, zIndex: 2, background: 'var(--surface)',
                    borderBottom: isLast ? 'none' : `1px solid ${border}`,
                    borderLeft: `1px solid ${border}`, height: 56, minWidth: 130,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 18px 0 0' }}>
                      <div style={{ width: 96, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end' }}>
                          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 16, fontWeight: 600, color: sc.fg }}>{comp.hours}</span>
                          <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 11.5, color: text3 }}>/ {comp.target}h</span>
                        </div>
                        <HoursBar hours={comp.hours} target={comp.target} dark={dark} height={6} />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>}

      {viewMode === 'week' && <CoveragePanel workers={workers} days={days} dark={dark} />}

      {/* Legend */}
      {viewMode === 'week' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, letterSpacing: '0.05em', textTransform: 'uppercase', color: text3, fontWeight: 600 }}>Franjas horarias</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[...getShiftIds(), 'libre'].map((k) => (
              <ShiftChip key={k} shiftKey={k} dark={dark} size="sm" showRange />
            ))}
          </div>
        </div>
      )}

      {active && (
        <ShiftPicker
          anchorEl={active.anchorEl}
          current={workers.find((w) => w.id === active.workerId)?.shifts[active.dayKey as keyof typeof workers[0]['shifts']] ?? 'libre'}
          dark={dark}
          onPick={(k) => assign(active.workerId, active.dayKey, k)}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

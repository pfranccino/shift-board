import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import {
  getCatIds, getCat, catColors, shiftColors, shiftHours, getShift, HUE_PALETTE, hueColors,
  DAYS,
} from '../data';
import { Icon } from '../components/Icon';
import type { Config, SolverConfig, Worker } from '../types';

interface Props {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  solverConfig: SolverConfig;
  setSolverConfig: React.Dispatch<React.SetStateAction<SolverConfig>>;
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  dark: boolean;
}

function genId(name: string, existing: string[]): string {
  let base = (name || 'x').toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '').slice(0, 12) || 'id';
  let id = base, i = 1;
  while (existing.includes(id)) id = base + String(i++);
  return id;
}

function HuePicker({ value, onChange }: { value: number; onChange: (h: number) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {HUE_PALETTE.map((h) => (
        <button key={h} onClick={() => onChange(h)} aria-label={`Color ${h}`} style={{
          width: 26, height: 26, borderRadius: 8, border: `2px solid ${value === h ? 'var(--text-1)' : 'transparent'}`,
          cursor: 'pointer', padding: 0,
          background: `oklch(0.68 0.13 ${h})`,
          transform: value === h ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform .1s',
        }} />
      ))}
    </div>
  );
}

function CategoryModal({ initial, existingIds, dark, onSave, onClose }: {
  initial?: Config['categories'][number];
  existingIds: string[];
  dark: boolean;
  onSave: (data: { name: string; hue: number }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [hue, setHue] = useState(initial?.hue ?? HUE_PALETTE[0]);
  const c = hueColors(hue, dark);
  const save = () => { if (name.trim()) onSave({ name: name.trim(), hue }); };
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '9px', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13.5,
      background: dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)',
    },
  };
  return (
    <Dialog open onClose={onClose} PaperProps={{
      sx: { borderRadius: '16px', maxWidth: 420, background: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)', border: `1px solid ${border}` }
    }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0, fontFamily: '"IBM Plex Sans"', fontSize: 16, fontWeight: 600 }}>
        {initial ? 'Editar categoría' : 'Nueva categoría'}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'grid', placeItems: 'center', padding: 4 }}><Icon name="x" size={16} /></button>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Nombre del puesto</span>
          <TextField autoFocus value={name} placeholder="Ej. Bombero, Cajero, Encargado"
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} sx={inputSx} size="small" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Color</span>
          <HuePicker value={hue} onChange={setHue} />
          <span style={{ marginTop: 4, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 6, background: c.bg, color: c.fg, alignSelf: 'flex-start' }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: c.dot }} />{name.trim() || 'Vista previa'}
          </span>
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: 'var(--text-2)', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={save} disabled={!name.trim()} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: '#4664c9', color: 'white', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer', opacity: !name.trim() ? 0.5 : 1 }}>
          {initial ? 'Guardar' : 'Crear'}
        </button>
      </DialogActions>
    </Dialog>
  );
}

function ShiftModal({ initial, dark, onSave, onClose }: {
  initial?: Config['shiftTypes'][number];
  dark: boolean;
  onSave: (data: { name: string; start: number; end: number; hue: number }) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial?.name || '');
  const [start, setStart] = useState(initial?.start ?? 6);
  const [end, setEnd] = useState(initial?.end ?? 14);
  const [hue, setHue] = useState(initial?.hue ?? HUE_PALETTE[0]);
  const hours = shiftHours({ start: Number(start), end: Number(end) });
  const c = hueColors(hue, dark);
  const save = () => { if (name.trim()) onSave({ name: name.trim(), start: Number(start), end: Number(end), hue }); };
  const hourOpts = Array.from({ length: 24 }, (_, i) => i);
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '9px', fontFamily: '"IBM Plex Sans"', fontSize: 13.5,
      background: dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)',
    },
    '& .MuiSelect-select': { fontFamily: '"IBM Plex Sans"', fontSize: 13.5 },
  };
  const selectStyle: React.CSSProperties = {
    padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 9,
    background: dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)',
    fontFamily: '"IBM Plex Sans"', fontSize: 13.5, color: 'var(--text-1)',
    outline: 'none', width: '100%',
  };
  return (
    <Dialog open onClose={onClose} PaperProps={{
      sx: { borderRadius: '16px', maxWidth: 420, background: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)', border: `1px solid ${border}` }
    }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0, fontFamily: '"IBM Plex Sans"', fontSize: 16, fontWeight: 600 }}>
        {initial ? 'Editar franja' : 'Nueva franja horaria'}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'grid', placeItems: 'center', padding: 4 }}><Icon name="x" size={16} /></button>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Nombre de la franja</span>
          <TextField autoFocus value={name} placeholder="Ej. Mañana, Noche, Medio Turno"
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} sx={inputSx} size="small" />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[{ label: 'Desde', val: start, set: setStart }, { label: 'Hasta', val: end, set: setEnd }].map(({ label, val, set }) => (
            <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{label}</span>
              <select value={val} onChange={(e) => set(Number(e.target.value))} style={selectStyle}>
                {hourOpts.map((h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
              </select>
            </div>
          ))}
          <div style={{ width: 78, display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Duración</span>
            <div style={{ ...selectStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"IBM Plex Mono"', fontWeight: 600 }}>{hours}h</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Color</span>
          <HuePicker value={hue} onChange={setHue} />
          <span style={{ marginTop: 4, alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 9px', borderRadius: 7, fontSize: 12.5, fontWeight: 500, background: c.bg, color: c.fg, border: `1px solid ${c.border}` }}>
            <span style={{ width: 7, height: 7, borderRadius: 99, background: c.dot }} />
            {name.trim() || 'Vista previa'}
            <span style={{ fontFamily: '"IBM Plex Mono"', opacity: 0.7, fontSize: 11 }}>{String(Number(start)).padStart(2, '0')}–{String(Number(end)).padStart(2, '0')}</span>
          </span>
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: 'var(--text-2)', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={save} disabled={!name.trim()} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: '#4664c9', color: 'white', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer', opacity: !name.trim() ? 0.5 : 1 }}>
          {initial ? 'Guardar' : 'Crear'}
        </button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmModal({ title, body, confirmLabel, onConfirm, onClose, dark }: {
  title: string; body: string; confirmLabel: string;
  onConfirm: () => void; onClose: () => void; dark: boolean;
}) {
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  return (
    <Dialog open onClose={onClose} PaperProps={{ sx: { borderRadius: '16px', maxWidth: 380, background: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)', border: `1px solid ${border}` } }}>
      <DialogTitle sx={{ fontFamily: '"IBM Plex Sans"', fontSize: 16, fontWeight: 600 }}>{title}</DialogTitle>
      <DialogContent><p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>{body}</p></DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: 'var(--text-2)', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={onConfirm} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'oklch(0.58 0.12 28)', color: 'white', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>{confirmLabel}</button>
      </DialogActions>
    </Dialog>
  );
}

export function ConfiguracionView({ config, setConfig, solverConfig, setSolverConfig, workers, setWorkers, dark }: Props) {
  const setSolver = <K extends keyof SolverConfig>(k: K, v: SolverConfig[K]) =>
    setSolverConfig((s) => ({ ...s, [k]: v }));
  const [catModal, setCatModal] = useState<{ cat?: Config['categories'][number] } | null>(null);
  const [shiftModal, setShiftModal] = useState<{ shift?: Config['shiftTypes'][number] } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'cat' | 'shift'; item: Config['categories'][number] | Config['shiftTypes'][number]; n: number } | null>(null);

  const catCount = (id: string) => workers.filter((w) => w.cat === id).length;
  const shiftCount = (id: string) => workers.reduce((n, w) => n + DAYS.filter((d) => w.shifts[d.key] === id).length, 0);

  const saveCat = (data: { name: string; hue: number }) => {
    if (catModal?.cat) {
      setConfig((c) => ({ ...c, categories: c.categories.map((x) => (x.id === catModal.cat!.id ? { ...x, ...data } : x)) }));
    } else {
      const id = genId(data.name, config.categories.map((x) => x.id));
      setConfig((c) => ({ ...c, categories: [...c.categories, { id, ...data }] }));
    }
    setCatModal(null);
  };

  const delCat = (cat: Config['categories'][number]) => {
    const others = config.categories.filter((x) => x.id !== cat.id);
    const fallback = others[0]?.id;
    setConfig((c) => ({ ...c, categories: others }));
    if (fallback) setWorkers((prev) => prev.map((w) => (w.cat === cat.id ? { ...w, cat: fallback } : w)));
    setConfirm(null);
  };

  const saveShift = (data: { name: string; start: number; end: number; hue: number }) => {
    if (shiftModal?.shift) {
      setConfig((c) => ({ ...c, shiftTypes: c.shiftTypes.map((x) => (x.id === shiftModal.shift!.id ? { ...x, ...data } : x)) }));
    } else {
      const id = genId(data.name, config.shiftTypes.map((x) => x.id));
      setConfig((c) => ({ ...c, shiftTypes: [...c.shiftTypes, { id, ...data }], coverage: { ...c.coverage, [id]: 0 } }));
    }
    setShiftModal(null);
  };

  const delShift = (shift: Config['shiftTypes'][number]) => {
    setConfig((c) => {
      const cov = { ...c.coverage }; delete cov[shift.id];
      return { ...c, shiftTypes: c.shiftTypes.filter((x) => x.id !== shift.id), coverage: cov };
    });
    setWorkers((prev) => prev.map((w) => {
      const ns = { ...w.shifts };
      DAYS.forEach((d) => { if (ns[d.key] === shift.id) ns[d.key] = 'libre'; });
      return { ...w, shifts: ns };
    }));
    setConfirm(null);
  };

  const setCov = (id: string, n: number) => setConfig((c) => ({ ...c, coverage: { ...c.coverage, [id]: Math.max(0, n) } }));

  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const accent = '#4664c9';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';

  const panel: React.CSSProperties = { background: 'var(--surface)', border: `1px solid ${border}`, borderRadius: 14, padding: 20, boxShadow: 'var(--shadow-sm)' };
  const panelHead: React.CSSProperties = { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 };
  const smBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '5px 10px', borderRadius: 9, border: `1px solid ${border}`,
    background: 'transparent', color: 'var(--text-2)',
    fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 12, cursor: 'pointer',
  };
  const iconBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center', transition: 'background .12s' };

  return (
    <div className="view-pad">
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Configuración</h1>
        <p style={{ margin: '5px 0 0', color: text3, fontSize: 13 }}>Define los puestos, franjas horarias, cobertura y las reglas del motor de optimización.</p>
      </div>

      <div className="config-cols">
        {/* Categories */}
        <div style={panel}>
          <div style={panelHead}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Categorías / Puestos</h3>
            <button style={smBtn} onClick={() => setCatModal({})}><Icon name="plus" size={14} stroke={2.2} /> Nueva</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {config.categories.map((cat) => {
              const c = catColors(cat.id, dark);
              const n = catCount(cat.id);
              return (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 8px', borderRadius: 10, transition: 'background .1s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = surface2; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ width: 11, height: 11, borderRadius: 99, background: c.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{cat.name}</div>
                    <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 11.5, color: text3, marginTop: 2 }}>{n} {n === 1 ? 'trabajador' : 'trabajadores'}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button style={iconBtn} onClick={() => setCatModal({ cat })} aria-label="Editar"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    ><Icon name="edit" size={14} /></button>
                    <button style={{ ...iconBtn, opacity: config.categories.length <= 1 ? 0.3 : 1, cursor: config.categories.length <= 1 ? 'not-allowed' : 'pointer' }}
                      disabled={config.categories.length <= 1}
                      onClick={() => setConfirm({ kind: 'cat', item: cat, n })}
                      aria-label="Eliminar"
                      onMouseEnter={(e) => { if (config.categories.length > 1) { const el = e.currentTarget as HTMLElement; el.style.background = `color-mix(in oklch, oklch(0.6 0.14 28) 12%, transparent)`; el.style.color = 'oklch(0.55 0.14 28)'; } }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--text-2)'; }}
                    ><Icon name="trash" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shifts */}
        <div style={panel}>
          <div style={panelHead}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Franjas horarias</h3>
            <button style={smBtn} onClick={() => setShiftModal({})}><Icon name="plus" size={14} stroke={2.2} /> Nueva</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end', padding: '4px 8px 8px', borderBottom: `1px solid ${border}`, marginBottom: 4, fontSize: 11, fontWeight: 600, color: text3, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            <span>Franja</span>
            <span style={{ textAlign: 'center', lineHeight: 1.3 }}>Cobertura mín.<br /><span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, opacity: 0.8 }}>personas por día</span></span>
            <span />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {config.shiftTypes.map((st) => {
              const s = getShift(st.id);
              const c = shiftColors(st.id, dark);
              const cov = config.coverage[st.id] || 0;
              return (
                <div key={st.id} style={{ display: 'grid', gridTemplateColumns: '11px 1fr auto auto', alignItems: 'center', gap: 12, padding: '11px 8px', borderRadius: 10, transition: 'background .1s' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = surface2; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ width: 11, height: 11, borderRadius: 99, background: c.dot }} />
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
                    <div style={{ fontFamily: '"IBM Plex Mono"', fontSize: 11.5, color: text3, marginTop: 2 }}>{s.range} · {s.hours}h</div>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: surface2, border: `1px solid ${border}`, borderRadius: 8, padding: 2 }}>
                    <button onClick={() => setCov(st.id, cov - 1)} disabled={cov <= 0} aria-label="Menos" style={{
                      width: 26, height: 26, border: 'none', background: 'transparent', color: 'var(--text-2)',
                      borderRadius: 6, cursor: cov <= 0 ? 'not-allowed' : 'pointer', fontSize: 16, lineHeight: 1,
                      display: 'grid', placeItems: 'center', opacity: cov <= 0 ? 0.35 : 1,
                    }}>−</button>
                    <span style={{ fontFamily: '"IBM Plex Mono"', minWidth: 22, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{cov}</span>
                    <button onClick={() => setCov(st.id, cov + 1)} aria-label="Más" style={{
                      width: 26, height: 26, border: 'none', background: 'transparent', color: 'var(--text-2)',
                      borderRadius: 6, cursor: 'pointer', fontSize: 16, lineHeight: 1,
                      display: 'grid', placeItems: 'center',
                    }}>+</button>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <button style={iconBtn} onClick={() => setShiftModal({ shift: st })} aria-label="Editar"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    ><Icon name="edit" size={14} /></button>
                    <button style={{ ...iconBtn, opacity: config.shiftTypes.length <= 1 ? 0.3 : 1, cursor: config.shiftTypes.length <= 1 ? 'not-allowed' : 'pointer' }}
                      disabled={config.shiftTypes.length <= 1}
                      onClick={() => setConfirm({ kind: 'shift', item: st, n: shiftCount(st.id) })}
                      aria-label="Eliminar"
                      onMouseEnter={(e) => { if (config.shiftTypes.length > 1) { const el = e.currentTarget as HTMLElement; el.style.background = `color-mix(in oklch, oklch(0.6 0.14 28) 12%, transparent)`; el.style.color = 'oklch(0.55 0.14 28)'; } }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--text-2)'; }}
                    ><Icon name="trash" size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginTop: 14, padding: '12px 14px', borderRadius: 10, background: surface2, border: `1px solid ${border}`, fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.5 }}>
            <Icon name="clock" size={14} style={{ flexShrink: 0, marginTop: 1, color: text3 }} />
            <span>La cobertura mínima marca cuántas personas debe haber en cada franja por día. Los huecos se muestran en <b>Turnos</b> y <b>Estadísticas</b>.</span>
          </div>
        </div>
      </div>

      {/* Solver Config */}
      <div style={{ ...panel, marginTop: 14 }}>
        <div style={{ ...panelHead, marginBottom: 20 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="magic" size={15} style={{ verticalAlign: '-2px' }} /> Motor de optimización
            </h3>
            <p style={{ margin: '5px 0 0', fontSize: 12.5, color: text3, lineHeight: 1.5 }}>
              Estas reglas definen qué puede y qué no puede hacer el algoritmo al generar el cuadro de turnos.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Hard constraints */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: text3, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 8, borderBottom: `1px solid ${border}` }}>
              Reglas obligatorias
            </div>

            {[
              { key: 'min_rest_hours' as const, label: 'Descanso mínimo entre turnos', unit: 'h', hint: 'Horas de descanso obligatorio entre dos turnos.', min: 0, max: 72 },
              { key: 'max_consecutive_days' as const, label: 'Días máximos continuos', unit: 'd', hint: 'Máximo de días seguidos sin descanso.', min: 1, max: 60 },
              { key: 'max_weekly_hours' as const, label: 'Límite de horas semanales', unit: 'h', hint: 'Tope de horas que puede trabajar una persona en la semana.', min: 1, max: 168 },
            ].map(({ key, label, unit, hint, min, max }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: text3, marginTop: 2, lineHeight: 1.4 }}>{hint}</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <input
                    type="number" min={min} max={max}
                    value={solverConfig[key] as number}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v) && v >= min && v <= max) setSolver(key, v);
                    }}
                    style={{
                      width: 64, padding: '5px 8px', borderRadius: 8,
                      border: `1px solid ${border}`, background: surface2,
                      fontFamily: '"IBM Plex Mono"', fontSize: 14, fontWeight: 600,
                      color: 'var(--text-1)', textAlign: 'center', outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: 12, color: text3 }}>{unit}</span>
                </div>
              </div>
            ))}

            {/* Boolean hard constraints */}
            {[
              { key: 'prevent_clopening' as const, label: 'Evitar clopening', hint: 'Prohíbe cierre nocturno seguido de apertura al día siguiente.' },
              { key: 'allow_split_shifts' as const, label: 'Permitir turnos divididos', hint: 'Permite asignar dos franjas horarias en el mismo día.' },
            ].map(({ key, label, hint }) => (
              <div key={key} onClick={() => setSolver(key, !solverConfig[key])} role="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 10, cursor: 'pointer', transition: 'border-color .12s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = border; }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: text3, marginTop: 3, lineHeight: 1.4 }}>{hint}</div>
                </div>
                <span style={{ width: 38, height: 22, borderRadius: 99, position: 'relative', flexShrink: 0, background: solverConfig[key] ? accent : border, transition: 'background .2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: 99, background: 'white', transition: 'transform .2s', transform: solverConfig[key] ? 'translateX(16px)' : 'none' }} />
                </span>
              </div>
            ))}
          </div>

          {/* Soft constraints */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: text3, textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: 8, borderBottom: `1px solid ${border}` }}>
              Preferencias del algoritmo
            </div>
            <p style={{ margin: 0, fontSize: 12, color: text3, lineHeight: 1.5 }}>
              El solver intentará cumplirlas, pero puede sacrificarlas si la cobertura lo exige.
            </p>

            {[
              { key: 'group_days_off' as const, label: 'Agrupar días libres', hint: 'Prefiere que los descansos caigan juntos (ej. sáb y dom).' },
              { key: 'fair_weekends' as const, label: 'Rotación justa de fines de semana', hint: 'Penaliza asignar fin de semana a quien ya trabajó el anterior.' },
              { key: 'consistent_shifts' as const, label: 'Consistencia de turnos', hint: 'Evita mezclar franjas distintas dentro de la misma semana.' },
              { key: 'rotate_shifts_weekly' as const, label: 'Rotación semanal de bloque', hint: 'Fuerza un cambio de franja respecto a la semana anterior.' },
            ].map(({ key, label, hint }) => (
              <div key={key} onClick={() => setSolver(key, !solverConfig[key])} role="button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '10px 12px', border: `1px solid ${border}`, borderRadius: 10, cursor: 'pointer', transition: 'border-color .12s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = border; }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
                  <div style={{ fontSize: 11.5, color: text3, marginTop: 3, lineHeight: 1.4, maxWidth: 240 }}>{hint}</div>
                </div>
                <span style={{ width: 38, height: 22, borderRadius: 99, position: 'relative', flexShrink: 0, background: solverConfig[key] ? accent : border, transition: 'background .2s' }}>
                  <span style={{ position: 'absolute', top: 2, left: 2, width: 18, height: 18, borderRadius: 99, background: 'white', transition: 'transform .2s', transform: solverConfig[key] ? 'translateX(16px)' : 'none' }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {catModal !== null && (
        <CategoryModal
          initial={catModal.cat} existingIds={config.categories.map((x) => x.id)}
          dark={dark} onSave={saveCat} onClose={() => setCatModal(null)}
        />
      )}
      {shiftModal !== null && (
        <ShiftModal initial={shiftModal.shift} dark={dark} onSave={saveShift} onClose={() => setShiftModal(null)} />
      )}
      {confirm?.kind === 'cat' && (
        <ConfirmModal title="Eliminar categoría"
          body={confirm.n > 0
            ? `${confirm.n} trabajador(es) pasarán a la categoría "${config.categories.find((x) => x.id !== (confirm.item as Config['categories'][number]).id)?.name}". ¿Continuar?`
            : `¿Eliminar la categoría "${confirm.item.name}"?`}
          confirmLabel="Eliminar" dark={dark}
          onConfirm={() => delCat(confirm.item as Config['categories'][number])} onClose={() => setConfirm(null)}
        />
      )}
      {confirm?.kind === 'shift' && (
        <ConfirmModal title="Eliminar franja"
          body={confirm.n > 0
            ? `Esta franja está asignada en ${confirm.n} celda(s); quedarán como "Libre". ¿Continuar?`
            : `¿Eliminar la franja "${confirm.item.name}"?`}
          confirmLabel="Eliminar" dark={dark}
          onConfirm={() => delShift(confirm.item as Config['shiftTypes'][number])} onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

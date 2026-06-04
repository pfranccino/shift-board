import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import {
  getCatIds, getCat, catColors, statusColors, complianceStatus,
  initials, avatarBg, DAYS, ROLES,
} from '../data';
import { HoursBar } from '../components/HoursBar';
import { StatusPill } from '../components/StatusPill';
import { Icon } from '../components/Icon';
import type { Worker, Role } from '../types';

interface Props {
  workers: Worker[];
  setWorkers: React.Dispatch<React.SetStateAction<Worker[]>>;
  onBulkAdd?: (names: string[]) => Promise<void>;
  dark: boolean;
}

function BulkModal({ dark, onAdd, onClose }: {
  dark: boolean;
  onAdd: (names: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const names = text.split('\n').map((n) => n.trim()).filter(Boolean);

  const handle = async () => {
    if (!names.length) return;
    setLoading(true);
    await onAdd(names).catch(() => {});
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open onClose={onClose} PaperProps={{
      sx: { borderRadius: '16px', width: '100%', maxWidth: 420, background: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)', border: `1px solid ${border}` }
    }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0, fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 16, fontWeight: 600 }}>
        Cargar lista
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'grid', placeItems: 'center', padding: 4 }}>
          <Icon name="x" size={16} />
        </button>
      </DialogTitle>
      <DialogContent sx={{ pt: '16px !important' }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
          Un nombre por línea. Se crean con turno completo (40h) sin asignación inicial.
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Benjamin\nDiego\nCristian\nEduardo'}
          rows={8}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: 9,
            border: `1px solid ${border}`, background: dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)',
            color: 'var(--text-1)', fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 13, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: 'var(--text-2)', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
        <button onClick={handle} disabled={!names.length || loading} style={{
          padding: '8px 14px', borderRadius: 9, border: 'none', background: '#4664c9', color: 'white',
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13,
          cursor: names.length && !loading ? 'pointer' : 'not-allowed', opacity: names.length && !loading ? 1 : 0.5,
        }}>
          {loading ? 'Cargando…' : names.length > 0 ? `Cargar ${names.length} trabajador${names.length === 1 ? '' : 'es'}` : 'Cargar'}
        </button>
      </DialogActions>
    </Dialog>
  );
}

function Seg({ options, value, onChange }: { options: { key: string; label: string | React.ReactNode }[]; value: string; onChange: (k: string) => void }) {
  return (
    <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <button key={o.key} onClick={() => onChange(o.key)} style={{
            flex: 1, padding: '6px 12px', border: 'none', borderRadius: 6,
            background: on ? 'var(--surface)' : 'transparent',
            color: on ? 'var(--text-1)' : 'var(--text-2)',
            boxShadow: on ? 'var(--shadow-sm)' : 'none',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function WorkerModal({ initial, dark, onSave, onClose }: {
  initial?: Worker;
  dark: boolean;
  onSave: (data: { name: string; role: Role; cat: string; contracted_hours: number }) => void;
  onClose: () => void;
}) {
  const catIds = getCatIds();
  const [name, setName] = useState(initial?.name || '');
  const [role, setRole] = useState<Role>(initial?.role || 'full');
  const [cat, setCat] = useState(initial?.cat || catIds[0]);
  const [contractedHours, setContractedHours] = useState<number>(
    initial?.contracted_hours ?? ROLES[initial?.role || 'full'].target
  );
  const editing = !!initial;

  const save = () => { if (name.trim() && cat) onSave({ name: name.trim(), role, cat, contracted_hours: contractedHours }); };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '9px',
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      fontSize: 13.5,
      background: dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)',
    },
  };

  return (
    <Dialog open onClose={onClose} PaperProps={{
      sx: {
        borderRadius: '16px', width: '100%', maxWidth: 420,
        background: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)',
        border: `1px solid ${dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)'}`,
      }
    }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0, fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 16, fontWeight: 600 }}>
        {editing ? 'Editar trabajador' : 'Nuevo trabajador'}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'grid', placeItems: 'center', padding: 4 }}>
          <Icon name="x" size={16} />
        </button>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Nombre completo</span>
          <TextField
            autoFocus value={name} placeholder="Ej. Lucía Fernández"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            sx={inputSx} size="small"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Tipo de contrato</span>
          <Seg
            options={Object.values(ROLES).map((r) => ({
              key: r.key,
              label: <>{r.label}</>,
            }))}
            value={role}
            onChange={(v) => {
              const next = v as Role;
              if (contractedHours === ROLES[role].target) setContractedHours(ROLES[next].target);
              setRole(next);
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Horas contratadas semanales</span>
          <TextField
            type="number"
            value={contractedHours}
            onChange={(e) => setContractedHours(Math.max(1, Math.floor(Number(e.target.value))))}
            inputProps={{ min: 1, max: 168 }}
            sx={inputSx} size="small"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Categoría / Puesto</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {catIds.map((cid) => {
              const c = catColors(cid, dark);
              const on = cat === cid;
              return (
                <button key={cid} onClick={() => setCat(cid)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 12px', borderRadius: 9,
                  border: `1px solid ${on ? c.dot : 'var(--border)'}`,
                  background: on ? c.bg : 'var(--surface-2)',
                  color: on ? c.fg : 'var(--text-2)',
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  fontSize: 13, fontWeight: on ? 600 : 500, cursor: 'pointer',
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: 99, background: c.dot }} />
                  {getCat(cid).name}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>Las categorías se administran en <b>Configuración</b>.</div>
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <button onClick={onClose} style={{
          padding: '8px 14px', borderRadius: 9, border: '1px solid var(--border)',
          background: 'transparent', color: 'var(--text-2)',
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
        }}>Cancelar</button>
        <button onClick={save} disabled={!name.trim()} style={{
          padding: '8px 14px', borderRadius: 9, border: 'none',
          background: '#4664c9', color: 'white',
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          opacity: !name.trim() ? 0.5 : 1,
        }}>
          {editing ? 'Guardar cambios' : 'Agregar'}
        </button>
      </DialogActions>
    </Dialog>
  );
}

export function TrabajadoresView({ workers, setWorkers, onBulkAdd, dark }: Props) {
  const [modal, setModal] = useState<{ worker?: Worker } | null>(null);
  const [bulkModal, setBulkModal] = useState(false);
  const [query, setQuery] = useState('');
  const [confirm, setConfirm] = useState<Worker | null>(null);

  const filtered = workers.filter((w) =>
    w.name.toLowerCase().includes(query.toLowerCase()) ||
    getCat(w.cat).name.toLowerCase().includes(query.toLowerCase()));

  const addWorker = (data: { name: string; role: Role; cat: string; contracted_hours: number }) => {
    const blank: Worker['shifts'] = { lun: 'libre', mar: 'libre', mie: 'libre', jue: 'libre', vie: 'libre', sab: 'libre', dom: 'libre' };
    setWorkers((prev) => [...prev, { id: `w${Date.now()}`, ...data, shifts: blank }]);
    setModal(null);
  };
  const editWorker = (id: string, data: { name: string; role: Role; cat: string; contracted_hours: number }) => {
    setWorkers((prev) => prev.map((w) => (w.id === id ? { ...w, ...data } : w)));
    setModal(null);
  };
  const delWorker = (id: string) => { setWorkers((prev) => prev.filter((w) => w.id !== id)); setConfirm(null); };

  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const accent = '#4664c9';

  return (
    <div className="view-pad">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Trabajadores</h1>
          <p style={{ margin: '5px 0 0', color: text3, fontSize: 13 }}>
            {workers.length} en plantilla · {workers.filter((w) => w.role === 'full').length} tiempo completo · {workers.filter((w) => w.role === 'part').length} part time
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 38, border: `1px solid ${border}`, borderRadius: 9, background: 'var(--surface)' }}>
            <Icon name="search" size={15} style={{ color: text3 }} />
            <input
              placeholder="Buscar…" value={query} onChange={(e) => setQuery(e.target.value)}
              style={{ border: 'none', background: 'none', outline: 'none', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13, color: 'var(--text-1)', width: 150 }}
            />
          </div>
          {onBulkAdd && (
            <button onClick={() => setBulkModal(true)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px',
              borderRadius: 9, border: `1px solid ${border}`, background: 'var(--surface)', color: 'var(--text-2)',
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
            }}>
              <Icon name="users" size={15} /> Cargar lista
            </button>
          )}
          <button onClick={() => setModal({})} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px',
            borderRadius: 9, border: 'none', background: accent, color: 'white',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}>
            <Icon name="plus" size={15} stroke={2.2} /> Agregar
          </button>
        </div>
      </div>

      <div className="worker-grid">
        {filtered.map((w) => {
          const comp = complianceStatus(w);
          const days = DAYS.filter((d) => w.shifts[d.key] !== 'libre').length;
          const cc = catColors(w.cat, dark);

          return (
            <div key={w.id} style={{
              background: 'var(--surface)', border: `1px solid ${border}`, borderRadius: 14,
              padding: 16, boxShadow: 'var(--shadow-sm)', transition: 'border-color .12s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = dark ? 'oklch(0.40 0.012 260)' : 'oklch(0.86 0.006 250)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = border; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  width: 42, height: 42, borderRadius: 11, display: 'grid', placeItems: 'center',
                  fontSize: 14, fontWeight: 600, background: avatarBg(w.name, dark),
                  color: dark ? 'oklch(0.85 0.01 260)' : 'oklch(0.25 0.01 260)', flexShrink: 0,
                }}>{initials(w.name)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 4 }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
                      padding: '3px 9px', borderRadius: 6, background: cc.bg, color: cc.fg,
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: 99, background: cc.dot }} />
                      {getCat(w.cat).name}
                    </span>
                    <span style={{ fontSize: 12, color: text3 }}>{ROLES[w.role].short}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
                  {[
                    { icon: 'edit', action: () => setModal({ worker: w }), label: 'Editar' },
                    { icon: 'trash', action: () => setConfirm(w), label: 'Eliminar', danger: true },
                  ].map(({ icon, action, label, danger }) => (
                    <button key={icon} onClick={action} aria-label={label} style={{
                      width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent',
                      color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center',
                      transition: 'background .12s, color .12s',
                    }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = danger ? `color-mix(in oklch, oklch(0.6 0.14 28) 12%, transparent)` : 'var(--hover)';
                        if (danger) el.style.color = 'oklch(0.55 0.14 28)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = 'transparent';
                        el.style.color = 'var(--text-2)';
                      }}
                    ><Icon name={icon} size={15} /></button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 16, paddingTop: 15, borderTop: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11.5, color: text3, letterSpacing: '0.02em' }}>Horas asignadas</span>
                  <StatusPill status={comp.status} dark={dark} diff={comp.diff} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '8px 0 9px' }}>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em' }}>{comp.hours}</span>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 12.5, color: text3 }}>/ {comp.target}h meta</span>
                </div>
                <HoursBar hours={comp.hours} target={comp.target} dark={dark} height={8} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11, color: text3 }}>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{days} {days === 1 ? 'día' : 'días'} con turno</span>
                  <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>{7 - days} libres</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && query && (
        <div style={{ textAlign: 'center', padding: 60, color: text3, fontSize: 14 }}>
          Sin resultados para "{query}".
        </div>
      )}

      {bulkModal && onBulkAdd && (
        <BulkModal dark={dark} onAdd={onBulkAdd} onClose={() => setBulkModal(false)} />
      )}

      {modal !== null && (
        <WorkerModal
          initial={modal.worker}
          dark={dark}
          onSave={(data) => (modal.worker ? editWorker(modal.worker.id, data) : addWorker(data))}
          onClose={() => setModal(null)}
        />
      )}

      {confirm && (
        <Dialog open onClose={() => setConfirm(null)} PaperProps={{
          sx: {
            borderRadius: '16px', maxWidth: 380,
            background: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)',
            border: `1px solid ${border}`,
          }
        }}>
          <DialogTitle sx={{ fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 16, fontWeight: 600 }}>Eliminar trabajador</DialogTitle>
          <DialogContent>
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              ¿Estás seguro de que quieres eliminar a <strong style={{ color: 'var(--text-1)' }}>{confirm.name}</strong>? Se quitará del cuadro de turnos.
            </p>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
            <button onClick={() => setConfirm(null)} style={{
              padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`,
              background: 'transparent', color: 'var(--text-2)',
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
            }}>Cancelar</button>
            <button onClick={() => delWorker(confirm.id)} style={{
              padding: '8px 14px', borderRadius: 9, border: 'none',
              background: 'oklch(0.58 0.12 28)', color: 'white',
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
            }}>Eliminar</button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

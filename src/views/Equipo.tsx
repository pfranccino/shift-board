import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { initials, avatarBg } from '../data';
import { Icon } from '../components/Icon';
import type { MockUser, MockOrg, MockMember, MockInvitation, OrgRole } from '../types';

interface Props {
  currentUser: MockUser;
  org: MockOrg;
  members: MockMember[];
  invitations: MockInvitation[];
  onInvite: (email: string, role: Exclude<OrgRole, 'owner'>) => MockInvitation;
  onRemoveMember: (memberId: string) => void;
  onCancelInvite: (inviteId: string) => void;
  dark: boolean;
}

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  manager: 'Mánager',
};

const ROLE_HUE: Record<OrgRole, number> = { owner: 250, admin: 35, manager: 145 };

function RoleSeg({ value, onChange }: { value: Exclude<OrgRole, 'owner'>; onChange: (r: Exclude<OrgRole, 'owner'>) => void }) {
  const opts: Exclude<OrgRole, 'owner'>[] = ['admin', 'manager'];
  return (
    <div style={{ display: 'flex', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: 3, gap: 2 }}>
      {opts.map((r) => {
        const on = r === value;
        return (
          <button key={r} onClick={() => onChange(r)} style={{
            flex: 1, padding: '6px 12px', border: 'none', borderRadius: 6,
            background: on ? 'var(--surface)' : 'transparent',
            color: on ? 'var(--text-1)' : 'var(--text-2)',
            boxShadow: on ? 'var(--shadow-sm)' : 'none',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
          }}>
            {ROLE_LABEL[r]}
          </button>
        );
      })}
    </div>
  );
}

function InviteModal({ dark, onInvite, onClose }: {
  dark: boolean;
  onInvite: (email: string, role: Exclude<OrgRole, 'owner'>) => MockInvitation;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Exclude<OrgRole, 'owner'>>('manager');
  const [generated, setGenerated] = useState<MockInvitation | null>(null);
  const [copied, setCopied] = useState(false);

  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';

  const inviteLink = generated ? `https://shiftboard.app/join?token=${generated.token}` : '';

  const handleGenerate = () => {
    if (!email.trim().includes('@')) return;
    const inv = onInvite(email.trim().toLowerCase(), role);
    setGenerated(inv);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '9px', fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13.5,
      background: dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)',
    },
  };

  return (
    <Dialog open onClose={onClose} PaperProps={{
      sx: { borderRadius: '16px', width: '100%', maxWidth: 440, background: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)', border: `1px solid ${border}` }
    }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 0, fontFamily: '"IBM Plex Sans"', fontSize: 16, fontWeight: 600 }}>
        Invitar al equipo
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-2)', display: 'grid', placeItems: 'center', padding: 4 }}>
          <Icon name="x" size={16} />
        </button>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        {!generated ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Correo electrónico</span>
              <TextField
                autoFocus type="email" value={email} placeholder="manager@negocio.com"
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                sx={inputSx} size="small" fullWidth
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Rol</span>
              <RoleSeg value={role} onChange={setRole} />
              <div style={{ fontSize: 11.5, color: text3, lineHeight: 1.4 }}>
                {role === 'admin'
                  ? 'Puede invitar mánagers, editar configuración y ver todo.'
                  : 'Puede crear y editar turnos y trabajadores. No puede invitar.'}
              </div>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, background: `color-mix(in oklch, oklch(0.65 0.15 145) 8%, transparent)`, border: `1px solid color-mix(in oklch, oklch(0.65 0.15 145) 25%, transparent)` }}>
              <Icon name="check" size={18} style={{ color: 'oklch(0.55 0.15 145)', flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>Invitación generada</div>
                <div style={{ fontSize: 12, color: text3 }}>Envía este enlace a <strong>{generated.email}</strong></div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Enlace de invitación</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9, background: surface2,
                  border: `1px solid ${border}`, fontSize: 12, color: text3,
                  fontFamily: '"IBM Plex Mono", monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {inviteLink}
                </div>
                <button onClick={handleCopy} style={{
                  padding: '8px 12px', borderRadius: 9, border: `1px solid ${border}`,
                  background: copied ? `color-mix(in oklch, oklch(0.65 0.15 145) 12%, transparent)` : 'transparent',
                  color: copied ? 'oklch(0.55 0.15 145)' : 'var(--text-2)',
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                  fontSize: 12.5, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                  transition: 'background .15s, color .15s',
                }}>
                  <Icon name={copied ? 'check' : 'copy'} size={13} /> {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: text3, lineHeight: 1.5 }}>
              El enlace expira en 7 días. El invitado creará su cuenta al abrirlo.
            </p>
          </div>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
        <button onClick={onClose} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: 'var(--text-2)', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
          {generated ? 'Cerrar' : 'Cancelar'}
        </button>
        {!generated && (
          <button onClick={handleGenerate} disabled={!email.trim().includes('@')} style={{
            padding: '8px 14px', borderRadius: 9, border: 'none', background: '#4664c9', color: 'white',
            fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: email.trim().includes('@') ? 'pointer' : 'not-allowed',
            opacity: email.trim().includes('@') ? 1 : 0.5,
          }}>
            Generar invitación
          </button>
        )}
      </DialogActions>
    </Dialog>
  );
}

export function EquipoView({ currentUser, org, members, invitations, onInvite, onRemoveMember, onCancelInvite, dark }: Props) {
  const [inviteModal, setInviteModal] = useState(false);
  const [confirm, setConfirm] = useState<MockMember | null>(null);

  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const accent = '#4664c9';

  const canInvite = members.find((m) => m.id === currentUser.id)?.role !== 'manager';

  return (
    <div className="view-pad">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Equipo</h1>
          <p style={{ margin: '5px 0 0', color: text3, fontSize: 13 }}>
            {org.name} · {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
          </p>
        </div>
        {canInvite && (
          <button onClick={() => setInviteModal(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px',
            borderRadius: 9, border: 'none', background: accent, color: 'white',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}>
            <Icon name="plus" size={15} stroke={2.2} /> Invitar mánager
          </button>
        )}
      </div>

      {/* Members */}
      <div style={{ background: 'var(--surface)', border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
          <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Miembros activos</h3>
        </div>
        {members.map((m, i) => {
          const hue = ROLE_HUE[m.role];
          const isMe = m.id === currentUser.id;
          const canRemove = !isMe && m.role !== 'owner' && canInvite;
          return (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
              borderBottom: i < members.length - 1 ? `1px solid ${border}` : 'none',
            }}>
              <span style={{
                width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center',
                fontSize: 13, fontWeight: 600, background: avatarBg(m.name, dark),
                color: dark ? 'oklch(0.85 0.01 260)' : 'oklch(0.25 0.01 260)', flexShrink: 0,
              }}>{initials(m.name)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{m.name}</span>
                  {isMe && <span style={{ fontSize: 11, color: text3 }}>(tú)</span>}
                </div>
                <div style={{ fontSize: 12, color: text3, marginTop: 2 }}>{m.email}</div>
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
                background: `oklch(0.93 0.04 ${hue})`, color: `oklch(0.38 0.1 ${hue})`,
              }}>
                {ROLE_LABEL[m.role]}
              </span>
              {canRemove && (
                <button onClick={() => setConfirm(m)} style={{
                  width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent',
                  color: 'var(--text-2)', cursor: 'pointer', display: 'grid', placeItems: 'center',
                }}
                  onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `color-mix(in oklch, oklch(0.6 0.14 28) 12%, transparent)`; el.style.color = 'oklch(0.55 0.14 28)'; }}
                  onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--text-2)'; }}
                >
                  <Icon name="trash" size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <div style={{ background: 'var(--surface)', border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
            <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Invitaciones pendientes</h3>
          </div>
          {invitations.map((inv, i) => (
            <div key={inv.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px',
              borderBottom: i < invitations.length - 1 ? `1px solid ${border}` : 'none',
            }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--surface-2)', border: `1px solid ${border}`, color: text3, flexShrink: 0 }}>
                <Icon name="mail" size={16} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                <div style={{ fontSize: 11.5, color: text3, marginTop: 2 }}>Pendiente · {ROLE_LABEL[inv.role]}</div>
              </div>
              <button onClick={() => onCancelInvite(inv.id)} style={{
                padding: '5px 10px', borderRadius: 8, border: `1px solid ${border}`,
                background: 'transparent', color: 'var(--text-2)',
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 12, cursor: 'pointer',
              }}>
                Cancelar
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Invite modal */}
      {inviteModal && (
        <InviteModal dark={dark} onInvite={onInvite} onClose={() => setInviteModal(false)} />
      )}

      {/* Confirm remove */}
      {confirm && (
        <Dialog open onClose={() => setConfirm(null)} PaperProps={{
          sx: { borderRadius: '16px', maxWidth: 380, background: dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)', border: `1px solid ${border}` }
        }}>
          <DialogTitle sx={{ fontFamily: '"IBM Plex Sans"', fontSize: 16, fontWeight: 600 }}>Eliminar miembro</DialogTitle>
          <DialogContent>
            <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              ¿Estás seguro de que quieres eliminar a <strong style={{ color: 'var(--text-1)' }}>{confirm.name}</strong> del equipo?
            </p>
          </DialogContent>
          <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
            <button onClick={() => setConfirm(null)} style={{ padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background: 'transparent', color: 'var(--text-2)', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
            <button onClick={() => { onRemoveMember(confirm.id); setConfirm(null); }} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'oklch(0.58 0.12 28)', color: 'white', fontFamily: '"IBM Plex Sans"', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Eliminar</button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

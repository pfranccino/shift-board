import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { initials, avatarBg } from '../data';
import { Icon } from '../components/Icon';
import type { MockUser, MockOrg, MockMember } from '../types';

interface Props {
  currentUser: MockUser;
  org: MockOrg;
  members: MockMember[];
  onRemoveMember: (memberId: string) => Promise<void> | void;
  isSuperAdmin: boolean;
  dark: boolean;
}

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Empleado',
};

type OrgRole = 'owner' | 'admin' | 'manager' | 'employee';
const ROLE_HUE: Record<OrgRole, number> = { owner: 250, admin: 35, manager: 145, employee: 145 };

export function EquipoView({ currentUser, org, members, onRemoveMember, isSuperAdmin, dark }: Props) {
  void isSuperAdmin;
  const [confirm, setConfirm] = useState<MockMember | null>(null);

  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const accent = '#4664c9';

  return (
    <div className="view-pad">
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Equipo</h1>
        <p style={{ margin: '5px 0 0', color: text3, fontSize: 13 }}>
          {org.name} · {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
        </p>
      </div>

      {/* Members */}
      <div style={{ background: 'var(--surface)', border: `1px solid ${border}`, borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
          <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600 }}>Miembros activos</h3>
        </div>
        {members.map((m, i) => {
          const hue = ROLE_HUE[m.role];
          const isMe = m.id === currentUser.id;
          const canRemove = !isMe && m.role !== 'owner';
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

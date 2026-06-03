import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { fbDb } from '../lib/firebase';
import { Icon } from '../components/Icon';
import type { MockUser, OrgRole } from '../types';

interface InvitationData {
  email: string;
  role: OrgRole;
  orgId: string;
  orgName: string;
}

interface Props {
  token: string;
  user: MockUser;
  dark: boolean;
  onJoin: (token: string) => Promise<void>;
  onLogout: () => void;
}

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  manager: 'Gerente',
  employee: 'Empleado',
};

export function JoinView({ token, user, dark, onJoin, onLogout }: Props) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loadingInv, setLoadingInv] = useState(true);
  const [invError, setInvError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const accent = '#4664c9';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const surface = dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)';

  useEffect(() => {
    if (!fbDb) { setInvError('El sistema de invitaciones requiere Firebase.'); setLoadingInv(false); return; }
    getDoc(doc(fbDb, `invitations/${token}`))
      .then((snap) => {
        if (!snap.exists()) {
          setInvError('Esta invitación no es válida o ya fue utilizada.');
        } else {
          setInvitation(snap.data() as InvitationData);
        }
      })
      .catch(() => setInvError('No se pudo cargar la invitación. Verifica tu conexión.'))
      .finally(() => setLoadingInv(false));
  }, [token]);

  const emailMatch = !!invitation && invitation.email.toLowerCase() === user.email.toLowerCase();

  const handleAccept = async () => {
    if (!invitation || joining) return;
    if (!emailMatch) {
      setJoinError(`Esta invitación es para ${invitation.email}, pero tu sesión es ${user.email}. Cierra sesión e ingresa con la cuenta correcta.`);
      return;
    }
    setJoining(true);
    setJoinError(null);
    try {
      await onJoin(token);
    } catch (e: any) {
      setJoinError(e.message ?? 'Error al aceptar la invitación.');
      setJoining(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: surface, border: `1px solid ${border}`,
        borderRadius: 20, padding: 36, boxShadow: 'var(--shadow-lg)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center',
            background: accent, color: 'white', flexShrink: 0,
          }}>
            <Icon name="calendar" size={20} stroke={1.9} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>ShiftBoard</span>
        </div>

        {loadingInv && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: accent,
              animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        )}

        {!loadingInv && invError && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'color-mix(in oklch, oklch(0.6 0.14 28) 10%, transparent)',
              display: 'grid', placeItems: 'center', margin: '0 auto 16px',
              color: 'oklch(0.55 0.14 28)',
            }}>
              <Icon name="warn" size={22} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Invitación no válida</h2>
            <p style={{ fontSize: 13.5, color: text3, margin: '0 0 24px', lineHeight: 1.5 }}>{invError}</p>
            <button onClick={onLogout} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: `1px solid ${border}`, cursor: 'pointer',
              color: text3, fontSize: 13, padding: '8px 16px', borderRadius: 9,
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            }}>
              <Icon name="logout" size={14} /> Cerrar sesión
            </button>
          </div>
        )}

        {!loadingInv && invitation && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 6px' }}>
                Tienes una invitación
              </h1>
              <p style={{ fontSize: 13, color: text3, margin: 0, lineHeight: 1.5 }}>
                Fuiste invitado a unirte a{' '}
                <strong style={{ color: 'var(--text-1)' }}>{invitation.orgName}</strong>{' '}
                como <strong style={{ color: 'var(--text-1)' }}>{ROLE_LABEL[invitation.role]}</strong>.
              </p>
            </div>

            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'var(--surface-2)', border: `1px solid ${border}`,
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 11.5, color: text3, marginBottom: 3 }}>Cuenta a usar</div>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>{user.email}</div>
              {!emailMatch && (
                <div style={{ fontSize: 12, color: 'oklch(0.55 0.14 28)', marginTop: 6, lineHeight: 1.4 }}>
                  La invitación es para <strong>{invitation.email}</strong>. Cierra sesión e ingresa con esa cuenta.
                </div>
              )}
            </div>

            {joinError && (
              <div style={{ fontSize: 12, color: '#e53935', marginBottom: 12, lineHeight: 1.4 }}>{joinError}</div>
            )}

            <button
              onClick={handleAccept}
              disabled={!emailMatch || joining}
              style={{
                width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
                background: accent, color: 'white',
                fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                fontWeight: 600, fontSize: 14,
                cursor: emailMatch && !joining ? 'pointer' : 'not-allowed',
                opacity: emailMatch && !joining ? 1 : 0.5,
              }}
            >
              {joining ? 'Uniéndose…' : 'Aceptar invitación'}
            </button>

            <button onClick={onLogout} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: text3, fontSize: 12.5, marginTop: 16, padding: 0,
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            }}>
              <Icon name="logout" size={13} /> Usar otra cuenta
            </button>
          </>
        )}
      </div>
    </div>
  );
}

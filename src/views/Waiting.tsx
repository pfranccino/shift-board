import { Icon } from '../components/Icon';
import type { MockUser } from '../types';

interface Props {
  user: MockUser;
  dark: boolean;
  onLogout: () => void;
}

export function WaitingView({ user, dark, onLogout }: Props) {
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const accent = '#4664c9';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const surface = dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: surface, border: `1px solid ${border}`,
        borderRadius: 20, padding: 36, boxShadow: 'var(--shadow-lg)',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, justifyContent: 'center' }}>
          <span style={{
            width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center',
            background: accent, color: 'white', flexShrink: 0,
          }}>
            <Icon name="calendar" size={20} stroke={1.9} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>ShiftBoard</span>
        </div>

        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: 'var(--surface-2)', border: `1px solid ${border}`,
          display: 'grid', placeItems: 'center',
          margin: '0 auto 20px', color: text3,
        }}>
          <Icon name="building" size={26} stroke={1.4} />
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 8px' }}>
          Sin organización asignada
        </h1>
        <p style={{ fontSize: 13.5, color: text3, margin: '0 0 8px', lineHeight: 1.6 }}>
          Tu cuenta <strong style={{ color: 'var(--text-1)' }}>{user.email}</strong> no está asociada a ninguna organización.
        </p>
        <p style={{ fontSize: 12.5, color: text3, margin: '0 0 28px', lineHeight: 1.6 }}>
          Si querés crear tu propia organización, cerrá sesión y usá <strong style={{ color: 'var(--text-1)' }}>Crear cuenta</strong>.
        </p>

        <button onClick={onLogout} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: `1px solid ${border}`, cursor: 'pointer',
          color: text3, fontSize: 13, padding: '8px 16px', borderRadius: 9,
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        }}>
          <Icon name="logout" size={14} /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}

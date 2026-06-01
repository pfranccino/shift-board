import { useState } from 'react';
import { TextField } from '@mui/material';
import { Icon } from '../components/Icon';
import type { MockUser } from '../types';

interface Props {
  user: MockUser;
  dark: boolean;
  onCreateOrg: (orgName: string) => void;
  onLogout: () => void;
}

export function OnboardingView({ user, dark, onCreateOrg, onLogout }: Props) {
  const [orgName, setOrgName] = useState('');

  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const accent = '#4664c9';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';
  const surface = dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)';

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '9px',
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      fontSize: 13.5,
      background: dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)',
    },
  };

  const submit = () => { if (orgName.trim()) onCreateOrg(orgName.trim()); };

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
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <span style={{
            width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center',
            background: accent, color: 'white', flexShrink: 0,
          }}>
            <Icon name="calendar" size={20} stroke={1.9} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>ShiftBoard</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 6px' }}>
            Creá tu organización
          </h1>
          <p style={{ fontSize: 13, color: text3, margin: 0, lineHeight: 1.5 }}>
            Hola <strong style={{ color: 'var(--text-1)' }}>{user.name.split(' ')[0]}</strong>. Ingresá el nombre de tu negocio para empezar.
            Después podés invitar a otros mánagers.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Nombre del negocio</span>
            <TextField
              autoFocus value={orgName} placeholder="Ej. Restaurante El Manche"
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              sx={inputSx} size="small" fullWidth
            />
          </div>

          <button onClick={submit} disabled={!orgName.trim()} style={{
            width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
            background: accent, color: 'white',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontWeight: 600, fontSize: 14, cursor: orgName.trim() ? 'pointer' : 'not-allowed',
            opacity: orgName.trim() ? 1 : 0.5,
          }}>
            Crear organización
          </button>
        </div>

        <button onClick={onLogout} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: text3, fontSize: 12.5, marginTop: 20, padding: 0,
          fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
        }}>
          <Icon name="logout" size={13} /> Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}

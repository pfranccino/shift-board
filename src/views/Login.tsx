import { useState } from 'react';
import { TextField } from '@mui/material';
import { Icon } from '../components/Icon';
import { isFirebaseConfigured, fbAuth } from '../lib/firebase';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';
import type { MockUser } from '../types';

interface Props {
  dark: boolean;
  onLogin: (user: MockUser) => void;
}

export function LoginView({ dark, onLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const canSubmit = isFirebaseConfigured
    ? name.trim().length > 0 && email.trim().includes('@') && password.length >= 6
    : name.trim().length > 0 && email.trim().includes('@');

  const submit = async () => {
    if (!canSubmit || loading) return;
    setError('');

    if (!isFirebaseConfigured || !fbAuth) {
      onLogin({ id: `user_${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase() });
      return;
    }

    setLoading(true);
    try {
      try {
        await signInWithEmailAndPassword(fbAuth, email.trim(), password);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential' || e.code === 'auth/invalid-email') {
          const cred = await createUserWithEmailAndPassword(fbAuth, email.trim(), password);
          await updateProfile(cred.user, { displayName: name.trim() });
        } else {
          throw e;
        }
      }
      // App.tsx se entera vía onAuthStateChanged
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-credential': 'Credenciales inválidas.',
        'auth/email-already-in-use': 'Este correo ya está registrado.',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
        'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
      };
      setError(msgs[e.code] ?? e.message ?? 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (loading) return;
    setError('');

    if (!isFirebaseConfigured || !fbAuth) {
      onLogin({
        id: `user_${Date.now()}`,
        name: 'Usuario Google',
        email: `usuario${Date.now() % 1000}@gmail.com`,
      });
      return;
    }

    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(fbAuth, provider);
      // App.tsx se entera vía onAuthStateChanged
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
        setError(e.message ?? 'Error con Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
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

        <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 6px' }}>Iniciar sesión</h1>
        <p style={{ fontSize: 13, color: text3, margin: '0 0 24px', lineHeight: 1.5 }}>
          {isFirebaseConfigured
            ? 'Ingresa tu nombre, correo y contraseña. Si no tienes cuenta, la creamos automáticamente.'
            : 'Accede a tu cuenta para gestionar los turnos de tu negocio.'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Nombre completo</span>
            <TextField
              autoFocus value={name} placeholder="Ej. Ana Pérez"
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              sx={inputSx} size="small" fullWidth disabled={loading}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Correo electrónico</span>
            <TextField
              type="email" value={email} placeholder="ana@negocio.com"
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              sx={inputSx} size="small" fullWidth disabled={loading}
            />
          </div>

          {isFirebaseConfigured && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Contraseña</span>
              <TextField
                type="password" value={password} placeholder="Mínimo 6 caracteres"
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                sx={inputSx} size="small" fullWidth disabled={loading}
              />
            </div>
          )}

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 9, fontSize: 12.5, lineHeight: 1.4,
              background: 'color-mix(in oklch, oklch(0.55 0.18 27) 10%, transparent)',
              border: '1px solid color-mix(in oklch, oklch(0.55 0.18 27) 25%, transparent)',
              color: dark ? 'oklch(0.85 0.1 27)' : 'oklch(0.45 0.18 27)',
            }}>
              {error}
            </div>
          )}

          <button onClick={submit} disabled={!canSubmit || loading} style={{
            width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
            background: accent, color: 'white',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontWeight: 600, fontSize: 14, cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
            opacity: canSubmit && !loading ? 1 : 0.5, marginTop: 4,
          }}>
            {loading ? 'Verificando…' : 'Continuar'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: border }} />
            <span style={{ fontSize: 12, color: text3 }}>o</span>
            <div style={{ flex: 1, height: 1, background: border }} />
          </div>

          <button onClick={loginWithGoogle} disabled={loading} style={{
            width: '100%', padding: '9px 0', borderRadius: 10,
            border: `1px solid ${border}`, background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontWeight: 500, fontSize: 13.5, color: 'var(--text-1)', cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1, transition: 'background .12s',
          }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </button>
        </div>

        <p style={{ fontSize: 11.5, color: text3, textAlign: 'center', marginTop: 24, lineHeight: 1.5 }}>
          Al continuar aceptás los términos de uso de ShiftBoard.
        </p>
      </div>
    </div>
  );
}

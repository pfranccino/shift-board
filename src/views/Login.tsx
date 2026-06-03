import { useState } from 'react';
import { Icon } from '../components/Icon';
import { isFirebaseConfigured, fbAuth } from '../lib/firebase';
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';
import { hueColors } from '../data';
import { PLATFORM_ROLES } from '../data/platform';
import type { MockUser } from '../types';

interface Props {
  dark: boolean;
  onLogin: (user: MockUser) => void;
  goSignup: () => void;
  goPricing: () => void;
}

export function LoginView({ dark, onLogin, goSignup, goPricing }: Props) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accent = '#4664c9';
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const surface = dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';
  const borderStrong = dark ? 'oklch(0.40 0.012 260)' : 'oklch(0.86 0.006 250)';
  const text2 = dark ? 'oklch(0.74 0.008 260)' : 'oklch(0.46 0.01 260)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@') || !pass) return;
    setError('');

    if (!isFirebaseConfigured || !fbAuth) {
      onLogin({ id: `user_${Date.now()}`, name: email.split('@')[0], email });
      return;
    }

    setLoading(true);
    try {
      try {
        await signInWithEmailAndPassword(fbAuth, email.trim(), pass);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
          const cred = await createUserWithEmailAndPassword(fbAuth, email.trim(), pass);
          await updateProfile(cred.user, { displayName: email.split('@')[0] });
        } else throw e;
      }
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/invalid-credential': 'Credenciales inválidas.',
        'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos.',
      };
      setError(msgs[e.code] ?? 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !fbAuth) {
      onLogin({ id: `user_${Date.now()}`, name: 'Usuario', email: `usuario${Date.now() % 1000}@gmail.com` });
      return;
    }
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(fbAuth, provider);
    } catch (e: any) {
      if (e.code !== 'auth/popup-closed-by-user') setError(e.message ?? 'Error con Google.');
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '9px 12px 9px 38px',
    border: `1px solid ${borderStrong}`, borderRadius: 9,
    background: surface2, fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    fontSize: 13.5, color: 'var(--text-1)', outline: 'none',
  };

  return (
    <div className="auth-layout">
      {/* ── Brand panel ── */}
      <div className="auth-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'oklch(1 0 0 / 0.18)' }}>
            <Icon name="calendar" size={22} stroke={1.9} />
          </span>
          <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em' }}>Turnos</span>
        </div>

        <div style={{ margin: 'auto 0', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
            Tu equipo, en orden.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'oklch(1 0 0 / 0.85)', margin: '16px 0 0' }}>
            Asigna turnos, controla cobertura y horas, y permite que cada rol vea exactamente lo que necesita.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 26 }}>
            {Object.values(PLATFORM_ROLES).map((r) => {
              const co = hueColors(r.hue, false);
              return (
                <span key={r.key} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '6px 12px', borderRadius: 99,
                  background: 'oklch(1 0 0 / 0.14)', fontSize: 12.5, fontWeight: 500,
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: co.dot }} />
                  {r.name}
                </span>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'oklch(1 0 0 / 0.7)', position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>© 2026 Turnos</span>
          <span style={{ width: 3, height: 3, borderRadius: 99, background: 'currentColor', opacity: 0.5 }} />
          <span>Gestión de turnos para equipos</span>
        </div>
      </div>

      {/* ── Form ── */}
      <div style={{ display: 'grid', placeItems: 'center', padding: '40px 32px', overflowY: 'auto', background: 'var(--bg)' }}>
        <form onSubmit={submit} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 15 }}>
          <div>
            <h1 style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Iniciar sesión</h1>
            <p style={{ fontSize: 13.5, color: text3, margin: '6px 0 0' }}>Ingresa a tu espacio de trabajo.</p>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: text2 }}>Email</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', color: text3 }}>
              <Icon name="mail" size={16} style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
              <input
                type="email" value={email} placeholder="tu@empresa.com"
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username" disabled={loading}
                style={inputBase}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: text2 }}>Contraseña</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', color: text3 }}>
              <Icon name="lock" size={16} style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'} value={pass} placeholder="••••••••"
                onChange={(e) => setPass(e.target.value)}
                autoComplete="current-password" disabled={loading}
                style={{ ...inputBase, paddingRight: 40 }}
              />
              <button
                type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 8, background: 'none', border: 'none', color: text3, cursor: 'pointer', padding: 6, display: 'grid', placeItems: 'center' }}
              >
                <Icon name="eye" size={16} />
              </button>
            </div>
          </div>

          {/* Remember / forgot */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: text2, cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: 16, height: 16, accentColor: accent }} />
              <span>Recordarme</span>
            </label>
            <a href="#" style={{ color: accent, fontSize: 12.5, fontWeight: 500, textDecoration: 'none' }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          {error && (
            <div style={{
              padding: '10px 12px', borderRadius: 9, fontSize: 12.5,
              background: 'color-mix(in oklch, oklch(0.55 0.18 27) 10%, transparent)',
              border: '1px solid color-mix(in oklch, oklch(0.55 0.18 27) 25%, transparent)',
              color: dark ? 'oklch(0.85 0.1 27)' : 'oklch(0.45 0.18 27)',
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '10px 0', borderRadius: 9, border: 'none',
            background: accent, color: 'white', fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
            fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            {loading ? 'Verificando…' : <><span>Entrar</span><Icon name="arrow" size={15} stroke={1.9} /></>}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: text3, justifyContent: 'center' }}>
            <Icon name="shield" size={14} />
            <span>Protegido con verificación en dos pasos</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: text3, fontSize: 11.5 }}>
            <div style={{ flex: 1, height: 1, background: border }} />
            <span>o</span>
            <div style={{ flex: 1, height: 1, background: border }} />
          </div>

          <button
            type="button" onClick={loginWithGoogle} disabled={loading}
            style={{
              width: '100%', padding: '9px 0', borderRadius: 9,
              border: `1px solid ${border}`, background: surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13.5,
              color: 'var(--text-1)', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLElement).style.background = 'var(--hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = surface; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>

          <p style={{ fontSize: 12.5, color: text3, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', margin: 0 }}>
            <span>¿No tienes cuenta?</span>
            <a href="#" onClick={(e) => { e.preventDefault(); goSignup(); }} style={{ color: accent, fontWeight: 500, textDecoration: 'none' }}>Crear una cuenta</a>
            <span style={{ width: 3, height: 3, borderRadius: 99, background: text3, display: 'inline-block' }} />
            <a href="#" onClick={(e) => { e.preventDefault(); goPricing(); }} style={{ color: accent, fontWeight: 500, textDecoration: 'none' }}>Ver planes</a>
          </p>
        </form>
      </div>
    </div>
  );
}

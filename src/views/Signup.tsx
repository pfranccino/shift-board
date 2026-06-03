import { useState } from 'react';
import { Icon } from '../components/Icon';
import { isFirebaseConfigured, fbAuth } from '../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { PLATFORM_PLANS } from '../data/platform';
import type { MockUser } from '../types';

interface Props {
  dark: boolean;
  initialPlan: string;
  onSignup: (user: MockUser, orgName: string) => void;
  goLogin: () => void;
  goPricing: () => void;
}

export function SignupView({ dark, initialPlan, onSignup, goLogin, goPricing }: Props) {
  const [step, setStep] = useState(1);
  const [org, setOrg] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [plan, setPlan] = useState(initialPlan || 'pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const accent = '#4664c9';
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const borderStrong = dark ? 'oklch(0.40 0.012 260)' : 'oklch(0.86 0.006 250)';
  const surface2 = dark ? 'oklch(0.255 0.009 260)' : 'oklch(0.985 0.003 250)';
  const text2 = dark ? 'oklch(0.74 0.008 260)' : 'oklch(0.46 0.01 260)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '9px 12px 9px 38px',
    border: `1px solid ${borderStrong}`, borderRadius: 9,
    background: surface2, fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
    fontSize: 13.5, color: 'var(--text-1)', outline: 'none',
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org.trim() || !name.trim() || !email.includes('@') || pass.length < 8) return;
    setStep(2);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isFirebaseConfigured && fbAuth) {
        const cred = await createUserWithEmailAndPassword(fbAuth, email.trim(), pass);
        await updateProfile(cred.user, { displayName: name.trim() });
        onSignup({ id: cred.user.uid, name: name.trim(), email: email.trim() }, org.trim());
      } else {
        onSignup({ id: `user_${Date.now()}`, name: name.trim(), email: email.trim() }, org.trim());
      }
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'Este correo ya está registrado.',
        'auth/weak-password': 'La contraseña debe tener al menos 8 caracteres.',
      };
      setError(msgs[e.code] ?? e.message ?? 'Error al crear la cuenta.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const steps = ['Datos de la cuenta', 'Elegí un plan', 'Listo para usar'];

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
            Crea tu espacio en minutos.
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: 'oklch(1 0 0 / 0.85)', margin: '16px 0 0' }}>
            Configura tu organización, elige un plan y empieza a armar turnos hoy mismo. 14 días de prueba, sin tarjeta.
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
            {steps.map((s, i) => {
              const on = step >= i + 1;
              return (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: on ? 'white' : 'oklch(1 0 0 / 0.6)', fontWeight: 500 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 99, display: 'grid', placeItems: 'center',
                    fontSize: 12, fontWeight: 600, flexShrink: 0,
                    border: on ? 'none' : '1.5px solid oklch(1 0 0 / 0.4)',
                    background: on ? 'white' : 'transparent',
                    color: on ? accent : 'inherit',
                  }}>{i + 1}</span>
                  {s}
                </li>
              );
            })}
          </ol>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: 'oklch(1 0 0 / 0.7)', position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: '"IBM Plex Mono", monospace' }}>© 2026 Turnos</span>
          <span style={{ width: 3, height: 3, borderRadius: 99, background: 'currentColor', opacity: 0.5 }} />
          <span>Gestión de turnos para equipos</span>
        </div>
      </div>

      {/* ── Form ── */}
      <div style={{ display: 'grid', placeItems: 'center', padding: '40px 32px', overflowY: 'auto', background: 'var(--bg)' }}>
        {step === 1 ? (
          <form onSubmit={handleStep1} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 15 }}>
            <div>
              <h1 style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Crear cuenta</h1>
              <p style={{ fontSize: 13.5, color: text3, margin: '6px 0 0' }}>Vas a ser el administrador de tu organización.</p>
            </div>

            {[
              { label: 'Nombre de la organización', icon: 'building', value: org, set: setOrg, ph: 'Mi empresa S.A.', type: 'text' },
              { label: 'Tu nombre', icon: 'users', value: name, set: setName, ph: 'Nombre y apellido', type: 'text' },
              { label: 'Email de trabajo', icon: 'mail', value: email, set: setEmail, ph: 'tu@empresa.com', type: 'email' },
              { label: 'Contraseña', icon: 'lock', value: pass, set: setPass, ph: 'Mínimo 8 caracteres', type: 'password' },
            ].map(({ label, icon, value, set, ph, type }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: text2 }}>{label}</span>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', color: text3 }}>
                  <Icon name={icon} size={16} style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
                  <input
                    type={type} value={value} placeholder={ph}
                    onChange={(e) => set(e.target.value)}
                    style={inputBase}
                  />
                </div>
              </div>
            ))}

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: 9, fontSize: 12.5,
                background: 'color-mix(in oklch, oklch(0.55 0.18 27) 10%, transparent)',
                border: '1px solid color-mix(in oklch, oklch(0.55 0.18 27) 25%, transparent)',
                color: dark ? 'oklch(0.85 0.1 27)' : 'oklch(0.45 0.18 27)',
              }}>{error}</div>
            )}

            <button type="submit" style={{
              width: '100%', padding: '10px 0', borderRadius: 9, border: 'none',
              background: accent, color: 'white', fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
              fontWeight: 600, fontSize: 14, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <span>Continuar</span><Icon name="arrow" size={15} stroke={1.9} />
            </button>

            <p style={{ fontSize: 12.5, color: text3, textAlign: 'center', margin: 0 }}>
              ¿Ya tenés cuenta?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); goLogin(); }} style={{ color: accent, fontWeight: 500, textDecoration: 'none' }}>Iniciar sesión</a>
            </p>
          </form>
        ) : (
          <form onSubmit={handleCreate} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 15 }}>
            <button type="button" onClick={() => setStep(1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: text3, fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 12.5, cursor: 'pointer', padding: 0, alignSelf: 'flex-start' }}>
              <Icon name="chevL" size={15} /> Volver
            </button>

            <div>
              <h1 style={{ fontSize: 25, fontWeight: 700, letterSpacing: '-0.025em', margin: 0 }}>Elegí un plan</h1>
              <p style={{ fontSize: 13.5, color: text3, margin: '6px 0 0' }}>Podés cambiarlo cuando quieras. La prueba dura 14 días.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PLATFORM_PLANS.map((p) => {
                const on = plan === p.id;
                return (
                  <button
                    key={p.id} type="button" onClick={() => setPlan(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                      border: `1px solid ${on ? accent : border}`, borderRadius: 11,
                      background: on ? `color-mix(in oklch, ${accent} 6%, var(--bg))` : 'var(--bg)',
                      cursor: 'pointer', textAlign: 'left', fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: 99, border: `2px solid ${on ? accent : borderStrong}`,
                      flexShrink: 0, position: 'relative', display: 'grid', placeItems: 'center',
                    }}>
                      {on && <span style={{ width: 8, height: 8, borderRadius: 99, background: accent, display: 'block' }} />}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.name}
                        {p.popular && (
                          <span style={{
                            padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: `color-mix(in oklch, #4664c9 15%, var(--bg))`,
                            color: accent, border: `1px solid color-mix(in oklch, #4664c9 30%, transparent)`,
                          }}>Popular</span>
                        )}
                      </span>
                      <span style={{ fontSize: 11.5, color: text3, display: 'block', marginTop: 2 }}>{p.tagline}</span>
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', fontFamily: '"IBM Plex Mono", monospace', whiteSpace: 'nowrap' }}>
                      {p.price == null ? 'A medida' : `$${p.price}`}
                      {p.price != null && <small style={{ fontSize: 11, color: text3, fontWeight: 500 }}>/{p.period}</small>}
                    </span>
                  </button>
                );
              })}
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
              {loading ? 'Creando…' : <><Icon name="check" size={15} stroke={2} /><span>Crear mi espacio</span></>}
            </button>

            <p style={{ fontSize: 12.5, color: text3, textAlign: 'center', margin: 0 }}>
              <a href="#" onClick={(e) => { e.preventDefault(); goPricing(); }} style={{ color: accent, fontWeight: 500, textDecoration: 'none' }}>Comparar planes en detalle</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

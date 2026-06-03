import { useState } from 'react';
import { Icon } from '../components/Icon';
import { hueColors, kindColors } from '../data';
import { PLATFORM_PLANS } from '../data/platform';

interface Props {
  dark: boolean;
  goLogin: () => void;
  goSignup: (plan: string) => void;
}

export function PricingView({ dark, goLogin, goSignup }: Props) {
  const [billing, setBilling] = useState<'mes' | 'anio'>('mes');
  const accent = '#4664c9';
  const border = dark ? 'oklch(0.32 0.01 260)' : 'oklch(0.91 0.005 250)';
  const surface = dark ? 'oklch(0.225 0.009 260)' : 'oklch(1 0 0)';
  const text2 = dark ? 'oklch(0.74 0.008 260)' : 'oklch(0.46 0.01 260)';
  const text3 = dark ? 'oklch(0.58 0.008 260)' : 'oklch(0.62 0.008 260)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 40px', borderBottom: `1px solid ${border}`,
        position: 'sticky', top: 0, zIndex: 20,
        background: `color-mix(in oklch, var(--bg) 85%, transparent)`,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', background: accent, color: 'white' }}>
            <Icon name="calendar" size={18} stroke={1.9} />
          </span>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>Turnos</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="#" onClick={(e) => { e.preventDefault(); goLogin(); }} style={{ color: accent, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
            Iniciar sesión
          </a>
          <button onClick={() => goSignup('pro')} style={{
            padding: '7px 14px', borderRadius: 9, border: 'none', background: accent, color: 'white',
            fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}>
            Crear cuenta
          </button>
        </div>
      </header>

      {/* Hero */}
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto', padding: '56px 24px 36px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: accent }}>Planes</span>
        <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', margin: '12px 0 14px', lineHeight: 1.1 }}>
          Un precio por organización, sin sorpresas.
        </h1>
        <p style={{ fontSize: 15, color: text2, lineHeight: 1.6, margin: '0 auto', maxWidth: 520 }}>
          Elegí según el tamaño de tu operación. Todos los planes incluyen el cuadro de turnos, control de cobertura y actualizaciones.
        </p>
        {/* Billing toggle */}
        <div style={{ marginTop: 26, display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'inline-flex', background: 'var(--surface-2)', border: `1px solid ${border}`, borderRadius: 9, padding: 3, gap: 2 }}>
            {([['mes', 'Mensual'], ['anio', 'Anual −20%']] as const).map(([val, lab]) => {
              const on = billing === val;
              return (
                <button key={val} onClick={() => setBilling(val)} style={{
                  padding: '6px 16px', border: 'none', borderRadius: 6,
                  background: on ? surface : 'transparent',
                  color: on ? 'var(--text-1)' : text2,
                  boxShadow: on ? 'var(--shadow-sm)' : 'none',
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                }}>{lab}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="pricing-grid">
        {PLATFORM_PLANS.map((p) => {
          const price = p.price == null ? null : billing === 'anio' ? Math.round(p.price * 0.8) : p.price;
          const co = hueColors(p.popular ? 75 : 250, dark);
          const checkCo = kindColors('ok', dark);
          return (
            <div key={p.id} style={{
              background: surface, border: `1px solid ${p.popular ? accent : border}`,
              borderRadius: 16, padding: '26px 24px', boxShadow: p.popular ? `0 0 0 1px ${accent}, var(--shadow-lg)` : 'var(--shadow-sm)',
              display: 'flex', flexDirection: 'column', gap: 14, position: 'relative',
            }}>
              {p.popular && (
                <span style={{
                  position: 'absolute', top: -12, left: 24,
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                  borderRadius: 99, border: `1px solid ${co.border}`,
                  background: co.bg, color: co.fg, fontSize: 11, fontWeight: 600,
                }}>
                  <Icon name="star" size={12} stroke={2} /> Más elegido
                </span>
              )}
              <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{p.name}</h3>
              <p style={{ fontSize: 12.5, color: text3, lineHeight: 1.5, minHeight: 38, margin: '-6px 0 0' }}>{p.tagline}</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                {price == null ? (
                  <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-0.02em' }}>A medida</span>
                ) : (
                  <>
                    <span style={{ fontSize: 20, fontWeight: 600, color: text2 }}>$</span>
                    <span style={{ fontSize: 42, fontWeight: 600, letterSpacing: '-0.03em', fontFamily: '"IBM Plex Mono", monospace' }}>{price}</span>
                    <span style={{ fontSize: 13, color: text3, marginLeft: 3 }}>/{billing === 'anio' ? 'mes·anual' : 'mes'}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => goSignup(p.id)}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 9,
                  border: p.popular ? 'none' : `1px solid ${border}`,
                  background: p.popular ? accent : 'transparent',
                  color: p.popular ? 'white' : 'var(--text-1)',
                  fontFamily: '"IBM Plex Sans", system-ui, sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
                }}
              >
                {p.price == null ? 'Contactar ventas' : 'Empezar prueba'}
              </button>
              <ul style={{ listStyle: 'none', padding: '16px 0 0', margin: '4px 0 0', borderTop: `1px solid ${border}`, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {p.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: text2, lineHeight: 1.4 }}>
                    <Icon name="check" size={14} stroke={2.2} style={{ color: checkCo.dot, marginTop: 2, flexShrink: 0 }} /> {f}
                  </li>
                ))}
                {p.notIncluded.map((f, i) => (
                  <li key={`n${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: text3, lineHeight: 1.4, opacity: 0.7 }}>
                    <Icon name="x" size={14} stroke={2} style={{ marginTop: 2, flexShrink: 0 }} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: text3, margin: '40px auto 0', maxWidth: 520 }}>
        ¿Necesitás algo distinto?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); goSignup('enterprise'); }} style={{ color: accent, fontWeight: 500, textDecoration: 'none' }}>Hablemos</a>
        {' '}sobre un plan a medida para tu cadena.
      </p>
    </div>
  );
}

import { statusColors } from '../data';
import type { ComplianceStatus } from '../types';

interface HoursBarProps {
  hours: number;
  target: number;
  dark: boolean;
  height?: number;
}

export function HoursBar({ hours, target, dark, height = 8 }: HoursBarProps) {
  const status: ComplianceStatus = hours === target ? 'exact' : hours > target ? 'over' : 'under';
  const sc = statusColors(status, dark);
  const pct = Math.min(100, (hours / target) * 100);
  const overPct = hours > target ? Math.min(100, ((hours - target) / target) * 100) : 0;
  const trackBg = dark ? 'oklch(0.30 0 0)' : 'oklch(0.92 0.003 250)';

  return (
    <div style={{ position: 'relative', width: '100%', height, background: trackBg, borderRadius: 99, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0, width: `${pct}%`,
        background: sc.solid, borderRadius: 99,
        transition: 'width .35s cubic-bezier(.4,0,.2,1)',
      }} />
      {overPct > 0 && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: 0, width: '100%',
          background: `repeating-linear-gradient(45deg, transparent, transparent 4px, ${dark ? 'oklch(1 0 0 / 0.15)' : 'oklch(1 0 0 / 0.4)'} 4px, ${dark ? 'oklch(1 0 0 / 0.15)' : 'oklch(1 0 0 / 0.4)'} 8px)`,
        }} />
      )}
    </div>
  );
}

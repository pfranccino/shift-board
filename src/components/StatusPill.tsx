import { statusColors, STATUS_LABEL } from '../data';
import { Icon } from './Icon';
import type { ComplianceStatus } from '../types';

interface StatusPillProps {
  status: ComplianceStatus;
  dark: boolean;
  diff: number;
}

export function StatusPill({ status, dark, diff }: StatusPillProps) {
  const sc = statusColors(status, dark);
  const label = STATUS_LABEL[status];
  const sign = diff > 0 ? '+' : '';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: sc.bg, color: sc.fg,
      fontSize: 11.5, fontWeight: 600, lineHeight: 1,
    }}>
      {status === 'exact'
        ? <Icon name="check" size={12} stroke={2.2} />
        : status === 'over'
          ? <Icon name="up" size={11} stroke={2.2} />
          : <Icon name="down" size={11} stroke={2.2} />}
      {label}
      {diff !== 0 && (
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', opacity: 0.85 }}>
          {sign}{diff}h
        </span>
      )}
    </span>
  );
}

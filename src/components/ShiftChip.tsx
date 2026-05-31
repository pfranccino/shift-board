import { getShift, shiftColors } from '../data';

interface ShiftChipProps {
  shiftKey: string;
  dark: boolean;
  size?: 'sm' | 'md';
  showRange?: boolean;
}

export function ShiftChip({ shiftKey, dark, size = 'md', showRange = false }: ShiftChipProps) {
  const s = getShift(shiftKey);
  const c = shiftColors(shiftKey, dark);
  if (!s) return null;
  const isLibre = shiftKey === 'libre';
  const pad = size === 'sm' ? '3px 7px' : '5px 9px';
  const fs = size === 'sm' ? 11.5 : 12.5;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: pad, borderRadius: 7,
      background: c.bg, color: c.fg, border: `1px solid ${c.border}`,
      fontSize: fs, fontWeight: 500, lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      {!isLibre && (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot, flexShrink: 0 }} />
      )}
      <span>{s.name}</span>
      {showRange && !isLibre && (
        <span style={{ fontFamily: '"IBM Plex Mono", monospace', opacity: 0.7, fontSize: size === 'sm' ? 10 : 11 }}>
          {s.range}
        </span>
      )}
    </span>
  );
}

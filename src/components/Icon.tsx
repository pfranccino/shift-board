import React from 'react';

interface IconProps {
  name: string;
  size?: number;
  stroke?: number;
  style?: React.CSSProperties;
}

const paths: Record<string, React.ReactNode> = {
  calendar: <><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" /><path d="M16 5.5a3 3 0 0 1 0 6M16.5 19.5a5.5 5.5 0 0 0-1.8-4.1" /></>,
  chart: <><path d="M4 4v16h16" /><rect x="7.5" y="11" width="2.8" height="6" rx="0.5" /><rect x="12.5" y="7" width="2.8" height="10" rx="0.5" /><rect x="17.5" y="13" width="2.8" height="4" rx="0.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  trash: <><path d="M4 7h16M9 7V4.5h6V7M6 7l1 13h10l1-13" /></>,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M14 6l4 4" /></>,
  chevL: <path d="M15 6l-6 6 6 6" />,
  chevR: <path d="M9 6l6 6-6 6" />,
  chevD: <path d="M6 9l6 6 6-6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  down: <path d="M12 5v14M6 13l6 6 6-6" />,
  dot: <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  magic: <><path d="M12 3.5l1.6 3.9 3.9 1.6-3.9 1.6L12 14.5l-1.6-3.9L6.5 9l3.9-1.6z" /><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></>,
  sliders: <><path d="M4 8h10M18 8h2M4 16h2M10 16h10" /><circle cx="16" cy="8" r="2.2" /><circle cx="8" cy="16" r="2.2" /></>,
  warn: <><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17.2v.1" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  shield: <><path d="M12 3L4 7v5c0 5 4.4 8.7 8 9.9C16 20.7 20 17 20 12V7l-8-4z" /></>,
  mail: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 6l9 7 9-7" /></>,
  copy: <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></>,
};

export function Icon({ name, size = 16, stroke = 1.6, style }: IconProps) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" style={style}
    >
      {paths[name]}
    </svg>
  );
}

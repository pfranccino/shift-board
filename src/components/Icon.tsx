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
  building: <><path d="M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16" /><path d="M14 9h4a1 1 0 0 1 1 1v11" /><path d="M3 21h18M8 8h2M8 12h2M8 16h2" /></>,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 9.5V20h12V9.5" /><path d="M10 20v-5h4v5" /></>,
  inbox: <><path d="M3 13h5l1.5 2.5h5L16 13h5" /><path d="M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></>,
  swap: <><path d="M7 7h11l-3-3M17 17H6l3 3" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7h-5M21 7v5" /></>,
  dollar: <><path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.8 7 7s2.5 3 5 3.5 5 1.3 5 3.5-2.2 3.5-5 3.5-5-1.1-5-3" /></>,
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M6 6l12 12" /></>,
  star: <path d="M12 3l2.6 6.3 6.4.5-4.9 4.2 1.5 6.5L12 17.6 6.9 20.5l1.5-6.5L3.5 9.8l6.4-.5z" />,
  card: <><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M3 9.5h18M7 15h4" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.8" cy="6" r="1.1" fill="currentColor" stroke="none" /><circle cx="3.8" cy="12" r="1.1" fill="currentColor" stroke="none" /><circle cx="3.8" cy="18" r="1.1" fill="currentColor" stroke="none" /></>,
  life: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="3.3" /><path d="M5.5 5.5l3.8 3.8M14.7 14.7l3.8 3.8M18.5 5.5l-3.8 3.8M9.3 14.7l-3.8 3.8" /></>,
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

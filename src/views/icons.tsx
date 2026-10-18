const base = {
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': 1.8,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
  'aria-hidden': 'true',
} as const;

export const ArrowRight = () => (
  <svg class="arrow" width="22" height="22" viewBox="0 0 24 24" {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ChevronLeft = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base} stroke="var(--ink)">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const Cross = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Plus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" {...base}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const Sliders = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" {...base} stroke-width={1.6}>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </svg>
);

export const Hand = () => (
  <svg width="30" height="30" viewBox="0 0 24 24" {...base} stroke-width={1.5}>
    <path d="M9 11V6.5a1.5 1.5 0 0 1 3 0V11" />
    <path d="M12 10.5V9a1.5 1.5 0 0 1 3 0v2" />
    <path d="M15 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.5 16a1.6 1.6 0 0 1 2.4-2.1L9 15.5" />
  </svg>
);

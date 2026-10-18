/**
 * Color themes for the group screens and the face of the reveal card (plan, Section 8).
 * Handoff and reveal screens ignore themes and always stay ink black.
 * Every theme must pass the contrast test in tests/unit/themes.test.ts.
 */
export type ThemeId = 'paper' | 'sky' | 'mint' | 'apricot' | 'lilac' | 'lemon';

export type Theme = {
  id: ThemeId;
  name: string;
  blurb: string;
  /** Page background, card face. */
  bg: string;
  /** Text and primary buttons. */
  ink: string;
  /** Hairlines between rows. */
  line: string;
  /** Outlines of chips and unselected buttons. */
  border: string;
  /** Secondary text. */
  muted: string;
  /** Large secondary numerals (30px+). */
  faint: string;
  /** The CAUGHT stamp. */
  stamp: string;
  /** Validation messages. */
  error: string;
};

export const THEMES: Theme[] = [
  {
    id: 'paper',
    name: 'Paper',
    blurb: 'A printed card game',
    bg: '#F3F1EC',
    ink: '#151515',
    line: '#D6D2CA',
    border: '#B9B4AA',
    muted: '#5E5A55',
    faint: '#7A756E',
    stamp: '#C8361B',
    error: '#B22D14',
  },
  {
    id: 'sky',
    name: 'Sky',
    blurb: 'Cool and clear',
    bg: '#DCE8F2',
    ink: '#151515',
    line: '#B9CBDB',
    border: '#98AEC3',
    muted: '#45535F',
    faint: '#5F6E7B',
    stamp: '#C8361B',
    error: '#A82912',
  },
  {
    id: 'mint',
    name: 'Mint',
    blurb: 'Fresh, a bit retro',
    bg: '#D6ECE1',
    ink: '#10231A',
    line: '#B3D2C3',
    border: '#8FB5A3',
    muted: '#3F5A4C',
    faint: '#557362',
    stamp: '#C8361B',
    error: '#A82912',
  },
  {
    id: 'apricot',
    name: 'Apricot',
    blurb: 'Warm for late nights',
    bg: '#F7DFCF',
    ink: '#24140D',
    line: '#E2BFA8',
    border: '#CFA083',
    muted: '#6A4A3A',
    faint: '#85614E',
    stamp: '#1F5FA8',
    error: '#A82912',
  },
  {
    id: 'lilac',
    name: 'Lilac',
    blurb: 'Soft and sly',
    bg: '#E3DFF3',
    ink: '#18142B',
    line: '#C6BFE2',
    border: '#A79DCB',
    muted: '#514B6B',
    faint: '#6A6386',
    stamp: '#C8361B',
    error: '#A82912',
  },
  {
    id: 'lemon',
    name: 'Lemon',
    blurb: 'Loud and sunny',
    bg: '#F2EDB8',
    ink: '#1A1806',
    line: '#D8D08A',
    border: '#BDB25E',
    muted: '#57522A',
    faint: '#6E6838',
    stamp: '#1F5FA8',
    error: '#A82912',
  },
];

export const DEFAULT_THEME: ThemeId = 'paper';

export function themeById(id: string): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export const isThemeId = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

const COLOR_KEYS = ['bg', 'ink', 'line', 'border', 'muted', 'faint', 'stamp', 'error'] as const;

/** Sets the CSS variables the group screens read (`--bg`, `--ink`, …). */
export function applyTheme(theme: Theme, root: HTMLElement = document.documentElement): void {
  for (const k of COLOR_KEYS) root.style.setProperty(`--${k}`, theme[k]);
}

/** Background of the private (handoff/reveal) screens; matches `--p-bg` in styles.css. */
export const PRIVATE_BG = '#151515';

/** WCAG contrast ratio between two #RRGGBB colors. */
export function contrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

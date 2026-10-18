/** Seat 0 → "01". */
export const seatLabel = (index: number) => String(index + 1).padStart(2, '0');

/** Rough width of one condensed display capital, as a fraction of the font size. */
const CHAR_WIDTH = 0.52;

/**
 * Font size that keeps the longest word of `text` on one line.
 * `available` is a CSS length for the space the text can use.
 */
export function fitFont(text: string, maxPx: number, available: string): string {
  const longest = Math.max(1, ...text.split(/\s+/).map((w) => w.length));
  return `min(${maxPx}px, calc(${available} / ${(longest * CHAR_WIDTH).toFixed(2)}))`;
}

/** Content width of a screen: the viewport (capped at 480px) minus its 24px gutters. */
export const SCREEN_WIDTH = '(min(100vw, 480px) - 48px)';

export const plural =(n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

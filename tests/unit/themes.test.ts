import { describe, expect, it } from 'vitest';
import { contrast, DEFAULT_THEME, isThemeId, THEMES, themeById } from '../../src/themes';

describe('themes', () => {
  it('has six themes with unique ids, Paper first and default', () => {
    expect(THEMES).toHaveLength(6);
    expect(new Set(THEMES.map((t) => t.id)).size).toBe(6);
    expect(THEMES[0].id).toBe('paper');
    expect(DEFAULT_THEME).toBe('paper');
  });

  it('falls back to Paper for an unknown id', () => {
    expect(themeById('neon').id).toBe('paper');
    expect(isThemeId('lilac')).toBe(true);
    expect(isThemeId('neon')).toBe(false);
  });

  it('computes WCAG contrast', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(contrast('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  describe.each(THEMES)('TH3: $name is readable', (t) => {
    it('ink at least 7:1', () => expect(contrast(t.ink, t.bg)).toBeGreaterThanOrEqual(7));
    it('muted text at least 4.5:1', () => expect(contrast(t.muted, t.bg)).toBeGreaterThanOrEqual(4.5));
    it('error text at least 4.5:1', () => expect(contrast(t.error, t.bg)).toBeGreaterThanOrEqual(4.5));
    it('stamp (40px) at least 3:1', () => expect(contrast(t.stamp, t.bg)).toBeGreaterThanOrEqual(3));
    it('faint numerals (30px) at least 3:1', () => expect(contrast(t.faint, t.bg)).toBeGreaterThanOrEqual(3));
    it('primary buttons (bg on ink) at least 7:1', () => expect(contrast(t.bg, t.ink)).toBeGreaterThanOrEqual(7));
  });
});

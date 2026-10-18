import { describe, expect, it } from 'vitest';
import rawWords from '../../src/data/words.json';
import { categoriesOf, drawWord, loadWords, WordListError } from '../../src/data/wordBank';
import { seededRng } from '../../src/rng';
import type { UsedWords } from '../../src/types';

describe('word bank', () => {
  it('W1: the bundled list has 150+ words, none blank, no duplicates', () => {
    const words = loadWords(rawWords);
    expect(rawWords.length).toBeGreaterThanOrEqual(150);
    expect(words).toHaveLength(rawWords.length);
    expect(words.every((w) => w.word.trim() !== '')).toBe(true);
    for (const c of categoriesOf(words)) {
      expect(words.filter((w) => w.category === c).length).toBeGreaterThanOrEqual(25);
    }
  });

  it('W1: trims and de-duplicates at load', () => {
    const words = loadWords([
      { word: ' Taco ', category: 'Food' },
      { word: 'taco', category: 'Food' },
      { word: '', category: 'Food' },
      { word: 'Owl', category: 'Animals' },
    ]);
    expect(words).toEqual([
      { word: 'Taco', category: 'Food' },
      { word: 'Owl', category: 'Animals' },
    ]);
  });

  it('W2: only draws from the selected category', () => {
    const words = loadWords(rawWords);
    let used: UsedWords = {};
    const rng = seededRng(7);
    for (let i = 0; i < 50; i++) {
      const res = drawWord(words, ['Food'], used, rng);
      expect(res.entry.category).toBe('Food');
      used = res.used;
    }
  });

  it('E2: no selection means every category', () => {
    const words = loadWords(rawWords);
    const seen = new Set<string>();
    let used: UsedWords = {};
    const rng = seededRng(11);
    for (let i = 0; i < 300; i++) {
      const res = drawWord(words, [], used, rng);
      seen.add(res.entry.category);
      used = res.used;
    }
    expect(seen.size).toBe(categoriesOf(words).length);
  });

  it('W3: no repeats until a category runs out, then it starts over', () => {
    const words = loadWords(rawWords);
    const food = words.filter((w) => w.category === 'Food');
    let used: UsedWords = {};
    const rng = seededRng(3);
    const drawn: string[] = [];
    for (let i = 0; i < food.length; i++) {
      const res = drawWord(words, ['Food'], used, rng);
      drawn.push(res.entry.word);
      used = res.used;
    }
    expect(new Set(drawn).size).toBe(food.length);
    const again = drawWord(words, ['Food'], used, rng);
    expect(again.used.Food).toEqual([again.entry.word]);
  });

  it('ignores selected categories that no longer exist', () => {
    const words = loadWords(rawWords);
    const res = drawWord(words, ['Gone'], {}, seededRng(1));
    expect(categoriesOf(words)).toContain(res.entry.category);
  });

  it('W4: a missing or broken list throws a WordListError', () => {
    expect(() => loadWords(undefined)).toThrow(WordListError);
    expect(() => loadWords({ words: [] })).toThrow(WordListError);
    expect(() => loadWords([{ nope: true }])).toThrow(WordListError);
  });
});

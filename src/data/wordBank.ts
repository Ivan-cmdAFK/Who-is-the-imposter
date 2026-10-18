import { randomIndex } from '../rng';
import type { Rng, UsedWords, WordEntry } from '../types';

export class WordListError extends Error {}

/** Validates raw JSON, trims words and drops duplicates within a category. */
export function loadWords(raw: unknown): WordEntry[] {
  if (!Array.isArray(raw)) throw new WordListError('Word list is not an array');
  const out: WordEntry[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) continue;
    const { word, category } = item as Record<string, unknown>;
    if (typeof word !== 'string' || typeof category !== 'string') continue;
    const w = word.trim();
    const c = category.trim();
    if (!w || !c) continue;
    const key = `${c.toLocaleLowerCase()}|${w.toLocaleLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ word: w, category: c });
  }
  if (out.length === 0) throw new WordListError('Word list is empty');
  return out;
}

export function categoriesOf(words: WordEntry[]): string[] {
  return [...new Set(words.map((w) => w.category))];
}

/**
 * Picks a word from the selected categories (empty = all), skipping used words.
 * A category whose words are all used starts over.
 */
export function drawWord(
  words: WordEntry[],
  selected: string[],
  used: UsedWords,
  rng: Rng,
): { entry: WordEntry; used: UsedWords } {
  const known = categoriesOf(words);
  const active = selected.filter((c) => known.includes(c));
  const cats = active.length > 0 ? active : known;

  const nextUsed: UsedWords = { ...used };
  for (const c of cats) {
    const total = words.filter((w) => w.category === c).length;
    if ((nextUsed[c]?.length ?? 0) >= total) nextUsed[c] = [];
  }

  const pool = words.filter((w) => cats.includes(w.category) && !(nextUsed[w.category] ?? []).includes(w.word));
  const entry = pool[randomIndex(rng, pool.length)];
  nextUsed[entry.category] = [...(nextUsed[entry.category] ?? []), entry.word];
  return { entry, used: nextUsed };
}

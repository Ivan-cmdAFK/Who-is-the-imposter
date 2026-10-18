import type { WordEntry } from '../types';

/** A word list the players wrote themselves (plan, Section 8). */
export type WordList = {
  id: string;
  name: string;
  words: string[];
  /** Shown on Home as a category chip. */
  visible: boolean;
};

export const MAX_LISTS = 20;
export const MAX_LIST_NAME = 24;
export const MAX_WORD_LENGTH = 30;
export const MAX_WORDS = 200;
export const MIN_PLAYABLE = 5;

export type NameProblem = 'blank' | 'too-long' | 'taken';

/** `takenNames` = every other list's name, built-in ones included. */
export function checkListName(name: string, takenNames: string[]): NameProblem | undefined {
  const n = name.trim();
  if (!n) return 'blank';
  if (n.length > MAX_LIST_NAME) return 'too-long';
  const key = n.toLocaleLowerCase();
  if (takenNames.some((t) => t.trim().toLocaleLowerCase() === key)) return 'taken';
  return undefined;
}

export type AddResult = {
  words: string[];
  added: string[];
  duplicates: number;
  tooLong: number;
  /** Words dropped because the list hit MAX_WORDS. */
  overLimit: number;
};

/** Adds one word or a pasted list (split on new lines and commas). */
export function addWords(existing: string[], input: string): AddResult {
  const words = [...existing];
  const seen = new Set(existing.map((w) => w.toLocaleLowerCase()));
  const result: AddResult = { words, added: [], duplicates: 0, tooLong: 0, overLimit: 0 };
  for (const raw of input.split(/[\n,]/)) {
    const w = raw.trim().replace(/\s+/g, ' ');
    if (!w) continue;
    if (w.length > MAX_WORD_LENGTH) {
      result.tooLong++;
      continue;
    }
    const key = w.toLocaleLowerCase();
    if (seen.has(key)) {
      result.duplicates++;
      continue;
    }
    if (words.length >= MAX_WORDS) {
      result.overLimit++;
      continue;
    }
    seen.add(key);
    words.push(w);
    result.added.push(w);
  }
  return result;
}

/** A short sentence about what addWords did, or undefined when there's nothing to say. */
export function describeAdd(r: AddResult, single: string): string | undefined {
  if (r.added.length === 1 && r.duplicates + r.tooLong + r.overLimit === 0) return undefined;
  if (r.added.length === 0 && r.duplicates === 1 && r.tooLong + r.overLimit === 0) {
    return `"${single.trim()}" is already on this list.`;
  }
  if (r.added.length === 0 && r.tooLong === 1 && r.duplicates + r.overLimit === 0) {
    return `Keep words to ${MAX_WORD_LENGTH} characters.`;
  }
  const parts = [`Added ${r.added.length}`];
  if (r.duplicates) parts.push(`skipped ${r.duplicates} already on the list`);
  if (r.tooLong) parts.push(`skipped ${r.tooLong} too long`);
  if (r.overLimit) parts.push(`${r.overLimit} over the ${MAX_WORDS}-word limit`);
  return `${parts.join(', ')}.`;
}

export const isPlayable = (list: WordList) => list.words.length >= MIN_PLAYABLE;

/** What "Copy as text" puts on the clipboard; pasting it into a list adds the same words back. */
export const listToText = (list: WordList) => list.words.join(', ');

/** "New list", or "New list 2", "New list 3"… if taken. */
export function freshListName(takenNames: string[]): string {
  for (let i = 1; ; i++) {
    const name = i === 1 ? 'New list' : `New list ${i}`;
    if (!checkListName(name, takenNames)) return name;
  }
}

const usable = (l: WordList) => l.visible && isPlayable(l);

/** Word entries for the word bank from visible, playable lists. A custom list's category is its id. */
export function customEntries(lists: WordList[]): WordEntry[] {
  return lists.filter(usable).flatMap((l) => l.words.map((word) => ({ word, category: l.id })));
}

/**
 * The selected categories that can actually be dealt from: built-in names, plus ids of
 * visible, playable custom lists. Stale ids (deleted or hidden lists) simply drop out.
 * Empty means "all built-in".
 */
export function activeSelection(selected: string[], builtIn: string[], lists: WordList[]): string[] {
  const ok = new Set([...builtIn, ...lists.filter(usable).map((l) => l.id)]);
  return selected.filter((id) => ok.has(id));
}

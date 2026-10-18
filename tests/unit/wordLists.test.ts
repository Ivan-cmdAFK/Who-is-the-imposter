import { describe, expect, it } from 'vitest';
import rawWords from '../../src/data/words.json';
import { categoriesOf, drawWord, loadWords } from '../../src/data/wordBank';
import {
  activeSelection,
  addWords,
  checkListName,
  customEntries,
  describeAdd,
  freshListName,
  isPlayable,
  listToText,
  MAX_WORDS,
  type WordList,
} from '../../src/data/wordLists';
import { seededRng } from '../../src/rng';

const list = (words: string[], extra: Partial<WordList> = {}): WordList => ({
  id: 'crew',
  name: 'Our crew',
  words,
  visible: true,
  ...extra,
});

describe('custom word lists', () => {
  it('CW1: rejects a blank name or one over 24 characters', () => {
    expect(checkListName('   ', [])).toBe('blank');
    expect(checkListName('x'.repeat(25), [])).toBe('too-long');
    expect(checkListName('x'.repeat(24), [])).toBeUndefined();
  });

  it('CW2: rejects a name another list already has, ignoring case', () => {
    expect(checkListName('food', ['Food', 'Animals'])).toBe('taken');
    expect(checkListName(' Our Crew ', ['our crew'])).toBe('taken');
    expect(checkListName('Food fights', ['Food'])).toBeUndefined();
  });

  it('CW3: trims and de-duplicates ignoring case', () => {
    const r1 = addWords([], ' Burnt toast ');
    expect(r1.words).toEqual(['Burnt toast']);
    const r2 = addWords(r1.words, 'burnt toast');
    expect(r2.words).toEqual(['Burnt toast']);
    expect(r2.duplicates).toBe(1);
    expect(describeAdd(r2, 'burnt toast')).toBe('"burnt toast" is already on this list.');
  });

  it('CW4: rejects a 31-character word and a 201st word', () => {
    expect(addWords([], 'x'.repeat(31)).tooLong).toBe(1);
    const full = Array.from({ length: MAX_WORDS }, (_, i) => `w${i}`);
    const r = addWords(full, 'one more');
    expect(r.overLimit).toBe(1);
    expect(r.words).toHaveLength(MAX_WORDS);
  });

  it('CW5: pasting splits on commas and new lines, skips blanks and repeats', () => {
    const r = addWords([], 'Karaoke, Rooftop\nNight bus,,rooftop');
    expect(r.words).toEqual(['Karaoke', 'Rooftop', 'Night bus']);
    expect(r.duplicates).toBe(1);
    expect(describeAdd(r, '')).toBe('Added 3, skipped 1 already on the list.');
  });

  it('CW6: a list needs 5 words to be playable', () => {
    expect(isPlayable(list(['a', 'b', 'c', 'd']))).toBe(false);
    expect(isPlayable(list(['a', 'b', 'c', 'd', 'e']))).toBe(true);
    expect(customEntries([list(['a', 'b', 'c', 'd'])])).toEqual([]);
  });

  it('CW10: copy as text, then paste, gives the same words in the same order', () => {
    const original = list(['Karaoke', "Dave's van", 'The lake house', 'Taco Tuesday']);
    expect(addWords([], listToText(original)).words).toEqual(original.words);
  });

  it('collapses runs of spaces inside a word', () => {
    expect(addWords([], 'Hot    sauce').words).toEqual(['Hot sauce']);
  });

  it('suggests a free name for a new list', () => {
    expect(freshListName(['Food'])).toBe('New list');
    expect(freshListName(['New list', 'New list 2'])).toBe('New list 3');
  });

  it('CW9: a custom list can be drawn from on its own', () => {
    const crew = list(['Karaoke', 'Rooftop', 'Night bus', 'Hot sauce', 'Road trip']);
    const words = [...loadWords(rawWords), ...customEntries([crew])];
    const rng = seededRng(5);
    for (let i = 0; i < 20; i++) {
      expect(drawWord(words, ['crew'], {}, rng).entry.category).toBe('crew');
    }
  });

  it('CW11: deleted, hidden or too-short lists drop out of the selection', () => {
    const cats = categoriesOf(loadWords(rawWords));
    const ready = ['a', 'b', 'c', 'd', 'e'];
    const lists = [
      list(ready, { id: 'shown' }),
      list(ready, { id: 'hidden', visible: false }),
      list(['a'], { id: 'short' }),
    ];
    expect(activeSelection(['Food', 'shown', 'hidden', 'short', 'deleted'], cats, lists)).toEqual(['Food', 'shown']);
    expect(activeSelection(['deleted'], cats, lists)).toEqual([]);
    expect(customEntries(lists).map((e) => e.category)).toEqual(['shown', 'shown', 'shown', 'shown', 'shown']);
  });
});

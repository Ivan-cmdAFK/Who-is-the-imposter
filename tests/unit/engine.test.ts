import { describe, expect, it } from 'vitest';
import { clueOrder, newRound, outcome, validatePlayers } from '../../src/engine/game';
import { cryptoRng, seededRng } from '../../src/rng';
import type { Player, Round, WordEntry } from '../../src/types';

const make = (...names: string[]): Player[] => names.map((name, i) => ({ id: `p${i + 1}`, name }));
const word: WordEntry = { word: 'Pancake', category: 'Food' };

describe('validatePlayers', () => {
  it('G1: rejects fewer than 3 players', () => {
    const v = validatePlayers(make('Ana', 'Sam'));
    expect(v.ok).toBe(false);
    expect(v.countError).toBe('too-few');
  });

  it('G2: rejects empty and whitespace-only names', () => {
    const v = validatePlayers(make('Ana', '', '   '));
    expect(v.ok).toBe(false);
    expect(v.nameErrors).toEqual({ p2: 'blank', p3: 'blank' });
  });

  it('G3: treats names that differ only by case or spaces as duplicates', () => {
    const v = validatePlayers(make('Sam', 'Ana', 'sam '));
    expect(v.ok).toBe(false);
    expect(v.nameErrors).toEqual({ p3: 'duplicate' });
  });

  it('G4: accepts 3 and 12 players, rejects 13', () => {
    const names = (n: number) => make(...Array.from({ length: n }, (_, i) => `Player ${i + 1}`));
    expect(validatePlayers(names(3)).ok).toBe(true);
    expect(validatePlayers(names(12)).ok).toBe(true);
    expect(validatePlayers(names(13)).countError).toBe('too-many');
  });

  it('trims names in the cleaned list', () => {
    expect(validatePlayers(make(' Ana ', 'Sam', 'Leo')).cleaned[0].name).toBe('Ana');
  });

  it('E1: rejects names over 20 characters', () => {
    expect(validatePlayers(make('A'.repeat(21), 'Sam', 'Leo')).nameErrors).toEqual({ p1: 'too-long' });
  });
});

describe('newRound', () => {
  const players = make('Ana', 'Sam', 'Maya', 'Jordan', 'Priya');

  it('G5: picks exactly one Imposter from the table; everyone else shares the word', () => {
    for (let seed = 0; seed < 200; seed++) {
      const round = newRound(players, word, seededRng(seed));
      const imposters = players.filter((p) => p.id === round.imposterId);
      expect(imposters).toHaveLength(1);
      expect(round.secret).toEqual(word);
    }
  });

  it('G6: the starter is always one of the players', () => {
    for (let seed = 0; seed < 200; seed++) {
      const round = newRound(players, word, seededRng(seed));
      expect(players.map((p) => p.id)).toContain(round.starterId);
    }
  });

  it('G7: clue order starts at the starter and wraps around', () => {
    const round: Round = { ...newRound(players, word, seededRng(1)), starterId: 'p4' };
    expect(clueOrder(round).map((p) => p.id)).toEqual(['p4', 'p5', 'p1', 'p2', 'p3']);
  });

  it('refuses to deal for fewer than 3 players', () => {
    expect(() => newRound(make('Ana', 'Sam'), word, seededRng(1))).toThrow();
  });
});

describe('outcome', () => {
  const base = { ...newRound(make('Ana', 'Sam', 'Leo'), word, seededRng(3)), imposterId: 'p2' };

  it('is undecided before the vote', () => {
    expect(outcome(base)).toBeUndefined();
  });

  it('G8: Imposter accused and misses the word: the group wins', () => {
    expect(outcome({ ...base, accusedId: 'p2', imposterGuessed: false })).toBe('group');
  });

  it('G9: wrong player accused: the Imposter wins', () => {
    expect(outcome({ ...base, accusedId: 'p3' })).toBe('imposter');
  });

  it('G10: Imposter accused but guesses the word: the Imposter wins', () => {
    expect(outcome({ ...base, accusedId: 'p2', imposterGuessed: true })).toBe('imposter');
  });

  it('waits for the guess when the Imposter is caught', () => {
    expect(outcome({ ...base, accusedId: 'p2' })).toBeUndefined();
  });
});

describe('randomization', () => {
  const players = make('Ana', 'Sam', 'Maya', 'Jordan', 'Priya');

  it('R1: the same seed deals the same round', () => {
    const a = newRound(players, word, seededRng(42));
    const b = newRound(players, word, seededRng(42));
    expect(a).toEqual(b);
  });

  const share = (pick: (r: Round) => string) => {
    const counts = new Map<string, number>();
    const n = 10_000;
    for (let i = 0; i < n; i++) {
      const id = pick(newRound(players, word, cryptoRng));
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return players.map((p) => (counts.get(p.id) ?? 0) / n);
  };

  it('R2: each player is the Imposter 18% to 22% of the time', () => {
    for (const s of share((r) => r.imposterId)) {
      expect(s).toBeGreaterThan(0.18);
      expect(s).toBeLessThan(0.22);
    }
  });

  it('R3: each player starts 18% to 22% of the time', () => {
    for (const s of share((r) => r.starterId)) {
      expect(s).toBeGreaterThan(0.18);
      expect(s).toBeLessThan(0.22);
    }
  });
});

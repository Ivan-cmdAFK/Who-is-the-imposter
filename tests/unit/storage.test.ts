import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  loadPlayers,
  loadSettings,
  loadUsed,
  savePlayers,
  saveSettings,
  saveUsed,
  type KeyValueStore,
} from '../../src/data/storage';

const memory = (init: Record<string, string> = {}): KeyValueStore => {
  const m = new Map(Object.entries(init));
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
};

describe('storage', () => {
  it('round-trips players, settings and used words', () => {
    const s = memory();
    const players = [{ id: 'a', name: 'Ana' }];
    const settings = { categories: ['Food'], showCategoryHint: false, clueRounds: 2 as const };
    savePlayers(s, players);
    saveSettings(s, settings);
    saveUsed(s, { Food: ['Taco'] });
    expect(loadPlayers(s)).toEqual(players);
    expect(loadSettings(s)).toEqual(settings);
    expect(loadUsed(s)).toEqual({ Food: ['Taco'] });
  });

  it('falls back to defaults on missing data', () => {
    const s = memory();
    expect(loadPlayers(s)).toEqual([]);
    expect(loadSettings(s)).toEqual(DEFAULT_SETTINGS);
    expect(loadUsed(s)).toEqual({});
  });

  it('survives corrupt data', () => {
    const s = memory({
      'imposter.v1.players': '{not json',
      'imposter.v1.settings': JSON.stringify({ clueRounds: 9, categories: 'x' }),
      'imposter.v1.used': JSON.stringify([1, 2]),
    });
    expect(loadPlayers(s)).toEqual([]);
    expect(loadSettings(s)).toEqual(DEFAULT_SETTINGS);
    expect(loadUsed(s)).toEqual({});
  });

  it('drops malformed players', () => {
    const s = memory({ 'imposter.v1.players': JSON.stringify([{ id: 'a', name: 'Ana' }, { id: 1 }, null]) });
    expect(loadPlayers(s)).toEqual([{ id: 'a', name: 'Ana' }]);
  });

  it('does not throw when the store refuses writes', () => {
    const s: KeyValueStore = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
    };
    expect(() => savePlayers(s, [])).not.toThrow();
  });
});

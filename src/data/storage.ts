import type { Player, Settings, UsedWords } from '../types';

const KEYS = {
  players: 'imposter.v1.players',
  settings: 'imposter.v1.settings',
  used: 'imposter.v1.used',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  categories: [],
  showCategoryHint: true,
  clueRounds: 1,
};

/** Minimal Storage surface, so tests can pass an in-memory fake. */
export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

function read(store: KeyValueStore, key: string): unknown {
  try {
    const raw = store.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function write(store: KeyValueStore, key: string, value: unknown): void {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the game still works, it just won't remember.
  }
}

export function loadPlayers(store: KeyValueStore): Player[] {
  const v = read(store, KEYS.players);
  if (!Array.isArray(v)) return [];
  return v.filter(
    (p): p is Player =>
      typeof p === 'object' && p !== null && typeof p.id === 'string' && typeof p.name === 'string',
  );
}

export function loadSettings(store: KeyValueStore): Settings {
  const v = read(store, KEYS.settings);
  if (typeof v !== 'object' || v === null) return { ...DEFAULT_SETTINGS };
  const s = v as Partial<Settings>;
  return {
    categories: Array.isArray(s.categories) ? s.categories.filter((c) => typeof c === 'string') : [],
    showCategoryHint: typeof s.showCategoryHint === 'boolean' ? s.showCategoryHint : true,
    clueRounds: s.clueRounds === 2 || s.clueRounds === 3 ? s.clueRounds : 1,
  };
}

export function loadUsed(store: KeyValueStore): UsedWords {
  const v = read(store, KEYS.used);
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
  const out: UsedWords = {};
  for (const [k, list] of Object.entries(v)) {
    if (Array.isArray(list)) out[k] = list.filter((w) => typeof w === 'string');
  }
  return out;
}

export const savePlayers = (store: KeyValueStore, players: Player[]) => write(store, KEYS.players, players);
export const saveSettings = (store: KeyValueStore, settings: Settings) => write(store, KEYS.settings, settings);
export const saveUsed = (store: KeyValueStore, used: UsedWords) => write(store, KEYS.used, used);

/** localStorage, or a throwaway in-memory store if access throws. */
export function browserStore(): KeyValueStore {
  try {
    const s = window.localStorage;
    s.getItem('imposter.probe');
    return s;
  } catch {
    const mem = new Map<string, string>();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v) };
  }
}

import { DEFAULT_THEME, isThemeId, type ThemeId } from '../themes';
import type { Player, Settings, UsedWords } from '../types';
import { MAX_LIST_NAME, MAX_LISTS, MAX_WORD_LENGTH, MAX_WORDS, type WordList } from './wordLists';

const KEYS = {
  players: 'imposter.v1.players',
  settings: 'imposter.v1.settings',
  used: 'imposter.v1.used',
  theme: 'imposter.v1.theme',
  lists: 'imposter.v1.lists',
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

export function loadTheme(store: KeyValueStore): ThemeId {
  const v = read(store, KEYS.theme);
  return isThemeId(v) ? v : DEFAULT_THEME;
}

export function loadLists(store: KeyValueStore): WordList[] {
  const v = read(store, KEYS.lists);
  if (!Array.isArray(v)) return [];
  const out: WordList[] = [];
  for (const item of v) {
    if (typeof item !== 'object' || item === null) continue;
    const { id, name, words, visible } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof name !== 'string' || !Array.isArray(words)) continue;
    out.push({
      id,
      name: name.slice(0, MAX_LIST_NAME),
      words: words
        .filter((w): w is string => typeof w === 'string' && w.trim() !== '' && w.length <= MAX_WORD_LENGTH)
        .slice(0, MAX_WORDS),
      visible: visible !== false,
    });
  }
  return out.slice(0, MAX_LISTS);
}

export const saveTheme = (store: KeyValueStore, theme: ThemeId) => write(store, KEYS.theme, theme);
export const saveLists = (store: KeyValueStore, lists: WordList[]) => write(store, KEYS.lists, lists);

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

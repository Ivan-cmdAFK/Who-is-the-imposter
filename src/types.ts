export type Player = { id: string; name: string };

export type WordEntry = { word: string; category: string };

export type Settings = {
  /**
   * Selected categories: built-in category names and custom list ids.
   * Empty means all built-in categories.
   */
  categories: string[];
  /** When on, every card (the Imposter's too) shows the category. */
  showCategoryHint: boolean;
  clueRounds: 1 | 2 | 3;
};

export type Round = {
  /** Seating order. */
  players: Player[];
  secret: WordEntry;
  /** Never rendered before the result phase. */
  imposterId: string;
  starterId: string;
  revealIndex: number;
  clueRound: number;
  accusedId?: string;
  imposterGuessed?: boolean;
};

export type Phase =
  | 'home'
  | 'setup'
  | 'settings'
  | 'list'
  | 'handoff'
  | 'reveal'
  | 'clues'
  | 'vote'
  | 'result';

/** Returns a float in [0, 1). */
export type Rng = () => number;

/** Used words per category. */
export type UsedWords = Record<string, string[]>;

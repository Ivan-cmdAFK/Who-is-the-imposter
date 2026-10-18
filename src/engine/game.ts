import { randomIndex } from '../rng';
import type { Player, Rng, Round, WordEntry } from '../types';

export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 12;
export const MAX_NAME_LENGTH = 20;

export type NameError = 'blank' | 'duplicate' | 'too-long';

export type Validation = {
  ok: boolean;
  /** Error per player id. */
  nameErrors: Record<string, NameError>;
  /** Problem with the size of the table, if any. */
  countError?: 'too-few' | 'too-many';
  /** Players with trimmed names. */
  cleaned: Player[];
};

export function validatePlayers(players: Player[]): Validation {
  const cleaned = players.map((p) => ({ ...p, name: p.name.trim() }));
  const nameErrors: Record<string, NameError> = {};
  const seen = new Set<string>();
  for (const p of cleaned) {
    const key = p.name.toLocaleLowerCase();
    if (p.name === '') nameErrors[p.id] = 'blank';
    else if (p.name.length > MAX_NAME_LENGTH) nameErrors[p.id] = 'too-long';
    else if (seen.has(key)) nameErrors[p.id] = 'duplicate';
    seen.add(key);
  }
  const countError =
    cleaned.length < MIN_PLAYERS ? 'too-few' : cleaned.length > MAX_PLAYERS ? 'too-many' : undefined;
  return {
    ok: !countError && Object.keys(nameErrors).length === 0,
    nameErrors,
    countError,
    cleaned,
  };
}

/** Deals a round: one Imposter, one secret word, one starting player. */
export function newRound(players: Player[], secret: WordEntry, rng: Rng): Round {
  if (players.length < MIN_PLAYERS) throw new Error('Not enough players');
  return {
    players,
    secret,
    imposterId: players[randomIndex(rng, players.length)].id,
    starterId: players[randomIndex(rng, players.length)].id,
    revealIndex: 0,
    clueRound: 1,
  };
}

/** Seating order, starting with the starter and wrapping around. */
export function clueOrder(round: Round): Player[] {
  const start = round.players.findIndex((p) => p.id === round.starterId);
  return [...round.players.slice(start), ...round.players.slice(0, start)];
}

export type Outcome = 'group' | 'imposter';

/**
 * Group wins only if they accuse the Imposter and the Imposter then misses the word.
 * Returns undefined while the result is still being decided.
 */
export function outcome(round: Round): Outcome | undefined {
  if (round.accusedId === undefined) return undefined;
  if (round.accusedId !== round.imposterId) return 'imposter';
  if (round.imposterGuessed === undefined) return undefined;
  return round.imposterGuessed ? 'imposter' : 'group';
}

import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/data/storage';
import { newRound } from '../../src/engine/game';
import { seededRng } from '../../src/rng';
import { reduce, type Action, type State } from '../../src/session/reducer';

const players = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Sam' },
  { id: 'c', name: 'Leo' },
];
const round = { ...newRound(players, { word: 'Taco', category: 'Food' }, seededRng(1)), imposterId: 'b' };
const home: State = { phase: 'home', players, settings: DEFAULT_SETTINGS, used: {} };
const run = (state: State, ...actions: Action[]) => actions.reduce(reduce, state);

describe('reducer', () => {
  it('walks a full round: deal, three reveals, clues, vote, result', () => {
    let s = run(home, { type: 'deal', round, used: { Food: ['Taco'] } });
    expect(s.phase).toBe('handoff');
    expect(s.used).toEqual({ Food: ['Taco'] });
    for (let i = 0; i < 3; i++) {
      s = run(s, { type: 'openCard' });
      expect(s.phase).toBe('reveal');
      s = run(s, { type: 'cardDone' });
    }
    expect(s.phase).toBe('clues');
    s = run(s, { type: 'cluesDone' });
    expect(s.phase).toBe('vote');
    s = run(s, { type: 'accuse', playerId: 'b' });
    expect(s.phase).toBe('result');
    s = run(s, { type: 'guess', guessed: false });
    expect(s.round?.imposterGuessed).toBe(false);
  });

  it('plays the configured number of clue rounds before voting', () => {
    let s = run({ ...home, settings: { ...DEFAULT_SETTINGS, clueRounds: 2 } }, { type: 'deal', round, used: {} });
    s = run(s, ...players.flatMap((): Action[] => [{ type: 'openCard' }, { type: 'cardDone' }]));
    expect(s.phase).toBe('clues');
    s = run(s, { type: 'cluesDone' });
    expect(s.phase).toBe('clues');
    expect(s.round?.clueRound).toBe(2);
    s = run(s, { type: 'cluesDone' });
    expect(s.phase).toBe('vote');
  });

  it('E4: an interruption during a reveal goes back to the same handoff', () => {
    let s = run(home, { type: 'deal', round, used: {} }, { type: 'openCard' }, { type: 'cardDone' }, { type: 'openCard' });
    expect(s.round?.revealIndex).toBe(1);
    s = run(s, { type: 'interrupt' });
    expect(s.phase).toBe('handoff');
    expect(s.round?.revealIndex).toBe(1);
  });

  it('P4: there is no action that goes back to an earlier reveal', () => {
    const s = run(home, { type: 'deal', round, used: {} }, { type: 'openCard' }, { type: 'cardDone' });
    expect(run(s, { type: 'interrupt' }).round?.revealIndex).toBe(1);
    expect(run(s, { type: 'cardDone' })).toBe(s);
  });

  it('ignores actions that do not fit the phase', () => {
    expect(run(home, { type: 'openCard' })).toBe(home);
    expect(run(home, { type: 'accuse', playerId: 'a' })).toBe(home);
    expect(run(home, { type: 'guess', guessed: true })).toBe(home);
    const handoff = run(home, { type: 'deal', round, used: {} });
    expect(run(handoff, { type: 'setPlayers', players: [] })).toBe(handoff);
    expect(run(handoff, { type: 'deal', round, used: {} })).toBe(handoff);
  });

  it('ignores accusing someone not at the table', () => {
    const vote: State = { ...home, phase: 'vote', round };
    expect(run(vote, { type: 'accuse', playerId: 'zzz' })).toBe(vote);
  });

  it('only asks for a guess when the Imposter was caught', () => {
    const wrong: State = { ...home, phase: 'result', round: { ...round, accusedId: 'a' } };
    expect(run(wrong, { type: 'guess', guessed: true })).toBe(wrong);
  });

  it('AC7: a new round from the result keeps the players', () => {
    const result: State = { ...home, phase: 'result', round: { ...round, accusedId: 'b' } };
    const next = { ...round, imposterId: 'c' };
    const s = run(result, { type: 'deal', round: next, used: {} });
    expect(s.phase).toBe('handoff');
    expect(s.players).toBe(players);
    expect(s.round?.revealIndex).toBe(0);
  });

  it('leaving the round drops it', () => {
    const s = run({ ...home, phase: 'result', round }, { type: 'goSetup' });
    expect(s.round).toBeUndefined();
  });
});

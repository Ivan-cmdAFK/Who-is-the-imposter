import type { Phase, Player, Round, Settings, UsedWords } from '../types';

export type State = {
  phase: Phase;
  players: Player[];
  settings: Settings;
  used: UsedWords;
  /** The round in play. Lives only in memory, never saved. */
  round?: Round;
};

export type Action =
  | { type: 'goHome' }
  | { type: 'goSetup' }
  | { type: 'setPlayers'; players: Player[] }
  | { type: 'setSettings'; settings: Settings }
  /** The caller deals (engine + word bank) so this reducer stays pure. */
  | { type: 'deal'; round: Round; used: UsedWords }
  | { type: 'openCard' }
  | { type: 'cardDone' }
  /** App went to the background mid-reveal: hide the card, back to the handoff. */
  | { type: 'interrupt' }
  | { type: 'cluesDone' }
  | { type: 'accuse'; playerId: string }
  | { type: 'guess'; guessed: boolean };

export function reduce(state: State, action: Action): State {
  const { phase, round } = state;
  switch (action.type) {
    case 'goHome':
      return { ...state, phase: 'home', round: undefined };
    case 'goSetup':
      return { ...state, phase: 'setup', round: undefined };
    case 'setPlayers':
      return phase === 'home' || phase === 'setup' ? { ...state, players: action.players } : state;
    case 'setSettings':
      return phase === 'home' || phase === 'setup' ? { ...state, settings: action.settings } : state;
    case 'deal':
      return phase === 'home' || phase === 'setup' || phase === 'result'
        ? { ...state, phase: 'handoff', round: action.round, used: action.used }
        : state;
    case 'openCard':
      return phase === 'handoff' ? { ...state, phase: 'reveal' } : state;
    case 'cardDone': {
      if (phase !== 'reveal' || !round) return state;
      const next = round.revealIndex + 1;
      return next >= round.players.length
        ? { ...state, phase: 'clues', round: { ...round, revealIndex: next } }
        : { ...state, phase: 'handoff', round: { ...round, revealIndex: next } };
    }
    case 'interrupt':
      return phase === 'reveal' ? { ...state, phase: 'handoff' } : state;
    case 'cluesDone': {
      if (phase !== 'clues' || !round) return state;
      return round.clueRound < state.settings.clueRounds
        ? { ...state, round: { ...round, clueRound: round.clueRound + 1 } }
        : { ...state, phase: 'vote' };
    }
    case 'accuse':
      if (phase !== 'vote' || !round || !round.players.some((p) => p.id === action.playerId)) return state;
      return { ...state, phase: 'result', round: { ...round, accusedId: action.playerId } };
    case 'guess':
      if (phase !== 'result' || !round || round.accusedId !== round.imposterId) return state;
      return { ...state, round: { ...round, imposterGuessed: action.guessed } };
  }
}

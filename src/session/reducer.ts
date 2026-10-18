import type { WordList } from '../data/wordLists';
import type { ThemeId } from '../themes';
import type { Phase, Player, Round, Settings, UsedWords } from '../types';

export type State = {
  phase: Phase;
  players: Player[];
  settings: Settings;
  used: UsedWords;
  theme: ThemeId;
  lists: WordList[];
  /** The custom list open in the editor (phase 'list'). */
  editingListId?: string;
  /** The round in play. Lives only in memory, never saved. */
  round?: Round;
};

export type Action =
  | { type: 'goHome' }
  | { type: 'goSetup' }
  | { type: 'goSettings' }
  | { type: 'openList'; listId: string }
  | { type: 'setPlayers'; players: Player[] }
  | { type: 'setSettings'; settings: Settings }
  | { type: 'setTheme'; theme: ThemeId }
  | { type: 'setLists'; lists: WordList[] }
  /** The caller deals (engine + word bank) so this reducer stays pure. */
  | { type: 'deal'; round: Round; used: UsedWords }
  | { type: 'openCard' }
  | { type: 'cardDone' }
  /** App went to the background mid-reveal: hide the card, back to the handoff. */
  | { type: 'interrupt' }
  | { type: 'cluesDone' }
  | { type: 'accuse'; playerId: string }
  | { type: 'guess'; guessed: boolean };

/** Phases where nothing secret is on screen, so tables, lists and looks can change. */
const EDITABLE: Phase[] = ['home', 'setup', 'settings', 'list'];

export function reduce(state: State, action: Action): State {
  const { phase, round } = state;
  const editable = EDITABLE.includes(phase);
  switch (action.type) {
    case 'goHome':
      return { ...state, phase: 'home', round: undefined, editingListId: undefined };
    case 'goSetup':
      return { ...state, phase: 'setup', round: undefined, editingListId: undefined };
    case 'goSettings':
      return editable ? { ...state, phase: 'settings', editingListId: undefined } : state;
    case 'openList':
      return editable && state.lists.some((l) => l.id === action.listId)
        ? { ...state, phase: 'list', editingListId: action.listId }
        : state;
    case 'setPlayers':
      return editable ? { ...state, players: action.players } : state;
    case 'setSettings':
      return editable ? { ...state, settings: action.settings } : state;
    case 'setTheme':
      return editable ? { ...state, theme: action.theme } : state;
    case 'setLists':
      // Selections pointing at deleted or hidden lists are ignored where they're read (activeSelection).
      return editable ? { ...state, lists: action.lists } : state;
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

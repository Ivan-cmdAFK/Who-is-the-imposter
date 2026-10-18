import { useEffect, useMemo, useReducer, useState } from 'preact/hooks';
import rawWords from './data/words.json';
import { browserStore, loadPlayers, loadSettings, loadUsed, savePlayers, saveSettings, saveUsed } from './data/storage';
import { categoriesOf, drawWord, loadWords } from './data/wordBank';
import { newRound, validatePlayers } from './engine/game';
import { cryptoRng } from './rng';
import { reduce, type State } from './session/reducer';
import { CluesView } from './views/CluesView';
import { HandoffView } from './views/HandoffView';
import { HomeView } from './views/HomeView';
import { ResultView } from './views/ResultView';
import { RevealView } from './views/RevealView';
import { SetupView } from './views/SetupView';
import { VoteView } from './views/VoteView';

const WORDS = loadWords(rawWords);
const CATEGORIES = categoriesOf(WORDS);
const store = browserStore();

function initialState(): State {
  return {
    phase: 'home',
    players: loadPlayers(store),
    settings: loadSettings(store),
    used: loadUsed(store),
  };
}

export function App() {
  const [state, dispatch] = useReducer(reduce, undefined, initialState);
  const [covered, setCovered] = useState(false);
  const { phase, players, settings, round } = state;
  const validation = useMemo(() => validatePlayers(players), [players]);
  const isPrivate = phase === 'handoff' || phase === 'reveal';

  useEffect(() => savePlayers(store, players), [players]);
  useEffect(() => saveSettings(store, settings), [settings]);
  useEffect(() => saveUsed(store, state.used), [state.used]);

  // Dark page behind private screens; theme color matches so the status bar area blends in.
  useEffect(() => {
    document.body.dataset.mode = isPrivate ? 'private' : 'group';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isPrivate ? '#151515' : '#F3F1EC');
  }, [isPrivate]);

  // Blank the screen when the app is backgrounded, and never resume mid-reveal.
  useEffect(() => {
    const onHide = () => {
      setCovered(true);
      dispatch({ type: 'interrupt' });
    };
    const onVisibility = () => (document.hidden ? onHide() : setCovered(false));
    const onShow = () => setCovered(false);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onHide);
    window.addEventListener('pageshow', onShow);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('pageshow', onShow);
    };
  }, []);

  useEffect(() => window.scrollTo(0, 0), [phase, round?.revealIndex]);

  const deal = () => {
    const v = validatePlayers(players);
    if (!v.ok) return;
    const { entry, used } = drawWord(WORDS, settings.categories, state.used, cryptoRng);
    dispatch({ type: 'setPlayers', players: v.cleaned });
    dispatch({ type: 'deal', round: newRound(v.cleaned, entry, cryptoRng), used });
  };

  const toggleCategory = (c: string) => {
    const has = settings.categories.includes(c);
    dispatch({
      type: 'setSettings',
      settings: { ...settings, categories: has ? settings.categories.filter((x) => x !== c) : [...settings.categories, c] },
    });
  };

  return (
    <>
      {phase === 'home' && (
        <HomeView
          players={players}
          settings={settings}
          categories={CATEGORIES}
          validation={validation}
          onToggleCategory={toggleCategory}
          onEditPlayers={() => dispatch({ type: 'goSetup' })}
          onDeal={deal}
        />
      )}
      {phase === 'setup' && (
        <SetupView
          players={players}
          settings={settings}
          validation={validation}
          onPlayers={(p) => dispatch({ type: 'setPlayers', players: p })}
          onSettings={(s) => dispatch({ type: 'setSettings', settings: s })}
          onBack={() => dispatch({ type: 'goHome' })}
          onStart={deal}
        />
      )}
      {phase === 'handoff' && round && (
        <HandoffView
          player={round.players[round.revealIndex]}
          index={round.revealIndex}
          total={round.players.length}
          onOpen={() => dispatch({ type: 'openCard' })}
        />
      )}
      {phase === 'reveal' && round && (
        <RevealView
          key={round.revealIndex}
          round={round}
          showCategoryHint={settings.showCategoryHint}
          onDone={() => dispatch({ type: 'cardDone' })}
        />
      )}
      {phase === 'clues' && round && (
        <CluesView
          round={round}
          totalRounds={settings.clueRounds}
          showCategoryHint={settings.showCategoryHint}
          onDone={() => dispatch({ type: 'cluesDone' })}
        />
      )}
      {phase === 'vote' && round && (
        <VoteView players={round.players} onAccuse={(id) => dispatch({ type: 'accuse', playerId: id })} />
      )}
      {phase === 'result' && round && (
        <ResultView
          round={round}
          onGuess={(guessed) => dispatch({ type: 'guess', guessed })}
          onNewRound={deal}
          onChangePlayers={() => dispatch({ type: 'goSetup' })}
        />
      )}
      {covered && <div class="cover" aria-hidden="true" />}
    </>
  );
}

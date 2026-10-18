import { useEffect, useMemo, useReducer, useState } from 'preact/hooks';
import rawWords from './data/words.json';
import {
  browserStore,
  loadLists,
  loadPlayers,
  loadSettings,
  loadTheme,
  loadUsed,
  saveLists,
  savePlayers,
  saveSettings,
  saveTheme,
  saveUsed,
} from './data/storage';
import { categoriesOf, drawWord, loadWords } from './data/wordBank';
import { activeSelection, customEntries, freshListName, isPlayable, type WordList } from './data/wordLists';
import { newRound, validatePlayers } from './engine/game';
import { cryptoRng } from './rng';
import { reduce, type State } from './session/reducer';
import { applyTheme, PRIVATE_BG, themeById } from './themes';
import { CluesView } from './views/CluesView';
import { HandoffView } from './views/HandoffView';
import { HomeView, type CategoryOption } from './views/HomeView';
import { ResultView } from './views/ResultView';
import { RevealView } from './views/RevealView';
import { SettingsView } from './views/SettingsView';
import { SetupView } from './views/SetupView';
import { VoteView } from './views/VoteView';
import { WordListView } from './views/WordListView';

const WORDS = loadWords(rawWords);
const BUILT_IN = categoriesOf(WORDS);
const store = browserStore();

function initialState(): State {
  return {
    phase: 'home',
    players: loadPlayers(store),
    settings: loadSettings(store),
    used: loadUsed(store),
    theme: loadTheme(store),
    lists: loadLists(store),
  };
}

export function App() {
  const [state, dispatch] = useReducer(reduce, undefined, initialState);
  const [covered, setCovered] = useState(false);
  const { phase, players, settings, round, lists } = state;
  const validation = useMemo(() => validatePlayers(players), [players]);
  const theme = themeById(state.theme);
  const isPrivate = phase === 'handoff' || phase === 'reveal';

  useEffect(() => savePlayers(store, players), [players]);
  useEffect(() => saveSettings(store, settings), [settings]);
  useEffect(() => saveUsed(store, state.used), [state.used]);
  useEffect(() => saveTheme(store, state.theme), [state.theme]);
  useEffect(() => saveLists(store, lists), [lists]);

  useEffect(() => applyTheme(theme), [theme]);

  // Dark page behind private screens; theme color matches so the status bar area blends in.
  useEffect(() => {
    document.body.dataset.mode = isPrivate ? 'private' : 'group';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', isPrivate ? PRIVATE_BG : theme.bg);
  }, [isPrivate, theme]);

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

  const categoryOptions: CategoryOption[] = useMemo(
    () => [
      ...BUILT_IN.map((c) => ({ id: c, name: c, playable: true })),
      ...lists.filter((l) => l.visible).map((l) => ({ id: l.id, name: l.name, playable: isPlayable(l) })),
    ],
    [lists],
  );
  const active = useMemo(() => activeSelection(settings.categories, BUILT_IN, lists), [settings.categories, lists]);
  const categoryName = (id: string) => lists.find((l) => l.id === id)?.name ?? id;
  /** Names a list can't take: built-in categories and every other custom list. */
  const takenNames = (exceptId?: string) => [...BUILT_IN, ...lists.filter((l) => l.id !== exceptId).map((l) => l.name)];

  const deal = () => {
    const v = validatePlayers(players);
    if (!v.ok) return;
    // Nothing selected deals from the built-in lists only.
    const pool = active.length > 0 ? [...WORDS, ...customEntries(lists)] : WORDS;
    const { entry, used } = drawWord(pool, active, state.used, cryptoRng);
    const secret = { word: entry.word, category: categoryName(entry.category) };
    dispatch({ type: 'setPlayers', players: v.cleaned });
    dispatch({ type: 'deal', round: newRound(v.cleaned, secret, cryptoRng), used });
  };

  const toggleCategory = (id: string) => {
    const has = settings.categories.includes(id);
    dispatch({
      type: 'setSettings',
      settings: { ...settings, categories: has ? settings.categories.filter((x) => x !== id) : [...settings.categories, id] },
    });
  };

  const setLists = (next: WordList[]) => dispatch({ type: 'setLists', lists: next });
  const newList = () => {
    const list: WordList = {
      id: crypto.randomUUID(),
      name: freshListName(takenNames()),
      words: [],
      visible: true,
    };
    setLists([...lists, list]);
    dispatch({ type: 'openList', listId: list.id });
  };
  const editing = lists.find((l) => l.id === state.editingListId);

  return (
    <>
      {phase === 'home' && (
        <HomeView
          players={players}
          categories={categoryOptions}
          active={active}
          validation={validation}
          onToggleCategory={toggleCategory}
          onEditPlayers={() => dispatch({ type: 'goSetup' })}
          onOpenSettings={() => dispatch({ type: 'goSettings' })}
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
      {phase === 'settings' && (
        <SettingsView
          theme={state.theme}
          lists={lists}
          builtInLists={BUILT_IN.length}
          builtInWords={WORDS.length}
          onTheme={(t) => dispatch({ type: 'setTheme', theme: t })}
          onOpenList={(id) => dispatch({ type: 'openList', listId: id })}
          onNewList={newList}
          onBack={() => dispatch({ type: 'goHome' })}
        />
      )}
      {phase === 'list' && editing && (
        <WordListView
          key={editing.id}
          list={editing}
          takenNames={takenNames(editing.id)}
          onChange={(l) => setLists(lists.map((x) => (x.id === l.id ? l : x)))}
          onDelete={() => {
            setLists(lists.filter((x) => x.id !== editing.id));
            dispatch({ type: 'goSettings' });
          }}
          onBack={() => dispatch({ type: 'goSettings' })}
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
          key={round.clueRound}
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

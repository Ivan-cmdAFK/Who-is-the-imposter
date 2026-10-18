import { MAX_LISTS, type WordList } from '../data/wordLists';
import { THEMES, type ThemeId } from '../themes';
import { plural } from './format';
import { ChevronLeft, ChevronRight, Plus } from './icons';

type Props = {
  theme: ThemeId;
  lists: WordList[];
  builtInLists: number;
  builtInWords: number;
  onTheme: (theme: ThemeId) => void;
  onOpenList: (listId: string) => void;
  onNewList: () => void;
  onBack: () => void;
};

export function SettingsView({ theme, lists, builtInLists, builtInWords, onTheme, onOpenList, onNewList, onBack }: Props) {
  return (
    <main class="screen">
      <div class="topbar">
        <button type="button" class="icon-btn" aria-label="Back to home" onClick={onBack}>
          <ChevronLeft />
        </button>
        <span class="mono">VERSION {__APP_VERSION__}</span>
      </div>

      <h1 class="display md" style={{ marginTop: '4px' }}>
        Make it yours
      </h1>

      <h2 class="section-label" style={{ marginTop: '20px' }}>
        Theme
      </h2>
      <div class="theme-grid" role="radiogroup" aria-label="Theme">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            class="theme-card"
            aria-checked={t.id === theme ? 'true' : 'false'}
            onClick={() => onTheme(t.id)}
          >
            <span class="swatch" aria-hidden="true" style={{ background: t.bg }}>
              <span class="swatch-dot" style={{ background: t.stamp }} />
              <span class="swatch-bar" style={{ background: t.ink }} />
            </span>
            <span class="theme-text">
              <span class="theme-name">{t.name}</span>
              <span class="theme-blurb">{t.blurb}</span>
            </span>
          </button>
        ))}
      </div>
      <p class="hint">
        Passing screens always stay dark, whatever the theme.
      </p>

      <h2 class="section-label" style={{ marginTop: '22px', marginBottom: '6px' }}>
        Word lists
      </h2>
      <ul class="list-rows">
        <li>
          <div class="list-row">
            <span class="list-name">Built-in</span>
            <span class="mono">
              {plural(builtInLists, 'LIST', 'LISTS')} · {builtInWords} WORDS
            </span>
          </div>
        </li>
        {lists.map((l) => (
          <li key={l.id}>
            <button type="button" class="list-row" onClick={() => onOpenList(l.id)}>
              <span class="list-name">{l.name}</span>
              <span class="mono list-meta">
                {plural(l.words.length, 'WORD', 'WORDS')}
                {!l.visible && ' · HIDDEN'}
                <ChevronRight />
              </span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" class="btn-dashed" disabled={lists.length >= MAX_LISTS} onClick={onNewList}>
        <Plus />
        {lists.length >= MAX_LISTS ? `${MAX_LISTS} lists is the limit` : 'New word list'}
      </button>
    </main>
  );
}

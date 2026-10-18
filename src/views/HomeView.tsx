import { MIN_PLAYABLE } from '../data/wordLists';
import type { Validation } from '../engine/game';
import type { Player } from '../types';
import { fitFont, SCREEN_WIDTH, seatLabel } from './format';
import { ArrowRight, Sliders } from './icons';

/** A category chip: a built-in category or a custom word list. */
export type CategoryOption = {
  id: string;
  name: string;
  /** False for a custom list with too few words. */
  playable: boolean;
};

type Props = {
  players: Player[];
  categories: CategoryOption[];
  /** Selected ids that can be dealt from (see activeSelection). */
  active: string[];
  validation: Validation;
  onToggleCategory: (id: string) => void;
  onEditPlayers: () => void;
  onOpenSettings: () => void;
  onDeal: () => void;
};

export function HomeView({
  players,
  categories,
  active,
  validation,
  onToggleCategory,
  onEditPlayers,
  onOpenSettings,
  onDeal,
}: Props) {
  const picked = categories.filter((c) => active.includes(c.id));
  const summary = picked.length === 0 ? 'ALL BUILT-IN' : picked.map((c) => c.name).join(', ').toUpperCase();

  return (
    <main class="screen">
      <div class="topbar mono">
        <span>3–12 PLAYERS</span>
        <button type="button" class="icon-btn end" aria-label="Themes and word lists" onClick={onOpenSettings}>
          <Sliders />
        </button>
      </div>

      <h1 class="display xl" style={{ marginTop: '4px', fontSize: fitFont('Imposter', 92, SCREEN_WIDTH) }}>
        Imposter
      </h1>
      <p style={{ margin: '16px 0 0', fontSize: '19px', lineHeight: 1.3, maxWidth: '300px' }}>
        Everyone gets the same secret word. Except one of you.
      </p>

      <hr class="rule" style={{ marginTop: '28px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
        <h2 class="section-label" style={{ margin: 0 }}>
          Tonight's table
        </h2>
        <button type="button" class="link" onClick={onEditPlayers}>
          {players.length === 0 ? 'Add players' : 'Edit players'}
        </button>
      </div>
      {players.length === 0 ? (
        <p class="lede" style={{ marginTop: '4px' }}>
          Nobody's sitting down yet. Add at least 3 players.
        </p>
      ) : (
        <ol class="table-list">
          {players.map((p, i) => (
            <li key={p.id}>
              <span class="mono">{seatLabel(i)}</span>
              <span class="name">{p.name.trim() || '(no name)'}</span>
            </li>
          ))}
        </ol>
      )}

      <h2 class="section-label">Words from</h2>
      <div class="chips">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            class="chip"
            disabled={!c.playable}
            aria-pressed={active.includes(c.id) ? 'true' : 'false'}
            onClick={() => onToggleCategory(c.id)}
          >
            {c.name}
            {!c.playable && <span class="chip-note"> · needs {MIN_PLAYABLE} words</span>}
          </button>
        ))}
      </div>

      <div class="spacer" />

      {validation.ok ? (
        <button type="button" class="btn btn-primary btn-split" onClick={onDeal}>
          <span>Deal a round</span>
          <ArrowRight />
        </button>
      ) : (
        <button type="button" class="btn btn-primary btn-split" onClick={onEditPlayers}>
          <span>Set up players</span>
          <ArrowRight />
        </button>
      )}
      <p class="mono" style={{ margin: '10px 0 0', textAlign: 'center' }}>
        {players.length} PLAYERS · 1 IMPOSTER · {summary}
      </p>
    </main>
  );
}

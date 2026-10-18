import type { Validation } from '../engine/game';
import { fitFont, SCREEN_WIDTH, seatLabel } from './format';
import { ArrowRight } from './icons';
import type { Player, Settings } from '../types';

type Props = {
  players: Player[];
  settings: Settings;
  categories: string[];
  validation: Validation;
  onToggleCategory: (category: string) => void;
  onEditPlayers: () => void;
  onDeal: () => void;
};

export function HomeView({ players, settings, categories, validation, onToggleCategory, onEditPlayers, onDeal }: Props) {
  const picked = settings.categories.filter((c) => categories.includes(c));
  const summary = picked.length === 0 ? 'ALL CATEGORIES' : picked.join(', ').toUpperCase();

  return (
    <main class="screen">
      <div class="topbar mono">
        <span>3–12 PLAYERS</span>
        <span>ONE PHONE</span>
      </div>

      <h1 class="display xl" style={{ marginTop: '12px', fontSize: fitFont('Imposter', 92, SCREEN_WIDTH) }}>
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
            key={c}
            type="button"
            class="chip"
            aria-pressed={picked.includes(c) ? 'true' : 'false'}
            onClick={() => onToggleCategory(c)}
          >
            {c}
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

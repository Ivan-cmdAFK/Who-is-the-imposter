import { useState } from 'preact/hooks';
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS, type NameError, type Validation } from '../engine/game';
import type { Player, Settings } from '../types';
import { plural, seatLabel } from './format';
import { ChevronLeft, Cross } from './icons';

type Props = {
  players: Player[];
  settings: Settings;
  validation: Validation;
  onPlayers: (players: Player[]) => void;
  onSettings: (settings: Settings) => void;
  onBack: () => void;
  onStart: () => void;
};

const ERROR_TEXT: Record<NameError, string> = {
  blank: 'Needs a name.',
  duplicate: 'Already at the table. Add an initial?',
  'too-long': `Keep it to ${MAX_NAME_LENGTH} characters.`,
};

export function SetupView({ players, settings, validation, onPlayers, onSettings, onBack, onStart }: Props) {
  const [draft, setDraft] = useState('');
  const full = players.length >= MAX_PLAYERS;

  const rename = (id: string, name: string) => onPlayers(players.map((p) => (p.id === id ? { ...p, name } : p)));
  const remove = (id: string) => onPlayers(players.filter((p) => p.id !== id));
  const add = (e: Event) => {
    e.preventDefault();
    const name = draft.trim();
    if (!name || full) return;
    onPlayers([...players, { id: crypto.randomUUID(), name: name.slice(0, MAX_NAME_LENGTH) }]);
    setDraft('');
  };

  const badNames = Object.keys(validation.nameErrors).length;
  const startLabel =
    validation.countError === 'too-few'
      ? `Add ${plural(MIN_PLAYERS - players.length, 'more player')}`
      : badNames > 0
        ? `Fix ${plural(badNames, 'name')} to start`
        : 'Start game';

  return (
    <main class="screen">
      <div class="topbar">
        <button type="button" class="icon-btn" aria-label="Back to home" onClick={onBack}>
          <ChevronLeft />
        </button>
        <span class="mono">
          {players.length} OF {MAX_PLAYERS} SEATS
        </span>
      </div>

      <h1 class="display md" style={{ marginTop: '8px' }}>
        Who's playing
      </h1>
      <p class="lede" style={{ margin: '4px 0 14px', fontSize: '15px' }}>
        In seating order. Clues go around the table this way.
      </p>

      <ol class="seat-list">
        {players.map((p, i) => {
          const error = validation.nameErrors[p.id];
          return (
            <li key={p.id}>
              <div class="seat-row">
                <span class="mono">{seatLabel(i)}</span>
                <input
                  type="text"
                  value={p.name}
                  maxLength={MAX_NAME_LENGTH}
                  autocomplete="off"
                  aria-label={`Player ${i + 1} name`}
                  aria-invalid={error ? 'true' : 'false'}
                  onInput={(e) => rename(p.id, e.currentTarget.value)}
                />
                <button type="button" class="icon-btn" aria-label={`Remove ${p.name || `player ${i + 1}`}`} onClick={() => remove(p.id)}>
                  <Cross />
                </button>
              </div>
              {error && <p class="field-error">{ERROR_TEXT[error]}</p>}
            </li>
          );
        })}
      </ol>

      <form class="add-row" onSubmit={add}>
        <label style={{ flexGrow: 1, display: 'flex' }}>
          <span class="sr-only">New player name</span>
          <input
            type="text"
            value={draft}
            maxLength={MAX_NAME_LENGTH}
            autocomplete="off"
            enterkeyhint="done"
            placeholder={full ? 'The table is full' : 'Add a player'}
            disabled={full}
            onInput={(e) => setDraft(e.currentTarget.value)}
          />
        </label>
        <button type="submit" class="btn-small" disabled={full || !draft.trim()}>
          Add
        </button>
      </form>

      <h2 class="section-label" style={{ marginTop: '26px', marginBottom: 0 }}>
        House rules
      </h2>
      <div class="setting">
        <div>
          <div class="setting-title">Imposter sees the category</div>
          <div class="setting-sub">A small hint so they can bluff</div>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          aria-checked={settings.showCategoryHint ? 'true' : 'false'}
          aria-label="Imposter sees the category"
          onClick={() => onSettings({ ...settings, showCategoryHint: !settings.showCategoryHint })}
        >
          <span />
        </button>
      </div>
      <div class="setting">
        <div class="setting-title">Clue rounds</div>
        <div class="segmented" role="group" aria-label="Clue rounds">
          {([1, 2, 3] as const).map((n) => (
            <button
              key={n}
              type="button"
              class="mono"
              style={{ fontSize: '15px', color: 'inherit' }}
              aria-pressed={settings.clueRounds === n ? 'true' : 'false'}
              onClick={() => onSettings({ ...settings, clueRounds: n })}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div class="spacer" />

      <button type="button" class="btn btn-primary" disabled={!validation.ok} onClick={onStart}>
        {startLabel}
      </button>
      <p class="mono" style={{ margin: '12px 0 0', textAlign: 'center' }}>
        VERSION {__APP_VERSION__}
      </p>
    </main>
  );
}

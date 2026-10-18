import { useState } from 'preact/hooks';
import type { Player } from '../types';
import { seatLabel } from './format';

type Props = {
  players: Player[];
  onAccuse: (playerId: string) => void;
};

export function VoteView({ players, onAccuse }: Props) {
  const [picked, setPicked] = useState<string>();
  const [split, setSplit] = useState(false);
  const accused = players.find((p) => p.id === picked);

  return (
    <main class="screen">
      <div class="topbar mono">THE VOTE</div>

      <h1 class="display lg" style={{ marginTop: '18px' }}>
        Who's the imposter?
      </h1>
      <p class="lede">Argue it out. When the table agrees, tap the accused.</p>

      <div class="vote-grid" role="radiogroup" aria-label="Accused player">
        {players.map((p, i) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={picked === p.id ? 'true' : 'false'}
            onClick={() => {
              setPicked(p.id);
              setSplit(false);
            }}
          >
            <span class="seat">{seatLabel(i)}</span>
            <span class="who">{p.name}</span>
          </button>
        ))}
      </div>

      {split && <p class="notice">No verdict yet. Talk it through, then vote again.</p>}

      <div class="spacer" />

      <button type="button" class="btn btn-primary" disabled={!accused} onClick={() => accused && onAccuse(accused.id)}>
        {accused ? `Accuse ${accused.name}` : 'Pick someone to accuse'}
      </button>
      <button
        type="button"
        class="btn btn-text"
        onClick={() => {
          setPicked(undefined);
          setSplit(true);
        }}
      >
        We're split, talk some more
      </button>
    </main>
  );
}

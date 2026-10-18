import { clueOrder } from '../engine/game';
import type { Round } from '../types';
import { fitFont, SCREEN_WIDTH, seatLabel } from './format';

type Props = {
  round: Round;
  totalRounds: number;
  showCategoryHint: boolean;
  onDone: () => void;
};

export function CluesView({ round, totalRounds, showCategoryHint, onDone }: Props) {
  const order = clueOrder(round);
  const starter = order[0];
  const lastRound = round.clueRound >= totalRounds;

  return (
    <main class="screen">
      <div class="topbar mono">
        <span>
          ROUND {round.clueRound} OF {totalRounds}
        </span>
        {showCategoryHint && <span class="pill">CATEGORY: {round.secret.category.toUpperCase()}</span>}
      </div>

      <h1 class="display lg" style={{ marginTop: '18px', fontSize: fitFont(`${starter.name} starts`, 64, SCREEN_WIDTH) }}>
        {starter.name} starts
      </h1>
      <p class="lede">Go around the table in this order. One word each, out loud.</p>

      <ol class="order-list">
        {order.map((p, i) => (
          <li key={p.id} class={i === 0 ? 'first' : ''}>
            <span class="pos">{i + 1}</span>
            <span class="who">{p.name}</span>
            {i === 0 && <span class="tag">FIRST</span>}
            <span class="mono" style={{ width: '22px', textAlign: 'right' }}>
              {seatLabel(round.players.indexOf(p))}
            </span>
          </li>
        ))}
      </ol>

      <div class="spacer" />

      <button type="button" class="btn btn-primary" onClick={onDone}>
        {lastRound ? "Everyone's given a clue" : 'Next clue round'}
      </button>
    </main>
  );
}

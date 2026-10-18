import type { Player } from '../types';
import { fitFont, SCREEN_WIDTH } from './format';

type Props = {
  player: Player;
  index: number;
  total: number;
  onOpen: () => void;
};

export function HandoffView({ player, index, total, onOpen }: Props) {
  return (
    <main class="screen private">
      <div class="topbar mono" style={{ minHeight: 0 }}>
        <span>DEALING</span>
        <span>
          {index + 1} OF {total}
        </span>
      </div>
      <div class="ticks" aria-hidden="true" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} class={i < index ? 'done' : i === index ? 'now' : ''} />
        ))}
      </div>

      <div class="handoff-body">
        <p class="lede" style={{ margin: 0, fontSize: '20px' }}>
          Pass the phone to
        </p>
        <h1 class="display name" style={{ marginTop: '6px', fontSize: fitFont(player.name, 132, SCREEN_WIDTH) }}>
          {player.name}
        </h1>
        <p class="lede" style={{ marginTop: '22px', fontSize: '17px', maxWidth: '290px' }}>
          Only {player.name} should see the next screen. Everyone else, look away.
        </p>
      </div>

      <button type="button" class="btn btn-light" onClick={onOpen}>
        I'm {player.name}
      </button>
      <p class="lede" style={{ margin: '12px 0 0', textAlign: 'center', maxWidth: 'none', fontSize: '14px' }}>
        Wrong person? Just hand it on.
      </p>
    </main>
  );
}

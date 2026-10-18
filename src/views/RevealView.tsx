import { useEffect, useState } from 'preact/hooks';
import type { Player, Round } from '../types';
import { fitFont, seatLabel } from './format';
import { Hand } from './icons';

/** The card is at most 300px wide with 22px padding each side. */
const CARD_TEXT_WIDTH = '(min(300px, 100vw - 48px) - 44px)';

type Props = {
  round: Round;
  showCategoryHint: boolean;
  onDone: () => void;
};

/**
 * Privacy rules (plan, Section 3):
 * - The role is only in the DOM while the card is held, not hidden with CSS.
 * - The word card and the Imposter card share one layout; only the words differ.
 * - Done stays disabled until the card has been seen once.
 */
export function RevealView({ round, showCategoryHint, onDone }: Props) {
  const [holding, setHolding] = useState(false);
  const [seen, setSeen] = useState(false);
  const player = round.players[round.revealIndex];
  const seat = seatLabel(round.revealIndex);

  // Let go of the card if the page is hidden mid-hold.
  useEffect(() => {
    const release = () => setHolding(false);
    document.addEventListener('visibilitychange', release);
    window.addEventListener('blur', release);
    return () => {
      document.removeEventListener('visibilitychange', release);
      window.removeEventListener('blur', release);
    };
  }, []);

  const start = () => {
    setHolding(true);
    setSeen(true);
  };
  const stop = () => setHolding(false);

  return (
    <main class="screen private">
      <div class="topbar" style={{ alignItems: 'baseline' }}>
        <span
          style={{
            fontFamily: 'var(--display)',
            fontSize: '22px',
            fontWeight: 700,
            fontStretch: '75%',
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          {player.name}
        </span>
        <span class="mono">SEAT {seat}</span>
      </div>

      <div class="reveal-body">
        <button
          type="button"
          class={holding ? 'card card-face' : 'card card-back'}
          aria-label={holding ? undefined : 'Press and hold to see your card'}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            start();
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              start();
            }
          }}
          onKeyUp={stop}
          onBlur={stop}
          onContextMenu={(e) => e.preventDefault()}
        >
          {holding ? <CardFace round={round} player={player} seat={seat} showCategoryHint={showCategoryHint} /> : <CardBack />}
        </button>
        <p class="reveal-note">
          {holding ? 'Let go to hide it.' : 'Press and hold the card to see it. Let go and it hides again.'}
        </p>
      </div>

      <button type="button" class="btn btn-ghost" disabled={!seen} onClick={onDone}>
        {seen ? 'Done, pass it on' : 'Hold the card first'}
      </button>
    </main>
  );
}

function CardBack() {
  return (
    <span class="card-back-inner">
      <span class="hold-target">
        <Hand />
        HOLD
      </span>
    </span>
  );
}

function CardFace({
  round,
  player,
  seat,
  showCategoryHint,
}: {
  round: Round;
  player: Player;
  seat: string;
  showCategoryHint: boolean;
}) {
  const imposter = player.id === round.imposterId;
  const big = imposter ? 'Imposter' : round.secret.word;
  return (
    <>
      <span class="corner">
        <span>{showCategoryHint ? round.secret.category : 'No hint'}</span>
        <span>{seat}</span>
      </span>
      <span class="middle">
        <span class="kicker">{imposter ? 'You are the' : 'Your word is'}</span>
        <span class="big" style={{ fontSize: fitFont(big, 76, CARD_TEXT_WIDTH) }}>
          {big}
        </span>
      </span>
      <span class="tip">
        {imposter
          ? 'Listen to the others, work out the word, and give a clue that fits in.'
          : "When it's your turn, say one word that hints at it. Not too obvious."}
      </span>
    </>
  );
}

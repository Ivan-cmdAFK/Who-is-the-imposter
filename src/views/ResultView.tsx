import { outcome } from '../engine/game';
import type { Round } from '../types';
import { fitFont, SCREEN_WIDTH } from './format';

type Props = {
  round: Round;
  onGuess: (guessed: boolean) => void;
  onNewRound: () => void;
  onChangePlayers: () => void;
};

export function ResultView({ round, onGuess, onNewRound, onChangePlayers }: Props) {
  const imposter = round.players.find((p) => p.id === round.imposterId)!;
  const accused = round.players.find((p) => p.id === round.accusedId);
  const caught = round.accusedId === round.imposterId;
  const winner = outcome(round);

  return (
    <main class="screen">
      <div class="topbar mono">THE REVEAL</div>

      <p class="lede" style={{ marginTop: '20px', fontSize: '20px' }}>
        The imposter was
      </p>
      <div class="verdict">
        <h1 class="display" style={{ fontSize: fitFont(imposter.name, 148, SCREEN_WIDTH), lineHeight: 0.85, letterSpacing: '-1px' }}>
          {imposter.name}
        </h1>
        <div class="stamp" aria-label={caught ? 'Caught' : 'Got away'}>
          {caught ? 'Caught' : 'Got away'}
        </div>
      </div>

      <hr class="rule" style={{ marginTop: '24px' }} />
      <div class="word-line">
        <span style={{ fontSize: '16px', color: 'var(--muted)' }}>The word was</span>
        <span class="big">{round.secret.word}</span>
      </div>

      {caught ? (
        <>
          <h2 style={{ margin: '22px 0 4px', fontSize: '19px', fontWeight: 600 }}>{imposter.name} gets one guess</h2>
          <p class="lede" style={{ margin: '0 0 12px', fontSize: '15px' }}>
            {imposter.name} says a word out loud. Did it match?
          </p>
          <div class="segmented wide" role="group" aria-label={`Did ${imposter.name} guess the word`}>
            <button
              type="button"
              aria-pressed={round.imposterGuessed === true ? 'true' : 'false'}
              onClick={() => onGuess(true)}
            >
              Guessed it
            </button>
            <button
              type="button"
              aria-pressed={round.imposterGuessed === false ? 'true' : 'false'}
              onClick={() => onGuess(false)}
            >
              Missed it
            </button>
          </div>
        </>
      ) : (
        <p class="lede" style={{ marginTop: '22px', fontSize: '17px' }}>
          The table accused {accused?.name}.
        </p>
      )}

      {winner && (
        <p class="winner" role="status">
          {winner === 'group' ? 'The table wins this round.' : `${imposter.name} wins this round.`}
        </p>
      )}

      <div class="spacer" />

      <button type="button" class="btn btn-primary" onClick={onNewRound}>
        New round, same table
      </button>
      <button type="button" class="btn btn-text" onClick={onChangePlayers}>
        Change players
      </button>
    </main>
  );
}

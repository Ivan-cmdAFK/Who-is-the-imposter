import { useEffect, useState } from 'preact/hooks';
import {
  addWords,
  checkListName,
  describeAdd,
  isPlayable,
  listToText,
  MAX_LIST_NAME,
  MAX_WORD_LENGTH,
  MIN_PLAYABLE,
  type NameProblem,
  type WordList,
} from '../data/wordLists';
import { plural } from './format';
import { ChevronLeft, Cross } from './icons';

type Props = {
  list: WordList;
  /** Every other list's name, built-in ones included. */
  takenNames: string[];
  onChange: (list: WordList) => void;
  onDelete: () => void;
  onBack: () => void;
};

const NAME_TEXT: Record<NameProblem, string> = {
  blank: 'Give the list a name.',
  'too-long': `Keep it to ${MAX_LIST_NAME} characters.`,
  taken: 'Another list already has that name.',
};

type Note = { text: string; error: boolean };

export function WordListView({ list, takenNames, onChange, onDelete, onBack }: Props) {
  const [name, setName] = useState(list.name);
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState<Note>();
  const [confirming, setConfirming] = useState(false);
  const nameProblem = checkListName(name, takenNames);

  // "Tap again to delete" quietly resets after a few seconds.
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(t);
  }, [confirming]);

  /** Saves the name when the field is left; an invalid name goes back to the saved one. */
  const commitName = () => {
    if (nameProblem) setName(list.name);
    else if (name.trim() !== list.name) onChange({ ...list, name: name.trim() });
  };

  const add = (input: string) => {
    const r = addWords(list.words, input);
    if (r.added.length > 0) onChange({ ...list, words: r.words });
    const text = describeAdd(r, input);
    setNote(text ? { text, error: r.added.length === 0 } : undefined);
    if (r.added.length > 0 || r.duplicates > 0) setDraft('');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(listToText(list));
      setNote({ text: `Copied ${plural(list.words.length, 'word')}. Paste them into a list on another phone.`, error: false });
    } catch {
      setNote({ text: "Couldn't copy. Try again, or long-press a word to select it.", error: true });
    }
  };

  const missing = MIN_PLAYABLE - list.words.length;

  return (
    <main class="screen">
      <div class="topbar">
        <button type="button" class="back-link" onClick={onBack}>
          <ChevronLeft />
          Word lists
        </button>
        <span class="mono">SAVED</span>
      </div>

      <label class="list-title">
        <span class="section-label" style={{ margin: 0, display: 'block' }}>
          List name
        </span>
        <input
          type="text"
          value={name}
          maxLength={MAX_LIST_NAME + 5}
          autocomplete="off"
          aria-invalid={nameProblem ? 'true' : 'false'}
          class="display"
          enterkeyhint="done"
          onInput={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          onBlur={commitName}
        />
      </label>
      {nameProblem && <p class="field-error" style={{ margin: '6px 0 0' }}>{NAME_TEXT[nameProblem]}</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '18px' }}>
        <h2 class="section-label" style={{ margin: 0 }}>
          Words
        </h2>
        <span class="mono">
          {isPlayable(list) ? `${list.words.length} WORDS · READY TO PLAY` : `${list.words.length} · ADD ${missing} MORE TO PLAY`}
        </span>
      </div>

      {list.words.length > 0 ? (
        <ul class="word-chips">
          {list.words.map((w) => (
            <li key={w}>
              <span>{w}</span>
              <button
                type="button"
                aria-label={`Remove ${w}`}
                onClick={() => onChange({ ...list, words: list.words.filter((x) => x !== w) })}
              >
                <Cross size={14} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p class="lede" style={{ marginTop: '8px' }}>
          No words yet. Add a few things only your group would get.
        </p>
      )}

      <form
        class="add-row"
        style={{ marginTop: '16px' }}
        onSubmit={(e) => {
          e.preventDefault();
          add(draft);
        }}
      >
        <label style={{ flexGrow: 1, display: 'flex' }}>
          <span class="sr-only">New word</span>
          <input
            type="text"
            value={draft}
            maxLength={MAX_WORD_LENGTH + 10}
            autocomplete="off"
            enterkeyhint="done"
            placeholder="Add a word"
            aria-invalid={note?.error ? 'true' : 'false'}
            onInput={(e) => {
              setDraft(e.currentTarget.value);
              if (note?.error) setNote(undefined);
            }}
            onPaste={(e) => {
              const text = e.clipboardData?.getData('text') ?? '';
              if (/[\n,]/.test(text)) {
                e.preventDefault();
                add(text);
              }
            }}
          />
        </label>
        <button type="submit" class="btn-small" disabled={!draft.trim()}>
          Add
        </button>
      </form>
      {note && (
        <p class={note.error ? 'hint error' : 'hint'} role="status">
          {note.text}
        </p>
      )}
      <p class="hint">
        Tip: paste a whole list at once, one word per line or separated by commas.
      </p>

      <div class="setting" style={{ marginTop: '12px', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
        <div>
          <div class="setting-title">Show on the home screen</div>
          <div class="setting-sub">Pick it like any other category</div>
        </div>
        <button
          type="button"
          class="switch"
          role="switch"
          aria-checked={list.visible ? 'true' : 'false'}
          aria-label="Show on the home screen"
          onClick={() => onChange({ ...list, visible: !list.visible })}
        >
          <span />
        </button>
      </div>

      <div class="spacer" />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button type="button" class="btn-small" style={{ flex: 1, height: '52px' }} disabled={list.words.length === 0} onClick={copy}>
          Copy as text
        </button>
        <button
          type="button"
          class={confirming ? 'btn-danger confirming' : 'btn-danger'}
          onClick={() => (confirming ? onDelete() : setConfirming(true))}
        >
          {confirming ? 'Tap again to delete' : 'Delete list'}
        </button>
      </div>
    </main>
  );
}

# Imposter: pass-the-phone party game (PWA)

A web app (PWA) for the party game Imposter, installed on the owner's iPhone from Safari via
Add to Home Screen. Personal use only: no App Store, no backend, no accounts. Development
happens on Windows; there is no Mac.

## Source of truth

- **Plan** (requirements, design, roadmap, test IDs, deployment):
  https://claude.ai/code/artifact/455f9454-06de-43b1-94b2-6f1f11f033af
  Read it with the Claude Docs tools, not a web fetch. Keep it in sync when rules or decisions change.
- **Visual design** (11 iPhone screens, Paper theme):
  https://claude.ai/artifact/TQMer4iY75XH7FZPkiRLhq
- Test IDs in code comments and test names (G1, R2, P4, AC7…) refer to Section 5 of the plan.

## Commands

```sh
npm run dev          # Vite dev server on the LAN (host: true); open the Network URL on the iPhone
npm test             # Vitest unit tests (rules, word bank, storage, reducer)
npm run test:e2e     # Playwright, WebKit, iPhone 13 + iPhone SE profiles; builds + previews on :4173
npm run build        # tsc --noEmit, then vite build into dist/ (with service worker)
npm run preview      # serve dist/ at http://localhost:4173/Who-is-the-imposter/
npm run icons        # re-render public/icon.svg to the PNG icons (needs Playwright WebKit)
```

Node.js 24 LTS was installed with winget. If `node` is not found in a shell, prepend
`C:\Program Files\nodejs` to PATH (Git Bash: `export PATH="/c/Program Files/nodejs:$PATH"`).

## Architecture

- `src/types.ts`: shared types. `src/rng.ts`: the only source of randomness (`cryptoRng` in the
  app, `seededRng` in tests). Never use `Math.random`.
- `src/engine/game.ts`: pure rules (validate players, deal a round, clue order, outcome). No Preact imports.
- `src/session/reducer.ts`: the phase machine (`home → setup → handoff ⇄ reveal → clues → vote → result`).
  Pure; the caller deals the round (engine + word bank) and passes it in the `deal` action.
  Actions that don't fit the current phase return the same state object.
- `src/data/`: `words.json` (7 categories, 25+ words each), `wordBank.ts` (load, de-dupe,
  draw without repeats per category), `storage.ts` (versioned `imposter.v1.*` keys in
  localStorage, every read validated and wrapped in try/catch).
- `src/views/`: one component per screen; `App.tsx` switches on `state.phase`. No router,
  no URL changes, no history entries: on purpose, so back gestures can't reveal an old card.
- `src/styles.css`: CSS variables from the design. Group screens use `--bg`/`--ink`…;
  private (handoff/reveal) screens use `--p-*` and always stay dark.

## Privacy rules (don't break these)

- A role is only in the DOM while the card is being held (`RevealView`); not hidden with CSS.
- The word card and the Imposter card share one layout; only the words differ.
- Backgrounding the app (`visibilitychange`/`pagehide`) shows a full-screen cover and sends
  a reveal back to its handoff screen. A round is never saved or resumed.
- Never log the word or the Imposter. E2E tests learn roles by holding each card, like a player.

## Conventions

- TypeScript strict. One component per file, named `…View.tsx`.
- Big display text uses `fitFont()` (`views/format.ts`) so the longest word fits on one line.
- Rule changes update the plan and the matching test in the same commit.
- Commit messages start with the task ID from the plan, e.g. `T5.2: vote and result views`.
- Log bugs in `docs/BUGS.md`; user-visible changes in `CHANGELOG.md`; bump `package.json`
  `version` for each release (it is shown on the Setup screen).

## Deployment

Push to `main` → `.github/workflows/deploy.yml` runs `npm test` and the build, then publishes
to GitHub Pages at https://ivan-cmdafk.github.io/Who-is-the-imposter/. One-time: repo
Settings › Pages › Source: GitHub Actions. The Vite `base` must match the repo name.

## Status (2026-10-17)

- Done: M0 (local), M1 engine, M2 word bank, M3 setup + storage, M4 private reveal,
  M5 round flow. 39 unit tests and 4 WebKit e2e tests pass. PWA manifest, icons, offline cache.
- Not done yet:
  - First push + enabling GitHub Pages (T0.4); installing on the iPhone; all on-device checks
    (P3, P5, P6, D1–D5, U2, U6). Nothing has been tested on a real iPhone yet.
  - Reordering players in Setup (only add/rename/remove exist).
  - M7, plan Section 8: six themes (Paper is the default and current look) and custom word lists.
- Known: Playwright's WebKit on Windows draws the condensed display font (Archivo, `font-stretch: 68%`)
  with overlapping letters. Believed to be a Windows WebKit rendering quirk; confirm on the iPhone.

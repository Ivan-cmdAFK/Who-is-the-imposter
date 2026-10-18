# Imposter

A pass-the-phone party game for 3 to 12 players. Everyone gets the same secret word, except one
player: the Imposter. Give one-word clues, then vote on who's bluffing.

Play it on an iPhone: open https://ivan-cmdafk.github.io/Who-is-the-imposter/ in Safari, tap
**Share › Add to Home Screen**, then open it once while online. After that it works offline.

## Develop

```sh
npm install
npm run dev        # open the Network URL on your phone (same Wi-Fi)
npm test
npm run test:e2e   # first time: npx playwright install webkit
```

Pushing to `main` deploys to GitHub Pages.

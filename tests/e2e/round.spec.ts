import { expect, test, type Page } from '@playwright/test';
import { peek } from './helpers';

const NAMES = ['Ana', 'Sam', 'Maya', 'Jordan'];

async function addPlayers(page: Page, names: string[]) {
  await page.getByRole('button', { name: 'Add players' }).click();
  const input = page.getByPlaceholder('Add a player');
  for (const name of names) {
    await input.fill(name);
    await input.press('Enter');
  }
}

test('a full round: private reveals, clues, vote and result', async ({ page }) => {
  await page.goto('./');
  await addPlayers(page, NAMES);
  await page.getByRole('button', { name: 'Start game' }).click();

  const cards: ({ name: string } & Awaited<ReturnType<typeof peek>>)[] = [];
  for (const name of NAMES) {
    // Handoff shows only the next name (P4) and no card.
    await expect(page.getByText('Pass the phone to')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    await page.getByRole('button', { name: `I'm ${name}` }).click();

    // P2: nothing about the role is on the page before the hold.
    await expect(page.locator('.card-face')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Hold the card first' })).toBeDisabled();

    cards.push({ name, ...(await peek(page)) });
    await page.getByRole('button', { name: 'Done, pass it on' }).click();
  }

  // G5: exactly one Imposter; everyone else shares one word.
  const imposters = cards.filter((c) => c.imposter);
  const crew = cards.filter((c) => !c.imposter);
  expect(imposters).toHaveLength(1);
  const word = crew[0].big;
  expect(crew.every((c) => c.big === word)).toBe(true);

  // P1: the Imposter's screen never contains the word.
  expect(imposters[0].pageText.toLowerCase()).not.toContain(word.toLowerCase());

  // Clues
  await expect(page.getByRole('heading', { level: 1 })).toContainText('starts');
  await page.getByRole('button', { name: "Everyone's given a clue" }).click();

  // Vote: a split vote records nothing (E5), then accuse the Imposter.
  const imposter = imposters[0].name;
  await page.getByRole('button', { name: "We're split, talk some more" }).click();
  await expect(page.getByText('No verdict yet')).toBeVisible();
  await page.getByRole('radio', { name: new RegExp(imposter) }).click();
  await page.getByRole('button', { name: `Accuse ${imposter}` }).click();

  // Result: the word is shown to everyone only now (P7), Imposter gets a guess.
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(imposter);
  await expect(page.locator('.stamp')).toHaveText('Caught');
  await expect(page.locator('.word-line .big')).toHaveText(word);
  await page.getByRole('button', { name: 'Missed it' }).click();
  await expect(page.getByRole('status')).toHaveText('The table wins this round.');

  // AC7: a new round keeps the table.
  await page.getByRole('button', { name: 'New round, same table' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(NAMES[0]);
});

test('setup blocks bad tables (G1, G3) and players are remembered (AC8)', async ({ page }) => {
  await page.goto('./');
  await addPlayers(page, ['Ana', 'Sam']);
  await expect(page.getByRole('button', { name: 'Add 1 more player' })).toBeDisabled();

  const input = page.getByPlaceholder('Add a player');
  await input.fill('sam');
  await input.press('Enter');
  await expect(page.getByText('Already at the table. Add an initial?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fix 1 name to start' })).toBeDisabled();

  await page.getByRole('textbox', { name: 'Player 3 name' }).fill('Sam B');
  await expect(page.getByRole('button', { name: 'Start game' })).toBeEnabled();

  await page.reload();
  await expect(page.locator('.table-list li')).toHaveCount(3);
  await expect(page.getByRole('button', { name: /Deal a round/ })).toBeVisible();
});

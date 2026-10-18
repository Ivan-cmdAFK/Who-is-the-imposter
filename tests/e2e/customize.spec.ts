import { expect, test, type Page } from '@playwright/test';
import { peek } from './helpers';

const bodyBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

/** Seeds players before the app boots (on every load), so the app's first save can't race it. */
async function seedPlayers(page: Page) {
  await page.addInitScript(() =>
    localStorage.setItem(
      'imposter.v1.players',
      JSON.stringify(['Ana', 'Sam', 'Leo'].map((name, i) => ({ id: `p${i}`, name }))),
    ),
  );
  await page.goto('./');
}

test('TH1/TH2: a theme recolors group screens, survives a reload, and never touches private screens', async ({ page }) => {
  await seedPlayers(page);
  await page.getByRole('button', { name: 'Themes and word lists' }).click();
  await page.getByRole('radio', { name: /Lilac/ }).click();
  await expect(page.getByRole('radio', { name: /Lilac/ })).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => bodyBg(page)).toBe('rgb(227, 223, 243)');

  await page.reload();
  await expect.poll(() => bodyBg(page)).toBe('rgb(227, 223, 243)');

  await page.getByRole('button', { name: /Deal a round/ }).click();
  await expect(page.getByText('Pass the phone to')).toBeVisible();
  await expect.poll(() => bodyBg(page)).toBe('rgb(21, 21, 21)');
});

test('CW5/CW9/CW8: build a custom list, play with only it, then delete it', async ({ page }) => {
  await seedPlayers(page);
  await page.getByRole('button', { name: 'Themes and word lists' }).click();
  await page.getByRole('button', { name: 'New word list' }).click();

  await page.getByRole('textbox', { name: 'List name' }).fill('Our crew');
  const add = page.getByPlaceholder('Add a word');
  await add.fill('Karaoke, Rooftop, Night bus, rooftop');
  await add.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Added 3, skipped 1 already on the list.');
  await expect(page.getByText('ADD 2 MORE TO PLAY')).toBeVisible();
  for (const w of ['Hot sauce', 'Road trip']) {
    await add.fill(w);
    await add.press('Enter');
  }
  await expect(page.locator('.word-chips li')).toHaveCount(5);

  await page.getByRole('button', { name: 'Word lists' }).click();
  await expect(page.getByRole('button', { name: /Our crew/ })).toContainText('5 WORDS');
  await page.getByRole('button', { name: 'Back to home' }).click();

  await page.getByRole('button', { name: 'Our crew' }).click();
  await expect(page.getByText('· OUR CREW')).toBeVisible();
  await page.getByRole('button', { name: /Deal a round/ }).click();

  // Hold the first card: the category corner names the custom list.
  await page.getByRole('button', { name: /^I'm / }).click();
  const { category, big, imposter } = await peek(page);
  expect(category).toBe('Our crew');
  if (!imposter) {
    expect(['Karaoke', 'Rooftop', 'Night bus', 'Hot sauce', 'Road trip']).toContain(big);
  }

  // Leave the round and delete the list: it disappears from Home.
  await page.reload();
  await page.getByRole('button', { name: 'Themes and word lists' }).click();
  await page.getByRole('button', { name: /Our crew/ }).click();
  await page.getByRole('button', { name: 'Delete list' }).click();
  await page.getByRole('button', { name: 'Tap again to delete' }).click();
  await expect(page.getByRole('button', { name: /Our crew/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Back to home' }).click();
  await expect(page.getByRole('button', { name: 'Our crew' })).toHaveCount(0);
  await expect(page.getByText('· ALL BUILT-IN')).toBeVisible();
});

test('CW1/CW2: a bad list name shows an error and keeps the old name', async ({ page }) => {
  await seedPlayers(page);
  await page.getByRole('button', { name: 'Themes and word lists' }).click();
  await page.getByRole('button', { name: 'New word list' }).click();
  const name = page.getByRole('textbox', { name: 'List name' });
  await name.fill('food');
  await expect(page.getByText('Another list already has that name.')).toBeVisible();
  await name.blur();
  await expect(name).toHaveValue('New list');
});

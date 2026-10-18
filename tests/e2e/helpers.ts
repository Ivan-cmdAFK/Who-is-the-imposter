import { expect, type Page } from '@playwright/test';

/** Press and hold the reveal card, read it like a player, let go. */
export async function peek(page: Page) {
  const card = page.locator('.card');
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(page.locator('.card-face')).toBeVisible();
  // textContent, not innerText: the card shows words in CSS uppercase.
  const kicker = (await page.locator('.card-face .kicker').textContent()) ?? '';
  const big = (await page.locator('.card-face .big').textContent()) ?? '';
  const category = (await page.locator('.card-face .corner span').first().textContent()) ?? '';
  const pageText = await page.locator('body').innerText();
  await page.mouse.up();
  // Letting go removes the role from the page at once.
  await expect(page.locator('.card-face')).toHaveCount(0);
  return { imposter: kicker === 'You are the', big, category, pageText };
}

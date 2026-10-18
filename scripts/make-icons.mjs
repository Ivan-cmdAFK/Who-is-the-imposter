// Renders public/icon.svg to the PNG sizes iOS and the web manifest need.
// Run with `npm run icons` after changing the SVG. Requires `npx playwright install webkit`.
import { readFile } from 'node:fs/promises';
import { webkit } from '@playwright/test';

const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const sizes = [
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];

const browser = await webkit.launch();
const page = await browser.newPage();
for (const [name, size] of sizes) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  await page.screenshot({ path: `public/${name}`, clip: { x: 0, y: 0, width: size, height: size } });
  console.log(`public/${name}`);
}
await browser.close();

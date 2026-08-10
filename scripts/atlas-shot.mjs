// Screenshot the baked sprite atlas for art review.
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const base = process.argv[2] ?? 'http://localhost:4173/plastic-platoon/';
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 }, deviceScaleFactor: 1 });
await page.goto(`${base}?seed=7&nosave=1`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ppAtlas !== undefined);
await page.evaluate(() => {
  const c = window.__ppAtlas;
  c.style.cssText =
    'position:fixed;top:0;left:0;z-index:9999;background:#8a5432;image-rendering:auto;';
  document.body.appendChild(c);
});
await page.locator('canvas').last().screenshot({ path: 'shots/atlas.png' });
console.log('shots/atlas.png');
await browser.close();

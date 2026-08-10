import { chromium } from 'playwright';
const base = process.argv[2] ?? 'http://localhost:4173/plastic-platoon/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
page.on('console', (m) => console.log('[console]', m.type(), m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.stack || String(e)));
page.on('requestfailed', (r) => console.log('[reqfail]', r.url(), r.failure()?.errorText));
const resp = await page.goto(`${base}?seed=7&nosave=1`, { waitUntil: 'load' }).catch((e) => {
  console.log('[goto error]', String(e));
  return null;
});
console.log('[status]', resp?.status());
await page.waitForTimeout(4000);
console.log('[__pp]', await page.evaluate(() => typeof window.__pp));
await browser.close();

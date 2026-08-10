import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const PORT = 4175;
const OUT = 'work/screenshots';
await mkdir(OUT, { recursive: true });

const viteBin = 'node_modules/vite/bin/vite.js';
const server = spawn(process.execPath, [viteBin, '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

const started = Date.now();
let ready = false;
while (!ready && Date.now() - started < 15000) {
  try {
    const response = await fetch(`http://127.0.0.1:${PORT}`);
    ready = response.ok;
  } catch {
    ready = false;
  }
  await new Promise((resolve) => setTimeout(resolve, 100));
}
if (!ready) {
  server.kill();
  throw new Error('Dev server did not start');
}

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => typeof window.plasticPlatoon?.debugState === 'function');
  await page.screenshot({ path: `${OUT}/01-initial.png`, fullPage: true });
  await page.evaluate(() => window.plasticPlatoon.debugFastForward(5));
  await page.screenshot({ path: `${OUT}/02-first-kill.png`, fullPage: true });
await page.evaluate(() => {
  window.plasticPlatoon.debugFastForward(55);
  window.plasticPlatoon.debugSpawnBattle();
});
await page.waitForTimeout(350);
await page.screenshot({ path: `${OUT}/03-mid-battle.png`, fullPage: true });
  await page.evaluate(() => {
    window.plasticPlatoon.debugAddScrap(1000);
    window.plasticPlatoon.debugBuyFirstAffordable();
  });
  await page.screenshot({ path: `${OUT}/04-upgrade.png`, fullPage: true });
  console.log(JSON.stringify({ out: OUT, errors }, null, 2));
  if (errors.length) throw new Error(`Console errors: ${errors.join('\n')}`);
} finally {
  await browser?.close().catch(() => undefined);
  server.kill();
}

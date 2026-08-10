import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const PORT = 4176;
const SAVE_KEY = 'plastic-platoon-save-v1';
const viteBin = 'node_modules/vite/bin/vite.js';
const server = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
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
  throw new Error('Preview server did not start');
}

const defaultSave = () => ({
  v: 1,
  scrap: 0,
  medals: 0,
  wave: 10,
  zoneIndex: 0,
  upgrades: { faster: 0, bigger: 0, rifles: 0, scouts: 0 },
  muted: true,
  lastSeen: Date.now(),
  pendingOfflineScrap: 0,
  totalEarned: 0,
  prestigeCount: 0
});

let browser;
try {
  browser = await chromium.launch({ headless: true });
  const errors = [];

  async function openWithSave(save) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
    await context.addInitScript(
      ({ key, save }) => {
        localStorage.setItem(key, JSON.stringify(save));
      },
      { key: SAVE_KEY, save }
    );
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.plasticPlatoon?.debugState === 'function');
    return { context, page };
  }

  const pendingRun = await openWithSave({ ...defaultSave(), pendingOfflineScrap: 220 });
  let stored = await pendingRun.page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  if (stored.pendingOfflineScrap !== 220 || stored.scrap !== 0) {
    throw new Error(`Pending offline reward did not survive first load: ${JSON.stringify(stored)}`);
  }

  await pendingRun.context.close();

  const pendingReload = await openWithSave(stored);
  stored = await pendingReload.page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  if (stored.pendingOfflineScrap !== 220 || stored.scrap !== 0) {
    throw new Error(`Pending offline reward was lost before claim: ${JSON.stringify(stored)}`);
  }

  await pendingReload.page.mouse.click(195, 407);
  await pendingReload.page.waitForTimeout(2200);
  stored = await pendingReload.page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  if (stored.pendingOfflineScrap !== 0 || stored.scrap !== 220 || stored.totalEarned !== 220) {
    throw new Error(`Offline claim should credit exactly once: ${JSON.stringify(stored)}`);
  }
  await pendingReload.context.close();

  const awayRun = await openWithSave({ ...defaultSave(), lastSeen: Date.now() - 2 * 60 * 60 * 1000 });
  stored = await awayRun.page.evaluate((key) => JSON.parse(localStorage.getItem(key)), SAVE_KEY);
  if (!(stored.pendingOfflineScrap > 0) || stored.scrap !== 0) {
    throw new Error(`Away-time reward was not persisted as pending: ${JSON.stringify(stored)}`);
  }
  await awayRun.context.close();

  if (errors.length) throw new Error(`Console errors: ${errors.join('\n')}`);
  console.log('Save/offline flows verified');
} finally {
  await browser?.close().catch(() => undefined);
  server.kill();
}

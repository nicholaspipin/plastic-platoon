// Screenshot self-review loop: deterministic captures at the brief's four checkpoints.
// Usage: node scripts/shots.mjs [baseUrl]   (default http://localhost:4173/plastic-platoon/)
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const base = process.argv[2] ?? 'http://localhost:4173/plastic-platoon/';
mkdirSync('shots', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

async function shot(name, prep) {
  await page.goto(`${base}?seed=7&nosave=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__pp !== undefined);
  await page.waitForTimeout(400);
  if (prep) await prep();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `shots/${name}.png` });
  console.log(`shots/${name}.png`);
}

async function dismissIntro() {
  const overlay = page.locator('.intro-overlay');
  if (await overlay.count()) {
    await overlay.tap();
    await overlay.waitFor({ state: 'detached' });
  }
}

// 1. initial load (intro card up)
await shot('1-load', null);

// 2. first kill (~5s in)
await shot('2-first-kill', async () => {
  await dismissIntro();
  await page.evaluate(() => window.__pp.ff(4));
  // let real frames run so VFX/anim state is alive
  await page.waitForTimeout(1600);
});

// 3. mid-battle (~60s simulated, upgrades bought like a real player;
//    fast-forward until tans are actually on screen so the shot shows combat)
await shot('3-mid-battle', async () => {
  await dismissIntro();
  await page.evaluate(() => {
    const pp = window.__pp;
    pp.ff(30);
    pp.buy('faster');
    pp.buy('bigger');
    pp.ff(28);
    let guard = 0;
    while (
      (pp.sim.countActive(1) < 6 ||
        pp.sim.units.some((u) => u.active && u.faction === 1 && u.x > pp.sim.w * 0.95)) &&
      guard++ < 240
    ) {
      pp.ff(0.25);
    }
    pp.ff(0.8); // let the exchange of fire start, but not finish
  });
  await page.waitForTimeout(1600);
});

// 4. upgrade purchase moment
await shot('4-upgrade', async () => {
  await dismissIntro();
  await page.evaluate(() => {
    window.__pp.ff(20);
    window.__pp.setScrap(500);
  });
  await page.waitForTimeout(300);
  // force: the affordable-pulse animation means the button is never "stable"
  await page.tap('.buy-btn', { force: true });
  await page.waitForTimeout(220);
});

if (errors.length) {
  console.error('CONSOLE ERRORS:');
  for (const e of errors) console.error('  ' + e);
  process.exitCode = 1;
} else {
  console.log('zero console errors');
}
await browser.close();

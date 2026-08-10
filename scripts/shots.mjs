// Screenshot self-review loop, v2: load, first battle, mid-game battle,
// upgrade moment, theater 2. Deterministic via ?seed + __pp hooks.
// Usage: node scripts/shots.mjs [baseUrl]
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

/** ff until battle tans are visibly on screen mid-fight. */
async function intoCombat(extraFf = 0.5) {
  await page.evaluate((extra) => {
    const pp = window.__pp;
    pp.attack();
    let guard = 0;
    while (
      (pp.sim.countActive(1) < 5 ||
        !pp.sim.units.some((u) => u.active && u.faction === 1 && u.x < pp.sim.w * 0.9)) &&
      guard++ < 400
    ) {
      pp.ff(0.25);
    }
    pp.ff(extra);
  }, extraFf);
  await page.waitForTimeout(1200);
}

// 1. initial load (intro card up)
await shot('1-load', null);

// 2. battle 1, first exchange of fire
await shot('2-first-battle', async () => {
  await dismissIntro();
  await page.evaluate(() => window.__pp.ff(6)); // a few stamps first
  await intoCombat(1.5);
});

// 3. mid-game: battle 9 with several classes fielded
await shot('3-mid-battle', async () => {
  await dismissIntro();
  await page.evaluate(() => {
    const pp = window.__pp;
    pp.sim.state.battle = 9;
    pp.setScrap(3000);
    for (let i = 0; i < 5; i++) pp.buyClass('rifle');
    for (let i = 0; i < 3; i++) pp.buyClass('scout');
    for (let i = 0; i < 2; i++) pp.buyClass('mg');
    pp.sim.state.scrap = 400;
    pp.ff(20); // build the army
  });
  await intoCombat(1);
});

// 4. upgrade purchase moment (unit card tap)
await shot('4-upgrade', async () => {
  await dismissIntro();
  await page.evaluate(() => {
    window.__pp.ff(15);
    window.__pp.setScrap(800);
  });
  await page.waitForTimeout(300);
  await page.locator('.unit-card .uc-buy').first().tap({ force: true });
  await page.waitForTimeout(220);
});

// 5. theater 2 (Under the Bed), commander battle
await shot('5-zone2', async () => {
  await dismissIntro();
  await page.evaluate(() => {
    const pp = window.__pp;
    pp.sim.state.battle = 25;
    pp.setScrap(60000);
    for (const c of ['rifle', 'scout', 'mg', 'medic', 'bazooka']) {
      for (let i = 0; i < 10; i++) pp.buyClass(c);
    }
    pp.ff(25);
  });
  await intoCombat(1);
});

if (errors.length) {
  console.error('CONSOLE ERRORS:');
  for (const e of errors) console.error('  ' + e);
  process.exitCode = 1;
} else {
  console.log('zero console errors');
}
await browser.close();

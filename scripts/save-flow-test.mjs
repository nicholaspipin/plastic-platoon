// V2 idle-loop gate: play, "close", return + claim offline, prestige through
// the Toy Box (tree), verify medals + tree + battle persistence, missions,
// theater unlock, v1→v2 save migration.
// Usage: node scripts/save-flow-test.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173/plastic-platoon/';
const KEY = 'plastic-platoon-save';
let failures = 0;

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

const browser = await chromium.launch({ args: ['--disable-features=BackForwardCache'] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
});
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.setDefaultNavigationTimeout(60000);
page.setDefaultTimeout(12000);

async function dismissIntro() {
  const overlay = page.locator('.intro-overlay');
  if (await overlay.count()) {
    await overlay.tap();
    await overlay.waitFor({ state: 'detached' });
  }
}

/** Cards can stack (offline + streak). Claim/dismiss them all. */
async function dismissAllCards() {
  for (let i = 0; i < 5; i++) {
    const overlays = page.locator('.card-overlay');
    if ((await overlays.count()) === 0) return;
    const top = overlays.last();
    const cta = top.locator('.card-cta').first();
    if (await cta.count()) await cta.tap({ force: true }).catch(() => {});
    else await top.locator('.card-dismiss').first().tap({ force: true }).catch(() => {});
    await page.waitForTimeout(350);
  }
}

// ---- 1. fresh session: play (battle 1 + skirmish), earn, save
await page.goto(`${base}?seed=7`, { waitUntil: 'load' });
await page.evaluate((k) => localStorage.removeItem(k), KEY);
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => window.__pp !== undefined);
await dismissIntro();
await page.evaluate(() => {
  const pp = window.__pp;
  pp.ff(10);
  pp.attack();
  pp.ff(60); // win battle 1, then skirmish income
});
await page.evaluate(() => window.__pp.saveNow());
const save1 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
check('v2 save written with earnings', save1 && save1.v === 2 && save1.state.lifetimeScrap > 0 && save1.scrapRate > 0,
  `battle=${save1?.state.battle}, lifetime=${save1?.state.lifetimeScrap?.toFixed(0)}, rate=${save1?.scrapRate?.toFixed(2)}/s`);
check('missions rolled (3 slots)', save1?.state.missions?.length === 3);

// ---- 2. simulate 3h away → offline card, granted on load
await page.goto(`${base}?seed=7&nosave=1`, { waitUntil: 'load' });
// the live page kept persisting after saveNow, so assert against the file
// actually being tampered, not the earlier snapshot
const tampered = await page.evaluate((k) => {
  const s = JSON.parse(localStorage.getItem(k));
  s.lastSeen = Date.now() - 3 * 3600 * 1000;
  localStorage.setItem(k, JSON.stringify(s));
  return { scrap: s.state.scrap, rate: s.scrapRate };
}, KEY);
await page.goto(`${base}?seed=7`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pp !== undefined);
const card = page.locator('.card-overlay').first();
const cardShown = await card.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
check('offline card appears after 3h away', cardShown);
if (cardShown) {
  const scrapNow = await page.evaluate(() => window.__pp.sim.state.scrap);
  const expectedCap = 2 * 3600 * tampered.rate; // base cap 2h at logistics 0
  const granted = scrapNow - tampered.scrap;
  check('offline grant respects the 2h base cap', granted > 0 && granted <= expectedCap * 1.15 + 60,
    `granted≈${granted.toFixed(0)}, cap≈${expectedCap.toFixed(0)}`);
}
// claim/dismiss everything (offline card + the streak card that follows)
await page.waitForTimeout(1000);
await dismissAllCards();

// ---- 3. prestige through the real Toy Box UI
await dismissAllCards(); // anything that surfaced late must not block the fab
await page.evaluate(() => {
  const pp = window.__pp;
  pp.sim.state.battle = 12;
  pp.sim.state.lifetimeScrap = 60000;
});
await page.waitForTimeout(300);
const fabVisible = await page.locator('.prestige-fab').isVisible().catch(() => false);
check('Toy Box button appears when prestige is worthwhile', fabVisible);
let medals = 0;
if (fabVisible) {
  await page.tap('.prestige-fab', { force: true });
  await page.locator('.tree-card').waitFor({ state: 'visible', timeout: 3000 });
  const preview = await page.locator('.pack-up').textContent();
  await page.tap('.pack-up', { force: true }); // arm
  await page.tap('.pack-up', { force: true }); // confirm
  await page.waitForTimeout(400);
  medals = await page.evaluate(() => window.__pp.sim.state.medals);
  const battle = await page.evaluate(() => window.__pp.sim.state.battle);
  check('prestige grants medals and resets the campaign', medals >= 8 && battle === 1,
    `medals=${medals} (preview "${preview?.trim().slice(0, 30)}"), battle=${battle}`);
  // spend a point in the tree
  await page.tap('.prestige-fab', { force: true });
  await page.locator('.tree-card').waitFor({ state: 'visible', timeout: 3000 });
  const bought = await page.evaluate(() => window.__pp.sim.buyTreeNode('fasterMolder'));
  check('command tree node purchasable with medal points', bought);
  await page.tap('.card-dismiss', { force: true });
}

// ---- 4. reload: medals + tree survive
await page.evaluate(() => window.__pp.saveNow());
await page.reload({ waitUntil: 'load' });
await page.waitForFunction(() => window.__pp !== undefined);
await page.waitForTimeout(600);
const medals2 = await page.evaluate(() => window.__pp.sim.state.medals);
const treeRank = await page.evaluate(() => window.__pp.sim.state.tree.fasterMolder);
check('medals persist across reload', medals2 === medals && medals2 > 0, `medals=${medals2}`);
check('tree ranks persist across reload', treeRank === 1, `fasterMolder=${treeRank}`);

// ---- 5. scrap passive reflects medals; theater unlocks at battle 21
const mult = await page.evaluate(() => window.__pp.sim.scrapMult);
check('scrap passive includes +2%/medal', Math.abs(mult - (1 + medals2 * 0.02)) < 0.2, `×${mult.toFixed(2)}`);
const zone = await page.evaluate(() => {
  window.__pp.sim.state.battle = 21;
  return window.__pp.sim.zone;
});
check('theater 2 at battle 21', zone === 1, `zone=${zone}`);

// ---- 6. v1 → v2 migration
await page.goto(`${base}?seed=7&nosave=1`, { waitUntil: 'load' });
await page.evaluate((k) => {
  const v1 = {
    v: 1,
    state: {
      scrap: 500,
      totalScrapEarned: 9000,
      wave: 20,
      medals: 4,
      zone: 1,
      upgrades: { faster: 3, bigger: 2, rifles: 1, scouts: 0 },
    },
    scrapRate: 2.5,
    greenReserve: 10,
    lastSeen: Date.now(),
    muted: false,
    seenIntro: true,
  };
  localStorage.setItem(k, JSON.stringify(v1));
}, KEY);
await page.goto(`${base}?seed=7`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__pp !== undefined);
const mig = await page.evaluate(() => {
  const s = window.__pp.sim.state;
  return { battle: s.battle, scrap: s.scrap, medals: s.medals, rate: s.molderRateLv, rifle: s.classLv.rifle };
});
check('v1 save migrates to v2', mig.battle === 12 && mig.scrap === 500 && mig.medals === 12 && mig.rate === 6 && mig.rifle === 2,
  JSON.stringify(mig));

check('zero page errors', errors.length === 0, errors.join('; ').slice(0, 200));
await browser.close();
process.exitCode = failures ? 1 : 0;
console.log(failures ? `${failures} FAILURES` : 'ALL PASS');

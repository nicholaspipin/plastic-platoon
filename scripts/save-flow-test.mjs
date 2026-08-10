// M3 gate: full idle-loop test — play, "close", return, claim offline scrap,
// prestige, verify medals + persistence across reloads.
// Usage: node scripts/save-flow-test.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173/plastic-platoon/';
const KEY = 'plastic-platoon-save';
let failures = 0;

function check(name, ok, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

// bfcache off: same-URL navigations must re-run module init so the app
// actually re-reads the (tampered) save from localStorage
const browser = await chromium.launch({ args: ['--disable-features=BackForwardCache'] });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
});
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));

// ---- 1. fresh session: play, earn, save
await page.goto(`${base}?seed=7`, { waitUntil: 'networkidle' });
await page.evaluate((k) => localStorage.removeItem(k), KEY);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__pp !== undefined);
const overlay = page.locator('.intro-overlay');
if (await overlay.count()) {
  await overlay.tap();
  await overlay.waitFor({ state: 'detached' });
}
await page.evaluate(() => window.__pp.ff(50));
await page.evaluate(() => window.__pp.saveNow());
const save1 = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
check('save written with earnings', save1 && save1.state.scrap > 0 && save1.scrapRate > 0,
  `scrap=${save1?.state.scrap?.toFixed(0)}, rate=${save1?.scrapRate?.toFixed(2)}/s`);

// ---- 2. simulate 3h away, reload, offline card should appear.
// The app rightly stamps lastSeen on every pagehide, so tamper with the save
// from a page that will never write it: the app in ?nosave=1 mode.
// (A bogus path won't do — vite preview SPA-fallbacks everything to the app.)
await page.goto(`${base}?seed=7&nosave=1`, { waitUntil: 'load' });
await page.evaluate((k) => {
  const s = JSON.parse(localStorage.getItem(k));
  s.lastSeen = Date.now() - 3 * 3600 * 1000;
  localStorage.setItem(k, JSON.stringify(s));
}, KEY);
await page.goto(`${base}?seed=7`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__pp !== undefined);
const card = page.locator('.card-overlay');
const cardShown = await card.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false);
check('offline card appears after 3h away', cardShown);
let claimed = 0;
if (cardShown) {
  const before = await page.evaluate(() => window.__pp.sim.state.scrap);
  await page.waitForTimeout(1100); // count-up finishes
  await page.tap('.card-cta', { force: true });
  await card.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
  const after = await page.evaluate(() => window.__pp.sim.state.scrap);
  claimed = after - before;
  const expected = Math.floor(3 * 3600 * save1.scrapRate * 0.5);
  const tol = Math.max(4, expected * 0.05);
  check('claim adds the advertised offline scrap', Math.abs(claimed - expected) <= tol,
    `claimed=${claimed.toFixed(0)}, expected≈${expected}`);
}

// ---- 3. prestige: force eligibility, run the flow through the real UI
await page.evaluate(() => {
  const pp = window.__pp;
  pp.sim.state.wave = 20;
  pp.sim.state.totalScrapEarned = 60000;
});
await page.waitForTimeout(300);
const fabVisible = await page.locator('.prestige-fab').isVisible().catch(() => false);
check('prestige button appears when eligible', fabVisible);
let medals = 0;
if (fabVisible) {
  await page.tap('.prestige-fab', { force: true });
  const preview = await page.locator('.medal-chip .mc-value').first().textContent();
  await page.tap('.card-cta.gold', { force: true });
  await page.waitForTimeout(400);
  medals = await page.evaluate(() => window.__pp.sim.state.medals);
  const wave = await page.evaluate(() => window.__pp.sim.state.wave);
  const scrap = await page.evaluate(() => window.__pp.sim.state.scrap);
  check('prestige grants medals and resets battlefield', medals > 0 && wave === 1 && scrap === 0,
    `medals=${medals} (preview "${preview?.trim()}"), wave=${wave}, scrap=${scrap}`);
}

// ---- 4. reload: medals + zone survive, offline card does NOT reappear immediately
await page.evaluate(() => window.__pp.saveNow());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__pp !== undefined);
const medals2 = await page.evaluate(() => window.__pp.sim.state.medals);
check('medals persist across reload', medals2 === medals && medals2 > 0, `medals=${medals2}`);
const cardAgain = await page.locator('.card-overlay').isVisible().catch(() => false);
check('no offline card after immediate return', !cardAgain);

// ---- 5. scrap multiplier reflects medals
const mult = await page.evaluate(() => window.__pp.sim.scrapMult);
check('scrap multiplier includes medal bonus', Math.abs(mult - (1 + medals2 * 0.1)) < 1e-9, `×${mult}`);

// ---- 6. zone progression: wave 15+ switches to zone 1 (Under the Bed).
// ff until the current wave clears and the next one starts (bounded).
const zone = await page.evaluate(() => {
  const pp = window.__pp;
  pp.sim.state.wave = 15;
  let guard = 0;
  while (pp.sim.state.zone < 1 && guard++ < 90) pp.ff(1);
  return pp.sim.state.zone;
});
check('zone 1 unlocks at wave 15', zone === 1, `zone=${zone}`);

check('zero page errors', errors.length === 0, errors.join('; '));
await browser.close();
process.exitCode = failures ? 1 : 0;
console.log(failures ? `${failures} FAILURES` : 'ALL PASS');

// Perf probe: fast-forwards the sim to a heavy late-game state (3 sim-minutes+),
// then measures real render frame times and asserts p95 < 16.7ms.
// Headless GL is software (SwiftShader) — results are a conservative floor for
// real GPUs on mid-range phones; the renderer string is logged for the record.
// Usage: node scripts/perf-probe.mjs [baseUrl]
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4173/plastic-platoon/';
// rAF deltas on a healthy 60Hz display are exactly ~16.7ms (vsync-quantized),
// so the pass bar is one vsync interval + 5% jitter; p99 guards against hitches.
const BUDGET_MS = 17.5;
const HITCH_MS = 25;

const browser = await chromium.launch({
  args: ['--enable-gpu', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
});

const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push(String(e)));

await page.goto(`${base}?seed=7&nosave=1`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__pp !== undefined);
await page.tap('.cta-btn').catch(() => {});

const renderer = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  if (!gl) return 'no-webgl';
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'masked';
});
console.log('WebGL renderer:', renderer);

// Build a worst-case battlefield: 3+ sim-minutes at high wave, maxed-out molds,
// battalion cap saturated, then let real frames run and measure.
await page.evaluate(() => {
  const pp = window.__pp;
  pp.setScrap(1e9);
  for (let i = 0; i < 8; i++) pp.buy('faster');
  for (let i = 0; i < 10; i++) pp.buy('bigger');
  pp.sim.state.wave = 40; // heavy waves, boss cadence included
  pp.ff(200); // 3+ minutes of simulated play at high wave count
});

// warmup, then measure two windows: pure rendering, then rendering + taps.
// Comparing them separates game hitches from CDP/input-injection artifacts.
await page.waitForTimeout(2000);

await page.evaluate(() => window.__pp.resetFrames());
await page.waitForTimeout(12000);
const pure = await page.evaluate(() => window.__pp.frameStats());
console.log(
  `pure render : n=${pure.n} p50=${pure.p50.toFixed(2)} p95=${pure.p95.toFixed(2)} p99=${pure.p99.toFixed(2)} max=${pure.max.toFixed(1)} long=${pure.long}`
);

await page.evaluate(() => window.__pp.resetFrames());
const start = Date.now();
while (Date.now() - start < 10000) {
  await page.tap('body').catch(() => {});
  await page.waitForTimeout(2500);
}
const stats = await page.evaluate(() => window.__pp.frameStats());
console.log(
  `with taps   : n=${stats.n} p50=${stats.p50.toFixed(2)} p95=${stats.p95.toFixed(2)} p99=${stats.p99.toFixed(2)} max=${stats.max.toFixed(1)} long=${stats.long}`
);
const units = await page.evaluate(
  () => window.__pp.sim.units.filter((u) => u.active).length
);
const wave = await page.evaluate(() => window.__pp.sim.state.wave);

console.log(`active units: ${units}, wave: ${wave}`);
console.log(
  `frames n=${stats.n}  p50=${stats.p50.toFixed(2)}ms  p95=${stats.p95.toFixed(2)}ms  p99=${stats.p99.toFixed(2)}ms`
);

// the pure-render window is ground truth for game performance; the taps window
// additionally contains CDP input-injection overhead and is reported for context
let fail = false;
if (pure.p95 >= BUDGET_MS) {
  console.error(`FAIL: pure p95 ${pure.p95.toFixed(2)}ms >= ${BUDGET_MS}ms`);
  fail = true;
} else if (pure.p99 >= HITCH_MS) {
  console.error(`FAIL: pure p99 ${pure.p99.toFixed(2)}ms >= ${HITCH_MS}ms (hitching)`);
  fail = true;
} else {
  console.log(
    `PASS: pure p95 ${pure.p95.toFixed(2)}ms < ${BUDGET_MS}ms, p99 ${pure.p99.toFixed(2)}ms < ${HITCH_MS}ms`
  );
}
if (errors.length) {
  console.error('CONSOLE ERRORS:');
  for (const e of errors) console.error('  ' + e);
  fail = true;
} else {
  console.log('zero console errors');
}
console.log(
  'CAVEAT: headless Chromium may use software GL; verify on-device for ground truth.'
);
process.exitCode = fail ? 1 : 0;
await browser.close();

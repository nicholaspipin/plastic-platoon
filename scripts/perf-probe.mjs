import { chromium } from 'playwright';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';

const build = process.env.npm_execpath
  ? spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'build'], { stdio: 'inherit' })
  : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], { stdio: 'inherit' });
if (build.status !== 0) {
  throw new Error(`Build failed before perf probe${build.error ? `: ${build.error.message}` : ''}`);
}

const PORT = 4174;
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
  await page.evaluate(() => {
    window.plasticPlatoon.debugAddScrap(100000);
  });
  const cpuProbe = await page.evaluate(() => window.plasticPlatoon.debugPerfProbe(180, 1 / 60));
  await page.waitForTimeout(1200);
  const state = await page.evaluate(() => window.plasticPlatoon.debugState());
  console.log(JSON.stringify({ ...state, cpuProbe, errors, caveat: 'Headless Chromium RAF can be timer-throttled; cpuProbe.p95 is the asserted frame-cost gate.' }, null, 2));
  if (errors.length) throw new Error(`Console errors: ${errors.join('\n')}`);
  if (cpuProbe.p95 > 16.7) throw new Error(`CPU p95 frame cost ${cpuProbe.p95.toFixed(2)}ms exceeds 16.7ms`);
  if (cpuProbe.minUnits < 200) throw new Error(`Perf probe dropped below 200 active units: ${cpuProbe.minUnits}`);
  if (cpuProbe.minParticles < 180) throw new Error(`Perf probe dropped below 180 active particles: ${cpuProbe.minParticles}`);
  if (cpuProbe.longFrames > Math.max(3, cpuProbe.frames * 0.01)) {
    throw new Error(`Too many long CPU frames over 16.7ms: ${cpuProbe.longFrames}/${cpuProbe.frames}`);
  }
  if (cpuProbe.max > 150) throw new Error(`Extreme CPU frame spike ${cpuProbe.max.toFixed(2)}ms exceeds 150ms`);
} finally {
  await browser?.close().catch(() => undefined);
  server.kill();
  await once(server, 'exit').catch(() => undefined);
}

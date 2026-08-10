import './ui/style.css';
import { SIM_DT } from './sim/defs';
import { Sim } from './sim/sim';
import { applySave, loadGame, saveGame, clearSave } from './sim/save';
import { Renderer } from './render/renderer';
import { Hud } from './ui/hud';
import { Sfx } from './audio/sfx';

const params = new URLSearchParams(location.search);
const seed = params.has('seed') ? Number(params.get('seed')) : undefined;
const nosave = params.has('nosave');

const sim = new Sim(seed);
const sfx = new Sfx();
let seenIntro = false;

const save = nosave ? null : loadGame();
if (save) {
  applySave(sim, save);
  seenIntro = save.seenIntro;
}

const renderer = new Renderer();
const gameEl = document.getElementById('game')!;
const uiEl = document.getElementById('ui')!;

const hud = new Hud(
  uiEl,
  {
    onBuy: (id) => {
      sim.buy(id);
    },
    onMute: (muted) => {
      sfx.muted = muted;
      persist();
    },
    onStart: () => {},
  },
  save?.muted ?? false
);
sfx.muted = save?.muted ?? false;

// frame-time ring buffer for the perf probe (cheap: one write per frame)
const frameTimes = new Float32Array(1200);
let frameIdx = 0;
let frameCount = 0;

let hitStop = 0; // seconds of sim freeze (render keeps running)

async function boot() {
  await renderer.init(gameEl, sim);

  // input: tap anywhere on the battlefield = rubber band snap
  renderer.app.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    sfx.unlock();
    const rect = renderer.app.canvas.getBoundingClientRect();
    sim.tryBand(e.clientX - rect.left, e.clientY - rect.top);
    if (navigator.vibrate) navigator.vibrate(8);
  });

  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = window.setTimeout(() => renderer.layout(sim), 120);
  });

  if (!seenIntro) {
    hud.showIntro(() => {
      sfx.unlock();
      seenIntro = true;
      persist();
    });
  }

  let last = performance.now();
  let acc = 0;

  function frame(now: number) {
    const rawDt = Math.min((now - last) / 1000, 0.1);
    last = now;

    frameTimes[frameIdx] = rawDt * 1000;
    frameIdx = (frameIdx + 1) % frameTimes.length;
    frameCount++;

    if (hitStop > 0) {
      hitStop -= rawDt;
    } else {
      acc += rawDt;
    }
    let steps = 0;
    while (acc >= SIM_DT && steps < 6) {
      sim.step();
      acc -= SIM_DT;
      steps++;
    }
    if (steps === 6) acc = 0; // spiral-of-death guard

    // drain events to all consumers
    for (const e of sim.events) {
      renderer.handleEvent(e, sim);
      hud.handleEvent(e, sim);
      sfx.handleEvent(e);
    }
    sim.events.length = 0;

    renderer.render(sim, acc / SIM_DT, rawDt);
    hud.update(sim, rawDt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function persist() {
  if (nosave) return;
  saveGame(sim, { muted: sfx.muted, seenIntro });
}

setInterval(persist, 5000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') persist();
});
window.addEventListener('pagehide', persist);

// service worker (production only; dev caching is misery)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

// dev/test hooks for screenshots + perf probe
declare global {
  interface Window {
    __pp: {
      sim: Sim;
      ff: (seconds: number) => void;
      setScrap: (n: number) => void;
      buy: (id: 'faster' | 'bigger' | 'rifles' | 'scouts') => boolean;
      resetSave: () => void;
      hitStop: (ms: number) => void;
      frameStats: () => {
        p50: number;
        p95: number;
        p99: number;
        max: number;
        long: number;
        n: number;
      };
      resetFrames: () => void;
    };
  }
}

window.__pp = {
  sim,
  ff: (s) => sim.fastForward(s),
  setScrap: (n) => {
    sim.state.scrap = n;
  },
  buy: (id) => sim.buy(id),
  resetSave: () => {
    clearSave();
    location.reload();
  },
  hitStop: (ms) => {
    hitStop = Math.max(hitStop, ms / 1000);
  },
  frameStats: () => {
    const n = Math.min(frameCount, frameTimes.length);
    const arr = Array.from(frameTimes.subarray(0, n)).sort((a, b) => a - b);
    const q = (p: number) => arr[Math.min(n - 1, Math.floor(p * n))] ?? 0;
    const long = arr.filter((t) => t > 25).length;
    return { p50: q(0.5), p95: q(0.95), p99: q(0.99), max: arr[n - 1] ?? 0, long, n };
  },
  resetFrames: () => {
    frameCount = 0;
    frameIdx = 0;
    frameTimes.fill(0);
  },
};

void boot();

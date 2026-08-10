import './ui/style.css';
import { SIM_DT } from './sim/defs';
import { Sim } from './sim/sim';
import { applySave, loadGame, saveGame, clearSave } from './sim/save';
import { computeOffline } from './sim/offline';
import { Renderer } from './render/renderer';
import { Hud } from './ui/hud';
import { showOfflineCard, PrestigeUi } from './ui/cards';
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
      sfx.unlock(); // a buy may be the returning player's first gesture
      sim.buy(id);
    },
    onMute: (muted) => {
      sfx.unlock();
      sfx.muted = muted;
      persist();
    },
    onStart: () => {},
  },
  save?.muted ?? false
);
sfx.muted = save?.muted ?? false;

const prestigeUi = new PrestigeUi(uiEl, () => {
  sim.prestige();
  renderer.refreshStuds(sim);
  persist();
});

// frame-time ring buffer for the perf probe (cheap: one write per frame)
const frameTimes = new Float32Array(1200);
let frameIdx = 0;
let frameCount = 0;

let hitStop = 0; // seconds of sim freeze (render keeps running)

async function boot() {
  await renderer.init(gameEl, sim);

  // input: tap anywhere on the battlefield = rubber band snap.
  // ~80ms anticipation between the tap and the snap itself (juice table §4.4).
  let bandPending = false;
  renderer.app.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
    sfx.unlock();
    if (bandPending || sim.bandCd > 0) return;
    bandPending = true;
    const rect = renderer.app.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    renderer.anticipateBand(x, y);
    setTimeout(() => {
      bandPending = false;
      sim.tryBand(x, y);
      if (navigator.vibrate) navigator.vibrate(12);
    }, 80);
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

  prestigeUi.bind(sim);

  // offline earnings: one card max at session start (returning players only).
  // Scrap is granted IMMEDIATELY — the save's lastSeen advances within seconds,
  // so a claim-gated grant would be forfeited by any reload before the tap.
  if (save && seenIntro) {
    const offline = computeOffline(save);
    if (offline) grantOffline(offline.scrap, offline.seconds);
  }

  let lastZone = sim.state.zone;
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
    // spiral-of-death guard; clamp (not zero) keeps interpolation monotonic
    if (steps === 6 && acc > SIM_DT) acc = SIM_DT * 0.999;

    // drain events to all consumers
    for (const e of sim.events) {
      renderer.handleEvent(e, sim);
      hud.handleEvent(e, sim);
      sfx.handleEvent(e);
      // hit-stop freezes the sim, never render or audio; reduced-motion
      // users get the renderer's flash effects instead
      if (e.type === 'kill' && e.kind !== 'soldier') {
        if (!renderer.reducedMotion) hitStop = Math.max(hitStop, 0.07);
        if (navigator.vibrate) navigator.vibrate(25);
      } else if (e.type === 'buy' && navigator.vibrate) {
        navigator.vibrate(8);
      }
    }
    sim.events.length = 0;

    // zone shift: rebake the diorama when the battlefield moves rooms
    if (sim.state.zone !== lastZone) {
      lastZone = sim.state.zone;
      renderer.rebakeGround(lastZone);
    }

    renderer.render(sim, acc / SIM_DT, rawDt);
    hud.update(sim, rawDt);
    prestigeUi.update(sim);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function persist() {
  if (nosave) return;
  saveGame(sim, { muted: sfx.muted, seenIntro });
}

setInterval(persist, 5000);
// iOS PWAs resume from memory rather than reloading, so the load-time offline
// check never re-runs — do it on visibility return after a long background too.
let hiddenAt = 0;
let offlineCardOpen = false;

function grantOffline(scrap: number, seconds: number) {
  sim.state.scrap += scrap;
  sim.state.totalScrapEarned += scrap;
  persist();
  if (offlineCardOpen) return; // never stack receipt cards
  offlineCardOpen = true;
  showOfflineCard(uiEl, { scrap, seconds }, () => {
    offlineCardOpen = false;
    sfx.unlock();
    const fake = { type: 'buy', id: 'faster' } as const;
    sfx.handleEvent(fake);
    renderer.handleEvent(fake, sim); // the molder celebrates the claim
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    persist();
  } else {
    sfx.unlock(); // recover from iOS 'interrupted' audio state
    if (hiddenAt > 0 && !nosave) {
      const offline = computeOffline({ lastSeen: hiddenAt, scrapRate: sim.scrapRate });
      hiddenAt = 0;
      if (offline) grantOffline(offline.scrap, offline.seconds);
    }
  }
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
      saveNow: () => void;
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
  saveNow: () => {
    saveGame(sim, { muted: sfx.muted, seenIntro });
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

boot().catch((err) => {
  // WebGL denied / init failure: show something instead of a black void
  const card = document.createElement('div');
  card.className = 'intro-overlay';
  card.innerHTML = `<div class="intro-card"><div class="intro-brand">OUT OF<br>BATTERIES</div>
    <div class="intro-sub">This device couldn't start the battlefield (WebGL unavailable).<br>Try another browser or device.</div></div>`;
  uiEl.appendChild(card);
  console.error(err);
});

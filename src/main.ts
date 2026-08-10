import './ui/style.css';
import { BATTLE, SIM_DT, STREAK, type ClassId, type TreeNodeId } from './sim/defs';
import { Sim } from './sim/sim';
import { applySave, loadGame, saveGame, clearSave } from './sim/save';
import { computeOffline } from './sim/offline';
import { Renderer } from './render/renderer';
import { Hud } from './ui/hud';
import {
  showOfflineCard,
  showWinToast,
  showCommanderToast,
  showSurgeToast,
  showLossCard,
  showUnlockCard,
  showStreakCard,
  PrestigeUi,
} from './ui/cards';
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
    onBuyClass: (cls: ClassId) => {
      sfx.unlock();
      sim.buyClass(cls);
    },
    onBuyMolderRate: () => {
      sfx.unlock();
      sim.buyMolderRate();
    },
    onBuyMoldSize: () => {
      sfx.unlock();
      sim.buyMoldSize();
    },
    onToggleProgram: (cls: ClassId) => {
      sfx.unlock();
      sim.toggleProgram(cls);
    },
    onAttack: () => {
      sfx.unlock();
      sim.startBattle();
      if (navigator.vibrate) navigator.vibrate(10);
    },
    onClaimMission: (slot) => {
      sfx.unlock();
      if (sim.claimMission(slot)) {
        const fake = { type: 'buy', id: 'mission' } as const;
        sfx.handleEvent(fake);
        persist();
      }
    },
    onMute: (muted) => {
      sfx.unlock();
      sfx.muted = muted;
      persist();
    },
  },
  save?.muted ?? false
);
sfx.muted = save?.muted ?? false;

const prestigeUi = new PrestigeUi(
  uiEl,
  () => {
    sim.prestige();
    renderer.refreshStuds(sim);
    renderer.rebakeGround(sim.zone);
    persist();
  },
  (id: TreeNodeId) => {
    sfx.unlock();
    if (sim.buyTreeNode(id)) {
      const fake = { type: 'buy', id: 'tree' } as const;
      sfx.handleEvent(fake);
      persist();
    }
  }
);

// frame-time ring buffer for the perf probe
const frameTimes = new Float32Array(1200);
let frameIdx = 0;
let frameCount = 0;

let hitStop = 0;

async function boot() {
  await renderer.init(gameEl, sim);

  // input: tap the battlefield = rubber band snap (80ms anticipation)
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

  // offline earnings (grant immediately; card is the celebration)
  if (save && seenIntro) {
    const offline = computeOffline(save, sim.offlineCapHours);
    if (offline) grantOffline(offline.scrap, offline.seconds);
  }

  // daily streak (after the offline card so they don't stack awkwardly).
  // Also re-checked periodically: a tab left open past midnight must roll over.
  const checkNewDay = () => {
    if (nosave || !seenIntro) return;
    const day = sim.advanceStreak();
    if (day > 0) {
      const reward = Math.round(
        BATTLE.rewardBase * Math.pow(BATTLE.rewardGrowth, sim.state.battle - 1) * STREAK.rewardMult[day - 1] * 3
      );
      setTimeout(() => {
        showStreakCard(uiEl, day, reward, () => {
          sim.addScrap(reward / sim.scrapMult); // addScrap re-applies the multiplier
          if (day === STREAK.days) sim.activateBoost(STREAK.boostMinutes);
          sfx.handleEvent({ type: 'buy', id: 'streak' });
          persist();
        });
      }, 600);
    }
  };
  checkNewDay();
  setInterval(checkNewDay, 60000);

  let lastZone = sim.zone;
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
    if (steps === 6 && acc > SIM_DT) acc = SIM_DT * 0.999;

    for (const e of sim.events) {
      renderer.handleEvent(e, sim);
      hud.handleEvent(e, sim);
      sfx.handleEvent(e);
      switch (e.type) {
        case 'kill':
          if (e.kind !== 'soldier') {
            if (!renderer.reducedMotion) hitStop = Math.max(hitStop, 0.07);
            if (navigator.vibrate) navigator.vibrate(25);
          }
          break;
        case 'buy':
          if (navigator.vibrate) navigator.vibrate(8);
          break;
        case 'battleStart':
          if (e.commander) showCommanderToast(uiEl, e.battle);
          break;
        case 'surge':
          showSurgeToast(uiEl);
          if (navigator.vibrate) navigator.vibrate([30, 60, 30]);
          break;
        case 'battleWon': {
          showWinToast(uiEl, e.battle, e.reward);
          if (e.unlock) {
            const cls = e.unlock;
            setTimeout(() => showUnlockCard(uiEl, cls, () => persist()), 900);
          }
          if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
          persist();
          break;
        }
        case 'battleLost': {
          showLossCard(
            uiEl,
            { battle: e.battle, remaining: e.remaining, reward: e.reward, pity: sim.pity },
            () => sim.startBattle()
          );
          if (navigator.vibrate) navigator.vibrate(60);
          persist();
          break;
        }
        default:
          break;
      }
    }
    sim.events.length = 0;

    if (sim.zone !== lastZone) {
      lastZone = sim.zone;
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

let hiddenAt = 0;
let offlineCardOpen = false;

function grantOffline(scrap: number, seconds: number) {
  sim.state.scrap += scrap;
  sim.state.lifetimeScrap += scrap;
  persist();
  if (offlineCardOpen) return;
  offlineCardOpen = true;
  showOfflineCard(uiEl, { scrap, seconds }, () => {
    offlineCardOpen = false;
    sfx.unlock();
    const fake = { type: 'buy', id: 'offline' } as const;
    sfx.handleEvent(fake);
    renderer.handleEvent(fake, sim);
  });
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    persist();
  } else {
    sfx.unlock();
    if (hiddenAt > 0 && !nosave) {
      const offline = computeOffline({ lastSeen: hiddenAt, scrapRate: sim.scrapRate }, sim.offlineCapHours);
      hiddenAt = 0;
      if (offline) grantOffline(offline.scrap, offline.seconds);
    }
  }
});
window.addEventListener('pagehide', persist);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

// dev/test hooks for screenshots + probes
declare global {
  interface Window {
    __pp: {
      sim: Sim;
      ff: (seconds: number) => void;
      setScrap: (n: number) => void;
      buyClass: (cls: ClassId) => boolean;
      attack: () => void;
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
    __ppAtlas?: HTMLCanvasElement;
  }
}

window.__pp = {
  sim,
  ff: (s) => sim.fastForward(s),
  setScrap: (n) => {
    sim.state.scrap = n;
  },
  buyClass: (cls) => sim.buyClass(cls),
  attack: () => sim.startBattle(),
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
  const card = document.createElement('div');
  card.className = 'intro-overlay';
  card.innerHTML = `<div class="intro-card"><div class="intro-brand">OUT OF<br>BATTERIES</div>
    <div class="intro-sub">This device couldn't start the battlefield (WebGL unavailable).<br>Try another browser or device.</div></div>`;
  uiEl.appendChild(card);
  console.error(err);
});

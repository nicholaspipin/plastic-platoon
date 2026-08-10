import type { Sim, SimState, UpgradeId } from './sim';

const KEY = 'plastic-platoon-save';
const VERSION = 1;

export interface SaveData {
  v: number;
  state: SimState;
  scrapRate: number;
  greenReserve: number;
  lastSeen: number; // epoch ms, for offline earnings
  muted: boolean;
  seenIntro: boolean;
}

export function saveGame(sim: Sim, extra: { muted: boolean; seenIntro: boolean }) {
  const data: SaveData = {
    v: VERSION,
    state: sim.state,
    scrapRate: sim.scrapRate,
    greenReserve: sim.greenReserve,
    lastSeen: Date.now(),
    muted: extra.muted,
    seenIntro: extra.seenIntro,
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // storage full/blocked — nothing to do
  }
}

export function loadGame(): SaveData | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = migrate(JSON.parse(raw));
    return data;
  } catch {
    return null;
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

function migrate(data: any): SaveData | null {
  if (!data || typeof data !== 'object') return null;
  switch (data.v) {
    case VERSION:
      break;
    // future: case 1: upgrade to 2 ... fallthrough
    default:
      return null; // unknown version: start fresh rather than crash
  }
  // defensive defaults so a partially-corrupt save can't NaN the economy
  const s = data.state ?? {};
  const upgrades: Record<UpgradeId, number> = {
    faster: num(s.upgrades?.faster),
    bigger: num(s.upgrades?.bigger),
    rifles: num(s.upgrades?.rifles),
    scouts: num(s.upgrades?.scouts),
  };
  return {
    v: VERSION,
    state: {
      scrap: num(s.scrap),
      totalScrapEarned: num(s.totalScrapEarned),
      wave: Math.max(1, num(s.wave, 1)),
      medals: num(s.medals),
      zone: num(s.zone),
      upgrades,
    },
    scrapRate: num(data.scrapRate),
    greenReserve: num(data.greenReserve),
    lastSeen: num(data.lastSeen, Date.now()),
    muted: !!data.muted,
    seenIntro: !!data.seenIntro,
  };
}

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && isFinite(v) ? v : fallback;
}

export function applySave(sim: Sim, data: SaveData) {
  sim.state = data.state;
  sim.scrapRate = data.scrapRate;
  sim.greenReserve = data.greenReserve;
}

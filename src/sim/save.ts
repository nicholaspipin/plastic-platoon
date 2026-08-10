import { CLASS_ORDER, type TreeNodeId } from './defs';
import { defaultState, type Mission, type Sim, type SimState } from './sim';

const KEY = 'plastic-platoon-save';
const VERSION = 2;

export interface SaveData {
  v: number;
  state: SimState;
  scrapRate: number;
  greenReserve: number;
  lastSeen: number;
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
    return migrate(JSON.parse(raw));
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

/* eslint-disable @typescript-eslint/no-explicit-any */
function migrate(data: any): SaveData | null {
  if (!data || typeof data !== 'object') return null;
  switch (data.v) {
    case 1:
      data = migrateV1toV2(data);
      break;
    case VERSION:
      break;
    default:
      return null; // unknown version: start fresh rather than crash
  }
  return sanitize(data);
}

/** v1 (endless waves, 4 flat upgrades) → v2 (battles, classes, tree). */
function migrateV1toV2(v1: any): any {
  const s = v1.state ?? {};
  const up = s.upgrades ?? {};
  const state = defaultState();
  state.scrap = num(s.scrap);
  state.lifetimeScrap = num(s.totalScrapEarned);
  // v1 wave count maps to battle frontier, softened (v2 battles are meatier)
  state.battle = Math.max(1, Math.min(30, Math.round(num(s.wave, 1) * 0.6)));
  state.medals = num(s.medals) * 3; // v1 medals were scarcer; keep value felt
  state.molderRateLv = num(up.faster) * 2;
  state.moldSizeLv = num(up.bigger);
  state.classLv.rifle = num(up.rifles) * 2;
  state.classLv.scout = num(up.scouts) * 2;
  return {
    v: VERSION,
    state,
    scrapRate: num(v1.scrapRate),
    greenReserve: num(v1.greenReserve),
    lastSeen: num(v1.lastSeen, Date.now()),
    muted: !!v1.muted,
    seenIntro: !!v1.seenIntro,
  };
}

/** Defensive: corrupt saves must never NaN/negative the economy or softlock. */
function sanitize(data: any): SaveData | null {
  const d = defaultState();
  const s = data.state ?? {};
  const tree = { ...d.tree };
  for (const k of Object.keys(tree) as TreeNodeId[]) tree[k] = int(s.tree?.[k]);
  const program = { ...d.program };
  for (const c of CLASS_ORDER) program[c] = s.program?.[c] !== false;
  const classLv = { ...d.classLv };
  for (const c of CLASS_ORDER) classLv[c] = int(s.classLv?.[c]);
  const missions: Mission[] = Array.isArray(s.missions)
    ? s.missions.filter((m: any) => m && typeof m.id === 'string' && isFinite(m.target)).slice(0, 3)
    : [];

  const state: SimState = {
    scrap: num(s.scrap),
    lifetimeScrap: num(s.lifetimeScrap),
    battle: Math.max(1, int(s.battle, 1)),
    medals: num(s.medals),
    medalsSpent: Math.min(num(s.medalsSpent), num(s.medals)),
    tree,
    program,
    classLv,
    molderRateLv: int(s.molderRateLv),
    moldSizeLv: int(s.moldSizeLv),
    lossStreak: int(s.lossStreak),
    missions,
    missionSeed: Math.max(1, int(s.missionSeed, 1)),
    dailyDate: str(s.dailyDate),
    streakDay: Math.min(7, int(s.streakDay)),
    streakLast: str(s.streakLast),
    boostUntil: num(s.boostUntil),
    stats: {
      stamps: num(s.stats?.stamps),
      kills: num(s.stats?.kills),
      bands: num(s.stats?.bands),
      wins: num(s.stats?.wins),
      winsToday: num(s.stats?.winsToday),
    },
  };
  return {
    v: VERSION,
    state,
    scrapRate: num(data.scrapRate),
    greenReserve: num(data.greenReserve),
    lastSeen: num(data.lastSeen, Date.now()),
    muted: !!data.muted,
    seenIntro: !!data.seenIntro,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function num(v: unknown, fallback = 0): number {
  return typeof v === 'number' && isFinite(v) && v >= 0 ? v : fallback;
}
function int(v: unknown, fallback = 0): number {
  return Math.floor(num(v, fallback));
}
function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

export function applySave(sim: Sim, data: SaveData) {
  sim.state = data.state;
  sim.scrapRate = data.scrapRate;
  sim.greenReserve = data.greenReserve;
  sim.onLoaded();
}

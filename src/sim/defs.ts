// All tuning constants in one place. V2 numbers derive from research/idle-math.md
// (cost growth 1.07–1.15, battle budget ×1.16, TTNP 15–45s early) and DESIGN2.md.

export const SIM_HZ = 60;
export const SIM_DT = 1 / SIM_HZ;

// ---------------------------------------------------------------- unit classes

export type ClassId = 'rifle' | 'scout' | 'mg' | 'medic' | 'bazooka' | 'sniper' | 'officer';

export interface ClassDef {
  name: string;
  blurb: string;
  unlockBattle: number;
  weight: number; // stamp rotation weight when enabled
  costBase: number;
  costGrowth: number;
  speed: number;
  range: number;
  cd: number;
  hp: number;
  dmg: number;
  heal?: number; // medic: hp restored per action
  splash?: number; // bazooka: radius
  vsBoss?: number; // bazooka: damage multiplier vs robots/dinos
}

export const CLASS_ORDER: ClassId[] = ['rifle', 'scout', 'mg', 'medic', 'bazooka', 'sniper', 'officer'];

export const CLASSES: Record<ClassId, ClassDef> = {
  rifle: {
    name: 'RIFLEMAN',
    blurb: 'The classic. Holds the line.',
    unlockBattle: 1,
    weight: 3,
    costBase: 10,
    costGrowth: 1.12,
    speed: 46,
    range: 115,
    cd: 0.9,
    hp: 3,
    dmg: 1,
  },
  scout: {
    name: 'SCOUT',
    blurb: 'Fast screen, first contact.',
    unlockBattle: 3,
    weight: 2,
    costBase: 25,
    costGrowth: 1.12,
    speed: 74,
    range: 95,
    cd: 0.8,
    hp: 1.8,
    dmg: 0.5,
  },
  mg: {
    name: 'MG GUNNER',
    blurb: 'Sustained lane fire.',
    unlockBattle: 6,
    weight: 2,
    costBase: 60,
    costGrowth: 1.12,
    speed: 40,
    range: 100,
    cd: 0.32,
    hp: 3,
    dmg: 0.55,
  },
  medic: {
    name: 'MEDIC',
    blurb: 'Patches melting plastic.',
    unlockBattle: 10,
    weight: 1,
    costBase: 150,
    costGrowth: 1.13,
    speed: 44,
    range: 80,
    cd: 2.2,
    hp: 2.6,
    dmg: 0,
    heal: 2,
  },
  bazooka: {
    name: 'BAZOOKA',
    blurb: 'Melts armor. Splash damage.',
    unlockBattle: 14,
    weight: 1,
    costBase: 400,
    costGrowth: 1.13,
    speed: 38,
    range: 130,
    cd: 2.5,
    hp: 2.8,
    dmg: 4,
    splash: 36,
    vsBoss: 3,
  },
  sniper: {
    name: 'SNIPER',
    blurb: 'Picks the biggest target.',
    unlockBattle: 22,
    weight: 1,
    costBase: 1000,
    costGrowth: 1.14,
    speed: 40,
    range: 195,
    cd: 2.0,
    hp: 2.1,
    dmg: 3,
  },
  officer: {
    name: 'OFFICER',
    blurb: '+20% damage aura, +10% scrap.',
    unlockBattle: 30,
    weight: 1,
    costBase: 2500,
    costGrowth: 1.15,
    speed: 44,
    range: 90,
    cd: 1.2,
    hp: 3.5,
    dmg: 0.8,
  },
};

// class level → power multiplier (dmg+hp+heal): +22%/lv, ×2 milestones at 10/25/50
export const CLASS_POWER_PER_LEVEL = 0.22;
export const MILESTONES = [10, 25, 50];

export function classPower(level: number): number {
  let m = 1 + CLASS_POWER_PER_LEVEL * level;
  for (const t of MILESTONES) if (level >= t) m *= 2;
  return m;
}

// ---------------------------------------------------------------- battles

export const BATTLE = {
  budgetBase: 70, // enemy strength points at battle 1 (≈ total force HP / TAN.hpBase)
  budgetGrowth: 1.26,
  surgeAt: 120, // seconds — break the force by then or reinforcements charge
  surgeSpeed: 2,
  surgeDmg: 2.5,
  waves: 3,
  waveSplit: [0.3, 0.33, 0.37],
  wavePause: 3.5, // seconds between assault waves
  commanderEvery: 5,
  commanderBudgetFrac: 0.45,
  rewardBase: 14,
  rewardGrowth: 1.14,
  firstWinMult: 3,
  dropFrac: 0.35, // fraction of reward dropped as pips during the fight
  lossFrac: 0.5, // loss still pays this fraction of the reward
  pityAfter: 2,
  pityStep: 0.06,
  pityCap: 0.25,
  theaterEvery: 20,
  intermission: 4, // seconds between a win and the next battle auto-starting
  officerEscortFrom: 20, // commander battles bring tan officers from here
};

// tan scaling: battle-force COUNT grows ~linearly; the exponential budget
// (×1.16/battle) pours into per-tan HP, so quality outraces quantity — that's
// what creates the wall. Damage grows gently (linear) so molder pressure rises.
export const TAN_SCALE = {
  dmgPerBattle: 0.045, // +4.5%/battle, linear
  magnification: 1.18, // extra × on entering each new theater
  countBase: 6,
  countPerBattle: 1.1,
  countMax: 40,
};

export const MOLDER_HP = {
  base: 30,
  growth: 1.03, // per battle — keeps time-to-kill roughly constant
  repairDelay: 1.2, // seconds after last hit before repair starts
  repairRate: 0.12, // fraction of max per second while out of battle
};

export const SKIRMISH = {
  spawnEvery: 3.2, // idle trickle between battles
  strength: 0.6, // fraction of a battle-1 soldier's strength value in scrap terms
};

// ---------------------------------------------------------------- units (tan baselines)

export const TAN = {
  speed: 34,
  range: 95,
  cd: 1.5,
  hpBase: 3,
  dmg: 0.42,
};

export const ROBOT = {
  speed: 12,
  range: 110,
  cd: 2.0,
  hpBase: 26, // × budget scaling
  dmg: 3,
};

export const DINO = {
  speed: 26,
  range: 60,
  cd: 1.4,
  hpBase: 20,
  dmg: 2.2,
};

// ---------------------------------------------------------------- molder economy

export const ECON = {
  molderRate: { base: 15, growth: 1.07, pctPerLevel: 0.12 }, // stamp speed
  moldSize: { base: 80, growth: 1.35 }, // +1 per stamp
  stampBase: 2.2, // seconds between stamps at rate lv 0
};

// ---------------------------------------------------------------- prestige

export const PRESTIGE = {
  // medals = floor(coeff * sqrt(lifetimeScrap / S1)); tuned so an hour-one
  // lifetime (≈S1) grants ~15 medals, and 4× lifetime doubles the count
  S1: 25000,
  coefficient: 15,
  passivePerMedal: 0.02, // +2% scrap income per medal, automatic
  minBattle: 10,
};

export type TreeNodeId =
  | 'fasterMolder'
  | 'plasticQuality'
  | 'bayonets'
  | 'warBonds'
  | 'offlineLogistics'
  | 'elastic'
  | 'startingKit'
  | 'veteranMolds';

export interface TreeNode {
  name: string;
  blurb: string;
  maxRanks: number;
  costPerRank: number[]; // medal points
}

export const TREE: Record<TreeNodeId, TreeNode> = {
  fasterMolder: { name: 'GREASED PISTON', blurb: '+25% stamp speed / rank', maxRanks: 3, costPerRank: [2, 5, 12] },
  plasticQuality: { name: 'PLASTIC QUALITY', blurb: '+20% soldier HP / rank', maxRanks: 3, costPerRank: [2, 5, 12] },
  bayonets: { name: 'SHARPER BAYONETS', blurb: '+20% damage / rank', maxRanks: 3, costPerRank: [2, 5, 12] },
  warBonds: { name: 'WAR BONDS', blurb: '+30% battle rewards / rank', maxRanks: 3, costPerRank: [3, 7, 15] },
  offlineLogistics: { name: 'NIGHT SHIFT', blurb: '+2h offline cap / rank', maxRanks: 3, costPerRank: [3, 6, 10] },
  elastic: { name: 'ELASTIC BAND', blurb: '−1s snap cooldown / rank', maxRanks: 2, costPerRank: [4, 10] },
  startingKit: { name: 'STARTING KIT', blurb: 'Begin runs with Scout + MG unlocked', maxRanks: 1, costPerRank: [8] },
  veteranMolds: { name: 'VETERAN MOLDS', blurb: 'Keep milestone ×2s through prestige', maxRanks: 1, costPerRank: [20] },
};

// ---------------------------------------------------------------- band / offline / missions

export const BAND = {
  cd: 6,
  radius: 78,
  dmg: 8,
};

export const OFFLINE = {
  baseCapHours: 2,
  capPerLogistics: 2,
  efficiency: 1.0, // 100% of measured rate (research: generous offline wins)
  minAwaySec: 60,
};

export const MISSIONS = {
  slots: 3,
  // templates: [id, kind, base target, growth per battle, reward fraction of battle reward]
};

export const STREAK = {
  days: 7,
  // reward = battle reward × these multipliers; day 7 also grants a boost token
  rewardMult: [1, 1.5, 2, 2.5, 3, 4, 6],
  boostMinutes: 10,
  boostFactor: 2,
};

// ---------------------------------------------------------------- layout

export const LAYOUT = {
  bandTop: 0.41,
  bandBot: 0.73,
  molderX: 68,
  molderY: 0.62,
  hopperDY: -170,
  rallyX: 0.54,
  tanStopX: 175,
};

export const CAPS = {
  greenRendered: 110,
  tanRendered: 80,
  maxUnits: 240,
  pips: 96,
};

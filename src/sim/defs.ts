// All tuning constants in one place. Baseline values from the brief §3.2; tune freely ±.

export const SIM_HZ = 60;
export const SIM_DT = 1 / SIM_HZ;

export const GREEN = {
  speed: 46,
  range: 115,
  cd: 0.9,
  hp: 3,
  dmg: 1,
};

export const TAN = {
  speed: 34,
  range: 95,
  cd: 1.5,
  hpBase: 2,
  hpWaveScale: 0.18,
  dmg: 0.55,
  scrap: 2,
};

export const ROBOT = {
  speed: 12,
  range: 110,
  cd: 2.0,
  hpBase: 55,
  hpWaveScale: 0.18,
  dmg: 3,
  scrap: 22,
  everyNWaves: 5,
};

export const DINO = {
  // M3 boss #2: toy dinosaur — faster than robot, less tanky, lunges.
  speed: 26,
  range: 60,
  cd: 1.4,
  hpBase: 38,
  hpWaveScale: 0.2,
  dmg: 2.2,
  scrap: 22,
};

export const MOLDER = {
  stampBase: 2.2, // seconds between stamps
  stampFactorPerLevel: 0.75,
};

export const BAND = {
  cd: 6,
  radius: 78,
  dmg: 8,
};

export const COSTS = {
  faster: { base: 30, factor: 1.8 },
  bigger: { base: 80, factor: 2.2 },
  rifles: { base: 200, factor: 2.0 }, // M3: +25% green dmg per level
  scouts: { base: 140, factor: 1.9 }, // M3: +12% green speed per level
};

export const RIFLES_DMG_PER_LEVEL = 0.25;
export const SCOUTS_SPD_PER_LEVEL = 0.12;

export const CAPS = {
  greenRendered: 110,
  tanRendered: 80,
  maxUnits: 240,
  pips: 96,
};

export const WAVES = {
  baseCount: 4,
  countGrowth: 1.2, // + round(wave * growth)
  intermission: 2.5, // seconds between waves
  spawnStagger: 0.14, // seconds between tan spawns within a wave
};

export const OFFLINE = {
  capHours: 4.5,
  efficiency: 0.5, // fraction of live rate earned while away
  minAwaySec: 60,
};

export const PRESTIGE = {
  // medals = floor((totalScrapEarned / 2500) ^ 0.6); each medal = +10% scrap
  divisor: 2500,
  exponent: 0.6,
  bonusPerMedal: 0.1,
  minWave: 12,
};

// Layout fractions of the logical viewport.
export const LAYOUT = {
  bandTop: 0.34, // battle band vertical extent
  bandBot: 0.8,
  molderX: 60, // px from left
  rallyX: 0.54, // greens hold this line when unopposed (fraction of width)
  tanStopX: 175, // tans never advance past this (px from left) — no fail state
};

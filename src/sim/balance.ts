// Directive 2 balance surface. Keep tuning here so economy, army scale, and
// zone pacing can be reviewed without hunting through sim/render code.

export const SIM_HZ = 60;
export const SIM_DT = 1 / SIM_HZ;

export const GREEN = {
  speed: 54,
  range: 118,
  cd: 0.82,
  hp: 3,
  dmg: 1,
};

export const TAN = {
  speed: 34,
  range: 95,
  cd: 1.45,
  hpBase: 3,
  hpWaveScale: 0.36,
  dmg: 0.55,
  scrap: 2,
};

export const ROBOT = {
  speed: 12,
  range: 110,
  cd: 2.0,
  hpBase: 55,
  hpWaveScale: 0.22,
  dmg: 3,
  scrap: 22,
  everyNWaves: 5,
};

export const DINO = {
  speed: 26,
  range: 60,
  cd: 1.4,
  hpBase: 38,
  hpWaveScale: 0.2,
  dmg: 2.2,
  scrap: 22,
};

export const RC_CAR = {
  speed: 120,
  range: 36,
  cd: 1.2,
  hpBase: 24,
  hpWaveScale: 0.14,
  dmg: 1.8,
  scrap: 16,
};

export const PAPER_PLANE = {
  speed: 88,
  range: 80,
  cd: 1.0,
  hpBase: 18,
  hpWaveScale: 0.12,
  dmg: 1.4,
  scrap: 14,
};

export const MOLDER = {
  stampBase: 0.92,
  stampFactorPerLevel: 0.78,
  openingBurst: 6,
};

export const BAND = {
  cd: 6,
  radius: 86,
  dmg: 8,
};

export const COSTS = {
  faster: { base: 18, factor: 1.62 },
  bigger: { base: 34, factor: 1.7 },
  rifles: { base: 55, factor: 1.76 },
  scouts: { base: 46, factor: 1.68 },
};

export const RIFLES_DMG_PER_LEVEL = 0.25;
export const SCOUTS_SPD_PER_LEVEL = 0.12;

export const CAPS = {
  greenRendered: 150,
  tanRendered: 95,
  maxUnits: 320,
  pips: 128,
};

export const WAVES = {
  baseCount: 7,
  countGrowth: 2.1,
  intermission: 1.75,
  spawnStagger: 0.028,
  supplyDropEvery: 5,
};

export const FORMATION = {
  platoonSize: 20,
  columns: 8,
  rankXStep: 20,
  slotArriveRadius: 12,
  commandDefaultX: 0.66,
  commandMinX: 0.42,
  commandMaxX: 0.82,
};

export const TERRITORY = {
  zoneLength: 1000,
  pushBasePerSec: 7.5,
  retreatBasePerSec: 5,
  checkpointNames: ['Pencil Bridge', 'LEGO Gate', 'Cereal Box Fortress'],
  checkpointAt: [0.22, 0.52, 0.9],
};

export const HAZARDS = {
  glueX: 0.58,
  glueY: 0.66,
  glueRadius: 46,
  glueSlow: 0.42,
  marbleEvery: 37,
  paperEvery: 29,
  catEvery: 83,
};

export const OFFLINE = {
  capHours: 4.5,
  efficiency: 0.5,
  minAwaySec: 60,
};

export const PRESTIGE = {
  divisor: 2500,
  exponent: 0.6,
  bonusPerMedal: 0.1,
  minWave: 12,
};

export const LAYOUT = {
  bandTop: 0.38,
  bandBot: 0.72,
  molderX: 104,
  molderY: 0.62,
  hopperDY: -170,
  rallyX: 0.58,
  tanStopX: 175,
};

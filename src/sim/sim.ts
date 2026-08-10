import {
  BAND,
  CAPS,
  COSTS,
  DINO,
  FORMATION,
  GREEN,
  HAZARDS,
  LAYOUT,
  MOLDER,
  PAPER_PLANE,
  PRESTIGE,
  RC_CAR,
  RIFLES_DMG_PER_LEVEL,
  ROBOT,
  SCOUTS_SPD_PER_LEVEL,
  SIM_DT,
  TAN,
  TERRITORY,
  WAVES,
} from './defs';
import { mulberry32, type Rng } from './rng';

export type Faction = 0 | 1; // 0 green, 1 tan
export type UnitKind = 'rifleman' | 'bazooka' | 'gunner' | 'robot' | 'dino' | 'rcCar' | 'paperPlane';
export type MoveMode = 'waddle' | 'hop' | 'shuffle' | 'fly';
export type FormationShape = 'line' | 'wedge' | 'square';

export interface Unit {
  active: boolean;
  faction: Faction;
  kind: UnitKind;
  x: number;
  y: number;
  px: number;
  py: number;
  hp: number;
  maxHp: number;
  speed: number;
  range: number;
  fireCd: number;
  cd: number;
  dmg: number;
  scrap: number;
  target: number; // unit index or -1
  retargetIn: number;
  state: 'march' | 'fight' | 'dying';
  deathT: number;
  tipDir: number; // -1 | 1 which way the toy tips when knocked over
  phase: number; // anim phase offset
  variant: number; // sprite pose variant
  laneY: number; // assigned lane — units fan out toward it after spawning
  formationIndex: number;
  formationRank: number;
  formationCol: number;
  platoon: number;
  homeX: number;
  homeY: number;
  moveMode: MoveMode;
  stunT: number;
}

export interface Pip {
  active: boolean;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  t: number;
  value: number;
}

export type SimEvent =
  | { type: 'stamp'; count: number }
  | { type: 'spawn'; i: number }
  | { type: 'fire'; i: number; tx: number; ty: number; faction: Faction }
  | { type: 'hit'; i: number; x: number; y: number; faction: Faction }
  | { type: 'kill'; x: number; y: number; kind: UnitKind; faction: Faction; tipDir: number }
  | { type: 'collect'; value: number }
  | { type: 'band'; x: number; y: number }
  | { type: 'bandReady' }
  | { type: 'waveStart'; wave: number; boss: UnitKind | null }
  | { type: 'buy'; id: UpgradeId }
  | { type: 'platoon'; platoon: number; label: string; x: number; y: number }
  | { type: 'checkpoint'; index: number; name: string }
  | { type: 'commandLine'; x: number }
  | { type: 'hazard'; kind: 'marble' | 'paper' | 'glue' | 'cat'; x: number; y: number }
  | { type: 'stepTik'; count: number };

export type UpgradeId = 'faster' | 'bigger' | 'rifles' | 'scouts';

export interface SimState {
  scrap: number;
  totalScrapEarned: number;
  wave: number;
  medals: number;
  zone: number;
  push: number;
  bestPush: number;
  checkpoint: number;
  formation: FormationShape;
  upgrades: Record<UpgradeId, number>;
}

/**
 * Fixed-timestep battle simulation. Owns all game rules and the economy.
 * Rendering reads unit positions (with interpolation via px/py) and drains `events`.
 */
export class Sim {
  rng: Rng;
  units: Unit[] = [];
  pips: Pip[] = [];
  events: SimEvent[] = [];

  // dimensions of the logical battlefield (CSS px)
  w = 390;
  h = 780;

  state: SimState = {
    scrap: 0,
    totalScrapEarned: 0,
    wave: 1,
    medals: 0,
    zone: 0,
    push: 0,
    bestPush: 0,
    checkpoint: 0,
    formation: 'line',
    upgrades: { faster: 0, bigger: 0, rifles: 0, scouts: 0 },
  };

  // molder
  stampT = 0.18; // first stamps come quickly: the army fantasy starts immediately
  // wave machinery
  waveActive = false;
  intermissionT = 1.0;
  toSpawn = 0;
  spawnStaggerT = 0;
  waveHpMult = 1;
  bossToSpawn: UnitKind | null = null;
  // band
  bandCd = 0;
  // battalion reserve: greens beyond the render cap
  greenReserve = 0;
  commandLineX = 0;
  private nextPlatoonAnnounced = 1;
  private hazardT = 8;
  private paperT = 18;
  private catT = 48;
  private stepTikT = 0;
  // rolling scrap rate for offline earnings (scrap/sec, exponentially smoothed)
  scrapRate = 0;
  private scrapThisSecond = 0;
  private rateTickT = 0;
  time = 0;

  constructor(seed = (Math.random() * 2 ** 31) | 0) {
    this.rng = mulberry32(seed);
    for (let i = 0; i < CAPS.maxUnits; i++) this.units.push(makeUnit());
    for (let i = 0; i < CAPS.pips; i++) this.pips.push(makePip());
    this.commandLineX = this.w * FORMATION.commandDefaultX;
    for (let i = 0; i < MOLDER.openingBurst; i++) this.spawnGreen();
    this.events.length = 0;
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    if (!this.commandLineX) this.commandLineX = this.w * FORMATION.commandDefaultX;
  }

  // -------------------------------------------------- derived stats

  get stampInterval() {
    return MOLDER.stampBase * Math.pow(MOLDER.stampFactorPerLevel, this.state.upgrades.faster);
  }
  get stampSize() {
    return 1 + this.state.upgrades.bigger;
  }
  get greenDmg() {
    const battalion = 1 + this.greenReserve / CAPS.greenRendered;
    return GREEN.dmg * (1 + RIFLES_DMG_PER_LEVEL * this.state.upgrades.rifles) * battalion;
  }
  get greenSpeed() {
    return GREEN.speed * (1 + SCOUTS_SPD_PER_LEVEL * this.state.upgrades.scouts);
  }
  get scrapMult() {
    return 1 + this.state.medals * PRESTIGE.bonusPerMedal;
  }
  get battalionMult() {
    return 1 + this.greenReserve / CAPS.greenRendered;
  }

  upgradeCost(id: UpgradeId) {
    const c = COSTS[id];
    return Math.round(c.base * Math.pow(c.factor, this.state.upgrades[id]));
  }

  canBuy(id: UpgradeId) {
    return this.state.scrap >= this.upgradeCost(id);
  }

  buy(id: UpgradeId): boolean {
    const cost = this.upgradeCost(id);
    if (this.state.scrap < cost) return false;
    this.state.scrap -= cost;
    this.state.upgrades[id]++;
    this.events.push({ type: 'buy', id });
    return true;
  }

  // -------------------------------------------------- prestige (M3)

  medalsOnPrestige(): number {
    return Math.floor(Math.pow(this.state.totalScrapEarned / PRESTIGE.divisor, PRESTIGE.exponent));
  }

  canPrestige() {
    return this.state.wave >= PRESTIGE.minWave && this.medalsOnPrestige() > this.state.medals;
  }

  prestige() {
    const medals = this.medalsOnPrestige();
    this.state.medals = Math.max(this.state.medals, medals);
    this.state.scrap = 0;
    this.state.wave = 1;
    this.state.upgrades = { faster: 0, bigger: 0, rifles: 0, scouts: 0 };
    this.state.zone = 0;
    this.state.push = 0;
    this.state.bestPush = 0;
    this.state.checkpoint = 0;
    this.state.formation = 'line';
    for (const u of this.units) u.active = false;
    for (const p of this.pips) p.active = false;
    this.greenReserve = 0;
    this.waveActive = false;
    this.intermissionT = 1.5;
    this.toSpawn = 0;
    this.bossToSpawn = null;
    this.stampT = 0.18;
    this.bandCd = 0;
    this.nextPlatoonAnnounced = 1;
  }

  setCommandLine(x: number) {
    const lo = this.w * FORMATION.commandMinX;
    const hi = this.w * FORMATION.commandMaxX;
    this.commandLineX = clamp(x, lo, hi);
    this.events.push({ type: 'commandLine', x: this.commandLineX });
  }

  // -------------------------------------------------- input

  tryBand(x: number, y: number): boolean {
    if (this.bandCd > 0) return false;
    this.bandCd = BAND.cd;
    this.events.push({ type: 'band', x, y });
    const r2 = BAND.radius * BAND.radius;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (!u.active || u.faction !== 1 || u.state === 'dying') continue;
      const dx = u.x - x;
      const dy = u.y - y;
      if (dx * dx + dy * dy <= r2) this.damage(i, BAND.dmg, 1); // all tip rightward (same direction)
    }
    return true;
  }

  // -------------------------------------------------- stepping

  step() {
    const dt = SIM_DT;
    this.time += dt;

    // molder
    this.stampT -= dt;
    if (this.stampT <= 0) {
      this.stampT += this.stampInterval;
      this.stamp();
    }

    // band cooldown
    if (this.bandCd > 0) {
      this.bandCd -= dt;
      if (this.bandCd <= 0) {
        this.bandCd = 0;
        this.events.push({ type: 'bandReady' });
      }
    }

    // waves
    this.stepWaves(dt);
    this.assignFormations();
    this.stepTerritory(dt);
    this.stepHazards(dt);
    this.stepFootTiks(dt);

    // units
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (!u.active) continue;
      u.px = u.x;
      u.py = u.y;
      if (u.state === 'dying') {
        u.deathT += dt;
        if (u.deathT > 0.95) u.active = false;
        continue;
      }
      if (u.stunT > 0) u.stunT = Math.max(0, u.stunT - dt);
      this.stepUnit(i, u, dt);
    }
    this.separate(dt);

    // pips
    for (const p of this.pips) {
      if (!p.active) continue;
      p.px = p.x;
      p.py = p.y;
      this.stepPip(p, dt);
    }

    // scrap rate rolling estimate (for offline earnings)
    this.rateTickT += dt;
    if (this.rateTickT >= 1) {
      this.rateTickT -= 1;
      this.scrapRate = this.scrapRate * 0.95 + this.scrapThisSecond * 0.05;
      this.scrapThisSecond = 0;
    }
  }

  private stamp() {
    const n = this.stampSize;
    let spawned = 0;
    for (let k = 0; k < n; k++) {
      if (this.countActive(0) < CAPS.greenRendered) {
        this.spawnGreen();
        spawned++;
      } else {
        this.greenReserve++;
      }
    }
    this.events.push({ type: 'stamp', count: Math.max(spawned, 1) });
    const visibleGreens = this.countActive(0);
    while (visibleGreens + this.greenReserve >= this.nextPlatoonAnnounced * FORMATION.platoonSize) {
      const platoon = this.nextPlatoonAnnounced;
      this.events.push({
        type: 'platoon',
        platoon,
        label: platoonLabel(platoon),
        x: this.commandLineX - 44,
        y: this.h * LAYOUT.bandTop + 24 + (platoon % 4) * 22,
      });
      this.nextPlatoonAnnounced++;
    }
  }

  private assignFormations() {
    const greens: number[] = [];
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (u.active && u.faction === 0 && u.state !== 'dying') greens.push(i);
    }
    greens.sort((a, b) => this.units[b].x - this.units[a].x || a - b);

    const bandTop = this.h * LAYOUT.bandTop;
    const bandBot = this.h * LAYOUT.bandBot;
    const cols = FORMATION.columns;
    const colGap = (bandBot - bandTop) / cols;
    const shape = this.state.formation;

    for (let order = 0; order < greens.length; order++) {
      const u = this.units[greens[order]];
      const rank = Math.floor(order / cols);
      const col = order % cols;
      const centeredCol = col - (cols - 1) / 2;
      let x = this.commandLineX - rank * FORMATION.rankXStep;
      let y = bandTop + colGap * (col + 0.5);

      if (shape === 'wedge') {
        x -= Math.abs(centeredCol) * 5 + rank * 2;
      } else if (shape === 'square') {
        const squareRank = Math.floor(order / 10);
        const squareCol = order % 10;
        x = this.commandLineX - squareRank * 18;
        y = bandTop + ((squareCol + 0.5) / 10) * (bandBot - bandTop);
      }

      u.formationIndex = order;
      u.formationRank = rank;
      u.formationCol = col;
      u.platoon = Math.floor(order / FORMATION.platoonSize) + 1;
      u.homeX = x;
      u.homeY = y;
      u.laneY = y;
    }
  }

  private stepTerritory(dt: number) {
    const greens = this.countActive(0) + this.greenReserve * 0.25;
    const tans = this.countActive(1);
    const advantage = greens - tans * 1.2;
    const speed =
      advantage >= 0
        ? Math.min(18, TERRITORY.pushBasePerSec + advantage * 0.06)
        : -Math.min(10, TERRITORY.retreatBasePerSec + Math.abs(advantage) * 0.08);
    const shapeBonus = this.state.formation === 'wedge' ? 1.12 : this.state.formation === 'square' ? 0.9 : 1;
    this.state.push = clamp(this.state.push + speed * shapeBonus * dt, 0, TERRITORY.zoneLength);
    this.state.bestPush = Math.max(this.state.bestPush, this.state.push);

    const progress = this.state.push / TERRITORY.zoneLength;
    const next = this.state.checkpoint;
    if (next < TERRITORY.checkpointAt.length && progress >= TERRITORY.checkpointAt[next]) {
      this.state.checkpoint++;
      this.events.push({
        type: 'checkpoint',
        index: next,
        name: TERRITORY.checkpointNames[next],
      });
      if (next === 0) this.state.formation = 'wedge';
      if (next === 1) this.state.formation = 'square';
    }
  }

  private stepHazards(dt: number) {
    this.hazardT -= dt;
    this.paperT -= dt;
    this.catT -= dt;

    if (this.hazardT <= 0) {
      this.hazardT += HAZARDS.marbleEvery + this.rng() * 8;
      const y = this.h * (LAYOUT.bandTop + this.rng() * (LAYOUT.bandBot - LAYOUT.bandTop));
      this.events.push({ type: 'hazard', kind: 'marble', x: this.w + 20, y });
      for (let i = 0; i < this.units.length; i++) {
        const u = this.units[i];
        if (!u.active || u.state === 'dying') continue;
        if (Math.abs(u.y - y) < 28 && u.x > this.w * 0.45) this.damage(i, 1.1, u.faction === 0 ? -1 : 1);
      }
    }

    if (this.paperT <= 0) {
      this.paperT += HAZARDS.paperEvery + this.rng() * 10;
      this.spawnTan('paperPlane');
      this.events.push({ type: 'hazard', kind: 'paper', x: this.w * 0.72, y: this.h * 0.34 });
    }

    if (this.catT <= 0) {
      this.catT += HAZARDS.catEvery + this.rng() * 28;
      const y = this.h * 0.55;
      this.events.push({ type: 'hazard', kind: 'cat', x: this.w * 0.86, y });
      for (const u of this.units) {
        if (!u.active || u.state === 'dying') continue;
        u.stunT = Math.max(u.stunT, 1.4);
        u.x += (this.rng() - 0.5) * 42;
        u.y = clamp(u.y + (this.rng() - 0.5) * 54, this.h * LAYOUT.bandTop, this.h * LAYOUT.bandBot);
      }
    }
  }

  private stepFootTiks(dt: number) {
    this.stepTikT -= dt;
    if (this.stepTikT > 0) return;
    const marchers = this.countActive(0);
    if (marchers < 12) {
      this.stepTikT = 0.45;
      return;
    }
    this.stepTikT = clamp(0.34 - marchers * 0.0012, 0.16, 0.34);
    this.events.push({ type: 'stepTik', count: marchers });
  }

  private spawnGreen() {
    const i = this.alloc();
    if (i < 0) {
      this.greenReserve++;
      return;
    }
    const u = this.units[i];
    const bandTop = this.h * LAYOUT.bandTop;
    const bandBot = this.h * LAYOUT.bandBot;
    const tierRoll = this.state.upgrades.rifles + this.state.upgrades.bigger;
    const kind: UnitKind = tierRoll >= 7 && this.rng() < 0.16 ? 'gunner' : tierRoll >= 3 && this.rng() < 0.18 ? 'bazooka' : 'rifleman';
    resetUnit(u, 0, kind);
    // eject onto the molder's output tray (right of the platens — units must
    // never clip through the machine), then fan out to an assigned lane
    u.x = LAYOUT.molderX + 58 + this.rng() * 16;
    u.y = this.h * (LAYOUT.molderY - 0.018) + this.rng() * this.h * 0.04;
    u.laneY = bandTop + this.rng() * (bandBot - bandTop);
    u.px = u.x;
    u.py = u.y;
    const tierBonus = kind === 'gunner' ? 1.45 : kind === 'bazooka' ? 1.9 : 1;
    u.hp = u.maxHp = GREEN.hp * (kind === 'gunner' ? 1.3 : 1);
    u.speed = this.greenSpeed * (0.92 + this.rng() * 0.16) * (kind === 'bazooka' ? 0.9 : 1);
    u.range = GREEN.range + (kind === 'bazooka' ? 30 : kind === 'gunner' ? 15 : 0);
    u.cd = GREEN.cd * (kind === 'gunner' ? 0.72 : kind === 'bazooka' ? 1.45 : 1);
    u.fireCd = GREEN.cd * (0.3 + this.rng() * 0.7);
    u.dmg = tierBonus;
    u.phase = this.rng() * Math.PI * 2;
    u.variant = (this.rng() * 3) | 0;
    u.moveMode = this.state.upgrades.scouts > 0 && u.variant === 2 ? 'hop' : 'waddle';
    this.events.push({ type: 'spawn', i });
  }

  private spawnTan(kind: UnitKind): boolean {
    const i = this.alloc();
    if (i < 0) return false;
    const u = this.units[i];
    const bandTop = this.h * LAYOUT.bandTop;
    const bandBot = this.h * LAYOUT.bandBot;
    resetUnit(u, 1, kind);
    const def =
      kind === 'robot'
        ? ROBOT
        : kind === 'dino'
          ? DINO
          : kind === 'rcCar'
            ? RC_CAR
            : kind === 'paperPlane'
              ? PAPER_PLANE
              : TAN;
    const hpBase = kind === 'rifleman' ? TAN.hpBase : def.hpBase;
    const scale =
      1 +
      (kind === 'dino'
        ? DINO.hpWaveScale
        : kind === 'robot'
          ? ROBOT.hpWaveScale
          : kind === 'rcCar'
            ? RC_CAR.hpWaveScale
            : kind === 'paperPlane'
              ? PAPER_PLANE.hpWaveScale
              : TAN.hpWaveScale) *
        this.state.wave;
    u.x = this.w + 30 + this.rng() * 40;
    u.y = bandTop + this.rng() * (bandBot - bandTop);
    u.laneY = u.y;
    u.px = u.x;
    u.py = u.y;
    u.hp = u.maxHp = hpBase * scale * this.waveHpMult;
    u.speed = def.speed * (0.9 + this.rng() * 0.2);
    u.range = def.range;
    u.cd = def.cd;
    u.fireCd = def.cd * (0.5 + this.rng() * 0.5);
    u.dmg = def.dmg;
    u.scrap = (kind === 'rifleman' ? TAN.scrap : def.scrap) * this.waveHpMult;
    u.phase = this.rng() * Math.PI * 2;
    u.variant = (this.rng() * 3) | 0;
    u.moveMode = kind === 'robot' ? 'shuffle' : kind === 'paperPlane' ? 'fly' : kind === 'rcCar' ? 'hop' : 'waddle';
    this.events.push({ type: 'spawn', i });
    return true;
  }

  private stepWaves(dt: number) {
    if (this.waveActive) {
      if (this.toSpawn > 0 || this.bossToSpawn) {
        this.spawnStaggerT -= dt;
        if (this.spawnStaggerT <= 0) {
          this.spawnStaggerT = WAVES.spawnStagger;
          // only consume the spawn if the pool actually had a slot
          if (this.bossToSpawn) {
            if (this.spawnTan(this.bossToSpawn)) this.bossToSpawn = null;
          } else if (this.spawnTan('rifleman')) {
            this.toSpawn--;
          }
        }
      } else if (this.countActive(1) === 0) {
        // wave cleared
        this.waveActive = false;
        this.intermissionT = WAVES.intermission;
        this.state.wave++;
      }
    } else {
      this.intermissionT -= dt;
      if (this.intermissionT <= 0) this.startWave();
    }
  }

  private startWave() {
    const w = this.state.wave;
    // zone progression: Under the Bed from wave 15 (more zones post-M3)
    if (w >= 15 && this.state.zone < 1) this.state.zone = 1;
    const isBossWave = w % ROBOT.everyNWaves === 0;
    const isRcWave = !isBossWave && w >= 4 && w % 4 === 0;
    let count = WAVES.baseCount + Math.round(w * WAVES.countGrowth);
    if (isBossWave) count = Math.max(3, Math.round(count * 0.5));
    const rendered = Math.min(count, CAPS.tanRendered);
    this.waveHpMult = count / rendered;
    this.toSpawn = rendered;
    // boss #2 (dino) alternates with the robot from zone 2 onward
    const boss: UnitKind | null = isBossWave
      ? this.state.zone >= 1 && (w / ROBOT.everyNWaves) % 2 === 0
        ? 'dino'
        : 'robot'
      : isRcWave
        ? 'rcCar'
      : null;
    this.bossToSpawn = boss;
    this.waveActive = true;
    this.spawnStaggerT = 0;
    this.events.push({ type: 'waveStart', wave: w, boss });
  }

  private stepUnit(i: number, u: Unit, dt: number) {
    if (u.stunT > 0) {
      u.state = 'march';
      return;
    }

    // periodic retarget
    u.retargetIn -= dt;
    if (u.retargetIn <= 0 || (u.target >= 0 && !this.validTarget(u.target, u.faction))) {
      u.retargetIn = 0.13 + this.rng() * 0.05;
      u.target = this.findNearestEnemy(u);
    }

    const t = u.target >= 0 ? this.units[u.target] : null;
    let inRange = false;
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      inRange = dx * dx + dy * dy <= u.range * u.range;
    }
    if (u.faction === 0 && u.formationRank > 1) inRange = false;

    if (inRange && t) {
      u.state = 'fight';
      u.fireCd -= dt;
      if (u.fireCd <= 0) {
        u.fireCd = u.cd * (0.92 + this.rng() * 0.16);
        this.events.push({ type: 'fire', i, tx: t.x, ty: t.y, faction: u.faction });
        const dmg = u.faction === 0 ? this.greenDmg * u.dmg : u.dmg;
        this.damage(u.target, dmg, u.faction === 0 ? 1 : -1);
      }
    } else {
      u.state = 'march';
      if (u.faction === 0) {
        let tx = u.homeX || this.commandLineX;
        let ty = u.homeY || u.laneY;
        if (t && u.formationRank <= 1) {
          tx = Math.min(this.commandLineX + 14, t.x - u.range * 0.82);
          ty = ty * 0.7 + t.y * 0.3;
        }
        const dx = tx - u.x;
        const dy = ty - u.y;
        const dist = Math.hypot(dx, dy);
        if (dist > FORMATION.slotArriveRadius) {
          const speed = u.speed * (u.moveMode === 'hop' ? 1.12 : 1) * this.terrainSpeedMul(u);
          u.x += (dx / dist) * speed * dt;
          u.y += (dy / dist) * speed * dt;
        }
      } else {
        const dir = -1;
        let vx = dir * u.speed * this.terrainSpeedMul(u);
        let vy = Math.sin(this.time * 1.7 + u.phase) * 6;
        if (u.kind === 'paperPlane') {
          vy += Math.sin(this.time * 4 + u.phase) * 18;
          vx *= 1.25;
        }
        if (u.kind === 'rcCar') {
          vy *= 0.2;
          if (u.x < this.w * 0.18) u.active = false;
        }
        const laneDy = u.laneY - u.y;
        vy += Math.sign(laneDy) * Math.min(Math.abs(laneDy), 34) * 1.2;
        const spread = u.phase / (Math.PI * 2) - 0.5;
        if (u.kind !== 'rcCar' && u.kind !== 'paperPlane' && u.x < LAYOUT.tanStopX + (spread + 0.5) * 90) vx = 0;
        if (t) {
          const dy = t.y - u.y;
          if (Math.abs(dy) > u.range * 0.55) vy += Math.sign(dy) * 14;
        }
        u.x += vx * dt;
        u.y += vy * dt;
      }
      const bandTop = this.h * LAYOUT.bandTop;
      const bandBot = this.h * LAYOUT.bandBot;
      if (u.y < bandTop) u.y = bandTop;
      if (u.y > bandBot) u.y = bandBot;
    }
  }

  private terrainSpeedMul(u: Unit) {
    const gx = this.w * HAZARDS.glueX;
    const gy = this.h * HAZARDS.glueY;
    const dx = u.x - gx;
    const dy = u.y - gy;
    return dx * dx + dy * dy < HAZARDS.glueRadius * HAZARDS.glueRadius ? HAZARDS.glueSlow : 1;
  }

  /**
   * Same-faction spacing so armies read as ranks of individual toys, not mush.
   * Pairwise over ~200 units is ~20k cheap checks — fine at 60Hz.
   */
  private separate(dt: number) {
    const MIN = 21;
    const MIN2 = MIN * MIN;
    const push = 46 * dt;
    const bandTop = this.h * LAYOUT.bandTop;
    const bandBot = this.h * LAYOUT.bandBot;
    for (let i = 0; i < this.units.length; i++) {
      const a = this.units[i];
      if (!a.active || a.state === 'dying') continue;
      for (let j = i + 1; j < this.units.length; j++) {
        const b = this.units[j];
        if (!b.active || b.state === 'dying' || b.faction !== a.faction) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 >= MIN2 || d2 < 0.01) continue;
        const d = Math.sqrt(d2);
        // mostly vertical spreading so rank depth (x) stays intact
        const nx = (dx / d) * push * 0.5;
        const ny = (dy / d) * push * 1.25;
        a.x -= nx;
        a.y = clamp(a.y - ny, bandTop, bandBot);
        b.x += nx;
        b.y = clamp(b.y + ny, bandTop, bandBot);
      }
    }
  }

  private validTarget(idx: number, myFaction: Faction) {
    const t = this.units[idx];
    return t.active && t.state !== 'dying' && t.faction !== myFaction;
  }

  private findNearestEnemy(u: Unit): number {
    let best = -1;
    let bestD = Infinity;
    for (let j = 0; j < this.units.length; j++) {
      const v = this.units[j];
      if (!v.active || v.faction === u.faction || v.state === 'dying') continue;
      const dx = v.x - u.x;
      const dy = (v.y - u.y) * 1.6; // prefer same-lane targets
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    return best;
  }

  private damage(idx: number, amount: number, tipDir: number) {
    const u = this.units[idx];
    if (!u.active || u.state === 'dying') return;
    u.hp -= amount;
    this.events.push({ type: 'hit', i: idx, x: u.x, y: u.y, faction: u.faction });
    if (u.hp <= 0) this.kill(idx, tipDir);
  }

  private kill(idx: number, tipDir: number) {
    const u = this.units[idx];
    u.state = 'dying';
    u.deathT = 0;
    u.tipDir = tipDir;
    this.events.push({ type: 'kill', x: u.x, y: u.y, kind: u.kind, faction: u.faction, tipDir });
    if (u.faction === 1) {
      this.dropScrap(u.x, u.y, u.scrap * this.scrapMult);
    } else if (this.greenReserve > 0) {
      // the battalion reserve feeds the line: a reinforcement steps up
      this.greenReserve--;
      this.spawnGreen();
    }
  }

  private dropScrap(x: number, y: number, total: number) {
    const n = Math.min(3, Math.max(1, Math.round(total / 8)));
    const each = total / n;
    for (let k = 0; k < n; k++) {
      const p = this.allocPip();
      if (!p) {
        // pool exhausted: bank it directly — never lose scrap, never silently:
        // the collect event still drives the blip + counter pulse
        this.addScrap(total - k * each);
        this.events.push({ type: 'collect', value: total - k * each });
        return;
      }
      p.x = p.px = x;
      p.y = p.py = y;
      p.vx = (this.rng() - 0.5) * 120;
      p.vy = -60 - this.rng() * 90;
      p.t = 0;
      p.value = each;
    }
  }

  private stepPip(p: Pip, dt: number) {
    p.t += dt;
    if (p.t < 0.38) {
      // pop up with gravity
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else {
      // home to the hopper with ease-in acceleration
      const hx = LAYOUT.molderX + 10;
      const hy = this.h * LAYOUT.molderY + LAYOUT.hopperDY;
      const dx = hx - p.x;
      const dy = hy - p.y;
      const dist = Math.hypot(dx, dy);
      const speed = 260 + (p.t - 0.38) * 1400;
      if (dist < speed * dt + 6) {
        p.active = false;
        this.addScrap(p.value);
        this.events.push({ type: 'collect', value: p.value });
      } else {
        p.x += (dx / dist) * speed * dt;
        p.y += (dy / dist) * speed * dt;
      }
    }
  }

  private addScrap(v: number) {
    this.state.scrap += v;
    this.state.totalScrapEarned += v;
    this.scrapThisSecond += v;
  }

  /** Offline/probe fast-forward: run the sim headless for n seconds. */
  fastForward(seconds: number) {
    const steps = Math.floor(seconds * 60);
    for (let s = 0; s < steps; s++) {
      this.step();
      if (this.events.length > 512) this.events.length = 0; // nobody is consuming
    }
    this.events.length = 0;
  }

  countActive(faction: Faction) {
    let n = 0;
    for (const u of this.units) if (u.active && u.faction === faction && u.state !== 'dying') n++;
    return n;
  }

  private alloc(): number {
    for (let i = 0; i < this.units.length; i++) {
      if (!this.units[i].active) {
        this.units[i].active = true;
        return i;
      }
    }
    return -1;
  }

  private allocPip(): Pip | null {
    for (const p of this.pips) {
      if (!p.active) {
        p.active = true;
        return p;
      }
    }
    return null;
  }
}

function makeUnit(): Unit {
  return {
    active: false,
    faction: 0,
    kind: 'rifleman',
    x: 0,
    y: 0,
    px: 0,
    py: 0,
    hp: 0,
    maxHp: 1,
    speed: 0,
    range: 0,
    fireCd: 0,
    cd: 1,
    dmg: 0,
    scrap: 0,
    target: -1,
    retargetIn: 0,
    state: 'march',
    deathT: 0,
    tipDir: 1,
    phase: 0,
    variant: 0,
    laneY: 0,
    formationIndex: 0,
    formationRank: 0,
    formationCol: 0,
    platoon: 1,
    homeX: 0,
    homeY: 0,
    moveMode: 'waddle',
    stunT: 0,
  };
}

function resetUnit(u: Unit, faction: Faction, kind: UnitKind) {
  u.faction = faction;
  u.kind = kind;
  u.state = 'march';
  u.deathT = 0;
  u.target = -1;
  u.retargetIn = 0;
  u.tipDir = faction === 0 ? -1 : 1;
  u.scrap = 0;
  u.stunT = 0;
  u.formationIndex = 0;
  u.formationRank = 0;
  u.formationCol = 0;
  u.platoon = 1;
  u.homeX = 0;
  u.homeY = 0;
  u.moveMode = 'waddle';
}

function makePip(): Pip {
  return { active: false, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, t: 0, value: 0 };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function platoonLabel(platoon: number) {
  const suffix = platoon === 1 ? 'ST' : platoon === 2 ? 'ND' : platoon === 3 ? 'RD' : 'TH';
  return `${platoon}${suffix} CARPET DIVISION`;
}

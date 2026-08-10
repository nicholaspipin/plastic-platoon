import {
  BAND,
  CAPS,
  COSTS,
  DINO,
  GREEN,
  LAYOUT,
  MOLDER,
  PRESTIGE,
  RIFLES_DMG_PER_LEVEL,
  ROBOT,
  SCOUTS_SPD_PER_LEVEL,
  SIM_DT,
  TAN,
  WAVES,
} from './defs';
import { mulberry32, type Rng } from './rng';

export type Faction = 0 | 1; // 0 green, 1 tan
export type UnitKind = 'soldier' | 'robot' | 'dino';

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
  | { type: 'hit'; x: number; y: number; faction: Faction }
  | { type: 'kill'; x: number; y: number; kind: UnitKind; faction: Faction; tipDir: number }
  | { type: 'collect'; value: number }
  | { type: 'band'; x: number; y: number }
  | { type: 'bandReady' }
  | { type: 'waveStart'; wave: number; boss: UnitKind | null }
  | { type: 'buy'; id: UpgradeId };

export type UpgradeId = 'faster' | 'bigger' | 'rifles' | 'scouts';

export interface SimState {
  scrap: number;
  totalScrapEarned: number;
  wave: number;
  medals: number;
  zone: number;
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
    upgrades: { faster: 0, bigger: 0, rifles: 0, scouts: 0 },
  };

  // molder
  stampT = 1.2; // first stamp comes quickly
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
  // rolling scrap rate for offline earnings (scrap/sec, exponentially smoothed)
  scrapRate = 0;
  private scrapThisSecond = 0;
  private rateTickT = 0;
  time = 0;

  constructor(seed = (Math.random() * 2 ** 31) | 0) {
    this.rng = mulberry32(seed);
    for (let i = 0; i < CAPS.maxUnits; i++) this.units.push(makeUnit());
    for (let i = 0; i < CAPS.pips; i++) this.pips.push(makePip());
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
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
    for (const u of this.units) u.active = false;
    for (const p of this.pips) p.active = false;
    this.greenReserve = 0;
    this.waveActive = false;
    this.intermissionT = 1.5;
    this.toSpawn = 0;
    this.bossToSpawn = null;
    this.stampT = 1.2;
    this.bandCd = 0;
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

    // units
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (!u.active) continue;
      u.px = u.x;
      u.py = u.y;
      if (u.state === 'dying') {
        u.deathT += dt;
        if (u.deathT > 0.6) u.active = false;
        continue;
      }
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
    resetUnit(u, 0, 'soldier');
    // eject onto the molder's output tray, then fan out to an assigned lane
    u.x = LAYOUT.molderX + 40 + this.rng() * 18;
    u.y = this.h * (LAYOUT.molderY - 0.02) + this.rng() * this.h * 0.045;
    u.laneY = bandTop + this.rng() * (bandBot - bandTop);
    u.px = u.x;
    u.py = u.y;
    u.hp = u.maxHp = GREEN.hp;
    u.speed = this.greenSpeed * (0.92 + this.rng() * 0.16);
    u.range = GREEN.range;
    u.cd = GREEN.cd;
    u.fireCd = GREEN.cd * (0.3 + this.rng() * 0.7);
    u.dmg = 1; // green dmg read live from greenDmg (battalion/rifles scale)
    u.phase = this.rng() * Math.PI * 2;
    u.variant = (this.rng() * 3) | 0;
    this.events.push({ type: 'spawn', i });
  }

  private spawnTan(kind: UnitKind) {
    const i = this.alloc();
    if (i < 0) return;
    const u = this.units[i];
    const bandTop = this.h * LAYOUT.bandTop;
    const bandBot = this.h * LAYOUT.bandBot;
    resetUnit(u, 1, kind);
    const def = kind === 'robot' ? ROBOT : kind === 'dino' ? DINO : TAN;
    const hpBase = kind === 'soldier' ? TAN.hpBase : def.hpBase;
    const scale = 1 + (kind === 'dino' ? DINO.hpWaveScale : kind === 'robot' ? ROBOT.hpWaveScale : TAN.hpWaveScale) * this.state.wave;
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
    u.scrap = (kind === 'soldier' ? TAN.scrap : def.scrap) * this.waveHpMult;
    u.phase = this.rng() * Math.PI * 2;
    u.variant = (this.rng() * 3) | 0;
    this.events.push({ type: 'spawn', i });
  }

  private stepWaves(dt: number) {
    if (this.waveActive) {
      if (this.toSpawn > 0 || this.bossToSpawn) {
        this.spawnStaggerT -= dt;
        if (this.spawnStaggerT <= 0) {
          this.spawnStaggerT = WAVES.spawnStagger;
          if (this.bossToSpawn) {
            this.spawnTan(this.bossToSpawn);
            this.bossToSpawn = null;
          } else {
            this.spawnTan('soldier');
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
    const isBossWave = w % ROBOT.everyNWaves === 0;
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
      : null;
    this.bossToSpawn = boss;
    this.waveActive = true;
    this.spawnStaggerT = 0;
    this.events.push({ type: 'waveStart', wave: w, boss });
  }

  private stepUnit(i: number, u: Unit, dt: number) {
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

    if (inRange && t) {
      u.state = 'fight';
      u.fireCd -= dt;
      if (u.fireCd <= 0) {
        u.fireCd = u.cd * (0.92 + this.rng() * 0.16);
        this.events.push({ type: 'fire', i, tx: t.x, ty: t.y, faction: u.faction });
        const dmg = u.faction === 0 ? this.greenDmg : u.dmg;
        this.damage(u.target, dmg, u.faction === 0 ? 1 : -1);
      }
    } else {
      u.state = 'march';
      const dir = u.faction === 0 ? 1 : -1;
      let vx = dir * u.speed;
      let vy = Math.sin(this.time * 1.7 + u.phase) * 6; // gentle organic drift
      // fan out toward the assigned lane (fresh stamps leave the tray this way)
      const laneDy = u.laneY - u.y;
      vy += Math.sign(laneDy) * Math.min(Math.abs(laneDy), 34) * 1.4;
      // hold lines are staggered per-unit so formations read as ragged toy
      // battle lines, not a single-file column
      const spread = u.phase / (Math.PI * 2) - 0.5; // stable -0.5..0.5
      // greens hold the rally line when unopposed and never chase off-screen;
      // tans never pass the stop line (no fail state)
      // deep formations (±65–70px) so the army reads as ranks, not a wall;
      // the advance clamp keeps the exchange of fire in mid-screen frame
      if (u.faction === 0 && !t && u.x > this.w * LAYOUT.rallyX + spread * 130) vx = 0;
      if (u.faction === 0 && vx > 0 && u.x > this.w * 0.68 + spread * 140) vx = 0;
      if (u.faction === 1 && u.x < LAYOUT.tanStopX + (spread + 0.5) * 90) vx = 0;
      // range is radial, so only home toward the target's lane when badly off —
      // constant homing funnels the whole army into one clump
      if (t) {
        const dy = t.y - u.y;
        if (Math.abs(dy) > u.range * 0.55) vy += Math.sign(dy) * 14;
      }
      u.x += vx * dt;
      u.y += vy * dt;
      const bandTop = this.h * LAYOUT.bandTop;
      const bandBot = this.h * LAYOUT.bandBot;
      if (u.y < bandTop) u.y = bandTop;
      if (u.y > bandBot) u.y = bandBot;
    }
  }

  /**
   * Same-faction spacing so armies read as ranks of individual toys, not mush.
   * Pairwise over ~200 units is ~20k cheap checks — fine at 60Hz.
   */
  private separate(dt: number) {
    const MIN = 19;
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
    this.events.push({ type: 'hit', x: u.x, y: u.y, faction: u.faction });
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
        // pool exhausted: bank it directly, never lose scrap
        this.addScrap(total - k * each);
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
    kind: 'soldier',
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
}

function makePip(): Pip {
  return { active: false, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, t: 0, value: 0 };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

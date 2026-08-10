import {
  BAND,
  BATTLE,
  CAPS,
  CLASSES,
  CLASS_ORDER,
  DINO,
  ECON,
  LAYOUT,
  MILESTONES,
  MOLDER_HP,
  PRESTIGE,
  ROBOT,
  SIM_DT,
  SKIRMISH,
  TAN,
  TAN_SCALE,
  TREE,
  classPower,
  type ClassId,
  type TreeNodeId,
} from './defs';
import { mulberry32, type Rng } from './rng';

export type Faction = 0 | 1; // 0 green, 1 tan
export type UnitKind = 'soldier' | 'robot' | 'dino';
export type Mode = 'skirmish' | 'battle' | 'intermission';

export interface Unit {
  active: boolean;
  faction: Faction;
  kind: UnitKind;
  cls: ClassId; // soldier class (both factions use the same roster art)
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
  heal: number;
  scrap: number;
  target: number;
  retargetIn: number;
  state: 'march' | 'fight' | 'dying';
  deathT: number;
  tipDir: number; // 0 = fade without tipping (retreat/despawn)
  phase: number;
  variant: number;
  laneY: number;
  battleUnit: boolean; // belongs to the current battle force (vs skirmish trickle)
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

export interface Mission {
  id: string;
  kind: 'stamp' | 'kill' | 'band' | 'reach' | 'winCount';
  label: string;
  target: number;
  progress: number;
  reward: number; // scrap
  medal: boolean; // daily slot pays a medal
  daily: boolean;
}

export type SimEvent =
  | { type: 'stamp'; count: number }
  | { type: 'spawn'; i: number }
  | { type: 'fire'; i: number; tx: number; ty: number; faction: Faction }
  | { type: 'heal'; i: number; tx: number; ty: number }
  | { type: 'hit'; i: number; x: number; y: number; faction: Faction }
  | { type: 'kill'; x: number; y: number; kind: UnitKind; faction: Faction; tipDir: number }
  | { type: 'collect'; value: number }
  | { type: 'band'; x: number; y: number }
  | { type: 'bandReady' }
  | { type: 'battleStart'; battle: number; commander: boolean }
  | { type: 'surge' }
  | { type: 'waveStart'; wave: number; boss: UnitKind | null }
  | { type: 'battleWon'; battle: number; reward: number; unlock: ClassId | null }
  | { type: 'battleLost'; battle: number; remaining: number; reward: number }
  | { type: 'molderHit' }
  | { type: 'buy'; id: string }
  | { type: 'milestone'; cls: ClassId; level: number }
  | { type: 'missionDone'; slot: number };

export interface SimState {
  scrap: number;
  lifetimeScrap: number;
  battle: number; // current frontier battle
  medals: number;
  /** Medals earned via the prestige formula only — the formula's baseline.
   * Mission/migration medals are additive bonuses and must never be clawed
   * back by `medalsOnPrestige` (review finding: they locked prestige out). */
  prestigeMedals: number;
  medalsSpent: number;
  tree: Record<TreeNodeId, number>;
  program: Record<ClassId, boolean>;
  classLv: Record<ClassId, number>;
  molderRateLv: number;
  moldSizeLv: number;
  lossStreak: number;
  missions: Mission[];
  missionSeed: number;
  dailyDate: string; // YYYY-MM-DD the daily mission was issued
  streakDay: number;
  streakLast: string;
  boostUntil: number; // epoch ms — 2x scrap while active
  stats: { stamps: number; kills: number; bands: number; wins: number; winsToday: number };
}

interface QueuedTan {
  kind: UnitKind;
  cls: ClassId;
  hp: number;
  dmg: number;
  scrap: number;
}

export function defaultState(): SimState {
  return {
    scrap: 0,
    lifetimeScrap: 0,
    battle: 1,
    medals: 0,
    prestigeMedals: 0,
    medalsSpent: 0,
    tree: {
      fasterMolder: 0,
      plasticQuality: 0,
      bayonets: 0,
      warBonds: 0,
      offlineLogistics: 0,
      elastic: 0,
      startingKit: 0,
      veteranMolds: 0,
    },
    program: { rifle: true, scout: true, mg: true, medic: true, bazooka: true, sniper: true, officer: true },
    classLv: { rifle: 0, scout: 0, mg: 0, medic: 0, bazooka: 0, sniper: 0, officer: 0 },
    molderRateLv: 0,
    moldSizeLv: 0,
    lossStreak: 0,
    missions: [],
    missionSeed: 1,
    dailyDate: '',
    streakDay: 0,
    streakLast: '',
    boostUntil: 0,
    stats: { stamps: 0, kills: 0, bands: 0, wins: 0, winsToday: 0 },
  };
}

/**
 * Fixed-timestep battle simulation, v2: discrete win/lose battles over an idle
 * skirmish base, seven-class roster, medal prestige with a command tree.
 * Rendering reads unit positions (interpolated via px/py) and drains `events`.
 */
export class Sim {
  rng: Rng;
  units: Unit[] = [];
  pips: Pip[] = [];
  events: SimEvent[] = [];

  w = 390;
  h = 780;

  state: SimState = defaultState();

  // ---- runtime (not persisted)
  mode: Mode = 'skirmish';
  waveIdx = 0;
  private waveQueues: QueuedTan[][] = [];
  private spawnQueue: QueuedTan[] = [];
  private spawnStaggerT = 0;
  private battleTotalStrength = 0;
  private battleReward = 0;
  private intermissionT = 0;
  private skirmishT = 1.5;
  molderHpMax = 30;
  molderHp = 30;
  private molderHitT = 0;
  bandCd = 0;
  greenReserve = 0;
  scrapRate = 0;
  private scrapThisSecond = 0;
  private rateTickT = 0;
  private officersAlive = 0;
  time = 0;

  constructor(seed = (Math.random() * 2 ** 31) | 0) {
    this.rng = mulberry32(seed);
    for (let i = 0; i < CAPS.maxUnits; i++) this.units.push(makeUnit());
    for (let i = 0; i < CAPS.pips; i++) this.pips.push(makePip());
    this.setupMolderHp();
    this.ensureMissions();
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
  }

  /** Call after a save is applied: refill missions, roll the daily, fix HP. */
  onLoaded() {
    this.ensureMissions();
    this.setupMolderHp();
  }

  /** Probe hook: hard-reset to a deterministic fresh run (tuning tools only). */
  debugReset(seed: number) {
    this.rng = mulberry32(seed);
    this.state = defaultState();
    for (const u of this.units) u.active = false;
    for (const p of this.pips) p.active = false;
    this.events.length = 0;
    this.mode = 'skirmish';
    this.waveQueues = [];
    this.spawnQueue = [];
    this.waveIdx = 0;
    this.battleT = 0;
    this.surging = false;
    this.greenReserve = 0;
    this.scrapRate = 0;
    this.time = 0;
    this.bandCd = 0;
    this.stampT = 1.2;
    this.skirmishT = 1.5;
    this.setupMolderHp();
    this.ensureMissions();
  }

  // -------------------------------------------------- derived

  get zone() {
    return Math.floor((this.state.battle - 1) / BATTLE.theaterEvery);
  }
  get theater() {
    return this.zone;
  }
  get stampInterval() {
    const rate = 1 + ECON.molderRate.pctPerLevel * this.state.molderRateLv;
    const tree = 1 + 0.25 * this.state.tree.fasterMolder;
    return ECON.stampBase / (rate * tree);
  }
  get stampSize() {
    return 1 + this.state.moldSizeLv;
  }
  get battalionMult() {
    // sub-linear + capped: an unbounded reserve→damage feedback was the v2
    // pacing probe's #1 runaway (battles never got hard)
    return 1 + Math.min(1.5, Math.sqrt(this.greenReserve / CAPS.greenRendered));
  }
  get officerAura() {
    return 1 + 0.2 * Math.min(this.officersAlive, 3);
  }
  get globalDmgMult() {
    return (1 + 0.2 * this.state.tree.bayonets) * this.battalionMult * this.officerAura;
  }
  get globalHpMult() {
    return 1 + 0.2 * this.state.tree.plasticQuality;
  }
  get scrapMult() {
    const officer = this.officersAlive > 0 ? 1.1 : 1;
    const boost = Date.now() < this.state.boostUntil ? 2 : 1;
    return (1 + this.state.medals * PRESTIGE.passivePerMedal) * officer * boost;
  }
  get rewardMult() {
    return 1 + 0.3 * this.state.tree.warBonds;
  }
  get bandCdMax() {
    return Math.max(2, BAND.cd - this.state.tree.elastic);
  }
  get offlineCapHours() {
    return 2 + 2 * this.state.tree.offlineLogistics;
  }
  get pity() {
    const extra = Math.max(0, this.state.lossStreak - BATTLE.pityAfter);
    return Math.min(BATTLE.pityCap, extra * BATTLE.pityStep);
  }

  unlockedClasses(): ClassId[] {
    const startKit = this.state.tree.startingKit > 0;
    return CLASS_ORDER.filter((c) => {
      if (startKit && (c === 'scout' || c === 'mg')) return true;
      return this.state.battle >= CLASSES[c].unlockBattle;
    });
  }

  classCost(cls: ClassId) {
    const def = CLASSES[cls];
    return Math.round(def.costBase * Math.pow(def.costGrowth, this.state.classLv[cls]));
  }
  molderRateCost() {
    return Math.round(ECON.molderRate.base * Math.pow(ECON.molderRate.growth, this.state.molderRateLv));
  }
  moldSizeCost() {
    return Math.round(ECON.moldSize.base * Math.pow(ECON.moldSize.growth, this.state.moldSizeLv));
  }

  buyClass(cls: ClassId): boolean {
    const cost = this.classCost(cls);
    if (this.state.scrap < cost || !this.unlockedClasses().includes(cls)) return false;
    this.state.scrap -= cost;
    this.state.classLv[cls]++;
    this.events.push({ type: 'buy', id: cls });
    if (MILESTONES.includes(this.state.classLv[cls])) {
      this.events.push({ type: 'milestone', cls, level: this.state.classLv[cls] });
    }
    return true;
  }
  buyMolderRate(): boolean {
    const cost = this.molderRateCost();
    if (this.state.scrap < cost) return false;
    this.state.scrap -= cost;
    this.state.molderRateLv++;
    this.events.push({ type: 'buy', id: 'molderRate' });
    return true;
  }
  buyMoldSize(): boolean {
    const cost = this.moldSizeCost();
    if (this.state.scrap < cost) return false;
    this.state.scrap -= cost;
    this.state.moldSizeLv++;
    this.events.push({ type: 'buy', id: 'moldSize' });
    return true;
  }

  toggleProgram(cls: ClassId) {
    // never allow zero enabled classes
    const enabled = CLASS_ORDER.filter((c) => this.state.program[c] && this.unlockedClasses().includes(c));
    if (this.state.program[cls] && enabled.length <= 1) return;
    this.state.program[cls] = !this.state.program[cls];
  }

  // -------------------------------------------------- prestige

  medalsFor(lifetime: number): number {
    return Math.floor(PRESTIGE.coefficient * Math.sqrt(lifetime / PRESTIGE.S1));
  }
  medalsOnPrestige(): number {
    return Math.max(0, this.medalsFor(this.state.lifetimeScrap) - this.state.prestigeMedals);
  }
  canPrestige() {
    return this.state.battle > PRESTIGE.minBattle && this.medalsOnPrestige() > 0;
  }
  get medalPoints() {
    return this.state.medals - this.state.medalsSpent;
  }

  buyTreeNode(id: TreeNodeId): boolean {
    const node = TREE[id];
    const rank = this.state.tree[id];
    if (rank >= node.maxRanks) return false;
    const cost = node.costPerRank[rank];
    if (this.medalPoints < cost) return false;
    this.state.medalsSpent += cost;
    this.state.tree[id]++;
    this.events.push({ type: 'buy', id: `tree:${id}` });
    return true;
  }

  prestige() {
    const gain = this.medalsOnPrestige();
    this.state.medals += gain;
    this.state.prestigeMedals += gain;
    this.state.scrap = 0;
    this.state.battle = 1;
    this.state.lossStreak = 0;
    this.state.molderRateLv = 0;
    this.state.moldSizeLv = 0;
    if (this.state.tree.veteranMolds > 0) {
      // keep milestone tiers: floor each class to its highest crossed milestone
      for (const c of CLASS_ORDER) {
        const lv = this.state.classLv[c];
        let keep = 0;
        for (const t of MILESTONES) if (lv >= t) keep = t;
        this.state.classLv[c] = keep;
      }
    } else {
      for (const c of CLASS_ORDER) this.state.classLv[c] = 0;
    }
    for (const u of this.units) u.active = false;
    for (const p of this.pips) p.active = false;
    this.greenReserve = 0;
    this.mode = 'skirmish';
    this.waveQueues = [];
    this.spawnQueue = [];
    this.skirmishT = 1.5;
    this.bandCd = 0;
    this.setupMolderHp();
    // reroll missions: old-run battle targets/rewards are meaningless now
    this.state.missions = [];
    this.ensureMissions();
  }

  // -------------------------------------------------- missions

  private ensureMissions() {
    const s = this.state;
    while (s.missions.length < 3) {
      s.missions.push(s.missions.length === 2 ? this.rollDaily() : this.rollMission(s.missions.length));
    }
    // refresh the daily slot on a new day — the ONLY path that mints a daily
    const today = dayString();
    if (s.dailyDate !== today) {
      s.dailyDate = today;
      s.stats.winsToday = 0;
      s.missions[2] = this.rollDaily();
    }
  }

  private rollDaily(): Mission {
    const b = this.state.battle;
    const seed = this.state.missionSeed++;
    const rewardBase = BATTLE.rewardBase * Math.pow(BATTLE.rewardGrowth, b - 1);
    return { id: `m${seed}`, kind: 'winCount', label: 'Win {n} battles today', target: 5, progress: 0, reward: Math.round(rewardBase * 8), medal: true, daily: true };
  }

  private rollMission(slot: number): Mission {
    const b = this.state.battle;
    const seed = this.state.missionSeed++;
    const rewardBase = BATTLE.rewardBase * Math.pow(BATTLE.rewardGrowth, b - 1);
    if (slot === 0) {
      // short (~5 min)
      const pick = seed % 2;
      if (pick === 0)
        return { id: `m${seed}`, kind: 'stamp', label: 'Stamp {n} soldiers', target: 30 + b * 4, progress: 0, reward: Math.round(rewardBase * 1.5), medal: false, daily: false };
      return { id: `m${seed}`, kind: 'band', label: 'Snap {n} rubber bands', target: 3 + Math.floor(b / 6), progress: 0, reward: Math.round(rewardBase * 1.5), medal: false, daily: false };
    }
    // medium (~1h) — also the post-claim filler for the daily slot
    const pick = seed % 2;
    if (pick === 0)
      return { id: `m${seed}`, kind: 'kill', label: 'Knock over {n} tans', target: 60 + b * 8, progress: 0, reward: Math.round(rewardBase * 4), medal: false, daily: false };
    return { id: `m${seed}`, kind: 'reach', label: 'Win Battle {n}', target: b + 2, progress: 0, reward: Math.round(rewardBase * 6), medal: false, daily: false };
  }

  private missionProgress(kind: Mission['kind'], amount: number, absolute = false) {
    for (let s = 0; s < this.state.missions.length; s++) {
      const m = this.state.missions[s];
      if (m.kind !== kind) continue;
      const before = m.progress;
      m.progress = absolute ? Math.max(m.progress, amount) : m.progress + amount;
      if (before < m.target && m.progress >= m.target) {
        this.events.push({ type: 'missionDone', slot: s });
      }
    }
  }

  claimMission(slot: number): boolean {
    const m = this.state.missions[slot];
    if (!m || m.progress < m.target) return false;
    this.addScrap(m.reward);
    if (m.medal) this.state.medals += 1;
    // ONE daily per day: a claimed daily refills with a non-medal filler until
    // ensureMissions rolls a fresh daily on the next calendar day
    if (m.daily) {
      this.state.dailyDate = dayString();
      this.state.missions[slot] = this.rollMission(1);
    } else {
      this.state.missions[slot] = this.rollMission(slot);
    }
    return true;
  }

  /** Called by main on a new play day. Returns the streak day index (1-based). */
  advanceStreak(): number {
    const today = dayString();
    const s = this.state;
    if (s.streakLast === today) return 0; // already counted today
    const gap = daysBetween(s.streakLast, today);
    // cycles after day 7 (a permanent 6×+boost daily would trivialize income)
    s.streakDay = gap <= 2 && s.streakDay > 0 ? (s.streakDay % 7) + 1 : 1;
    s.streakLast = today;
    this.ensureMissions();
    return s.streakDay;
  }

  activateBoost(minutes: number) {
    this.state.boostUntil = Date.now() + minutes * 60000;
  }

  // -------------------------------------------------- battle lifecycle

  private setupMolderHp() {
    this.molderHpMax = Math.round(MOLDER_HP.base * Math.pow(MOLDER_HP.growth, this.state.battle - 1));
    this.molderHp = this.molderHpMax;
  }

  startBattle() {
    if (this.mode === 'battle') return;
    const b = this.state.battle;
    this.mode = 'battle';
    this.waveIdx = 0;
    this.battleT = 0;
    this.surging = false;
    this.setupMolderHp();
    // clear skirmish tans so the battle reads clean
    for (const u of this.units) {
      if (u.active && u.faction === 1 && u.state !== 'dying') despawn(u);
    }

    const theater = this.zone;
    // exponential budget pours into per-tan HP over a ~linear count — quality
    // outracing quantity is what creates the wall (DESIGN2 §1)
    const strength =
      BATTLE.budgetBase *
      Math.pow(BATTLE.budgetGrowth, b - 1) *
      Math.pow(TAN_SCALE.magnification, theater) *
      (1 - this.pity);
    const count = Math.min(TAN_SCALE.countMax, Math.round(TAN_SCALE.countBase + b * TAN_SCALE.countPerBattle));
    const perStrength = strength / count;
    const qualDmg = TAN.dmg * (1 + TAN_SCALE.dmgPerBattle * (b - 1));
    const commander = b % BATTLE.commanderEvery === 0;
    this.battleReward = Math.round(
      BATTLE.rewardBase * Math.pow(BATTLE.rewardGrowth, b - 1) * (commander ? 2.5 : 1) * this.rewardMult
    );
    this.battleTotalStrength = strength;

    const force: QueuedTan[] = [];
    let boss: QueuedTan | null = null;
    let troopCount = count;
    if (commander) {
      // the commander absorbs its share of the budget as a single huge toy
      troopCount = Math.max(4, Math.round(count * (1 - BATTLE.commanderBudgetFrac)));
      const kind: UnitKind = theater % 2 === 1 && b >= 20 ? 'dino' : 'robot';
      const def = kind === 'dino' ? DINO : ROBOT;
      boss = {
        kind,
        cls: 'rifle',
        hp: TAN.hpBase * strength * BATTLE.commanderBudgetFrac * 1.2,
        dmg: def.dmg * (1 + TAN_SCALE.dmgPerBattle * (b - 1)),
        scrap: 0,
      };
      if (b >= BATTLE.officerEscortFrom) {
        force.push(this.makeTanTroop('officer', TAN.hpBase * perStrength * 2.2, qualDmg * 1.4, 3));
        troopCount -= 1;
      }
    }

    // class mix by battle number
    const mix: { cls: ClassId; from: number; frac: number; hpMul: number; dmgMul: number }[] = [
      { cls: 'rifle', from: 1, frac: 0.6, hpMul: 1, dmgMul: 1 },
      { cls: 'scout', from: 6, frac: 0.15, hpMul: 0.55, dmgMul: 0.6 },
      { cls: 'mg', from: 12, frac: 0.15, hpMul: 1.1, dmgMul: 1.4 },
      { cls: 'bazooka', from: 18, frac: 0.1, hpMul: 1.2, dmgMul: 2.2 },
    ];
    const avail = mix.filter((m) => b >= m.from);
    const fracSum = avail.reduce((a, m) => a + m.frac, 0);
    const dropEach = (this.battleReward * BATTLE.dropFrac) / Math.max(4, troopCount);
    for (const m of avail) {
      const n = Math.max(m.cls === 'rifle' ? 2 : 1, Math.round((troopCount * m.frac) / fracSum));
      for (let i = 0; i < n; i++) {
        force.push(this.makeTanTroop(m.cls, TAN.hpBase * perStrength * m.hpMul, qualDmg * m.dmgMul, dropEach));
      }
    }
    // shuffle for mixed waves
    for (let i = force.length - 1; i > 0; i--) {
      const j = (this.rng() * (i + 1)) | 0;
      [force[i], force[j]] = [force[j], force[i]];
    }
    // split into waves; commander rides the last one
    this.waveQueues = [];
    let idx = 0;
    for (let wv = 0; wv < BATTLE.waves; wv++) {
      const n = wv === BATTLE.waves - 1 ? force.length - idx : Math.round(force.length * BATTLE.waveSplit[wv]);
      this.waveQueues.push(force.slice(idx, idx + n));
      idx += n;
    }
    if (boss) this.waveQueues[BATTLE.waves - 1].push(boss);
    this.spawnQueue = [];
    this.events.push({ type: 'battleStart', battle: b, commander });
    this.launchWave();
  }

  private makeTanTroop(cls: ClassId, hp: number, dmg: number, scrap: number): QueuedTan {
    return { kind: 'soldier', cls, hp, dmg, scrap };
  }

  private waveCooldown = 0;
  battleT = 0;
  surging = false;

  private launchWave() {
    if (this.waveIdx >= this.waveQueues.length) return;
    const wave = this.waveQueues[this.waveIdx];
    this.spawnQueue = wave.slice();
    this.spawnStaggerT = 0;
    this.waveCooldown = BATTLE.wavePause;
    const hasBoss = wave.some((q) => q.kind !== 'soldier');
    this.events.push({ type: 'waveStart', wave: this.waveIdx + 1, boss: hasBoss ? wave.find((q) => q.kind !== 'soldier')!.kind : null });
    this.waveIdx++;
  }

  private winBattle() {
    const b = this.state.battle;
    const payout = Math.round(this.battleReward * (1 - BATTLE.dropFrac));
    this.addScrap(payout);
    this.state.lossStreak = 0;
    this.state.stats.wins++;
    this.state.stats.winsToday++;
    this.state.battle = b + 1;
    this.missionProgress('reach', this.state.battle, true);
    this.missionProgress('winCount', 1);
    const unlock = CLASS_ORDER.find((c) => CLASSES[c].unlockBattle === this.state.battle) ?? null;
    this.events.push({ type: 'battleWon', battle: b, reward: payout, unlock });
    this.mode = 'intermission';
    this.intermissionT = BATTLE.intermission;
  }

  private loseBattle() {
    const remainingStrength = this.aliveBattleStrengthFrac();
    const payout = Math.round(this.battleReward * (1 - BATTLE.dropFrac) * BATTLE.lossFrac);
    this.addScrap(payout);
    this.state.lossStreak++;
    // tan force withdraws, satisfied
    for (const u of this.units) {
      if (u.active && u.faction === 1 && u.state !== 'dying') despawn(u);
    }
    this.waveQueues = [];
    this.spawnQueue = [];
    this.events.push({ type: 'battleLost', battle: this.state.battle, remaining: remainingStrength, reward: payout });
    this.mode = 'skirmish';
    this.skirmishT = 2.5;
  }

  private aliveBattleStrengthFrac(): number {
    let alive = 0;
    for (const u of this.units) {
      if (u.active && u.faction === 1 && u.battleUnit && u.state !== 'dying') alive += u.kind === 'soldier' ? 1 : 6;
    }
    for (const q of this.spawnQueue) alive += q.kind === 'soldier' ? 1 : 6;
    for (let wv = this.waveIdx; wv < this.waveQueues.length; wv++) {
      for (const q of this.waveQueues[wv]) alive += q.kind === 'soldier' ? 1 : 6;
    }
    const total = Math.max(1, this.battleTotalStrength);
    return Math.min(1, alive / total);
  }

  // -------------------------------------------------- input

  tryBand(x: number, y: number): boolean {
    if (this.bandCd > 0) return false;
    this.bandCd = this.bandCdMax;
    this.state.stats.bands++;
    this.missionProgress('band', 1);
    this.events.push({ type: 'band', x, y });
    const r2 = BAND.radius * BAND.radius;
    for (let i = 0; i < this.units.length; i++) {
      const u = this.units[i];
      if (!u.active || u.faction !== 1 || u.state === 'dying') continue;
      const dx = u.x - x;
      const dy = u.y - y;
      if (dx * dx + dy * dy <= r2) this.damage(i, BAND.dmg, 1);
    }
    return true;
  }

  // -------------------------------------------------- stepping

  step() {
    const dt = SIM_DT;
    this.time += dt;

    // molder stamps in every mode — the heartbeat never stops
    this.stampT -= dt;
    if (this.stampT <= 0) {
      this.stampT += this.stampInterval;
      this.stamp();
    }

    if (this.bandCd > 0) {
      this.bandCd -= dt;
      if (this.bandCd <= 0) {
        this.bandCd = 0;
        this.events.push({ type: 'bandReady' });
      }
    }

    // mode machinery
    if (this.mode === 'battle') {
      this.stepBattle(dt);
    } else if (this.mode === 'intermission') {
      this.intermissionT -= dt;
      this.repairMolder(dt);
      if (this.intermissionT <= 0) this.startBattle();
    } else {
      // skirmish trickle keeps scrap flowing while shopping
      this.repairMolder(dt);
      this.skirmishT -= dt;
      if (this.skirmishT <= 0) {
        this.skirmishT = SKIRMISH.spawnEvery;
        this.spawnSkirmisher();
      }
    }

    // units
    this.officersAlive = 0;
    for (const u of this.units) {
      if (u.active && u.faction === 0 && u.cls === 'officer' && u.state !== 'dying') this.officersAlive++;
    }
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

    for (const p of this.pips) {
      if (!p.active) continue;
      p.px = p.x;
      p.py = p.y;
      this.stepPip(p, dt);
    }

    this.rateTickT += dt;
    if (this.rateTickT >= 1) {
      this.rateTickT -= 1;
      this.scrapRate = this.scrapRate * 0.95 + this.scrapThisSecond * 0.05;
      this.scrapThisSecond = 0;
    }
  }

  private stepBattle(dt: number) {
    this.battleT += dt;
    // overtime: break the force in time or its reinforcements charge the Molder
    if (!this.surging && this.battleT >= BATTLE.surgeAt) {
      this.surging = true;
      // any unspawned waves pour in at once
      while (this.waveIdx < this.waveQueues.length) {
        this.spawnQueue.push(...this.waveQueues[this.waveIdx]);
        this.waveIdx++;
      }
      for (const u of this.units) {
        if (u.active && u.faction === 1 && u.state !== 'dying') {
          u.speed *= BATTLE.surgeSpeed;
          u.dmg *= BATTLE.surgeDmg;
        }
      }
      for (const q of this.spawnQueue) {
        q.dmg *= BATTLE.surgeDmg;
      }
      this.events.push({ type: 'surge' });
    }
    // stagger spawns of the current wave
    if (this.spawnQueue.length > 0) {
      this.spawnStaggerT -= dt;
      if (this.spawnStaggerT <= 0) {
        this.spawnStaggerT = 0.08;
        const q = this.spawnQueue.shift()!;
        this.spawnTan(q, true);
      }
    } else {
      const activeTans = this.countActive(1);
      if (this.waveCooldown > 0) this.waveCooldown -= dt;
      if (this.waveIdx < this.waveQueues.length) {
        // next wave when the previous one is mostly broken, with a breather
        const waveSize = this.waveQueues[this.waveIdx - 1]?.length ?? 1;
        if (this.waveCooldown <= 0 && activeTans <= Math.max(2, waveSize * 0.25)) this.launchWave();
      } else if (activeTans === 0) {
        this.winBattle();
      }
    }
    if (this.molderHitT > 0) this.molderHitT -= dt;
  }

  private repairMolder(dt: number) {
    if (this.molderHp < this.molderHpMax) {
      this.molderHp = Math.min(this.molderHpMax, this.molderHp + this.molderHpMax * MOLDER_HP.repairRate * dt);
    }
  }

  private stampT = 1.2;

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
    this.state.stats.stamps += n;
    this.missionProgress('stamp', n);
    this.events.push({ type: 'stamp', count: Math.max(spawned, 1) });
  }

  private pickStampClass(): ClassId {
    const unlocked = this.unlockedClasses();
    const enabled = unlocked.filter((c) => this.state.program[c]);
    const pool = enabled.length > 0 ? enabled : ['rifle' as ClassId];
    let total = 0;
    for (const c of pool) total += CLASSES[c].weight;
    let r = this.rng() * total;
    for (const c of pool) {
      r -= CLASSES[c].weight;
      if (r <= 0) return c;
    }
    return pool[0];
  }

  private spawnGreen() {
    const i = this.alloc();
    if (i < 0) {
      this.greenReserve++;
      return;
    }
    const u = this.units[i];
    const cls = this.pickStampClass();
    const def = CLASSES[cls];
    const power = classPower(this.state.classLv[cls]);
    const bandTop = this.h * LAYOUT.bandTop;
    const bandBot = this.h * LAYOUT.bandBot;
    resetUnit(u, 0, 'soldier');
    u.cls = cls;
    u.x = LAYOUT.molderX + 58 + this.rng() * 16;
    u.y = this.h * (LAYOUT.molderY - 0.018) + this.rng() * this.h * 0.04;
    u.laneY = bandTop + this.rng() * (bandBot - bandTop);
    u.px = u.x;
    u.py = u.y;
    u.hp = u.maxHp = def.hp * power * this.globalHpMult;
    u.speed = def.speed * (0.92 + this.rng() * 0.16);
    u.range = def.range;
    u.cd = def.cd;
    u.fireCd = def.cd * (0.3 + this.rng() * 0.7);
    u.dmg = def.dmg * power;
    u.heal = (def.heal ?? 0) * power;
    u.phase = this.rng() * Math.PI * 2;
    u.variant = (this.rng() * 3) | 0;
    this.events.push({ type: 'spawn', i });
  }

  private spawnSkirmisher() {
    const b = this.state.battle;
    // skirmishers track battle quality at reduced strength
    const strength =
      BATTLE.budgetBase * Math.pow(BATTLE.budgetGrowth, b - 1) * Math.pow(TAN_SCALE.magnification, this.zone);
    const count = Math.min(TAN_SCALE.countMax, Math.round(TAN_SCALE.countBase + b * TAN_SCALE.countPerBattle));
    const qualHp = TAN.hpBase * (strength / count);
    const qualDmg = TAN.dmg * (1 + TAN_SCALE.dmgPerBattle * (b - 1));
    const drop = BATTLE.rewardBase * Math.pow(BATTLE.rewardGrowth, b - 1) * 0.02 + 1;
    this.spawnTan({ kind: 'soldier', cls: 'rifle', hp: qualHp * SKIRMISH.strength, dmg: qualDmg * 0.7, scrap: drop }, false);
  }

  private spawnTan(q: QueuedTan, battleUnit: boolean): boolean {
    const i = this.alloc();
    if (i < 0) return false;
    const u = this.units[i];
    const bandTop = this.h * LAYOUT.bandTop;
    const bandBot = this.h * LAYOUT.bandBot;
    resetUnit(u, 1, q.kind);
    u.cls = q.cls;
    u.battleUnit = battleUnit;
    const def = q.kind === 'robot' ? ROBOT : q.kind === 'dino' ? DINO : q.cls === 'scout' ? CLASSES.scout : q.cls === 'mg' ? CLASSES.mg : q.cls === 'bazooka' ? CLASSES.bazooka : q.cls === 'officer' ? CLASSES.officer : TAN;
    // battle waves crest from deeper off-screen — the walk-in is the drumroll
    u.x = this.w + (battleUnit ? 40 + this.rng() * 140 : 30 + this.rng() * 60);
    u.y = bandTop + this.rng() * (bandBot - bandTop);
    u.laneY = u.y;
    u.px = u.x;
    u.py = u.y;
    u.hp = u.maxHp = q.hp;
    u.speed = ('speed' in def ? def.speed : TAN.speed) * (0.9 + this.rng() * 0.2);
    u.range = 'range' in def ? def.range : TAN.range;
    u.cd = 'cd' in def ? def.cd : TAN.cd;
    u.fireCd = u.cd * (0.5 + this.rng() * 0.5);
    u.dmg = q.dmg;
    u.heal = 0;
    u.scrap = q.scrap;
    u.phase = this.rng() * Math.PI * 2;
    u.variant = (this.rng() * 3) | 0;
    this.events.push({ type: 'spawn', i });
    return true;
  }

  private stepUnit(i: number, u: Unit, dt: number) {
    // medics support instead of shooting
    if (u.faction === 0 && u.cls === 'medic') {
      this.stepMedic(i, u, dt);
      return;
    }

    u.retargetIn -= dt;
    if (u.retargetIn <= 0 || (u.target >= 0 && !this.validTarget(u.target, u.faction))) {
      u.retargetIn = 0.13 + this.rng() * 0.05;
      u.target = u.faction === 0 && u.cls === 'sniper' ? this.findBiggestEnemy(u) : this.findNearestEnemy(u);
    }

    // surging tans are CHARGING the machine — they stop shooting the line and
    // run it down; either the army melts them in transit or the Molder falls
    const charging = u.faction === 1 && this.surging && this.mode === 'battle';

    const t = u.target >= 0 ? this.units[u.target] : null;
    let inRange = false;
    if (t && !charging) {
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
        this.applyAttack(u, u.target);
      }
      return;
    }

    // tans assault the Molder itself when they reach it during a battle
    if (u.faction === 1 && this.mode === 'battle' && u.x <= LAYOUT.molderX + 120) {
      u.state = 'fight';
      u.fireCd -= dt;
      if (u.fireCd <= 0) {
        u.fireCd = u.cd * (0.92 + this.rng() * 0.16);
        this.events.push({ type: 'fire', i, tx: LAYOUT.molderX + 30, ty: this.h * LAYOUT.molderY - 80, faction: 1 });
        this.molderHp -= u.dmg;
        this.molderHitT = MOLDER_HP.repairDelay;
        this.events.push({ type: 'molderHit' });
        if (this.molderHp <= 0) {
          this.molderHp = 0;
          this.loseBattle();
        }
      }
      return;
    }

    u.state = 'march';
    const dir = u.faction === 0 ? 1 : -1;
    let vx = dir * u.speed;
    let vy = Math.sin(this.time * 1.7 + u.phase) * 6;
    const laneDy = u.laneY - u.y;
    vy += Math.sign(laneDy) * Math.min(Math.abs(laneDy), 34) * 1.4;
    const spread = u.phase / (Math.PI * 2) - 0.5;
    if (u.faction === 0 && !t && u.x > this.w * LAYOUT.rallyX + spread * 130) vx = 0;
    if (u.faction === 0 && vx > 0 && u.x > this.w * 0.68 + spread * 140) vx = 0;
    // skirmish tans hold at the stop line (no molder damage outside battles)
    if (u.faction === 1 && this.mode !== 'battle' && u.x < LAYOUT.tanStopX + (spread + 0.5) * 90) vx = 0;
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

  private stepMedic(i: number, u: Unit, dt: number) {
    u.retargetIn -= dt;
    if (u.retargetIn <= 0) {
      u.retargetIn = 0.2 + this.rng() * 0.1;
      u.target = this.findWoundedAlly(i);
    }
    const t = u.target >= 0 ? this.units[u.target] : null;
    let inRange = false;
    if (t && t.active && t.state !== 'dying' && t.hp < t.maxHp) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      inRange = dx * dx + dy * dy <= u.range * u.range;
    }
    if (inRange && t) {
      u.state = 'fight';
      u.fireCd -= dt;
      if (u.fireCd <= 0) {
        u.fireCd = u.cd * (0.92 + this.rng() * 0.16);
        t.hp = Math.min(t.maxHp, t.hp + u.heal);
        this.events.push({ type: 'heal', i, tx: t.x, ty: t.y });
      }
      return;
    }
    // follow the line
    u.state = 'march';
    let vx = u.speed;
    let vy = Math.sin(this.time * 1.7 + u.phase) * 6;
    const laneDy = u.laneY - u.y;
    vy += Math.sign(laneDy) * Math.min(Math.abs(laneDy), 34) * 1.4;
    const spread = u.phase / (Math.PI * 2) - 0.5;
    if (u.x > this.w * (LAYOUT.rallyX - 0.06) + spread * 100) vx = 0; // medics hang slightly back
    if (t && t.active) {
      const dx = t.x - u.x;
      if (Math.abs(dx) > 30) vx = Math.sign(dx) * u.speed;
      const dy = t.y - u.y;
      if (Math.abs(dy) > 16) vy += Math.sign(dy) * 22;
    }
    u.x += vx * dt;
    u.y += vy * dt;
    const bandTop = this.h * LAYOUT.bandTop;
    const bandBot = this.h * LAYOUT.bandBot;
    if (u.y < bandTop) u.y = bandTop;
    if (u.y > bandBot) u.y = bandBot;
  }

  private applyAttack(u: Unit, targetIdx: number) {
    const t = this.units[targetIdx];
    let dmg = u.dmg;
    if (u.faction === 0) {
      dmg *= this.globalDmgMult;
      const def = CLASSES[u.cls];
      if (def.vsBoss && t.kind !== 'soldier') dmg *= def.vsBoss;
      // bazooka splash
      if (def.splash) {
        const r2 = def.splash * def.splash;
        for (let j = 0; j < this.units.length; j++) {
          if (j === targetIdx) continue;
          const v = this.units[j];
          if (!v.active || v.faction !== 1 || v.state === 'dying') continue;
          const dx = v.x - t.x;
          const dy = v.y - t.y;
          if (dx * dx + dy * dy <= r2) this.damage(j, dmg * 0.5, 1);
        }
      }
      this.damage(targetIdx, dmg, 1);
    } else {
      this.damage(targetIdx, dmg, -1);
    }
  }

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
      const dy = (v.y - u.y) * 1.6;
      const d = dx * dx + dy * dy;
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    return best;
  }

  private findBiggestEnemy(u: Unit): number {
    // snipers pick the highest-HP target in extended range, else nearest
    let best = -1;
    let bestHp = 0;
    const r2 = u.range * u.range;
    for (let j = 0; j < this.units.length; j++) {
      const v = this.units[j];
      if (!v.active || v.faction === u.faction || v.state === 'dying') continue;
      const dx = v.x - u.x;
      const dy = v.y - u.y;
      if (dx * dx + dy * dy > r2) continue;
      if (v.hp > bestHp) {
        bestHp = v.hp;
        best = j;
      }
    }
    return best >= 0 ? best : this.findNearestEnemy(u);
  }

  private findWoundedAlly(self: number): number {
    let best = -1;
    let bestFrac = 1;
    for (let j = 0; j < this.units.length; j++) {
      if (j === self) continue;
      const v = this.units[j];
      if (!v.active || v.faction !== 0 || v.state === 'dying') continue;
      const frac = v.hp / v.maxHp;
      if (frac < bestFrac) {
        bestFrac = frac;
        best = j;
      }
    }
    return bestFrac < 0.999 ? best : -1;
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
      this.state.stats.kills++;
      this.missionProgress('kill', 1);
      if (u.scrap > 0) this.dropScrap(u.x, u.y, u.scrap * this.scrapMult);
    } else if (this.greenReserve > 0) {
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
        this.addScrapRaw(total - k * each);
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
      p.vy += 520 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    } else {
      const hx = LAYOUT.molderX + 10;
      const hy = this.h * LAYOUT.molderY + LAYOUT.hopperDY;
      const dx = hx - p.x;
      const dy = hy - p.y;
      const dist = Math.hypot(dx, dy);
      const speed = 260 + (p.t - 0.38) * 1400;
      if (dist < speed * dt + 6) {
        p.active = false;
        this.addScrapRaw(p.value);
        this.events.push({ type: 'collect', value: p.value });
      } else {
        p.x += (dx / dist) * speed * dt;
        p.y += (dy / dist) * speed * dt;
      }
    }
  }

  /** Scrap with all income multipliers applied. */
  addScrap(v: number) {
    this.addScrapRaw(v * this.scrapMult);
  }
  /** Scrap that has already been multiplied (pips carry their multiplier). */
  private addScrapRaw(v: number) {
    this.state.scrap += v;
    this.state.lifetimeScrap += v;
    this.scrapThisSecond += v;
  }

  /** Offline/probe fast-forward: run the sim headless for n seconds. */
  fastForward(seconds: number) {
    const steps = Math.floor(seconds * 60);
    for (let s = 0; s < steps; s++) {
      this.step();
      if (this.events.length > 512) this.events.length = 0;
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
    cls: 'rifle',
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
    heal: 0,
    scrap: 0,
    target: -1,
    retargetIn: 0,
    state: 'march',
    deathT: 0,
    tipDir: 1,
    phase: 0,
    variant: 0,
    laneY: 0,
    battleUnit: false,
  };
}

function resetUnit(u: Unit, faction: Faction, kind: UnitKind) {
  u.faction = faction;
  u.kind = kind;
  u.cls = 'rifle';
  u.state = 'march';
  u.deathT = 0;
  u.target = -1;
  u.retargetIn = 0;
  u.tipDir = faction === 0 ? -1 : 1;
  u.scrap = 0;
  u.battleUnit = false;
}

function despawn(u: Unit) {
  u.state = 'dying';
  u.deathT = 0.25;
  u.tipDir = 0; // fade without tipping — a withdrawal, not a knockover
}

function makePip(): Pip {
  return { active: false, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, t: 0, value: 0 };
}

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dayString(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a: string, b: string): number {
  if (!a) return 999;
  const da = new Date(a + 'T12:00:00');
  const db = new Date(b + 'T12:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

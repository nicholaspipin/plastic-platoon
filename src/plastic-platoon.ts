import {
  Application,
  Assets,
  Container,
  FederatedPointerEvent,
  FillGradient,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  Texture
} from 'pixi.js';

type Team = 'green' | 'tan';
type UnitKind = 'soldier' | 'robot' | 'tank';
type ParticleKind = 'shard' | 'pip' | 'spark' | 'dust' | 'tracer' | 'ring';
type ZoneId = 'bedroom' | 'underbed' | 'hallway' | 'kitchen';

interface SaveData {
  v: 1;
  scrap: number;
  medals: number;
  wave: number;
  zoneIndex: number;
  upgrades: Record<UpgradeId, number>;
  muted: boolean;
  lastSeen: number;
  pendingOfflineScrap: number;
  totalEarned: number;
  prestigeCount: number;
}

type UpgradeId = 'faster' | 'bigger' | 'rifles' | 'scouts';

interface UpgradeDef {
  id: UpgradeId;
  title: string;
  subtitle: string;
  baseCost: number;
  costScale: number;
  max: number;
}

interface LaneUnit {
  active: boolean;
  id: number;
  team: Team;
  kind: UnitKind;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  vx: number;
  range: number;
  cd: number;
  fireTimer: number;
  speed: number;
  damage: number;
  radius: number;
  scrap: number;
  lane: number;
  stopMotion: number;
  wobble: number;
  deathTimer: number;
  tipped: number;
  targetId: number;
  sprite: Sprite;
  shadow: Sprite;
  bar: Container;
  barFill: Sprite;
}

interface Particle {
  active: boolean;
  kind: ParticleKind;
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  life: number;
  maxLife: number;
  rot: number;
  spin: number;
  scale: number;
  targetX: number;
  targetY: number;
  value: number;
}

interface FloatingText {
  active: boolean;
  text: Text;
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
}

interface ButtonState {
  id: UpgradeId | 'prestige' | 'claim' | 'mute';
  rect: Rectangle;
  title: string;
  subtitle: string;
  enabled: boolean;
  pressed: number;
}

interface CameraKick {
  strength: number;
  time: number;
  maxTime: number;
  angle: number;
}

interface ZoneDef {
  id: ZoneId;
  title: string;
  ground: number;
  ground2: number;
  fiber: number;
  enemy: number;
  accent: number;
  dark: boolean;
}

const SAVE_KEY = 'plastic-platoon-save-v1';
const WIDTH = 390;
const HEIGHT = 844;
const LANES = [342, 405, 468, 531, 594];
const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const UPGRADES: UpgradeDef[] = [
  { id: 'faster', title: 'FASTER MOLD', subtitle: 'stamp timer x0.75', baseCost: 30, costScale: 1.8, max: 12 },
  { id: 'bigger', title: 'BIGGER MOLD', subtitle: '+1 soldier / stamp', baseCost: 80, costScale: 2.2, max: 9 },
  { id: 'rifles', title: 'RIFLES', subtitle: '+25% green damage', baseCost: 55, costScale: 1.9, max: 15 },
  { id: 'scouts', title: 'SCOUTS', subtitle: '+14% march speed', baseCost: 45, costScale: 1.7, max: 12 }
];
const ZONES: ZoneDef[] = [
  { id: 'bedroom', title: 'Bedroom Carpet', ground: 0x766a58, ground2: 0x97886d, fiber: 0xd1c0a3, enemy: 0xc5a067, accent: 0xe7464f, dark: false },
  { id: 'underbed', title: 'Under the Bed', ground: 0x3b3840, ground2: 0x54515d, fiber: 0x89828e, enemy: 0xb18754, accent: 0x7ed7f2, dark: true },
  { id: 'hallway', title: 'Hallway Hardwood', ground: 0x8b5731, ground2: 0xc47a3b, fiber: 0xffc06e, enemy: 0xb97a4d, accent: 0x59a5ff, dark: false },
  { id: 'kitchen', title: 'Kitchen Tile', ground: 0xa8b8ba, ground2: 0xe0ece7, fiber: 0x6f8c91, enemy: 0xbe9761, accent: 0xf2c84d, dark: false }
];

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
const easeInQuad = (t: number) => t * t;
const easeOutElastic = (t: number) => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

function tintToRgb(tint: number) {
  return {
    r: (tint >> 16) & 255,
    g: (tint >> 8) & 255,
    b: tint & 255
  };
}

function shade(tint: number, amount: number) {
  const { r, g, b } = tintToRgb(tint);
  const mix = amount >= 0 ? 255 : 0;
  const a = Math.abs(amount);
  return ((Math.round(r + (mix - r) * a) << 16) | (Math.round(g + (mix - g) * a) << 8) | Math.round(b + (mix - b) * a)) >>> 0;
}

function defaultSave(): SaveData {
  return {
    v: 1,
    scrap: 0,
    medals: 0,
    wave: 1,
    zoneIndex: 0,
    upgrades: { faster: 0, bigger: 0, rifles: 0, scouts: 0 },
    muted: false,
    lastSeen: Date.now(),
    pendingOfflineScrap: 0,
    totalEarned: 0,
    prestigeCount: 0
  };
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if (parsed.v !== 1) return defaultSave();
    return {
      ...defaultSave(),
      ...parsed,
      upgrades: { ...defaultSave().upgrades, ...parsed.upgrades }
    };
  } catch {
    return defaultSave();
  }
}

function formatNumber(value: number) {
  if (value < 1000) return `${Math.floor(value)}`;
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`;
  return `${(value / 1_000_000).toFixed(1)}M`;
}

class ToyAudio {
  private ctx: AudioContext | null = null;
  private lastCollect = 0;
  muted = false;

  constructor(muted: boolean) {
    this.muted = muted;
  }

  async unlock() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  setMuted(value: boolean) {
    this.muted = value;
  }

  blip(kind: 'stamp' | 'tok' | 'collect' | 'snap' | 'buy' | 'boss' | 'wave') {
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    filter.type = 'lowpass';
    filter.frequency.value = 1800;
    let freq = 300;
    let dur = 0.08;
    let type: OscillatorType = 'triangle';
    if (kind === 'stamp') {
      freq = 105;
      dur = 0.13;
      type = 'square';
      filter.frequency.value = 780;
    } else if (kind === 'tok') {
      freq = 520 + Math.random() * 60;
      dur = 0.045;
      type = 'triangle';
      filter.frequency.value = 1300;
    } else if (kind === 'collect') {
      const ladder = now - this.lastCollect < 1 ? 1.13 : 1;
      freq = 720 * ladder + Math.random() * 35;
      dur = 0.035;
      type = 'sine';
      this.lastCollect = now;
    } else if (kind === 'snap') {
      freq = 160;
      dur = 0.12;
      type = 'sawtooth';
      filter.frequency.value = 650;
    } else if (kind === 'buy') {
      freq = 620;
      dur = 0.18;
      type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(980, now + dur);
    } else if (kind === 'boss') {
      freq = 72;
      dur = 0.22;
      type = 'square';
      filter.frequency.value = 480;
    } else if (kind === 'wave') {
      freq = 180;
      dur = 0.16;
      type = 'triangle';
    }
    osc.type = type;
    if (kind !== 'buy') {
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.62), now + dur);
    }
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === 'boss' ? 0.18 : 0.08, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
}

export class PlasticPlatoonGame {
  private app = new Application();
  private root: HTMLDivElement;
  private buildSha: string;
  private save: SaveData = loadSave();
  private audio = new ToyAudio(this.save.muted);
  private world = new Container();
  private ground = new Container();
  private props = new Container();
  private unitLayer = new Container();
  private shadowLayer = new Container();
  private particleLayer = new Container();
  private ui = new Container();
  private overlay = new Container();
  private textures = new Map<string, Texture>();
  private units: LaneUnit[] = [];
  private particles: Particle[] = [];
  private floaters: FloatingText[] = [];
  private buttons: ButtonState[] = [];
  private nextUnitId = 1;
  private accumulator = 0;
  private lastTime = performance.now();
  private simTime = 0;
  private hitStop = 0;
  private stampTimer = 0.5;
  private waveTimer = 1.2;
  private bandCd = 0;
  private cameraKick: CameraKick = { strength: 0, time: 0, maxTime: 1, angle: 0 };
  private resizeObserver?: ResizeObserver;
  private scrapDisplay = this.save.scrap;
  private medalDisplay = this.save.medals;
  private offlineAward = 0;
  private showOfflineCard = false;
  private showPrestigeCard = false;
  private touchPulse = 0;
  private molderPulse = 0;
  private fpsSamples: number[] = [];
  private lastAutosave = 0;
  private isFastForwarding = false;
  private particleCursor = 0;
  private lastSpacingAt = 0;
  private stageScale = 1;
  private stageX = 0;
  private stageY = 0;
  private uiRedrawCooldown = 0;

  private scrapText = new Text({ text: '0', style: { fill: '#fff8d8', fontSize: 28, fontWeight: '900', fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' } });
  private medalText = new Text({ text: '0', style: { fill: '#fde06c', fontSize: 19, fontWeight: '900', fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' } });
  private waveText = new Text({ text: 'WAVE 1', style: { fill: '#fff8d8', fontSize: 17, fontWeight: '900', fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' } });
  private zoneText = new Text({ text: 'Bedroom Carpet', style: { fill: '#17351e', fontSize: 14, fontWeight: '900', fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' } });
  private bandText = new Text({ text: 'SNAP READY', style: { fill: '#fff8d8', fontSize: 14, fontWeight: '900', fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' } });

  constructor(root: HTMLDivElement, buildSha: string) {
    this.root = root;
    this.buildSha = buildSha;
  }

  async start() {
    await this.app.init({
      background: '#243622',
      antialias: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      resizeTo: this.root,
      powerPreference: 'high-performance'
    });
    this.root.innerHTML = '';
    this.root.appendChild(this.app.canvas);
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = this.app.screen;
    this.app.stage.addChild(this.world);
    this.world.addChild(this.ground, this.props, this.shadowLayer, this.unitLayer, this.particleLayer);
    this.shadowLayer.sortableChildren = true;
    this.unitLayer.sortableChildren = true;
    this.app.stage.addChild(this.overlay, this.ui);
    await Assets.load([]);
    this.createTextures();
    this.createScene();
    this.createPools();
    this.setupInput();
    this.handleOfflineReturn();
    this.resize();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.root);
    this.app.ticker.add(() => this.tick());
    this.exposeDebugApi();
  }

  destroy() {
    this.resizeObserver?.disconnect();
    this.persist();
    this.app.destroy(true);
  }

  private createTextures() {
    const zone = ZONES[this.save.zoneIndex % ZONES.length];
    this.textures.clear();
    this.textures.set('ground', this.makeGroundTexture(zone));
    this.textures.set('greenSoldier', this.makeSoldierTexture(0x2f913e, 'green'));
    this.textures.set('tanSoldier', this.makeSoldierTexture(zone.enemy, 'tan'));
    this.textures.set('robot', this.makeBossTexture(0x9ba5a7, 'robot'));
    this.textures.set('tank', this.makeBossTexture(0x7c9d47, 'tank'));
    this.textures.set('shadow', this.makeEllipseTexture(0x000000, 0.25, 68, 19));
    this.textures.set('smallShadow', this.makeEllipseTexture(0x000000, 0.18, 36, 11));
    this.textures.set('pip', this.makePipTexture());
    this.textures.set('shardGreen', this.makeShardTexture(0x2f913e));
    this.textures.set('shardTan', this.makeShardTexture(zone.enemy));
    this.textures.set('spark', this.makeShardTexture(0xfff3a1));
    this.textures.set('dust', this.makeEllipseTexture(0xd5c4a4, 0.38, 42, 16));
    this.textures.set('tracer', this.makeTracerTexture());
    this.textures.set('ring', this.makeRingTexture());
    this.textures.set('healthBg', this.makeHealthTexture(false));
    this.textures.set('healthFill', this.makeHealthTexture(true));
  }

  private createScene() {
    this.ground.removeChildren();
    this.props.removeChildren();
    this.overlay.removeChildren();
    this.ui.removeChildren();
    const ground = new Sprite(this.textures.get('ground'));
    ground.width = WIDTH;
    ground.height = HEIGHT;
    this.ground.addChild(ground);
    this.drawProps();
    this.drawTiltShift();
    this.drawStaticUi();
  }

  private createPools() {
    for (let i = 0; i < 260; i += 1) this.units.push(this.makeUnit());
    for (let i = 0; i < 1200; i += 1) this.particles.push(this.makeParticle());
    for (let i = 0; i < 70; i += 1) this.floaters.push(this.makeFloatingText());
  }

  private setupInput() {
    const onDown = async (event: FederatedPointerEvent) => {
      await this.audio.unlock();
      const point = this.toGamePoint(event.global.x, event.global.y);
      const button = this.buttons.find((candidate) => candidate.rect.contains(point.x, point.y));
      if (button) {
        button.pressed = 0.15;
        this.handleButton(button.id);
        return;
      }
      this.tryBand(point.x, point.y);
    };
    this.app.stage.on('pointerdown', onDown);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.persist();
      if (document.visibilityState === 'visible') this.handleOfflineReturn();
    });
  }

  private exposeDebugApi() {
    Object.assign(this, {
      debugFastForward: (seconds: number) => this.fastForward(seconds),
      debugState: () => ({
        scrap: this.save.scrap,
        wave: this.save.wave,
        units: this.units.filter((unit) => unit.active).length,
        fpsP95: this.getFrameP95()
      }),
      debugPerfProbe: (seconds = 180, step = 1 / 20) => this.runCpuPerfProbe(seconds, step),
      debugBuyFirstAffordable: () => {
        const item = UPGRADES.find((upgrade) => this.save.scrap >= this.upgradeCost(upgrade));
        if (item) this.buyUpgrade(item.id);
      },
      debugAddScrap: (amount: number) => {
        this.save.scrap += amount;
        this.save.totalEarned += amount;
      },
      debugTriggerOffline: (amount = 150) => {
        this.offlineAward = amount;
        this.showOfflineCard = true;
        this.drawStaticUi();
      },
      debugSpawnBattle: () => {
        for (let i = 0; i < 5; i += 1) this.activateUnit('green', 'soldier', 105 + i * 42, LANES[i % LANES.length] + rand(-8, 8));
        for (let i = 0; i < 14; i += 1) this.activateUnit('tan', 'soldier', 292 + (i % 3) * 36, LANES[i % LANES.length] + rand(-8, 8));
        this.activateUnit('tan', this.save.wave % 2 ? 'robot' : 'tank', 342, LANES[2]);
      }
    });
  }

  private tick() {
    const now = performance.now();
    const dtRaw = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.fpsSamples.push(dtRaw * 1000);
    if (this.fpsSamples.length > 720) this.fpsSamples.shift();
    this.accumulator += dtRaw;
    const fixed = 1 / 60;
    let loops = 0;
    while (this.accumulator >= fixed && loops < 4) {
      this.simulate(fixed);
      this.accumulator -= fixed;
      loops += 1;
    }
    this.renderFrame(dtRaw);
  }

  private simulate(dt: number) {
    this.simTime += dt;
    this.hitStop = Math.max(0, this.hitStop - dt);
    this.bandCd = Math.max(0, this.bandCd - dt);
    this.touchPulse = Math.max(0, this.touchPulse - dt);
    this.molderPulse = Math.max(0, this.molderPulse - dt);
    if (this.hitStop <= 0) {
      this.stampTimer -= dt;
      this.waveTimer -= dt;
      if (this.stampTimer <= 0) this.stamp();
      if (this.waveTimer <= 0) this.spawnWave();
      this.updateUnits(dt);
    }
    this.updateParticles(dt);
    this.updateFloaters(dt);
    for (const button of this.buttons) button.pressed = Math.max(0, button.pressed - dt);
    this.scrapDisplay += (this.save.scrap - this.scrapDisplay) * Math.min(1, dt * 8);
    this.medalDisplay += (this.save.medals - this.medalDisplay) * Math.min(1, dt * 8);
    this.lastAutosave += dt;
    if (this.lastAutosave > 4) {
      this.persist();
      this.lastAutosave = 0;
    }
  }

  private renderFrame(dt: number) {
    const kick = this.cameraKick;
    kick.time = Math.max(0, kick.time - dt);
    let offsetX = 0;
    let offsetY = 0;
    if (kick.time > 0 && !REDUCED_MOTION) {
      const t = kick.time / kick.maxTime;
      const amount = kick.strength * t * t;
      offsetX = Math.cos(kick.angle) * amount * (Math.random() * 2 - 1);
      offsetY = Math.sin(kick.angle) * amount * (Math.random() * 2 - 1);
    }
    this.world.position.set(this.stageX + offsetX * this.stageScale, this.stageY + offsetY * this.stageScale);
    this.world.scale.set(this.stageScale);
    this.overlay.position.set(this.stageX, this.stageY);
    this.overlay.scale.set(this.stageScale);
    this.ui.position.set(this.stageX, this.stageY);
    this.ui.scale.set(this.stageScale);
    this.updateHudText();
    this.uiRedrawCooldown -= dt;
    if (this.uiRedrawCooldown <= 0) {
      const pressedButton = this.buttons.some((button) => button.pressed > 0);
      this.drawDynamicUi();
      this.uiRedrawCooldown = this.molderPulse > 0 || pressedButton ? 1 / 12 : 1 / 6;
    }
    for (const unit of this.units) {
      if (!unit.active) continue;
      const march = Math.sin(this.simTime * 22 + unit.wobble);
      const stepHold = Math.floor(this.simTime * 12 + unit.wobble) % 2 === 0 ? 1 : -1;
      const hop = unit.stopMotion > 0 ? Math.sin(unit.stopMotion * Math.PI) * 10 : Math.max(0, march) * 3;
      unit.sprite.position.set(unit.x, unit.y - hop);
      unit.shadow.position.set(unit.x, unit.y + 20);
      unit.sprite.zIndex = unit.y + (unit.kind === 'soldier' ? 0 : 2);
      unit.shadow.zIndex = unit.y - 2;
      unit.bar.zIndex = unit.y + 4;
      unit.sprite.rotation = unit.tipped + (unit.deathTimer > 0 ? unit.deathTimer * 1.2 : stepHold * 0.04);
      const pulse = unit.team === 'green' && this.molderPulse > 0 ? 1 + this.molderPulse * 0.08 : 1;
      const bossScale = unit.kind === 'robot' ? 1.32 : unit.kind === 'tank' ? 1.34 : 1;
      unit.sprite.scale.set(unit.team === 'green' ? bossScale * pulse : -bossScale * pulse, bossScale * pulse);
      unit.shadow.scale.set((unit.kind === 'soldier' ? 1 : 1.8) * pulse, (unit.kind === 'soldier' ? 1 : 1.4) * pulse);
      unit.sprite.alpha = unit.deathTimer > 0 ? clamp(unit.deathTimer * 3, 0, 1) : 1;
      unit.shadow.alpha = unit.sprite.alpha * 0.78;
      unit.bar.position.set(unit.x - 24, unit.y - 62);
      unit.bar.visible = unit.hp < unit.maxHp && unit.deathTimer <= 0;
      if (unit.bar.visible) {
        unit.barFill.scale.x = clamp(unit.hp / unit.maxHp, 0.02, 1);
        unit.barFill.tint = unit.team === 'green' ? 0x9eff5c : 0xffe08a;
      }
    }
    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.sprite.position.set(particle.x, particle.y);
      particle.sprite.rotation = particle.rot;
      particle.sprite.scale.set(particle.scale);
      particle.sprite.alpha = clamp(particle.life / particle.maxLife, 0, 1);
    }
    for (const floater of this.floaters) {
      if (!floater.active) continue;
      floater.text.position.set(floater.x, floater.y);
      const t = floater.life / floater.maxLife;
      floater.text.alpha = clamp(t, 0, 1);
      floater.text.scale.set(0.75 + (1 - t) * 0.35);
    }
  }

  private updateUnits(dt: number) {
    const active: LaneUnit[] = [];
    const byLane: Array<{ green: LaneUnit[]; tan: LaneUnit[] }> = LANES.map(() => ({ green: [], tan: [] }));
    for (const unit of this.units) {
      if (!unit.active) continue;
      active.push(unit);
      byLane[unit.lane][unit.team].push(unit);
    }
    for (const unit of active) {
      if (unit.deathTimer > 0) {
        unit.deathTimer -= dt;
        if (unit.deathTimer <= 0) this.deactivateUnit(unit);
        continue;
      }
      unit.stopMotion = Math.max(0, unit.stopMotion - dt * 5);
      unit.fireTimer -= dt;
      const target = this.findTarget(unit, byLane[unit.lane][unit.team === 'green' ? 'tan' : 'green']);
      unit.targetId = target?.id ?? 0;
      if (target && Math.abs(target.x - unit.x) <= unit.range) {
        if (unit.fireTimer <= 0) {
          this.fire(unit, target);
          unit.fireTimer = unit.cd;
        }
      } else {
        const dir = unit.team === 'green' ? 1 : -1;
        unit.x += dir * unit.speed * dt;
      }
      if (unit.team === 'green' && unit.x > WIDTH + 70) {
        this.deactivateUnit(unit);
      }
      if (unit.team === 'tan' && unit.x < 78) {
        this.damageMolder(unit);
        this.knockover(unit, -1, false);
      }
    }
    if (this.simTime - this.lastSpacingAt > 0.08) {
      this.applyLaneSpacing(active);
      this.lastSpacingAt = this.simTime;
    }
  }

  private applyLaneSpacing(active: LaneUnit[]) {
    for (const team of ['green', 'tan'] as const) {
      for (let lane = 0; lane < LANES.length; lane += 1) {
        const row = active
          .filter((unit) => unit.active && unit.team === team && unit.lane === lane && unit.deathTimer <= 0)
          .sort((a, b) => a.x - b.x);
        for (let i = 1; i < row.length; i += 1) {
          const left = row[i - 1];
          const right = row[i];
          const minGap = left.kind === 'soldier' && right.kind === 'soldier' ? 34 : 58;
          const gap = right.x - left.x;
          if (gap < minGap) {
            const push = (minGap - gap) * 0.45;
            left.x = clamp(left.x - push, 66, WIDTH + 120);
            right.x = clamp(right.x + push, 66, WIDTH + 120);
          }
        }
      }
    }
  }

  private updateParticles(dt: number) {
    const hopper = this.hopperPoint();
    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.life -= dt;
      if (particle.kind === 'pip') {
        const age = 1 - particle.life / particle.maxLife;
        const t = easeInQuad(clamp(age, 0, 1));
        particle.x += (hopper.x - particle.x) * t * 0.12;
        particle.y += (hopper.y - particle.y) * t * 0.12 - Math.sin(age * Math.PI) * 0.6;
        particle.rot += particle.spin * dt;
        particle.scale = 0.75 + Math.sin(age * Math.PI) * 0.45;
        if (particle.life <= 0.05) {
          this.save.scrap += particle.value;
          this.save.totalEarned += particle.value;
          this.audio.blip('collect');
          particle.active = false;
          particle.sprite.visible = false;
        }
      } else if (particle.kind === 'ring') {
        const age = 1 - particle.life / particle.maxLife;
        particle.scale = easeOutQuad(age) * 2.9;
        particle.sprite.alpha = (1 - age) * 0.7;
        if (particle.life <= 0) {
          particle.active = false;
          particle.sprite.visible = false;
        }
      } else {
        particle.vx += particle.ax * dt;
        particle.vy += particle.ay * dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.rot += particle.spin * dt;
        if (particle.kind === 'dust') particle.scale += dt * 0.9;
        if (particle.life <= 0) {
          particle.active = false;
          particle.sprite.visible = false;
        }
      }
    }
  }

  private updateFloaters(dt: number) {
    for (const floater of this.floaters) {
      if (!floater.active) continue;
      floater.life -= dt;
      floater.y += floater.vy * dt;
      if (floater.life <= 0) {
        floater.active = false;
        floater.text.visible = false;
      }
    }
  }

  private findTarget(unit: LaneUnit, opponents: LaneUnit[]) {
    let best: LaneUnit | null = null;
    let bestDist = Infinity;
    for (const other of opponents) {
      if (!other.active || other.deathTimer > 0) continue;
      const dist = Math.abs(other.x - unit.x);
      const isAhead = unit.team === 'green' ? other.x >= unit.x - 4 : other.x <= unit.x + 4;
      if (isAhead && dist < bestDist) {
        best = other;
        bestDist = dist;
      }
    }
    return best;
  }

  private fire(attacker: LaneUnit, target: LaneUnit) {
    attacker.stopMotion = 1;
    target.hp -= attacker.damage;
    this.spawnTracer(attacker.x + (attacker.team === 'green' ? 28 : -28), attacker.y - 28, target.x, target.y - 28, attacker.team);
    this.spawnSparks(target.x, target.y - 35, attacker.team === 'green' ? 1 : -1);
    if (target.hp <= 0) this.knockover(target, attacker.team === 'green' ? 1 : -1, true);
  }

  private stamp() {
    const fasterLevel = this.save.upgrades.faster;
    const biggerLevel = this.save.upgrades.bigger;
    const medalMult = this.medalMultiplier();
    this.stampTimer = Math.max(0.33, 2.2 * Math.pow(0.75, fasterLevel) / Math.sqrt(medalMult));
    const count = 1 + biggerLevel;
    this.molderPulse = 0.45;
    this.audio.blip('stamp');
    this.shake(2.2, 0.18, Math.PI);
    for (let i = 0; i < count; i += 1) {
      const lane = i % LANES.length;
      const unit = this.activateUnit('green', 'soldier', 96 - i * 5, LANES[lane] + rand(-8, 8));
      if (!unit) break;
      unit.stopMotion = 1;
      unit.x -= rand(0, 26);
    }
    this.spawnStampFlash();
  }

  private spawnWave() {
    const wave = this.save.wave;
    const bossWave = wave % 5 === 0;
    const tankWave = wave % 10 === 0;
    const count = bossWave ? 1 : Math.min(8 + Math.floor(wave * 1.25), 35);
    this.audio.blip('wave');
    this.spawnWaveDust();
    if (bossWave) {
      const kind: UnitKind = tankWave ? 'tank' : 'robot';
      const lane = LANES[Math.floor(LANES.length / 2)];
      this.activateUnit('tan', kind, WIDTH + 82, lane);
    } else {
      for (let i = 0; i < count; i += 1) {
        const lane = LANES[i % LANES.length];
        this.activateUnit('tan', 'soldier', WIDTH + 42 + i * 11, lane + rand(-7, 7));
      }
    }
    this.save.wave += 1;
    if (this.save.wave > 1 && this.save.wave % 8 === 1) {
      this.save.zoneIndex = (this.save.zoneIndex + 1) % ZONES.length;
      this.createTextures();
      this.createScene();
      this.showFloater(ZONES[this.save.zoneIndex].title, WIDTH / 2 - 64, 292, 0xfff1a8);
    }
    this.waveTimer = bossWave ? 9.5 : Math.max(3.6, 7.2 - wave * 0.055);
  }

  private activateUnit(team: Team, kind: UnitKind, x: number, y: number) {
    const unit = this.units.find((candidate) => !candidate.active);
    if (!unit) return null;
    const wave = this.save.wave;
    const medalMult = this.medalMultiplier();
    const rifleMult = 1 + this.save.upgrades.rifles * 0.25;
    const scoutMult = 1 + this.save.upgrades.scouts * 0.14;
    const zone = ZONES[this.save.zoneIndex % ZONES.length];
    let hp = team === 'green' ? 3 * medalMult : 2 * (1 + 0.18 * wave);
    let speed = team === 'green' ? 46 * scoutMult : 34;
    let range = team === 'green' ? 115 : 95;
    let cd = team === 'green' ? 0.9 : 1.5;
    let damage = team === 'green' ? rifleMult * medalMult : 0.55;
    let scrap = team === 'tan' ? 2 : 0;
    let radius = 22;
    let texture = team === 'green' ? 'greenSoldier' : 'tanSoldier';
    if (kind === 'robot') {
      hp = 20 * (1 + wave * 0.22);
      speed = 18;
      range = 106;
      cd = 1.2;
      damage = 1.1;
      scrap = 22 + Math.floor(wave * 1.8);
      radius = 42;
      texture = 'robot';
    } else if (kind === 'tank') {
      hp = 34 * (1 + wave * 0.24);
      speed = 15;
      range = 125;
      cd = 1.75;
      damage = 1.8;
      scrap = 42 + Math.floor(wave * 2.5);
      radius = 44;
      texture = 'tank';
    }
    unit.active = true;
    unit.id = this.nextUnitId++;
    unit.team = team;
    unit.kind = kind;
    unit.hp = hp;
    unit.maxHp = hp;
    unit.x = x;
    unit.y = y;
    unit.vx = team === 'green' ? speed : -speed;
    unit.range = range;
    unit.cd = cd;
    unit.fireTimer = rand(0.1, cd);
    unit.speed = speed;
    unit.damage = damage;
    unit.radius = radius;
    unit.scrap = scrap;
    unit.lane = LANES.reduce((best, lane, index) => (Math.abs(y - lane) < Math.abs(y - LANES[best]) ? index : best), 0);
    unit.stopMotion = 0;
    unit.wobble = rand(0, Math.PI * 2);
    unit.deathTimer = 0;
    unit.tipped = 0;
    unit.targetId = 0;
    unit.sprite.texture = this.textures.get(texture) ?? Texture.WHITE;
    unit.shadow.texture = this.textures.get(kind === 'soldier' ? 'shadow' : 'shadow') ?? Texture.WHITE;
    unit.sprite.tint = team === 'tan' && kind === 'soldier' ? shade(zone.enemy, 0) : 0xffffff;
    unit.sprite.visible = true;
    unit.shadow.visible = true;
    unit.bar.visible = false;
    return unit;
  }

  private deactivateUnit(unit: LaneUnit) {
    unit.active = false;
    unit.sprite.visible = false;
    unit.shadow.visible = false;
    unit.bar.visible = false;
  }

  private knockover(unit: LaneUnit, dir: number, reward: boolean) {
    if (unit.deathTimer > 0) return;
    unit.deathTimer = 0.34;
    unit.tipped = dir * (Math.PI / 2.2);
    this.audio.blip(unit.kind === 'soldier' ? 'tok' : 'boss');
    this.shake(unit.kind === 'soldier' ? 2.3 : 6, unit.kind === 'soldier' ? 0.18 : 0.36, dir > 0 ? 0 : Math.PI);
    if (unit.kind !== 'soldier' && !REDUCED_MOTION) this.hitStop = 0.07;
    const shardCount = unit.kind === 'soldier' ? Math.floor(rand(6, 12)) : 28;
    for (let i = 0; i < shardCount; i += 1) this.spawnShard(unit.x, unit.y - 30, unit.team, unit.kind !== 'soldier');
    if (reward && unit.scrap > 0) {
      const pipCount = Math.min(18, Math.max(2, Math.floor(unit.scrap / 2)));
      const value = unit.scrap / pipCount;
      for (let i = 0; i < pipCount; i += 1) this.spawnPip(unit.x + rand(-16, 16), unit.y - 26 + rand(-20, 8), value);
      this.showFloater(`+${unit.scrap}`, unit.x - 14, unit.y - 76, 0xffef85);
    }
  }

  private damageMolder(unit: LaneUnit) {
    this.shake(3.5, 0.18, 0);
    this.showFloater('BONK', 76, unit.y - 55, 0xff8a76);
  }

  private tryBand(x: number, y: number) {
    if (this.bandCd > 0 || y < 220) return;
    this.bandCd = 6;
    this.touchPulse = 0.55;
    this.audio.blip('snap');
    this.shake(5, 0.24, x > WIDTH / 2 ? 0 : Math.PI);
    this.spawnRing(x, y);
    if ('vibrate' in navigator) navigator.vibrate?.(45);
    for (const unit of this.units) {
      if (!unit.active || unit.team !== 'tan' || unit.deathTimer > 0) continue;
      const dx = unit.x - x;
      const dy = unit.y - y;
      if (Math.hypot(dx, dy) <= 78 + unit.radius) {
        unit.hp -= 8 * this.medalMultiplier();
        unit.x += dx > 0 ? 14 : -14;
        if (unit.hp <= 0) this.knockover(unit, dx >= 0 ? 1 : -1, true);
        else {
          unit.stopMotion = 1;
          this.spawnSparks(unit.x, unit.y - 32, dx >= 0 ? 1 : -1);
        }
      }
    }
  }

  private handleButton(id: ButtonState['id']) {
    if (id === 'mute') {
      this.save.muted = !this.save.muted;
      this.audio.setMuted(this.save.muted);
      this.persist();
      return;
    }
    if (id === 'claim') {
      this.claimOffline();
      return;
    }
    if (id === 'prestige') {
      if (this.showPrestigeCard) this.confirmPrestige();
      else {
        this.showPrestigeCard = true;
        this.drawStaticUi();
      }
      return;
    }
    this.buyUpgrade(id);
  }

  private buyUpgrade(id: UpgradeId) {
    const def = UPGRADES.find((upgrade) => upgrade.id === id);
    if (!def) return;
    const cost = this.upgradeCost(def);
    if (this.save.upgrades[id] >= def.max || this.save.scrap < cost) return;
    this.save.scrap -= cost;
    this.save.upgrades[id] += 1;
    this.audio.blip('buy');
    this.shake(2, 0.16, -Math.PI / 2);
    this.molderPulse = 0.8;
    this.spawnBuyBurst(270, 740);
    this.showFloater('UPGRADE!', 164, 666, 0xfff1a8);
    this.persist();
  }

  private upgradeCost(def: UpgradeDef) {
    return Math.floor(def.baseCost * Math.pow(def.costScale, this.save.upgrades[def.id]));
  }

  private medalMultiplier() {
    return 1 + this.save.medals * 0.08;
  }

  private prestigePreview() {
    return Math.max(1, Math.floor(Math.sqrt(Math.max(0, this.save.wave - 8)) + this.save.totalEarned / 1800));
  }

  private confirmPrestige() {
    const award = this.prestigePreview();
    if (award <= 0) return;
    const muted = this.save.muted;
    const medals = this.save.medals + award;
    const prestigeCount = this.save.prestigeCount + 1;
    this.save = defaultSave();
    this.save.muted = muted;
    this.save.medals = medals;
    this.save.prestigeCount = prestigeCount;
    this.audio.setMuted(muted);
    this.showPrestigeCard = false;
    this.units.forEach((unit) => this.deactivateUnit(unit));
    this.particles.forEach((particle) => {
      particle.active = false;
      particle.sprite.visible = false;
    });
    this.save.zoneIndex = 0;
    this.createTextures();
    this.createScene();
    this.shake(5, 0.25, -Math.PI / 2);
    this.audio.blip('buy');
    this.persist();
  }

  private handleOfflineReturn() {
    const now = Date.now();
    const awayMs = now - this.save.lastSeen;
    if (this.save.pendingOfflineScrap > 0) {
      this.offlineAward = this.save.pendingOfflineScrap;
      this.showOfflineCard = true;
      this.save.lastSeen = now;
      this.persist();
      this.drawStaticUi();
      return;
    }
    if (awayMs < 60_000) {
      this.save.lastSeen = now;
      return;
    }
    const cappedHours = Math.min(4.5, awayMs / 3_600_000);
    const rate = Math.max(8, this.save.wave * 2.4 + Object.values(this.save.upgrades).reduce((a, b) => a + b, 0) * 6) * this.medalMultiplier();
    const award = Math.floor(rate * cappedHours);
    if (award > 0) {
      this.save.pendingOfflineScrap += award;
      this.offlineAward = award;
      this.showOfflineCard = true;
      this.save.lastSeen = now;
      this.persist();
      this.drawStaticUi();
      return;
    }
    this.save.lastSeen = now;
  }

  private claimOffline() {
    if (this.offlineAward <= 0) return;
    const amount = this.offlineAward;
    this.offlineAward = 0;
    this.showOfflineCard = false;
    this.save.pendingOfflineScrap = 0;
    this.save.scrap += amount;
    this.save.totalEarned += amount;
    for (let i = 0; i < 22; i += 1) this.spawnPip(WIDTH / 2 + rand(-80, 80), 320 + rand(-20, 80), 0);
    this.audio.blip('buy');
    this.drawStaticUi();
    this.persist();
  }

  private fastForward(seconds: number) {
    this.isFastForwarding = true;
    const fixed = 1 / 30;
    const loops = Math.ceil(seconds / fixed);
    for (let i = 0; i < loops; i += 1) this.simulate(fixed);
    this.isFastForwarding = false;
  }

  private runCpuPerfProbe(seconds: number, step: number) {
    this.units.forEach((unit) => this.deactivateUnit(unit));
    this.particles.forEach((particle) => {
      particle.active = false;
      particle.sprite.visible = false;
    });
    this.save.wave = Math.max(this.save.wave, 35);
    this.ensurePerfPressure();
    const samples: number[] = [];
    const frames = Math.ceil(seconds / step);
    let minUnits = Infinity;
    let minParticles = Infinity;
    for (let i = 0; i < frames; i += 1) {
      if (i % 8 === 0) this.ensurePerfPressure();
      const start = performance.now();
      this.simulate(step);
      this.renderFrame(Math.min(step, 1 / 15));
      samples.push(performance.now() - start);
      if (i % 30 === 0) {
        minUnits = Math.min(minUnits, this.units.filter((unit) => unit.active).length);
        minParticles = Math.min(minParticles, this.particles.filter((particle) => particle.active).length);
      }
    }
    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(samples.length * 0.95)];
    const max = samples[samples.length - 1];
    const longFrames = samples.filter((sample) => sample > 16.7).length;
    return {
      seconds,
      step,
      frames,
      units: this.units.filter((unit) => unit.active).length,
      particles: this.particles.filter((particle) => particle.active).length,
      minUnits,
      minParticles,
      p95,
      max,
      longFrames
    };
  }

  private ensurePerfPressure() {
    const counts = { green: 0, tan: 0, boss: 0, particles: 0 };
    for (const unit of this.units) {
      if (!unit.active) continue;
      if (unit.team === 'green') counts.green += 1;
      else if (unit.kind === 'soldier') counts.tan += 1;
      else counts.boss += 1;
    }
    for (const particle of this.particles) if (particle.active) counts.particles += 1;
    for (let i = counts.green; i < 104; i += 1) {
      this.activateUnit('green', 'soldier', 82 + (i % 10) * 18, LANES[i % LANES.length] + rand(-14, 14));
    }
    for (let i = counts.tan; i < 116; i += 1) {
      this.activateUnit('tan', 'soldier', 230 + (i % 10) * 18, LANES[i % LANES.length] + rand(-14, 14));
    }
    if (counts.boss < 1) this.activateUnit('tan', 'robot', 328, LANES[1]);
    if (counts.boss < 2) this.activateUnit('tan', 'tank', 352, LANES[3]);
    for (let i = counts.particles; i < 300; i += 1) this.spawnPerfParticle(i);
  }

  private spawnPerfParticle(index: number) {
    const particle = this.firstParticle();
    if (!particle) return;
    particle.kind = index % 3 === 0 ? 'dust' : 'spark';
    particle.sprite.texture = this.textures.get(index % 3 === 0 ? 'dust' : 'spark') ?? Texture.WHITE;
    particle.sprite.visible = true;
    particle.active = true;
    particle.x = rand(90, WIDTH - 20);
    particle.y = rand(300, 620);
    particle.vx = rand(-80, 80);
    particle.vy = rand(-80, 40);
    particle.ax = 0;
    particle.ay = rand(120, 320);
    particle.life = particle.maxLife = rand(0.8, 1.8);
    particle.rot = rand(0, Math.PI * 2);
    particle.spin = rand(-8, 8);
    particle.scale = rand(0.35, 0.85);
    particle.value = 0;
  }

  private persist() {
    this.save.lastSeen = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
  }

  private getFrameP95() {
    if (!this.fpsSamples.length) return 0;
    const sorted = [...this.fpsSamples].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.95)];
  }

  private makeUnit(): LaneUnit {
    const sprite = new Sprite(Texture.WHITE);
    const shadow = new Sprite(Texture.WHITE);
    const bar = new Container();
    const barBg = new Sprite(this.textures.get('healthBg') ?? Texture.WHITE);
    const barFill = new Sprite(this.textures.get('healthFill') ?? Texture.WHITE);
    barFill.position.set(1, 1);
    bar.addChild(barBg, barFill);
    sprite.anchor.set(0.5, 0.86);
    shadow.anchor.set(0.5);
    sprite.visible = false;
    shadow.visible = false;
    bar.visible = false;
    this.shadowLayer.addChild(shadow);
    this.unitLayer.addChild(sprite, bar);
    return {
      active: false,
      id: 0,
      team: 'green',
      kind: 'soldier',
      hp: 1,
      maxHp: 1,
      x: 0,
      y: 0,
      vx: 0,
      range: 0,
      cd: 1,
      fireTimer: 0,
      speed: 0,
      damage: 0,
      radius: 20,
      scrap: 0,
      lane: 0,
      stopMotion: 0,
      wobble: 0,
      deathTimer: 0,
      tipped: 0,
      targetId: 0,
      sprite,
      shadow,
      bar,
      barFill
    };
  }

  private makeParticle(): Particle {
    const sprite = new Sprite(Texture.WHITE);
    sprite.anchor.set(0.5);
    sprite.visible = false;
    this.particleLayer.addChild(sprite);
    return {
      active: false,
      kind: 'shard',
      sprite,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: 0,
      life: 0,
      maxLife: 1,
      rot: 0,
      spin: 0,
      scale: 1,
      targetX: 0,
      targetY: 0,
      value: 0
    };
  }

  private makeFloatingText(): FloatingText {
    const text = new Text({
      text: '',
      style: {
        fill: '#fff1a8',
        fontSize: 20,
        fontWeight: '900',
        stroke: { color: '#432716', width: 4 },
        fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif'
      }
    });
    text.visible = false;
    this.ui.addChild(text);
    return { active: false, text, x: 0, y: 0, vy: -46, life: 0, maxLife: 1 };
  }

  private spawnShard(x: number, y: number, team: Team, big: boolean) {
    const particle = this.firstParticle();
    if (!particle) return;
    particle.kind = 'shard';
    particle.sprite.texture = this.textures.get(team === 'green' ? 'shardGreen' : 'shardTan') ?? Texture.WHITE;
    particle.sprite.visible = true;
    particle.active = true;
    particle.x = x;
    particle.y = y;
    const angle = rand(-Math.PI, 0);
    const speed = rand(big ? 150 : 80, big ? 360 : 210);
    particle.vx = Math.cos(angle) * speed;
    particle.vy = Math.sin(angle) * speed;
    particle.ax = 0;
    particle.ay = 520;
    particle.life = particle.maxLife = rand(0.42, 0.78);
    particle.rot = rand(0, Math.PI);
    particle.spin = rand(-8, 8);
    particle.scale = rand(big ? 0.8 : 0.45, big ? 1.35 : 0.9);
  }

  private spawnPip(x: number, y: number, value: number) {
    const particle = this.firstParticle();
    if (!particle) return;
    particle.kind = 'pip';
    particle.sprite.texture = this.textures.get('pip') ?? Texture.WHITE;
    particle.sprite.visible = true;
    particle.active = true;
    particle.x = x;
    particle.y = y;
    particle.vx = rand(-70, 70);
    particle.vy = rand(-120, -30);
    particle.ax = 0;
    particle.ay = 0;
    particle.life = particle.maxLife = rand(0.55, 0.95);
    particle.rot = rand(0, Math.PI * 2);
    particle.spin = rand(-8, 8);
    particle.scale = 0.75;
    particle.value = value;
  }

  private spawnSparks(x: number, y: number, dir: number) {
    for (let i = 0; i < 4; i += 1) {
      const particle = this.firstParticle();
      if (!particle) return;
      particle.kind = 'spark';
      particle.sprite.texture = this.textures.get('spark') ?? Texture.WHITE;
      particle.sprite.visible = true;
      particle.active = true;
      particle.x = x;
      particle.y = y;
      particle.vx = dir * rand(50, 170);
      particle.vy = rand(-80, 30);
      particle.ax = 0;
      particle.ay = 260;
      particle.life = particle.maxLife = rand(0.16, 0.28);
      particle.rot = rand(0, Math.PI);
      particle.spin = rand(-12, 12);
      particle.scale = rand(0.45, 0.75);
    }
  }

  private spawnTracer(x: number, y: number, tx: number, ty: number, team: Team) {
    const particle = this.firstParticle();
    if (!particle) return;
    particle.kind = 'tracer';
    particle.sprite.texture = this.textures.get('tracer') ?? Texture.WHITE;
    particle.sprite.visible = true;
    particle.active = true;
    particle.x = x;
    particle.y = y;
    const angle = Math.atan2(ty - y, tx - x);
    particle.vx = Math.cos(angle) * 720;
    particle.vy = Math.sin(angle) * 720;
    particle.ax = 0;
    particle.ay = 0;
    particle.life = particle.maxLife = 0.13;
    particle.rot = angle;
    particle.spin = 0;
    particle.scale = team === 'green' ? 0.8 : 0.65;
  }

  private spawnRing(x: number, y: number) {
    const particle = this.firstParticle();
    if (!particle) return;
    particle.kind = 'ring';
    particle.sprite.texture = this.textures.get('ring') ?? Texture.WHITE;
    particle.sprite.visible = true;
    particle.active = true;
    particle.x = x;
    particle.y = y;
    particle.vx = 0;
    particle.vy = 0;
    particle.ax = 0;
    particle.ay = 0;
    particle.life = particle.maxLife = 0.42;
    particle.rot = 0;
    particle.spin = 0;
    particle.scale = 0.15;
  }

  private spawnStampFlash() {
    for (let i = 0; i < 10; i += 1) {
      const particle = this.firstParticle();
      if (!particle) return;
      particle.kind = 'spark';
      particle.sprite.texture = this.textures.get(i % 2 ? 'spark' : 'shardGreen') ?? Texture.WHITE;
      particle.sprite.visible = true;
      particle.active = true;
      particle.x = 80 + rand(-20, 24);
      particle.y = 303 + rand(-26, 18);
      particle.vx = rand(-90, 150);
      particle.vy = rand(-120, 20);
      particle.ax = 0;
      particle.ay = 240;
      particle.life = particle.maxLife = rand(0.18, 0.42);
      particle.rot = rand(0, Math.PI);
      particle.spin = rand(-10, 10);
      particle.scale = rand(0.45, 0.9);
    }
  }

  private spawnWaveDust() {
    for (let i = 0; i < 12; i += 1) {
      const particle = this.firstParticle();
      if (!particle) return;
      particle.kind = 'dust';
      particle.sprite.texture = this.textures.get('dust') ?? Texture.WHITE;
      particle.sprite.visible = true;
      particle.active = true;
      particle.x = WIDTH + rand(-8, 38);
      particle.y = LANES[i % LANES.length] + rand(-24, 16);
      particle.vx = rand(-90, -20);
      particle.vy = rand(-10, 14);
      particle.ax = 0;
      particle.ay = -10;
      particle.life = particle.maxLife = rand(0.45, 0.8);
      particle.rot = rand(0, Math.PI);
      particle.spin = rand(-1, 1);
      particle.scale = rand(0.4, 0.8);
    }
  }

  private spawnBuyBurst(x: number, y: number) {
    for (let i = 0; i < 28; i += 1) {
      const particle = this.firstParticle();
      if (!particle) return;
      particle.kind = 'spark';
      particle.sprite.texture = this.textures.get(i % 3 ? 'pip' : 'spark') ?? Texture.WHITE;
      particle.sprite.visible = true;
      particle.active = true;
      particle.x = x + rand(-44, 44);
      particle.y = y + rand(-24, 24);
      const angle = rand(-Math.PI, Math.PI);
      const speed = rand(60, 230);
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
      particle.ax = 0;
      particle.ay = 430;
      particle.life = particle.maxLife = rand(0.36, 0.75);
      particle.rot = rand(0, Math.PI);
      particle.spin = rand(-10, 10);
      particle.scale = rand(0.5, 1.1);
    }
  }

  private showFloater(text: string, x: number, y: number, color: number) {
    const floater = this.floaters.find((candidate) => !candidate.active);
    if (!floater) return;
    floater.active = true;
    floater.text.text = text;
    floater.text.style.fill = color;
    floater.text.visible = true;
    floater.x = x;
    floater.y = y;
    floater.vy = -48;
    floater.life = floater.maxLife = 0.9;
  }

  private firstParticle() {
    for (let i = 0; i < this.particles.length; i += 1) {
      const index = (this.particleCursor + i) % this.particles.length;
      const candidate = this.particles[index];
      if (!candidate.active) {
        this.particleCursor = (index + 1) % this.particles.length;
        return candidate;
      }
    }
    return null;
  }

  private hopperPoint() {
    return { x: 55, y: 192 };
  }

  private shake(strength: number, duration: number, angle: number) {
    if (REDUCED_MOTION) return;
    if (strength >= this.cameraKick.strength * (this.cameraKick.time / Math.max(0.001, this.cameraKick.maxTime))) {
      this.cameraKick = { strength, time: duration, maxTime: duration, angle };
    }
  }

  private toGamePoint(x: number, y: number) {
    return {
      x: (x - this.stageX) / this.stageScale,
      y: (y - this.stageY) / this.stageScale
    };
  }

  private resize() {
    const screen = this.app.screen;
    this.stageScale = Math.max(screen.width / WIDTH, screen.height / HEIGHT);
    this.stageX = (screen.width - WIDTH * this.stageScale) / 2;
    this.stageY = (screen.height - HEIGHT * this.stageScale) / 2;
    this.app.stage.hitArea = new Rectangle(0, 0, screen.width, screen.height);
  }

  private drawProps() {
    const zone = ZONES[this.save.zoneIndex % ZONES.length];
    const g = new Graphics();
    if (zone.id === 'bedroom') {
      g.roundRect(212, 120, 190, 30, 7).fill(0xf3cd4d).stroke({ color: 0xb27d24, width: 4 });
      g.roundRect(246, 112, 48, 47, 5).fill(0xffea71).stroke({ color: 0xb27d24, width: 3 });
      g.roundRect(286, 156, 76, 42, 6).fill(0xdb3d39).stroke({ color: 0x8a1e1d, width: 4 });
      g.circle(331, 177, 16).fill(0xf6e174).stroke({ color: 0x9f761d, width: 4 });
      g.roundRect(160, 625, 240, 30, 7).fill(0xedd67d).stroke({ color: 0x8b6330, width: 4 });
      for (let x = 176; x < 380; x += 24) g.rect(x, 626, 2, 26).fill(0x8b6330);
    } else if (zone.id === 'underbed') {
      g.roundRect(230, 86, 110, 155, 10).fill(0x6a625d).stroke({ color: 0x2a272a, width: 6 });
      g.circle(264, 170, 18).fill(0xbcc7c8);
      g.roundRect(268, 190, 104, 30, 6).fill(0x283036).stroke({ color: 0x121518, width: 3 });
      g.roundRect(46, 632, 124, 70, 16).fill(0x8e7b8b).stroke({ color: 0x514854, width: 5 });
    } else if (zone.id === 'hallway') {
      for (let y = 74; y < 760; y += 86) {
        g.rect(0, y, WIDTH, 3).fill(0x5c321c);
      }
      g.roundRect(224, 122, 142, 28, 14).fill(0xf2c84d).stroke({ color: 0xa46a28, width: 4 });
      g.circle(238, 136, 10).fill(0xffea88);
      g.roundRect(32, 628, 132, 42, 7).fill(0x4d9bd9).stroke({ color: 0x245276, width: 4 });
    } else {
      for (let x = 0; x < WIDTH; x += 92) g.rect(x, 0, 3, HEIGHT).fill(0x769098);
      for (let y = 34; y < HEIGHT; y += 92) g.rect(0, y, WIDTH, 3).fill(0x769098);
      g.roundRect(244, 106, 108, 136, 10).fill(0xd64236).stroke({ color: 0x86231f, width: 5 });
      g.rect(258, 130, 80, 76).fill(0xfff0bd);
      g.roundRect(34, 642, 110, 36, 6).fill(0xc6d33c).stroke({ color: 0x69741a, width: 4 });
    }
    g.alpha = 0.95;
    this.props.addChild(g);
  }

  private drawTiltShift() {
    const top = new Graphics();
    const topGradient = new FillGradient(0, 0, 0, 150);
    topGradient.addColorStop(0, '#11150f');
    topGradient.addColorStop(1, 'rgba(17,21,15,0)');
    top.rect(0, 0, WIDTH, 160).fill({ fill: topGradient, alpha: 0.42 });
    const bottom = new Graphics();
    const bottomGradient = new FillGradient(0, HEIGHT - 170, 0, HEIGHT);
    bottomGradient.addColorStop(0, 'rgba(17,21,15,0)');
    bottomGradient.addColorStop(1, '#11150f');
    bottom.rect(0, HEIGHT - 170, WIDTH, 170).fill({ fill: bottomGradient, alpha: 0.5 });
    const blurTop = new Graphics();
    for (let i = 0; i < 38; i += 1) {
      blurTop.ellipse(rand(0, WIDTH), rand(0, 142), rand(20, 56), rand(4, 10)).fill({ color: 0xffffff, alpha: 0.016 });
      blurTop.ellipse(rand(0, WIDTH), HEIGHT - rand(0, 158), rand(20, 60), rand(4, 12)).fill({ color: 0xffffff, alpha: 0.012 });
    }
    this.overlay.addChild(top, bottom, blurTop);
  }

  private drawStaticUi() {
    this.ui.removeChildren();
    this.buttons = [];
    this.ui.addChild(this.scrapText, this.medalText, this.waveText, this.zoneText, this.bandText);
    for (const floater of this.floaters) {
      if (floater.text.parent !== this.ui) this.ui.addChild(floater.text);
    }
  }

  private drawDynamicUi() {
    const g = new Graphics();
    this.ui.removeChildren();
    this.buttons = [];
    this.ui.addChild(g);
    this.drawTopHud(g);
    this.drawMolder(g);
    this.drawUpgradeDock(g);
    if (this.showOfflineCard) this.drawOfflineCard(g);
    if (this.showPrestigeCard) this.drawPrestigeCard(g);
    this.ui.addChild(this.scrapText, this.medalText, this.waveText, this.zoneText, this.bandText);
    for (const floater of this.floaters) if (floater.active) this.ui.addChild(floater.text);
  }

  private updateHudText() {
    const zone = ZONES[this.save.zoneIndex];
    this.scrapText.text = formatNumber(this.scrapDisplay);
    this.medalText.text = `* ${formatNumber(this.medalDisplay)}`;
    this.waveText.text = `WAVE ${Math.max(1, this.save.wave - 1)}`;
    this.zoneText.text = zone.title;
    this.zoneText.style.fill = zone.dark ? '#fff1a8' : '#17351e';
    this.bandText.text = this.bandCd <= 0 ? 'SNAP READY' : `${Math.ceil(this.bandCd)}s SNAP`;
  }

  private drawTopHud(g: Graphics) {
    g.roundRect(12, 18, 152, 54, 9).fill(0x4c3528).stroke({ color: 0x261911, width: 3 });
    g.roundRect(17, 13, 144, 46, 8).fill(0xf1c956).stroke({ color: 0x78491f, width: 3 });
    g.circle(39, 37, 13).fill(0xb8b0a4).stroke({ color: 0x756b62, width: 3 });
    g.rect(33, 30, 12, 14).fill(0xe2ded4);
    this.scrapText.text = formatNumber(this.scrapDisplay);
    this.scrapText.position.set(58, 22);
    this.scrapText.style.fill = '#352318';
    g.roundRect(170, 17, 112, 34, 8).fill(0x294b2b).stroke({ color: 0x17351e, width: 3 });
    this.waveText.text = `WAVE ${Math.max(1, this.save.wave - 1)}`;
    this.waveText.position.set(184, 25);
    this.zoneText.text = ZONES[this.save.zoneIndex].title;
    this.zoneText.style.fill = ZONES[this.save.zoneIndex].dark ? '#fff1a8' : '#17351e';
    this.zoneText.position.set(188, 56);
    g.roundRect(286, 18, 86, 34, 8).fill(0x7a2525).stroke({ color: 0x3d1111, width: 3 });
    this.medalText.text = `* ${formatNumber(this.medalDisplay)}`;
    this.medalText.position.set(302, 25);
    this.addButton('mute', new Rectangle(310, 58, 66, 34), this.save.muted ? 'MUTE' : 'SFX', '', true, g);
    g.roundRect(8, HEIGHT - 25, 84, 18, 5).fill({ color: 0x1f3323, alpha: 0.74 }).stroke({ color: 0xf1c956, width: 2, alpha: 0.5 });
    const badge = new Text({
      text: `BUILD ${this.buildSha}`,
      style: { fill: '#ffffff', fontSize: 10, fontWeight: '800', fontFamily: 'monospace' }
    });
    badge.alpha = 0.65;
    badge.position.set(14, HEIGHT - 22);
    this.ui.addChild(badge);
  }

  private drawMolder(g: Graphics) {
    const pulse = this.molderPulse > 0 ? easeOutElastic(clamp(this.molderPulse / 0.8, 0, 1)) : 0;
    const pressY = 242 + pulse * 9;
    g.roundRect(16, 128, 94, 208, 12).fill(0x2f6c3f).stroke({ color: 0x14311d, width: 5 });
    g.roundRect(28, 143, 70, 36, 8).fill(0xd34236).stroke({ color: 0x7d1f1a, width: 4 });
    g.roundRect(38, 154, 50, 16, 4).fill(0xffef9d);
    g.roundRect(32, 188, 46, 44, 8).fill(0x486c7a).stroke({ color: 0x263d46, width: 4 });
    g.roundRect(47, 120 + Math.sin(this.simTime * 2.2) * 3, 28, 84, 8).fill(0xb8c3be).stroke({ color: 0x576560, width: 4 });
    g.roundRect(24, pressY, 76, 42 - pulse * 5, 8).fill(0x9ca9a4).stroke({ color: 0x4a5753, width: 4 });
    g.roundRect(12, 302, 112, 26, 8).fill(0x1f4428).stroke({ color: 0x0e2215, width: 4 });
    g.roundRect(22, 82, 74, 48, 8).fill(0x5c3a27).stroke({ color: 0x2a1710, width: 4 });
    const shimmer = 0.55 + Math.sin(this.simTime * 5.4) * 0.2;
    g.circle(46, 102, 7).fill({ color: 0xd7d2c5, alpha: shimmer });
    g.circle(68, 111, 5).fill({ color: 0xd7d2c5, alpha: shimmer * 0.8 });
    g.roundRect(8, 333, 128, 34, 8).fill(0xf0d060).stroke({ color: 0x573616, width: 4 });
    const molderLabel = new Text({
      text: 'THE MOLDER',
      style: {
        fill: '#412813',
        fontSize: 15,
        fontWeight: '900',
        fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif'
      }
    });
    molderLabel.position.set(20, 341);
    this.ui.addChild(molderLabel);
  }

  private drawUpgradeDock(g: Graphics) {
    g.roundRect(13, 667, 364, 158, 13).fill(0x6b4027).stroke({ color: 0x2d190e, width: 5 });
    g.roundRect(22, 657, 346, 36, 8).fill(0xefcf65).stroke({ color: 0x6e431a, width: 4 });
    const title = new Text({
      text: 'SHOP PACK',
      style: { fill: '#382313', fontSize: 17, fontWeight: '900', fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' }
    });
    title.position.set(35, 665);
    this.ui.addChild(title);
    const snapReady = this.bandCd <= 0;
    const bandW = 122;
    const bandRect = new Rectangle(242, 662, bandW, 42);
    if (snapReady) {
      const pulse = 0.5 + Math.sin(this.simTime * 7) * 0.5;
      g.roundRect(bandRect.x - 6 - pulse * 4, bandRect.y - 5 - pulse * 3, bandRect.width + 12 + pulse * 8, bandRect.height + 10 + pulse * 6, 13).stroke({
        color: 0xfff1a8,
        width: 3,
        alpha: 0.22 + pulse * 0.3
      });
      g.circle(bandRect.x + bandRect.width - 10, bandRect.y - 7, 5 + pulse * 2).fill({ color: 0xfff1a8, alpha: 0.38 + pulse * 0.28 });
    }
    g.roundRect(bandRect.x + 4, bandRect.y + 5, bandRect.width, bandRect.height, 9).fill(0x361812);
    g.roundRect(bandRect.x, bandRect.y, bandRect.width, bandRect.height, 9).fill(snapReady ? 0xd64236 : 0x866963).stroke({ color: 0x401610, width: 3 });
    const pct = snapReady ? 1 : 1 - this.bandCd / 6;
    g.roundRect(bandRect.x + 5, bandRect.y + 31, (bandRect.width - 10) * pct, 6, 3).fill(0xfff1a8);
    this.bandText.text = snapReady ? 'SNAP READY' : `${Math.ceil(this.bandCd)}s SNAP`;
    this.bandText.position.set(258, 675);
    const positions = [
      new Rectangle(24, 703, 166, 48),
      new Rectangle(200, 703, 166, 48),
      new Rectangle(24, 762, 166, 48),
      new Rectangle(200, 762, 166, 48)
    ];
    UPGRADES.forEach((upgrade, index) => {
      const cost = this.upgradeCost(upgrade);
      const level = this.save.upgrades[upgrade.id];
      const enabled = this.save.scrap >= cost && level < upgrade.max;
      this.addButton(upgrade.id, positions[index], upgrade.title, `L${level}  ${formatNumber(cost)}`, enabled, g);
    });
    const preview = this.prestigePreview();
    if (this.save.wave > 9 || this.save.medals > 0) {
      this.addButton('prestige', new Rectangle(30, 615, 144, 40), 'BACK IN BOX', `+${preview} medals`, true, g);
    }
  }

  private drawOfflineCard(g: Graphics) {
    g.roundRect(31, 246, 328, 208, 16).fill(0x442915).stroke({ color: 0x1f1209, width: 6 });
    g.roundRect(43, 232, 304, 64, 11).fill(0xf6d069).stroke({ color: 0x6b421a, width: 4 });
    const title = new Text({
      text: 'WHILE YOU WERE GONE...',
      style: { fill: '#3e2714', fontSize: 19, fontWeight: '900', fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' }
    });
    title.position.set(58, 253);
    const body = new Text({
      text: `${formatNumber(this.offlineAward)} scrap molded from idle patrols`,
      style: { fill: '#fff4d2', fontSize: 18, fontWeight: '900', align: 'center', wordWrap: true, wordWrapWidth: 250, fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' }
    });
    body.anchor.set(0.5, 0);
    body.position.set(WIDTH / 2, 321);
    this.ui.addChild(title, body);
    this.addButton('claim', new Rectangle(94, 382, 202, 50), 'CLAIM SCRAP', 'tap to collect', true, g);
  }

  private drawPrestigeCard(g: Graphics) {
    const award = this.prestigePreview();
    const nextMult = 1 + (this.save.medals + award) * 0.08;
    g.roundRect(28, 214, 334, 252, 16).fill(0x334128).stroke({ color: 0x142012, width: 6 });
    g.roundRect(49, 196, 292, 70, 11).fill(0x75a84a).stroke({ color: 0x1d3d1b, width: 4 });
    const title = new Text({
      text: 'BACK IN THE BOX?',
      style: { fill: '#fff8d8', fontSize: 22, fontWeight: '900', fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' }
    });
    title.position.set(70, 220);
    const body = new Text({
      text: `Reset battlefield for ${award} Medals.\nPermanent multiplier becomes x${nextMult.toFixed(2)}.`,
      style: { fill: '#fff8d8', fontSize: 18, fontWeight: '900', align: 'center', wordWrap: true, wordWrapWidth: 270, fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif' }
    });
    body.anchor.set(0.5, 0);
    body.position.set(WIDTH / 2, 292);
    this.ui.addChild(title, body);
    this.addButton('prestige', new Rectangle(88, 386, 214, 52), 'CONFIRM', `keep ${this.save.medals} + ${award}`, award > 0, g);
  }

  private addButton(id: ButtonState['id'], rect: Rectangle, title: string, subtitle: string, enabled: boolean, g: Graphics) {
    const state: ButtonState = { id, rect, title, subtitle, enabled, pressed: this.buttons.find((button) => button.id === id)?.pressed ?? 0 };
    this.buttons.push(state);
    const down = state.pressed > 0 ? 3 : 0;
    g.roundRect(rect.x + 4, rect.y + 6, rect.width, rect.height, 9).fill(enabled ? 0x24140b : 0x4a2e1d);
    g.roundRect(rect.x, rect.y + down, rect.width, rect.height, 9).fill(enabled ? 0xe95a37 : 0xb68b58).stroke({ color: enabled ? 0x6e2417 : 0x6c4324, width: 4 });
    g.roundRect(rect.x + 6, rect.y + 7 + down, rect.width - 12, 10, 5).fill({ color: 0xffffff, alpha: enabled ? 0.24 : 0.18 });
    const label = new Text({
      text: title,
      style: {
        fill: enabled ? '#fff8d8' : '#fff2d3',
        fontSize: title.length > 13 ? 12 : 14,
        fontWeight: '900',
        fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif'
      }
    });
    label.position.set(rect.x + 12, rect.y + 8 + down);
    this.ui.addChild(label);
    if (subtitle) {
      const sub = new Text({
        text: subtitle,
        style: {
          fill: enabled ? '#ffe08a' : '#ffe1a8',
          fontSize: 11,
          fontWeight: '900',
          fontFamily: 'Arial Rounded MT Bold, Trebuchet MS, sans-serif'
        }
      });
      sub.position.set(rect.x + 12, rect.y + 28 + down);
      this.ui.addChild(sub);
    }
  }

  private makeGroundTexture(zone: ZoneDef) {
    const g = new Graphics();
    g.rect(0, 0, WIDTH, HEIGHT).fill(zone.ground);
    for (let i = 0; i < 900; i += 1) {
      const c = Math.random() > 0.5 ? zone.ground2 : zone.fiber;
      const alpha = zone.dark ? rand(0.05, 0.16) : rand(0.05, 0.22);
      const x = rand(0, WIDTH);
      const y = rand(0, HEIGHT);
      if (zone.id === 'hallway') {
        g.rect(x, y, rand(10, 44), 1).fill({ color: c, alpha });
      } else if (zone.id === 'kitchen') {
        g.circle(x, y, rand(0.4, 1.3)).fill({ color: c, alpha });
      } else {
        g.ellipse(x, y, rand(0.6, 2.4), rand(0.2, 1.0)).fill({ color: c, alpha });
      }
    }
    if (zone.dark) g.rect(0, 0, WIDTH, HEIGHT).fill({ color: 0x0e1116, alpha: 0.28 });
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, WIDTH, HEIGHT), resolution: 1 });
  }

  private makeSoldierTexture(color: number, team: Team) {
    const dark = shade(color, -0.38);
    const mid = color;
    const light = shade(color, 0.28);
    const spec = team === 'green' ? 0xe5ffda : 0xfff2d6;
    const g = new Graphics();
    g.ellipse(0, 47, 34, 10).fill(dark);
    g.ellipse(0, 42, 31, 9).fill(mid).stroke({ color: dark, width: 3 });
    g.rect(-4, -38, 8, 18).fill(dark);
    g.roundRect(-18, -25, 36, 48, 10).fill(mid).stroke({ color: dark, width: 3 });
    g.roundRect(-13, -31, 26, 20, 8).fill(light).stroke({ color: dark, width: 3 });
    g.ellipse(0, -32, 19, 10).fill(light).stroke({ color: dark, width: 3 });
    g.rect(-19, -31, 38, 5).fill(dark);
    g.circle(6, -35, 4).fill(spec);
    g.roundRect(-27, -12, 17, 10, 5).fill(mid).stroke({ color: dark, width: 2 });
    g.roundRect(11, -11, 35, 8, 4).fill(dark);
    g.roundRect(23, -14, 36, 6, 3).fill(mid).stroke({ color: dark, width: 2 });
    g.circle(-18, -10, 4).fill(spec);
    g.roundRect(-14, 18, 11, 30, 5).fill(mid).stroke({ color: dark, width: 2 });
    g.roundRect(5, 17, 12, 31, 5).fill(mid).stroke({ color: dark, width: 2 });
    g.rect(-3, -22, 3, 58).fill({ color: spec, alpha: 0.22 });
    g.moveTo(-18, -5).lineTo(16, 18).stroke({ color: dark, width: 2, alpha: 0.55 });
    g.circle(12, -19, 4).fill(spec);
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(-64, -58, 128, 124), resolution: 2 });
  }

  private makeBossTexture(color: number, kind: 'robot' | 'tank') {
    const dark = shade(color, -0.42);
    const light = shade(color, 0.3);
    const spec = 0xf5fff4;
    const g = new Graphics();
    g.ellipse(0, 47, 46, 12).fill(dark);
    if (kind === 'robot') {
      g.roundRect(-28, -40, 56, 66, 8).fill(color).stroke({ color: dark, width: 4 });
      g.roundRect(-20, -68, 40, 34, 7).fill(light).stroke({ color: dark, width: 4 });
      g.circle(-9, -52, 4).fill(0xfff08a);
      g.circle(10, -52, 4).fill(0xfff08a);
      g.rect(-17, -42, 34, 6).fill(dark);
      g.roundRect(-47, -30, 18, 46, 5).fill(color).stroke({ color: dark, width: 3 });
      g.roundRect(29, -30, 18, 46, 5).fill(color).stroke({ color: dark, width: 3 });
      g.roundRect(-20, 24, 15, 38, 5).fill(color).stroke({ color: dark, width: 3 });
      g.roundRect(6, 24, 15, 38, 5).fill(color).stroke({ color: dark, width: 3 });
      g.circle(18, -66, 5).fill(spec);
      g.moveTo(29, -50).lineTo(52, -66).lineTo(57, -42).stroke({ color: 0xe7e0ad, width: 5 });
    } else {
      g.roundRect(-48, -22, 94, 42, 8).fill(color).stroke({ color: dark, width: 4 });
      g.roundRect(-24, -48, 42, 28, 7).fill(light).stroke({ color: dark, width: 4 });
      g.roundRect(9, -42, 66, 9, 4).fill(dark);
      g.circle(-31, 24, 10).fill(dark);
      g.circle(31, 24, 10).fill(dark);
      g.circle(-10, -38, 5).fill(spec);
      g.rect(-40, 0, 76, 5).fill({ color: spec, alpha: 0.24 });
    }
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(-82, -82, 164, 162), resolution: 2 });
  }

  private makeEllipseTexture(color: number, alpha: number, width: number, height: number) {
    const g = new Graphics();
    g.ellipse(width / 2, height / 2, width / 2, height / 2).fill({ color, alpha });
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, width, height), resolution: 1 });
  }

  private makePipTexture() {
    const g = new Graphics();
    g.circle(9, 9, 8).fill(0xb9b3a8).stroke({ color: 0x6c655d, width: 2 });
    g.rect(6, 4, 6, 10).fill(0xe7e1d7);
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, 18, 18), resolution: 2 });
  }

  private makeShardTexture(color: number) {
    const g = new Graphics();
    g.poly([1, 0, 15, 4, 11, 18, 0, 12]).fill(shade(color, 0.14)).stroke({ color: shade(color, -0.32), width: 1 });
    g.circle(6, 5, 2).fill({ color: 0xffffff, alpha: 0.55 });
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, 18, 20), resolution: 2 });
  }

  private makeTracerTexture() {
    const g = new Graphics();
    g.roundRect(0, 0, 34, 4, 2).fill(0xfff1a8);
    g.roundRect(2, 1, 18, 2, 1).fill(0xffffff);
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, 34, 4), resolution: 2 });
  }

  private makeRingTexture() {
    const g = new Graphics();
    g.circle(64, 64, 52).stroke({ color: 0xfff8d8, width: 7, alpha: 0.85 });
    g.circle(64, 64, 36).stroke({ color: 0xd64236, width: 4, alpha: 0.65 });
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, 128, 128), resolution: 1 });
  }

  private makeHealthTexture(fill: boolean) {
    const g = new Graphics();
    if (fill) g.roundRect(0, 0, 46, 4, 2).fill(0xffffff);
    else g.roundRect(0, 0, 48, 6, 3).fill({ color: 0x201713, alpha: 0.55 });
    return this.app.renderer.generateTexture({ target: g, frame: new Rectangle(0, 0, fill ? 46 : 48, fill ? 4 : 6), resolution: 1 });
  }
}

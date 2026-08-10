import { Application, Container, Sprite, Texture } from 'pixi.js';
import { LAYOUT } from '../sim/defs';
import type { Sim, SimEvent } from '../sim/sim';
import { bakeAtlas, type Atlas } from './atlas';
import { bakeGround } from './ground';
import { bakeTiltShift } from './tiltshift';
import { mulberry32 } from '../sim/rng';

interface Tracer {
  spr: Sprite;
  t: number;
  life: number;
}

interface RingFx {
  spr: Sprite;
  t: number;
}

interface Flash {
  spr: Sprite;
  t: number;
}

interface Shard {
  spr: Sprite;
  vx: number;
  vy: number;
  vr: number;
  t: number;
  life: number;
  floorY: number;
}

/**
 * Interpolated renderer over the fixed-step sim. All world drawing is sprite
 * blits from the baked atlas; the tilt-shift pass is two pre-blurred strips.
 * Owns camera shake + molder animation + per-unit cosmetic state (lean, hop).
 */
export class Renderer {
  app!: Application;
  atlas!: Atlas;
  world = new Container();
  groundLayer = new Container();
  shadowLayer = new Container();
  unitLayer = new Container();
  fxLayer = new Container();
  overlayLayer = new Container(); // tilt-shift strips, above the action

  private unitShadows: Sprite[] = [];
  private unitBodies: Sprite[] = [];
  private unitKeys: Sprite[] = [];
  private formationPlates: Sprite[] = [];
  private spawnT: Float32Array = new Float32Array(0); // per-unit hop anim
  private lean: Float32Array = new Float32Array(0); // per-unit static toy lean
  private hitT: Float32Array = new Float32Array(0); // per-unit flinch anim
  private pipSprites: Sprite[] = [];
  private tracers: Tracer[] = [];
  private rings: RingFx[] = [];
  private flashes: Flash[] = [];
  private shards: Shard[] = [];
  private marchTex: Texture[][] = [];
  private fireTex: Texture[] = [];
  private molderBase!: Sprite;
  private piston!: Sprite;
  private pellets!: Sprite;
  private studs: Sprite[] = [];
  private banners: Sprite[] = [];
  private commandLine!: Sprite;
  private molderGlow!: Sprite;
  private celebration!: Sprite; // additive flash over the molder on upgrade
  private stampAnim = 0;
  private groundSprite: Sprite | null = null;
  private tiltTop: Sprite | null = null;
  private tiltBottom: Sprite | null = null;
  private groundZone = -1;
  private idleT = 0;

  // screen shake (trauma model — random offsets, decay 1.5/s)
  trauma = 0;
  // directional camera kick (springs back critically damped)
  private kickX = 0;
  private kickY = 0;

  reducedMotion = false;

  async init(parent: HTMLElement, sim: Sim) {
    this.app = new Application();
    await this.app.init({
      background: 0x20180f,
      resizeTo: parent,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      antialias: false,
      preference: 'webgl',
    });
    parent.appendChild(this.app.canvas);
    const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotion = rmQuery.matches;
    rmQuery.addEventListener?.('change', (e) => {
      this.reducedMotion = e.matches;
    });

    this.atlas = bakeAtlas();
    this.marchTex = [
      [this.atlas.tex.green_march0, this.atlas.tex.green_march1],
      [this.atlas.tex.tan_march0, this.atlas.tex.tan_march1],
    ];
    this.fireTex = [this.atlas.tex.green_fire, this.atlas.tex.tan_fire];

    this.world.addChild(
      this.groundLayer,
      this.shadowLayer,
      this.unitLayer,
      this.fxLayer,
      this.overlayLayer
    );
    this.app.stage.addChild(this.world);
    this.unitLayer.sortableChildren = true;

    // unit sprite pools, parallel to sim.units
    this.spawnT = new Float32Array(sim.units.length).fill(9);
    this.lean = new Float32Array(sim.units.length);
    this.hitT = new Float32Array(sim.units.length);
    for (let i = 0; i < sim.units.length; i++) {
      const sh = new Sprite(this.atlas.tex.shadow);
      sh.anchor.set(0.5, 0.5);
      sh.visible = false;
      this.shadowLayer.addChild(sh);
      this.unitShadows.push(sh);

      const b = new Sprite(this.atlas.tex.green_march0);
      b.anchor.set(0.5, 0.9); // pivot at the base so tipping looks right
      b.visible = false;
      this.unitLayer.addChild(b);
      this.unitBodies.push(b);

      const key = new Sprite(this.atlas.tex.robot_key);
      key.anchor.set(0.5);
      key.visible = false;
      this.unitLayer.addChild(key);
      this.unitKeys.push(key);
    }

    for (let i = 0; i < sim.pips.length; i++) {
      const p = new Sprite(this.atlas.tex.pip);
      p.anchor.set(0.5);
      p.visible = false;
      this.fxLayer.addChild(p);
      this.pipSprites.push(p);
    }

    for (let i = 0; i < 8; i++) {
      const plate = new Sprite(this.atlas.tex.formation_plate);
      plate.anchor.set(0.5);
      plate.alpha = 0.54;
      plate.visible = false;
      this.shadowLayer.addChild(plate);
      this.formationPlates.push(plate);
    }

    for (let i = 0; i < 48; i++) {
      const t = new Sprite(this.atlas.tex.tracer);
      t.anchor.set(0, 0.5);
      t.visible = false;
      this.fxLayer.addChild(t);
      this.tracers.push({ spr: t, t: 0, life: 0.16 });
    }
    for (let i = 0; i < 24; i++) {
      const m = new Sprite(this.atlas.tex.muzzle);
      m.anchor.set(0.5);
      m.visible = false;
      this.fxLayer.addChild(m);
      this.flashes.push({ spr: m, t: 0 });
    }
    for (let i = 0; i < 6; i++) {
      const r = new Sprite(this.atlas.tex.ring);
      r.anchor.set(0.5);
      r.visible = false;
      this.fxLayer.addChild(r);
      this.rings.push({ spr: r, t: 1 });
    }
    for (let i = 0; i < 110; i++) {
      const s = new Sprite(this.atlas.tex.shard);
      s.anchor.set(0.5);
      s.visible = false;
      this.fxLayer.addChild(s);
      this.shards.push({ spr: s, vx: 0, vy: 0, vr: 0, t: 0, life: 1, floorY: 0 });
    }

    // molder — hero of the left side
    this.molderBase = new Sprite(this.atlas.tex.molder);
    this.molderBase.anchor.set(0.5, 1);
    this.piston = new Sprite(this.atlas.tex.piston);
    this.piston.anchor.set(0.5, 0);
    this.pellets = new Sprite(this.atlas.tex.pellets);
    this.pellets.anchor.set(0.5, 0.5);
    this.celebration = new Sprite(this.atlas.tex.spark);
    this.celebration.anchor.set(0.5);
    this.celebration.blendMode = 'add';
    this.celebration.visible = false;
    this.molderGlow = new Sprite(this.atlas.tex.spark);
    this.molderGlow.anchor.set(0.5);
    this.molderGlow.blendMode = 'add';
    this.molderGlow.alpha = 0.2;
    this.commandLine = new Sprite(this.atlas.tex.chalk_line);
    this.commandLine.anchor.set(0.5);
    this.commandLine.alpha = 0.58;
    this.unitLayer.addChild(this.molderGlow, this.molderBase, this.piston, this.pellets, this.celebration);
    this.shadowLayer.addChild(this.commandLine);
    // gold studs on the plinth mark purchased upgrade levels
    for (let i = 0; i < 8; i++) {
      const s = new Sprite(this.atlas.tex.stud);
      s.anchor.set(0.5);
      s.visible = false;
      this.unitLayer.addChild(s);
      this.studs.push(s);
    }
    for (let i = 0; i < 8; i++) {
      const b = new Sprite(this.atlas.tex.banner);
      b.anchor.set(0.2, 1);
      b.scale.set(0.72);
      b.visible = false;
      this.unitLayer.addChild(b);
      this.banners.push(b);
    }

    this.layout(sim);
    this.refreshStuds(sim);
  }

  get w() {
    return this.app.renderer.screen.width;
  }
  get h() {
    return this.app.renderer.screen.height;
  }

  private get molderTop() {
    return this.h * LAYOUT.molderY - 180;
  }

  private bakedW = 0;
  private bakedH = 0;

  layout(sim: Sim) {
    sim.resize(this.w, this.h);
    // rebake when the room OR the viewport changed (iOS toolbar collapse and
    // rotation resize the canvas; a stale bake mis-sizes ground + blur bands)
    if (this.groundZone !== sim.state.zone || this.bakedW !== this.w || this.bakedH !== this.h) {
      this.rebakeGround(sim.state.zone);
    }
    const my = this.h * LAYOUT.molderY;
    const heroScale = 1.16;
    this.molderBase.position.set(LAYOUT.molderX, my);
    this.molderBase.scale.set(heroScale);
    // Directive 2 hero read: the Molder stays in front of the supply column,
    // so it reads as the machine stamping the army instead of background art.
    this.molderBase.zIndex = my + 82;
    this.piston.position.set(LAYOUT.molderX + 14, this.molderTop + 30);
    this.piston.scale.set(heroScale);
    this.piston.zIndex = my + 83;
    this.pellets.position.set(LAYOUT.molderX + 10, this.molderTop + 4);
    this.pellets.scale.set(heroScale);
    this.pellets.zIndex = my + 84;
    this.molderGlow.position.set(LAYOUT.molderX, my - 88);
    this.molderGlow.scale.set(32);
    this.molderGlow.zIndex = my + 78;
    this.celebration.position.set(LAYOUT.molderX, my - 90);
    this.celebration.zIndex = my + 85;
    for (let i = 0; i < this.studs.length; i++) {
      this.studs[i].position.set(LAYOUT.molderX - 52 + i * 14.5, my - 22);
      this.studs[i].zIndex = my + 86;
    }
    this.commandLine.position.set(sim.commandLineX, this.h * (LAYOUT.bandTop + LAYOUT.bandBot) * 0.5);
    this.commandLine.height = this.h * (LAYOUT.bandBot - LAYOUT.bandTop) + 28;
    this.commandLine.width = 18;
  }

  refreshStuds(sim: Sim) {
    const total =
      sim.state.upgrades.faster +
      sim.state.upgrades.bigger +
      sim.state.upgrades.rifles +
      sim.state.upgrades.scouts;
    for (let i = 0; i < this.studs.length; i++) this.studs[i].visible = i < total;
  }

  rebakeGround(zone: number) {
    this.groundZone = zone;
    this.bakedW = this.w;
    this.bakedH = this.h;
    // textureSource: true is required — without it Pixi keeps the GL texture
    // AND the full-screen backing canvas alive forever (~18MB per rebake)
    if (this.groundSprite) {
      this.groundSprite.destroy({ texture: true, textureSource: true });
      this.groundSprite = null;
    }
    if (this.tiltTop) {
      this.tiltTop.destroy({ texture: true, textureSource: true });
      this.tiltBottom?.destroy({ texture: true, textureSource: true });
      this.tiltTop = this.tiltBottom = null;
    }
    const bake = bakeGround(this.w, this.h, zone, mulberry32(1234 + zone));
    this.groundSprite = new Sprite(bake.texture);
    // explicit sizing: Texture.from(canvas) fixes its frame at creation, so a
    // later source.resolution change does not shrink it — set logical size here
    this.groundSprite.width = this.w;
    this.groundSprite.height = this.h;
    this.groundLayer.addChild(this.groundSprite);

    const ts = bakeTiltShift(bake.canvas, this.h, bake.scale);
    this.tiltTop = ts.top;
    this.tiltBottom = ts.bottom;
    this.tiltTop.width = this.w;
    this.tiltTop.height = Math.round(this.h * 0.39);
    this.tiltBottom.width = this.w;
    this.tiltBottom.height = this.h - Math.round(this.h * 0.71);
    this.overlayLayer.addChild(ts.top, ts.bottom);
  }

  handleEvent(e: SimEvent, sim: Sim) {
    switch (e.type) {
      case 'stamp': {
        this.stampAnim = 1;
        this.addTrauma(0.3);
        // impact flash on the platform as the ram lands
        for (const f of this.flashes) {
          if (f.spr.visible) continue;
          f.spr.visible = true;
          f.spr.position.set(LAYOUT.molderX + 20, this.h * LAYOUT.molderY - 52);
          f.spr.rotation = Math.random() * Math.PI;
          f.spr.scale.set(2.6);
          f.spr.alpha = 1;
          f.t = 0;
          break;
        }
        break;
      }
      case 'spawn':
        this.spawnT[e.i] = 0;
        this.lean[e.i] = (sim.units[e.i].phase / Math.PI - 1) * 0.06; // ±3.5° toy lean
        break;
      case 'fire': {
        const u = sim.units[e.i];
        const dx = e.tx - u.x;
        const dy = e.ty - u.y;
        const len = Math.hypot(dx, dy) || 1;
        const mx = u.x + (dx / len) * 17;
        const my = u.y - 24 + (dy / len) * 8;
        this.spawnTracer(mx, my, e.tx, e.ty - 22);
        this.spawnFlash(mx, my);
        break;
      }
      case 'band': {
        this.spawnRing(e.x, e.y);
        this.addTrauma(0.42);
        // directional kick away from the snap point, springs back
        if (!this.reducedMotion) {
          const cx = this.w / 2;
          const cy = this.h / 2;
          const dx = cx - e.x;
          const dy = cy - e.y;
          const len = Math.hypot(dx, dy) || 1;
          this.kickX = (dx / len) * 5;
          this.kickY = (dy / len) * 5;
        }
        break;
      }
      case 'waveStart': {
        // horizon dust: tan puffs kicked up as the wave crests into view
        for (let i = 0; i < 7; i++) {
          for (const f of this.flashes) {
            if (f.spr.visible) continue;
            f.spr.visible = true;
            f.spr.tint = 0xc9a06a;
            f.spr.position.set(
              this.w - 8 - Math.random() * 30,
              this.h * (LAYOUT.bandTop + Math.random() * (LAYOUT.bandBot - LAYOUT.bandTop))
            );
            f.spr.rotation = Math.random() * Math.PI;
            f.spr.scale.set(1.6 + Math.random() * 1.8);
            f.spr.alpha = 0.55;
            f.t = -0.65 - Math.random() * 0.3; // negative t = slow dust fade mode
            break;
          }
        }
        break;
      }
      case 'kill': {
        const tint =
          e.kind === 'robot'
            ? 0x9aa1ac
            : e.kind === 'dino'
              ? 0xc97c42
              : e.faction === 0
                ? 0x82955c
                : 0xecd7a8;
        const small = e.kind === 'rifleman' || e.kind === 'bazooka' || e.kind === 'gunner';
        const count = small ? 7 + ((Math.random() * 5) | 0) : 26;
        this.spawnShards(e.x, e.y - 16, count, tint, small ? 1 : 1.6);
        if (!small) {
          this.addTrauma(0.5);
          // reduced-motion users get a flash in place of hit-stop + shake
          if (this.reducedMotion) this.spawnFlash(e.x, e.y - 20, 4.5);
        }
        break;
      }
      case 'hit': {
        // victim flinch: brief squash so every landed shot reads on the target
        const u = sim.units[e.i];
        if (u.active && u.state !== 'dying') this.hitT[e.i] = 0.001;
        break;
      }
      case 'buy': {
        // the machine celebrates: flash + gold/green confetti + a new stud
        this.celebration.visible = true;
        this.celebration.alpha = 0.95;
        this.celebration.scale.set(9);
        this.spawnShards(LAYOUT.molderX + 6, this.h * LAYOUT.molderY - 110, 9, 0xd9a62e, 1.2);
        this.spawnShards(LAYOUT.molderX + 6, this.h * LAYOUT.molderY - 100, 8, 0x82955c, 1.1);
        this.refreshStuds(sim);
        this.addTrauma(0.2);
        break;
      }
      case 'commandLine':
        this.commandLine.x = e.x;
        this.spawnRing(e.x, this.h * 0.55);
        break;
      case 'checkpoint':
        this.spawnShards(this.w * 0.76, this.h * 0.48, 30, 0xd9a62e, 1.7);
        this.addTrauma(0.38);
        break;
      case 'platoon':
        this.spawnShards(e.x, e.y, 14, 0xd9a62e, 1.1);
        break;
      case 'hazard':
        if (e.kind === 'cat') {
          this.spawnShards(e.x, e.y, 38, 0xc9a06a, 1.9);
          this.addTrauma(0.62);
        } else if (e.kind === 'marble') {
          this.spawnShards(this.w - 18, e.y, 22, 0x9aa1ac, 1.5);
          this.addTrauma(0.28);
        } else if (e.kind === 'paper') {
          this.spawnFlash(e.x, e.y);
        }
        break;
      default:
        break;
    }
  }

  private spawnShards(x: number, y: number, count: number, tint: number, sizeMul: number) {
    let spawned = 0;
    for (const s of this.shards) {
      if (s.spr.visible) continue;
      s.spr.visible = true;
      s.spr.position.set(x, y);
      s.spr.tint = tint;
      s.spr.rotation = Math.random() * Math.PI * 2;
      s.spr.alpha = 1;
      s.spr.scale.set((0.7 + Math.random() * 0.7) * sizeMul);
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 150;
      s.vx = Math.cos(a) * sp;
      s.vy = Math.sin(a) * sp * 0.6 - 110 - Math.random() * 80;
      s.vr = (Math.random() - 0.5) * 18;
      s.t = 0;
      s.life = 0.55 + Math.random() * 0.35;
      s.floorY = y + 14 + Math.random() * 18;
      if (++spawned >= count) return;
    }
  }

  addTrauma(v: number) {
    if (this.reducedMotion) return;
    // overlapping shakes take the strongest, never the sum (§4.4)
    this.trauma = Math.min(1, Math.max(this.trauma, v));
  }

  private spawnTracer(x1: number, y1: number, x2: number, y2: number) {
    for (const t of this.tracers) {
      if (t.spr.visible) continue;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      t.spr.visible = true;
      t.spr.position.set(x1, y1);
      t.spr.rotation = Math.atan2(dy, dx);
      t.spr.width = Math.min(len, 60);
      t.spr.alpha = 0.9;
      t.t = 0;
      return;
    }
  }

  private spawnFlash(x: number, y: number, scale = 0) {
    for (const f of this.flashes) {
      if (f.spr.visible) continue;
      f.spr.visible = true;
      f.spr.position.set(x, y);
      f.spr.rotation = Math.random() * Math.PI * 2;
      f.spr.scale.set(scale > 0 ? scale : 0.8 + Math.random() * 0.5);
      f.spr.alpha = 1;
      f.t = 0;
      return;
    }
  }

  private spawnRing(x: number, y: number) {
    for (const r of this.rings) {
      if (r.spr.visible) continue;
      r.spr.visible = true;
      r.spr.position.set(x, y);
      r.spr.alpha = 0.9;
      r.spr.scale.set(0.3);
      r.t = 0;
      return;
    }
  }

  /** Anticipation cue for the rubber band: a ring contracts onto the tap point. */
  anticipateBand(x: number, y: number) {
    for (const r of this.rings) {
      if (r.spr.visible) continue;
      r.spr.visible = true;
      r.spr.position.set(x, y);
      r.spr.alpha = 0.55;
      r.spr.scale.set(1.15);
      r.t = -0.09; // negative t = contract phase, matches the 80ms snap delay
      return;
    }
  }

  /** dt = real frame seconds (unaffected by hit-stop); alpha = sim interpolation. */
  render(sim: Sim, alpha: number, dt: number) {
    this.idleT += dt;

    // trauma shake: random offsets each frame, shake = trauma², decay 1.5/s
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
    const mag = this.trauma * this.trauma * 14;
    // directional kick springs back critically damped (~150ms)
    this.kickX -= this.kickX * Math.min(1, dt * 13);
    this.kickY -= this.kickY * Math.min(1, dt * 13);
    this.world.position.set(
      (Math.random() * 2 - 1) * mag + this.kickX,
      (Math.random() * 2 - 1) * mag * 0.7 + this.kickY
    );

    // ---- molder: slam anim + idle breathing (nothing is ever fully static)
    if (this.stampAnim > 0) this.stampAnim = Math.max(0, this.stampAnim - dt * 4.2);
    const a = this.stampAnim;
    // slam: instant down at trigger, spring back with overshoot
    let slam: number;
    if (a > 0.82) slam = (1 - a) / 0.18;
    else {
      const k = a / 0.82;
      slam = k * k * (1 + Math.sin(k * 9) * 0.12 * k);
    }
    const breathe = Math.sin(this.idleT * 1.9) * 2.2;
    this.piston.y = this.molderTop + 30 + slam * 34 + (1 - slam) * breathe;
    // body squash on impact
    const squash = a > 0.7 ? (a - 0.7) / 0.3 : 0;
    const heroScale = 1.16;
    this.molderBase.scale.set(heroScale * (1 + squash * 0.05), heroScale * (1 - squash * 0.06));
    this.molderGlow.alpha = 0.16 + Math.sin(this.idleT * 1.4) * 0.035;
    // pellet shimmer
    this.pellets.alpha = 0.5 + Math.sin(this.idleT * 2.7) * 0.3;
    this.pellets.y = this.molderTop + 4 + Math.sin(this.idleT * 1.9 + 1) * 1.2;

    const t = sim.time + alpha * (1 / 60);

    for (let i = 0; i < sim.units.length; i++) {
      const u = sim.units[i];
      const body = this.unitBodies[i];
      const sh = this.unitShadows[i];
      const key = this.unitKeys[i];
      if (!u.active) {
        if (body.visible) {
          body.visible = false;
          sh.visible = false;
          key.visible = false;
        }
        continue;
      }
      body.visible = true;
      sh.visible = true;
      key.visible = u.kind === 'robot';

      const x = u.px + (u.x - u.px) * alpha;
      const y = u.py + (u.y - u.py) * alpha;

      // texture selection (pre-resolved arrays — no per-frame string keys)
      let tex: Texture;
      if (u.kind === 'robot') tex = this.atlas.tex.robot;
      else if (u.kind === 'dino') tex = this.atlas.tex.dino;
      else if (u.kind === 'rcCar') tex = this.atlas.tex.rc_car;
      else if (u.kind === 'paperPlane') tex = this.atlas.tex.paper_plane;
      else if (u.faction === 0 && u.kind === 'bazooka') tex = this.atlas.tex.green_bazooka;
      else if (u.faction === 0 && u.kind === 'gunner') tex = this.atlas.tex.green_gunner;
      else if (u.state === 'fight') tex = this.fireTex[u.faction];
      else {
        tex = this.marchTex[u.faction][0];
      }
      if (body.texture !== tex) body.texture = tex;
      // zone skin: under the bed, the invaders are dusty gray-blue
      const wantTint = this.groundZone === 1 && u.faction === 1 ? 0xc9cede : 0xffffff;
      if (body.tint !== wantTint) body.tint = wantTint;

      let rot = this.lean[i];
      let bob = 0;
      let alphaV = 1;
      let sx = 1;
      let sy = 1;
      let ox = 0;

      // spawn hop: pop out of the mold with a landing squash
      if (this.spawnT[i] < 0.42) {
        this.spawnT[i] += dt;
        const k = Math.min(1, this.spawnT[i] / 0.42);
        bob -= Math.sin(k * Math.PI) * 10;
        if (k > 0.8) {
          const s = (k - 0.8) / 0.2;
          sx = 1 + Math.sin(s * Math.PI) * 0.18;
          sy = 1 - Math.sin(s * Math.PI) * 0.14;
        }
      }

      // victim flinch: 80ms squash when a shot lands
      if (this.hitT[i] > 0) {
        this.hitT[i] += dt;
        if (this.hitT[i] >= 0.08) this.hitT[i] = 0;
        else {
          const s = Math.sin((this.hitT[i] / 0.08) * Math.PI);
          sx *= 1 + s * 0.12;
          sy *= 1 - s * 0.1;
        }
      }

      if (u.state === 'dying') {
        const k = Math.min(1, u.deathT / 0.36);
        const e = 1 - (1 - k) * (1 - k); // ease-out tip
        rot = u.tipDir * e * (Math.PI / 2) * 0.94;
        if (u.deathT > 0.34 && u.deathT < 0.72) {
          rot += Math.sin((u.deathT - 0.34) * 24 + u.phase) * 0.12 * (1 - (u.deathT - 0.34) / 0.38);
        }
        if (u.deathT > 0.66) alphaV = Math.max(0, 1 - (u.deathT - 0.66) / 0.28);
      } else if (u.state === 'march') {
        if (u.moveMode === 'hop') {
          const ph = (t * 2.8 + u.phase) % 1;
          const lift = Math.sin(ph * Math.PI);
          bob -= lift * 7.5;
          rot += (ph < 0.5 ? -1 : 1) * 0.09 * lift;
          sx += lift > 0.85 ? 0.08 : 0;
          sy -= lift > 0.85 ? 0.06 : 0;
        } else if (u.moveMode === 'shuffle') {
          const step = Math.sin(t * 14 + u.phase);
          rot += step * 0.025;
          bob += Math.abs(step) * -0.9;
        } else if (u.moveMode === 'fly') {
          rot += Math.sin(t * 5 + u.phase) * 0.12;
          bob += Math.sin(t * 6 + u.phase) * 5;
        } else {
          // Base-pivot waddle: the whole molded toy rocks from oval-base edge
          // to oval-base edge. The figure/legs never cycle independently.
          const ph = (t * 3.1 + u.phase) % 1;
          const edge = ph < 0.5 ? -1 : 1;
          const rock = Math.sin(ph * Math.PI);
          rot += edge * 0.105 * rock;
          bob -= rock * 1.1;
          ox += edge * rock * 1.8;
        }
      } else {
        // firing: rigid, but breathe slightly
        sy *= 1 + Math.sin(this.idleT * 6.3 + u.phase) * 0.012;
      }

      const big = u.kind === 'robot' || u.kind === 'dino' || u.kind === 'rcCar' ? 1.55 : 1;
      body.position.set(x + ox, y + bob);
      body.rotation = rot;
      body.alpha = alphaV;
      body.scale.set(sx, sy);
      body.zIndex = y | 0; // integer z: static lines skip the per-frame re-sort
      sh.position.set(x, y - 1);
      sh.alpha = alphaV * 0.9;
      sh.scale.set(big + (bob < 0 ? bob * 0.012 : 0), big + (bob < 0 ? bob * 0.012 : 0));
      if (key.visible) {
        key.position.set(x + 31, y - 46 + Math.sin(t * 14 + u.phase) * 1.5);
        key.rotation = t * Math.max(4, u.speed * 0.22);
        key.alpha = alphaV;
        key.zIndex = y + 0.2;
      }
    }

    const platoonSeen = new Set<number>();
    const bounds = new Map<number, { minX: number; maxX: number; minY: number; maxY: number }>();
    for (let i = 0; i < sim.units.length; i++) {
      const u = sim.units[i];
      if (!u.active || u.faction !== 0 || u.state === 'dying') continue;
      platoonSeen.add(u.platoon);
      const b =
        bounds.get(u.platoon) ??
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
      b.minX = Math.min(b.minX, u.homeX);
      b.maxX = Math.max(b.maxX, u.homeX);
      b.minY = Math.min(b.minY, u.homeY);
      b.maxY = Math.max(b.maxY, u.homeY);
      bounds.set(u.platoon, b);
    }
    for (const [platoon, b] of bounds) {
      const plate = this.formationPlates[platoon - 1];
      if (plate) {
        plate.visible = true;
        plate.position.set((b.minX + b.maxX) * 0.5, (b.minY + b.maxY) * 0.5 + 4);
        plate.width = Math.max(84, b.maxX - b.minX + 76);
        plate.height = Math.max(130, b.maxY - b.minY + 58);
      }
      const banner = this.banners[platoon - 1];
      if (!banner) continue;
      banner.visible = true;
      banner.scale.set(0.72);
      banner.position.set(b.minX - 18, Math.max(this.h * LAYOUT.bandTop + 10, b.minY - 18));
      banner.zIndex = banner.y;
    }
    for (let i = 0; i < this.banners.length; i++) {
      if (!platoonSeen.has(i + 1)) this.banners[i].visible = false;
      if (!platoonSeen.has(i + 1)) this.formationPlates[i].visible = false;
    }

    // pips
    for (let i = 0; i < sim.pips.length; i++) {
      const p = sim.pips[i];
      const spr = this.pipSprites[i];
      if (!p.active) {
        if (spr.visible) spr.visible = false;
        continue;
      }
      spr.visible = true;
      spr.position.set(p.px + (p.x - p.px) * alpha, p.py + (p.y - p.py) * alpha);
      spr.rotation = p.t * 6;
    }

    // tracers
    for (const tr of this.tracers) {
      if (!tr.spr.visible) continue;
      tr.t += dt;
      tr.spr.alpha = Math.max(0, 0.9 * (1 - tr.t / tr.life));
      if (tr.t >= tr.life) tr.spr.visible = false;
    }

    // muzzle flashes (1–2 frame life) — negative t marks slow dust puffs
    for (const f of this.flashes) {
      if (!f.spr.visible) continue;
      if (f.t < 0) {
        f.t += dt;
        f.spr.x -= dt * 26;
        f.spr.y -= dt * 8;
        f.spr.alpha = Math.min(0.55, -f.t * 1.4);
        if (f.t >= 0) {
          f.spr.visible = false;
          f.spr.tint = 0xffffff;
        }
        continue;
      }
      f.t += dt;
      f.spr.alpha = Math.max(0, 1 - f.t / 0.08);
      if (f.t >= 0.08) f.spr.visible = false;
    }

    // rings: negative t = anticipation contraction, positive = shockwave
    for (const r of this.rings) {
      if (!r.spr.visible) continue;
      if (r.t < 0) {
        r.t += dt;
        const k = 1 + r.t / 0.09; // 0 → 1 over the contract phase
        r.spr.scale.set(1.15 - k * 0.85);
        r.spr.alpha = 0.55 + k * 0.3;
        if (r.t >= 0) r.spr.visible = false;
        continue;
      }
      r.t += dt * 3.2;
      r.spr.scale.set(0.3 + r.t * 1.6);
      r.spr.alpha = Math.max(0, 0.9 * (1 - r.t));
      if (r.t >= 1) r.spr.visible = false;
    }

    // plastic shards: gravity, spin, bounce once on the floor, fade
    for (const s of this.shards) {
      if (!s.spr.visible) continue;
      s.t += dt;
      s.vy += 620 * dt;
      s.spr.x += s.vx * dt;
      s.spr.y += s.vy * dt;
      s.spr.rotation += s.vr * dt;
      if (s.spr.y > s.floorY && s.vy > 0) {
        s.spr.y = s.floorY;
        s.vy *= -0.35;
        s.vx *= 0.6;
        s.vr *= 0.5;
      }
      const k = s.t / s.life;
      if (k > 0.65) s.spr.alpha = Math.max(0, 1 - (k - 0.65) / 0.35);
      if (k >= 1) s.spr.visible = false;
    }

    // upgrade celebration flash decays fast
    if (this.celebration.visible) {
      this.celebration.alpha -= dt * 3.4;
      this.celebration.scale.set(this.celebration.scale.x + dt * 26);
      if (this.celebration.alpha <= 0) this.celebration.visible = false;
    }
  }
}

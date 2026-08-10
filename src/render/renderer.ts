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
  private spawnT: Float32Array = new Float32Array(0); // per-unit hop anim
  private lean: Float32Array = new Float32Array(0); // per-unit static toy lean
  private pipSprites: Sprite[] = [];
  private tracers: Tracer[] = [];
  private rings: RingFx[] = [];
  private flashes: Flash[] = [];
  private molderBase!: Sprite;
  private piston!: Sprite;
  private pellets!: Sprite;
  private stampAnim = 0;
  private groundSprite: Sprite | null = null;
  private tiltTop: Sprite | null = null;
  private tiltBottom: Sprite | null = null;
  private groundZone = -1;
  private idleT = 0;

  // screen shake (trauma model — random offsets, decay 1.5/s)
  trauma = 0;

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
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.atlas = bakeAtlas();

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
    }

    for (let i = 0; i < sim.pips.length; i++) {
      const p = new Sprite(this.atlas.tex.pip);
      p.anchor.set(0.5);
      p.visible = false;
      this.fxLayer.addChild(p);
      this.pipSprites.push(p);
    }

    for (let i = 0; i < 48; i++) {
      const t = new Sprite(this.atlas.tex.tracer);
      t.anchor.set(0, 0.5);
      t.visible = false;
      this.fxLayer.addChild(t);
      this.tracers.push({ spr: t, t: 0, life: 0.09 });
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

    // molder — hero of the left side
    this.molderBase = new Sprite(this.atlas.tex.molder);
    this.molderBase.anchor.set(0.5, 1);
    this.piston = new Sprite(this.atlas.tex.piston);
    this.piston.anchor.set(0.5, 0);
    this.pellets = new Sprite(this.atlas.tex.pellets);
    this.pellets.anchor.set(0.5, 0.5);
    this.unitLayer.addChild(this.molderBase, this.piston, this.pellets);

    this.layout(sim);
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

  layout(sim: Sim) {
    sim.resize(this.w, this.h);
    if (this.groundZone !== sim.state.zone) {
      this.rebakeGround(sim.state.zone);
    }
    const my = this.h * LAYOUT.molderY;
    this.molderBase.position.set(LAYOUT.molderX, my);
    this.molderBase.zIndex = my - 6;
    this.piston.position.set(LAYOUT.molderX + 14, this.molderTop + 30);
    this.piston.zIndex = my - 5;
    this.pellets.position.set(LAYOUT.molderX + 10, this.molderTop + 4);
    this.pellets.zIndex = my - 4;
  }

  rebakeGround(zone: number) {
    this.groundZone = zone;
    if (this.groundSprite) {
      this.groundSprite.destroy({ texture: true });
      this.groundSprite = null;
    }
    if (this.tiltTop) {
      this.tiltTop.destroy({ texture: true });
      this.tiltBottom?.destroy({ texture: true });
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
      case 'stamp':
        this.stampAnim = 1;
        this.addTrauma(0.16);
        break;
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
      case 'band':
        this.spawnRing(e.x, e.y);
        this.addTrauma(0.42);
        break;
      case 'kill':
        if (e.kind !== 'soldier') this.addTrauma(0.5);
        break;
      default:
        break;
    }
  }

  addTrauma(v: number) {
    if (this.reducedMotion) return;
    this.trauma = Math.min(1, this.trauma + v);
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

  private spawnFlash(x: number, y: number) {
    for (const f of this.flashes) {
      if (f.spr.visible) continue;
      f.spr.visible = true;
      f.spr.position.set(x, y);
      f.spr.rotation = Math.random() * Math.PI * 2;
      f.spr.scale.set(0.8 + Math.random() * 0.5);
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

  /** dt = real frame seconds (unaffected by hit-stop); alpha = sim interpolation. */
  render(sim: Sim, alpha: number, dt: number) {
    this.idleT += dt;

    // trauma shake: random offsets each frame, shake = trauma², decay 1.5/s
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
    const mag = this.trauma * this.trauma * 14;
    this.world.position.set((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag * 0.7);

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
    this.molderBase.scale.set(1 + squash * 0.05, 1 - squash * 0.06);
    // pellet shimmer
    this.pellets.alpha = 0.5 + Math.sin(this.idleT * 2.7) * 0.3;
    this.pellets.y = this.molderTop + 4 + Math.sin(this.idleT * 1.9 + 1) * 1.2;

    const t = sim.time + alpha * (1 / 60);

    for (let i = 0; i < sim.units.length; i++) {
      const u = sim.units[i];
      const body = this.unitBodies[i];
      const sh = this.unitShadows[i];
      if (!u.active) {
        if (body.visible) {
          body.visible = false;
          sh.visible = false;
        }
        continue;
      }
      body.visible = true;
      sh.visible = true;

      const x = u.px + (u.x - u.px) * alpha;
      const y = u.py + (u.y - u.py) * alpha;

      // texture selection
      let tex: Texture;
      if (u.kind === 'robot') tex = this.atlas.tex.robot;
      else if (u.kind === 'dino') tex = this.atlas.tex.dino;
      else {
        const fac = u.faction === 0 ? 'green' : 'tan';
        if (u.state === 'fight') tex = this.atlas.tex[`${fac}_fire`];
        else {
          // march on twos: 2-frame cycle stepped (~12fps handmade feel)
          const frame = Math.floor(t * 6 + u.phase * 2) % 2;
          tex = this.atlas.tex[`${fac}_march${frame}`];
        }
      }
      if (body.texture !== tex) body.texture = tex;

      let rot = this.lean[i];
      let bob = 0;
      let alphaV = 1;
      let sx = 1;
      let sy = 1;

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

      if (u.state === 'dying') {
        const k = Math.min(1, u.deathT / 0.32);
        const e = 1 - (1 - k) * (1 - k); // ease-out tip
        rot = u.tipDir * e * (Math.PI / 2) * 0.94;
        if (u.deathT > 0.24) alphaV = Math.max(0, 1 - (u.deathT - 0.24) / 0.36);
      } else if (u.state === 'march') {
        // stiff plastic waddle, stepped like stop-motion
        const step = Math.floor(t * 6 + u.phase * 2) % 2;
        rot += (step === 0 ? 1 : -1) * 0.05;
        bob += step === 0 ? 0 : -1.5;
      } else {
        // firing: rigid, but breathe slightly
        sy *= 1 + Math.sin(this.idleT * 6.3 + u.phase) * 0.012;
      }

      const big = u.kind !== 'soldier' ? 1.55 : 1;
      body.position.set(x, y + bob);
      body.rotation = rot;
      body.alpha = alphaV;
      body.scale.set(sx, sy);
      body.zIndex = y;
      sh.position.set(x, y - 1);
      sh.alpha = alphaV * 0.9;
      sh.scale.set(big + (bob < 0 ? bob * 0.012 : 0), big + (bob < 0 ? bob * 0.012 : 0));
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

    // muzzle flashes: 1–2 frame life
    for (const f of this.flashes) {
      if (!f.spr.visible) continue;
      f.t += dt;
      f.spr.alpha = Math.max(0, 1 - f.t / 0.05);
      if (f.t >= 0.05) f.spr.visible = false;
    }

    // rings
    for (const r of this.rings) {
      if (!r.spr.visible) continue;
      r.t += dt * 3.2;
      r.spr.scale.set(0.3 + r.t * 1.6);
      r.spr.alpha = Math.max(0, 0.9 * (1 - r.t));
      if (r.t >= 1) r.spr.visible = false;
    }
  }
}

import { Application, Container, Sprite, Texture } from 'pixi.js';
import { LAYOUT } from '../sim/defs';
import type { Sim, SimEvent } from '../sim/sim';
import { bakeAtlas, type Atlas } from './atlas';
import { bakeGround } from './ground';
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

/**
 * Interpolated renderer over the fixed-step sim. All world drawing is sprite
 * blits from the baked atlas. Owns camera shake offset + molder animation.
 */
export class Renderer {
  app!: Application;
  atlas!: Atlas;
  world = new Container();
  groundLayer = new Container();
  shadowLayer = new Container();
  unitLayer = new Container();
  fxLayer = new Container();

  private unitShadows: Sprite[] = [];
  private unitBodies: Sprite[] = [];
  private pipSprites: Sprite[] = [];
  private tracers: Tracer[] = [];
  private rings: RingFx[] = [];
  private molderBase!: Sprite;
  private piston!: Sprite;
  private stampAnim = 0;
  private groundSprite: Sprite | null = null;
  private groundZone = -1;

  // screen shake (trauma model; full juice pass in M2)
  trauma = 0;
  private shakeT = 0;

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

    this.world.addChild(this.groundLayer, this.shadowLayer, this.unitLayer, this.fxLayer);
    this.app.stage.addChild(this.world);
    this.unitLayer.sortableChildren = true;

    // unit sprite pools, parallel to sim.units
    for (let i = 0; i < sim.units.length; i++) {
      const sh = new Sprite(this.atlas.tex.shadow);
      sh.anchor.set(0.5, 0.5);
      sh.visible = false;
      this.shadowLayer.addChild(sh);
      this.unitShadows.push(sh);

      const b = new Sprite(this.atlas.tex.green_march0);
      b.anchor.set(0.5, 0.92); // pivot at the base so tipping looks right
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
    for (let i = 0; i < 6; i++) {
      const r = new Sprite(this.atlas.tex.ring);
      r.anchor.set(0.5);
      r.visible = false;
      this.fxLayer.addChild(r);
      this.rings.push({ spr: r, t: 1 });
    }

    // molder
    this.molderBase = new Sprite(this.atlas.tex.molder);
    this.molderBase.anchor.set(0.5, 1);
    this.piston = new Sprite(this.atlas.tex.piston);
    this.piston.anchor.set(0.5, 0);
    this.unitLayer.addChild(this.molderBase);
    this.unitLayer.addChild(this.piston);

    this.layout(sim);
  }

  get w() {
    return this.app.renderer.screen.width;
  }
  get h() {
    return this.app.renderer.screen.height;
  }

  layout(sim: Sim) {
    sim.resize(this.w, this.h);
    if (this.groundZone !== sim.state.zone || !this.groundSprite) {
      this.rebakeGround(sim.state.zone);
    } else if (this.groundSprite) {
      this.groundSprite.width = this.w;
      this.groundSprite.height = this.h;
    }
    const my = this.h * 0.5;
    this.molderBase.position.set(LAYOUT.molderX, my + 75);
    this.molderBase.zIndex = my + 74;
    this.piston.position.set(LAYOUT.molderX + 14, my - 60);
    this.piston.zIndex = my + 76;
  }

  rebakeGround(zone: number) {
    this.groundZone = zone;
    if (this.groundSprite) {
      this.groundSprite.destroy({ texture: true });
      this.groundSprite = null;
    }
    const tex = bakeGround(this.w, this.h, zone, mulberry32(1234 + zone));
    this.groundSprite = new Sprite(tex);
    this.groundLayer.addChild(this.groundSprite);
  }

  handleEvent(e: SimEvent, sim: Sim) {
    switch (e.type) {
      case 'stamp':
        this.stampAnim = 1;
        this.addTrauma(0.18);
        break;
      case 'fire': {
        const u = sim.units[e.i];
        this.spawnTracer(u.x, u.y - 24, e.tx, e.ty - 24);
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
    // camera shake: trauma^2 falloff
    this.trauma = Math.max(0, this.trauma - dt * 1.5);
    this.shakeT += dt * 34;
    const mag = this.trauma * this.trauma * 6;
    this.world.position.set(
      Math.sin(this.shakeT * 1.9) * mag,
      Math.cos(this.shakeT * 2.7) * mag * 0.7
    );

    // molder piston
    if (this.stampAnim > 0) this.stampAnim = Math.max(0, this.stampAnim - dt * 5);
    const a = this.stampAnim;
    // fast slam down (a: 1 -> 0.7), spring back up
    const down = a > 0.7 ? (1 - a) / 0.3 : Math.pow(a / 0.7, 0.6);
    this.piston.y = this.h * 0.5 - 60 + down * 36;

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

      let rot = 0;
      let bob = 0;
      let alphaV = 1;
      if (u.state === 'dying') {
        const k = Math.min(1, u.deathT / 0.32);
        const e = 1 - (1 - k) * (1 - k); // ease-out tip
        rot = u.tipDir * e * (Math.PI / 2) * 0.94;
        if (u.deathT > 0.24) alphaV = Math.max(0, 1 - (u.deathT - 0.24) / 0.36);
      } else if (u.state === 'march') {
        // stiff plastic waddle, stepped like stop-motion
        const step = Math.floor(t * 6 + u.phase * 2) % 2;
        rot = (step === 0 ? 1 : -1) * 0.055;
        bob = step === 0 ? 0 : -1.5;
      }

      body.position.set(x, y + bob);
      body.rotation = rot;
      body.alpha = alphaV;
      body.zIndex = y;
      sh.position.set(x, y - 1);
      sh.alpha = alphaV * 0.9;
      const big = u.kind !== 'soldier' ? 1.5 : 1;
      sh.scale.set(big, big);
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

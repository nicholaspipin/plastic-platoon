import { Rectangle, Texture, type TextureSource } from 'pixi.js';

/**
 * Runtime-baked sprite atlas. All unit poses/variants are drawn ONCE here with
 * canvas2d (gradients allowed at bake time only) and blitted as sprites forever after.
 * Baked at 2x and served with resolution=2 so devices at DPR 2 stay crisp.
 */

export interface Atlas {
  tex: Record<string, Texture>;
}

const S = 2; // bake supersample

interface Palette {
  base: string;
  dark: string;
  spec: string;
}

export const GREEN_P: Palette = { base: '#4e7d2c', dark: '#35571c', spec: '#eaf6da' };
export const TAN_P: Palette = { base: '#c9a266', dark: '#937044', spec: '#f8ecd4' };
export const ROBOT_P: Palette = { base: '#8b909a', dark: '#585d66', spec: '#eff2f7' };
export const DINO_P: Palette = { base: '#b5622e', dark: '#7c3f1b', spec: '#f8dcc4' };

type Cell = { name: string; w: number; h: number; draw: (c: CanvasRenderingContext2D) => void };

export function bakeAtlas(): Atlas {
  const cells: Cell[] = [];

  for (const [fac, pal] of [
    ['green', GREEN_P],
    ['tan', TAN_P],
  ] as const) {
    const flip = fac === 'tan';
    cells.push({ name: `${fac}_march0`, w: 48, h: 52, draw: (c) => soldier(c, pal, 'march0', flip) });
    cells.push({ name: `${fac}_march1`, w: 48, h: 52, draw: (c) => soldier(c, pal, 'march1', flip) });
    cells.push({ name: `${fac}_fire`, w: 48, h: 52, draw: (c) => soldier(c, pal, 'fire', flip) });
  }
  cells.push({ name: 'robot', w: 72, h: 78, draw: (c) => robot(c, ROBOT_P) });
  cells.push({ name: 'dino', w: 84, h: 72, draw: (c) => dino(c, DINO_P) });
  cells.push({ name: 'shadow', w: 48, h: 20, draw: shadow });
  cells.push({ name: 'pip', w: 16, h: 16, draw: pip });
  cells.push({ name: 'tracer', w: 28, h: 6, draw: tracer });
  cells.push({ name: 'molder', w: 120, h: 150, draw: molderBody });
  cells.push({ name: 'piston', w: 64, h: 60, draw: molderPiston });
  cells.push({ name: 'ring', w: 96, h: 96, draw: ring });
  cells.push({ name: 'shard', w: 12, h: 12, draw: shard });
  cells.push({ name: 'spark', w: 10, h: 10, draw: spark });

  // simple shelf packing
  const PAD = 4;
  const MAXW = 1024;
  let x = PAD;
  let y = PAD;
  let rowH = 0;
  const placed: { cell: Cell; x: number; y: number }[] = [];
  for (const cell of cells) {
    const w = cell.w * S;
    const h = cell.h * S;
    if (x + w + PAD > MAXW) {
      x = PAD;
      y += rowH + PAD;
      rowH = 0;
    }
    placed.push({ cell, x, y });
    x += w + PAD;
    rowH = Math.max(rowH, h);
  }
  const atlasW = MAXW;
  const atlasH = y + rowH + PAD;

  const canvas = document.createElement('canvas');
  canvas.width = atlasW;
  canvas.height = atlasH;
  const ctx = canvas.getContext('2d')!;
  for (const p of placed) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(S, S);
    p.cell.draw(ctx);
    ctx.restore();
  }

  const baseTex = Texture.from(canvas);
  const source: TextureSource = baseTex.source;
  source.resolution = S;
  source.scaleMode = 'linear';

  const tex: Record<string, Texture> = {};
  for (const p of placed) {
    tex[p.cell.name] = new Texture({
      source,
      frame: new Rectangle(p.x / S, p.y / S, p.cell.w, p.cell.h),
    });
  }
  return { tex };
}

// ---------------------------------------------------------------- drawing helpers

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

/**
 * Classic army man, side view, facing right (flip=true mirrors for tan).
 * Cell 48x52, base ellipse center at (24, 46). 3-tone plastic: base pigment,
 * dark occlusion on the trailing/under side, hard near-white specular hits.
 */
function soldier(c: CanvasRenderingContext2D, p: Palette, pose: 'march0' | 'march1' | 'fire', flip: boolean) {
  c.save();
  if (flip) {
    c.translate(48, 0);
    c.scale(-1, 1);
  }

  // oval base — the #1 army-man signifier
  c.fillStyle = p.dark;
  c.beginPath();
  c.ellipse(24, 46, 14, 4.6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = p.base;
  c.beginPath();
  c.ellipse(24, 45, 13.2, 3.9, 0, 0, Math.PI * 2);
  c.fill();
  // base spec sliver
  c.fillStyle = p.spec;
  c.globalAlpha = 0.85;
  c.beginPath();
  c.ellipse(19, 43.8, 4.2, 1.1, -0.25, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;

  c.fillStyle = p.base;
  c.strokeStyle = p.base;
  c.lineCap = 'round';

  // legs
  c.lineWidth = 5;
  if (pose === 'march0') {
    line(c, 23, 32, 17.5, 44); // back leg
    line(c, 25, 32, 30.5, 44); // front leg
  } else if (pose === 'march1') {
    line(c, 24, 32, 21.5, 44);
    line(c, 24, 32, 27, 44);
  } else {
    line(c, 23, 32, 19, 44);
    line(c, 25, 32, 28.5, 44);
  }

  // torso
  rr(c, 19, 19.5, 10.5, 14.5, 4);
  c.fill();

  // rifle + arms
  c.lineWidth = 2.6;
  c.strokeStyle = p.dark;
  if (pose === 'fire') {
    line(c, 20, 23.5, 41, 21.5); // rifle leveled
  } else {
    line(c, 21, 26, 37, 18.5); // rifle at ready, angled up
  }
  c.strokeStyle = p.base;
  c.lineWidth = 4.2;
  if (pose === 'fire') {
    line(c, 25, 24, 33, 22.5);
    line(c, 23, 25, 28, 23.5);
  } else {
    line(c, 25, 24, 31.5, 21);
  }

  // helmet
  c.fillStyle = p.base;
  c.beginPath();
  c.arc(24.5, 14.2, 7.2, Math.PI, 0);
  c.quadraticCurveTo(32.5, 17.4, 30.5, 18.2);
  c.lineTo(18.5, 18.2);
  c.quadraticCurveTo(16.5, 17.4, 17.3, 14.2);
  c.fill();

  // occlusion: dark trailing edge on torso + under helmet brim
  c.fillStyle = p.dark;
  c.globalAlpha = 0.55;
  rr(c, 19, 19.5, 3.4, 14.5, 3);
  c.fill();
  c.beginPath();
  c.rect(18.5, 16.8, 12.5, 1.6);
  c.fill();
  c.globalAlpha = 1;

  // hard specular: helmet crescent + shoulder dot (toon-shader crisp)
  c.fillStyle = p.spec;
  c.beginPath();
  c.ellipse(22, 10.8, 3.4, 1.6, -0.5, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(26.5, 21.4, 1.8, 1.1, -0.3, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

/** Wind-up robot mini-boss. Cell 72x78, base center (36, 70). */
function robot(c: CanvasRenderingContext2D, p: Palette) {
  // base plate
  c.fillStyle = p.dark;
  c.beginPath();
  c.ellipse(36, 70, 21, 6, 0, 0, Math.PI * 2);
  c.fill();

  // wind-up key on the back (left side; robot faces left toward greens)
  c.strokeStyle = '#c79a2a';
  c.lineWidth = 3.4;
  c.beginPath();
  c.arc(60, 34, 7, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.arc(60, 34, 2.6, 0, Math.PI * 2);
  c.fillStyle = '#c79a2a';
  c.fill();
  line(c, 53, 34, 48, 34);

  // legs
  c.fillStyle = p.base;
  rr(c, 24, 52, 9, 16, 3);
  c.fill();
  rr(c, 39, 52, 9, 16, 3);
  c.fill();
  // feet
  c.fillStyle = p.dark;
  rr(c, 21, 64, 14, 6, 3);
  c.fill();
  rr(c, 37, 64, 14, 6, 3);
  c.fill();

  // body
  c.fillStyle = p.base;
  rr(c, 16, 24, 40, 32, 6);
  c.fill();
  // chest panel
  c.fillStyle = p.dark;
  c.globalAlpha = 0.5;
  rr(c, 22, 30, 18, 12, 3);
  c.fill();
  c.globalAlpha = 1;
  // rivets
  c.fillStyle = p.dark;
  for (const [rx, ry] of [
    [20, 27],
    [52, 27],
    [20, 52],
    [52, 52],
  ]) {
    c.beginPath();
    c.arc(rx, ry, 1.6, 0, Math.PI * 2);
    c.fill();
  }

  // head
  c.fillStyle = p.base;
  rr(c, 22, 8, 28, 18, 7);
  c.fill();
  // eye (faces left)
  c.fillStyle = '#e5484d';
  c.beginPath();
  c.arc(29, 17, 3.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffd9da';
  c.beginPath();
  c.arc(28, 15.8, 1.2, 0, Math.PI * 2);
  c.fill();

  // arm cannon (left)
  c.fillStyle = p.dark;
  rr(c, 6, 34, 14, 8, 4);
  c.fill();

  // occlusion right edge
  c.fillStyle = p.dark;
  c.globalAlpha = 0.45;
  rr(c, 50, 24, 6, 32, 4);
  c.fill();
  c.globalAlpha = 1;

  // specular hits
  c.fillStyle = p.spec;
  c.beginPath();
  c.ellipse(28, 11.4, 4.6, 1.7, -0.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(22, 27.5, 2.6, 1.3, -0.4, 0, Math.PI * 2);
  c.fill();
}

/** Toy dinosaur boss (M3). Cell 84x72, base center (42, 64), faces left. */
function dino(c: CanvasRenderingContext2D, p: Palette) {
  c.fillStyle = p.dark;
  c.beginPath();
  c.ellipse(42, 64, 26, 6, 0, 0, Math.PI * 2);
  c.fill();

  c.fillStyle = p.base;
  // tail (right)
  c.beginPath();
  c.moveTo(58, 38);
  c.quadraticCurveTo(80, 30, 82, 20);
  c.quadraticCurveTo(74, 34, 56, 44);
  c.closePath();
  c.fill();
  // body
  c.beginPath();
  c.ellipse(48, 42, 20, 15, -0.15, 0, Math.PI * 2);
  c.fill();
  // legs
  rr(c, 36, 48, 10, 16, 4);
  c.fill();
  rr(c, 52, 48, 10, 14, 4);
  c.fill();
  // neck + head (left)
  c.beginPath();
  c.moveTo(34, 38);
  c.quadraticCurveTo(24, 26, 18, 22);
  c.lineTo(30, 20);
  c.quadraticCurveTo(38, 28, 40, 34);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(17, 21, 11, 7, -0.2, 0, Math.PI * 2);
  c.fill();
  // jaw
  c.fillStyle = p.dark;
  c.beginPath();
  c.moveTo(8, 23);
  c.lineTo(20, 25);
  c.lineTo(9, 27.5);
  c.closePath();
  c.fill();
  // eye
  c.fillStyle = '#1e1508';
  c.beginPath();
  c.arc(15, 18.5, 1.8, 0, Math.PI * 2);
  c.fill();
  // back plates
  c.fillStyle = p.dark;
  for (const [px, py, r] of [
    [40, 27, 5],
    [50, 28, 6],
    [60, 32, 5],
  ]) {
    c.beginPath();
    c.moveTo(px - r, py + 2);
    c.lineTo(px, py - r);
    c.lineTo(px + r, py + 2);
    c.closePath();
    c.fill();
  }
  // occlusion under belly
  c.globalAlpha = 0.4;
  c.beginPath();
  c.ellipse(48, 52, 16, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  // specular
  c.fillStyle = p.spec;
  c.beginPath();
  c.ellipse(14, 17, 3.2, 1.4, -0.4, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(44, 32, 4.4, 1.8, -0.2, 0, Math.PI * 2);
  c.fill();
}

/** Soft contact shadow, baked radial gradient (bake-time only). */
function shadow(c: CanvasRenderingContext2D) {
  const g = c.createRadialGradient(24, 10, 2, 24, 10, 22);
  g.addColorStop(0, 'rgba(20,12,4,0.42)');
  g.addColorStop(1, 'rgba(20,12,4,0)');
  c.fillStyle = g;
  c.save();
  c.translate(0, 10);
  c.scale(1, 0.42);
  c.translate(0, -10);
  c.beginPath();
  c.arc(24, 10, 22, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Scrap pip: a molten little plastic nugget. */
function pip(c: CanvasRenderingContext2D) {
  c.fillStyle = '#57862f';
  c.beginPath();
  c.moveTo(8, 1.5);
  c.lineTo(14.5, 6);
  c.lineTo(12.5, 13.5);
  c.lineTo(4.5, 14);
  c.lineTo(1.5, 7);
  c.closePath();
  c.fill();
  c.fillStyle = '#3a5c1e';
  c.beginPath();
  c.moveTo(12.5, 13.5);
  c.lineTo(4.5, 14);
  c.lineTo(1.5, 7);
  c.lineTo(6, 9);
  c.closePath();
  c.fill();
  c.fillStyle = '#ddf0c0';
  c.beginPath();
  c.ellipse(6.4, 4.6, 2.6, 1.5, -0.5, 0, Math.PI * 2);
  c.fill();
}

function tracer(c: CanvasRenderingContext2D) {
  const g = c.createLinearGradient(0, 0, 28, 0);
  g.addColorStop(0, 'rgba(255,244,200,0)');
  g.addColorStop(0.7, 'rgba(255,244,200,0.9)');
  g.addColorStop(1, 'rgba(255,255,240,1)');
  c.fillStyle = g;
  rr(c, 0, 1.2, 28, 3.6, 1.8);
  c.fill();
}

/** The Molder body: toy injection press. Cell 120x150. Piston is a separate sprite. */
function molderBody(c: CanvasRenderingContext2D) {
  const red = '#c8452c';
  const redD = '#8d2c1b';
  const redL = '#f4e3d7';
  const steel = '#7d838d';
  const steelD = '#4f545c';

  // base plate / output tray
  c.fillStyle = steelD;
  rr(c, 6, 128, 108, 16, 6);
  c.fill();
  c.fillStyle = steel;
  rr(c, 8, 124, 104, 12, 6);
  c.fill();

  // frame column (left)
  c.fillStyle = red;
  rr(c, 10, 26, 26, 104, 8);
  c.fill();
  c.fillStyle = redD;
  c.globalAlpha = 0.5;
  rr(c, 10, 26, 7, 104, 6);
  c.fill();
  c.globalAlpha = 1;

  // top crossbeam
  c.fillStyle = red;
  rr(c, 10, 16, 96, 24, 9);
  c.fill();
  c.fillStyle = redD;
  c.globalAlpha = 0.45;
  rr(c, 10, 32, 96, 8, 5);
  c.fill();
  c.globalAlpha = 1;

  // hopper funnel on top
  c.fillStyle = steel;
  c.beginPath();
  c.moveTo(48, 2);
  c.lineTo(88, 2);
  c.lineTo(76, 20);
  c.lineTo(60, 20);
  c.closePath();
  c.fill();
  c.fillStyle = steelD;
  c.beginPath();
  c.ellipse(68, 3, 20, 3.4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#57862f';
  c.beginPath();
  c.ellipse(68, 3.4, 16, 2.4, 0, 0, Math.PI * 2);
  c.fill();

  // stamping platform
  c.fillStyle = steel;
  rr(c, 46, 116, 56, 10, 4);
  c.fill();
  c.fillStyle = steelD;
  rr(c, 46, 122, 56, 4, 2);
  c.fill();

  // bolts
  c.fillStyle = redD;
  for (const [bx, by] of [
    [16, 22],
    [100, 22],
    [16, 122],
    [30, 122],
  ]) {
    c.beginPath();
    c.arc(bx, by, 2.4, 0, Math.PI * 2);
    c.fill();
  }

  // specular hits (hard-edged)
  c.fillStyle = redL;
  c.beginPath();
  c.ellipse(20, 20.5, 6, 2, -0.15, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(14.5, 40, 2, 8, 0, 0, Math.PI * 2);
  c.fill();
}

/** Piston head: rams down onto the platform. Cell 64x60, anchor top-center. */
function molderPiston(c: CanvasRenderingContext2D) {
  const steel = '#8b919b';
  const steelD = '#565b63';
  const spec = '#eef1f6';
  // shaft
  c.fillStyle = steelD;
  rr(c, 26, 0, 12, 34, 3);
  c.fill();
  c.fillStyle = steel;
  rr(c, 28, 0, 5, 34, 2);
  c.fill();
  // head block
  c.fillStyle = '#c8452c';
  rr(c, 8, 32, 48, 22, 6);
  c.fill();
  c.fillStyle = '#8d2c1b';
  rr(c, 8, 48, 48, 6, 4);
  c.fill();
  c.fillStyle = spec;
  c.beginPath();
  c.ellipse(18, 36.5, 5, 1.7, -0.15, 0, Math.PI * 2);
  c.fill();
}

/** Expanding shockwave ring for the rubber band snap. */
function ring(c: CanvasRenderingContext2D) {
  c.strokeStyle = 'rgba(255,250,235,0.9)';
  c.lineWidth = 5;
  c.beginPath();
  c.arc(48, 48, 42, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = 'rgba(255,250,235,0.35)';
  c.lineWidth = 10;
  c.beginPath();
  c.arc(48, 48, 38, 0, Math.PI * 2);
  c.stroke();
}

/** Plastic shard for knockover bursts (tinted per faction at runtime). */
function shard(c: CanvasRenderingContext2D) {
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(6, 0.5);
  c.lineTo(11.5, 4.5);
  c.lineTo(8.5, 11);
  c.lineTo(1.5, 8);
  c.closePath();
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.18)';
  c.beginPath();
  c.moveTo(8.5, 11);
  c.lineTo(1.5, 8);
  c.lineTo(6, 6);
  c.closePath();
  c.fill();
}

function spark(c: CanvasRenderingContext2D) {
  const g = c.createRadialGradient(5, 5, 0.5, 5, 5, 5);
  g.addColorStop(0, 'rgba(255,252,240,1)');
  g.addColorStop(0.5, 'rgba(255,240,190,0.8)');
  g.addColorStop(1, 'rgba(255,240,190,0)');
  c.fillStyle = g;
  c.beginPath();
  c.arc(5, 5, 5, 0, Math.PI * 2);
  c.fill();
}

function line(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

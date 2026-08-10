import { Rectangle, Texture, type TextureSource } from 'pixi.js';

/**
 * Runtime-baked sprite atlas. All unit poses/variants are drawn ONCE here with
 * canvas2d (gradients allowed at bake time only) and blitted as sprites forever after.
 * Baked at 2x and served with resolution=2 so devices at DPR 2 stay crisp.
 *
 * Material rule (ART_NOTES §1): monochrome injection-molded plastic. Detail is
 * value shifts within ONE hue — five values per faction, no outlines, hard-edged
 * near-white speculars, cool rim light, oval base under every figure.
 */

export interface Atlas {
  tex: Record<string, Texture>;
}

const S = 2; // bake supersample

export interface Plastic {
  crev: string; // crevice/shadow
  base: string; // dominant fill
  light: string; // up-facing planes
  sheen: string; // waxy band on curved peaks
  spec: string; // hard hot spot
}

export const GREEN_P: Plastic = {
  crev: '#3b4423',
  base: '#5a6b3c',
  light: '#82955c',
  sheen: '#b7c68f',
  spec: '#f4f8e8',
};
export const TAN_P: Plastic = {
  crev: '#8a6f42',
  base: '#c4a46a',
  light: '#dec28e',
  sheen: '#f0ddb4',
  spec: '#fffbef',
};
export const ROBOT_P: Plastic = {
  crev: '#4a4e55',
  base: '#757b85',
  light: '#9aa1ac',
  sheen: '#c6ccd6',
  spec: '#f4f7fc',
};
export const DINO_P: Plastic = {
  crev: '#6e3714',
  base: '#a85a28',
  light: '#c97c42',
  sheen: '#e8a96b',
  spec: '#ffe8ce',
};

const RIM = 'rgba(221,231,240,0.4)'; // cool window-light rim

type Cell = { name: string; w: number; h: number; draw: (c: CanvasRenderingContext2D) => void };

export function bakeAtlas(): Atlas {
  const cells: Cell[] = [];

  for (const [fac, pal] of [
    ['green', GREEN_P],
    ['tan', TAN_P],
  ] as const) {
    const flip = fac === 'tan';
    cells.push({ name: `${fac}_march0`, w: 48, h: 54, draw: (c) => soldier(c, pal, 'march0', flip) });
    cells.push({ name: `${fac}_march1`, w: 48, h: 54, draw: (c) => soldier(c, pal, 'march1', flip) });
    cells.push({ name: `${fac}_fire`, w: 48, h: 54, draw: (c) => soldier(c, pal, 'fire', flip) });
  }
  cells.push({ name: 'robot', w: 76, h: 82, draw: (c) => robot(c, ROBOT_P) });
  cells.push({ name: 'dino', w: 88, h: 74, draw: (c) => dino(c, DINO_P) });
  cells.push({ name: 'shadow', w: 48, h: 20, draw: shadow });
  cells.push({ name: 'pip', w: 16, h: 16, draw: pip });
  cells.push({ name: 'tracer', w: 28, h: 6, draw: tracer });
  cells.push({ name: 'muzzle', w: 22, h: 22, draw: muzzle });
  cells.push({ name: 'molder', w: 150, h: 180, draw: molderBody });
  cells.push({ name: 'piston', w: 76, h: 74, draw: molderPiston });
  cells.push({ name: 'pellets', w: 44, h: 14, draw: pellets });
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

// ---------------------------------------------------------------- helpers

function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

function ell(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
  rot = 0
) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
}

function line(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}

/** Oval base + soft-ish contact edge, the #1 "army man" signifier. */
function ovalBase(c: CanvasRenderingContext2D, p: Plastic, cx: number, cy: number, rx: number) {
  const ry = rx * 0.34;
  // underside crevice (thickness of the base)
  c.fillStyle = p.crev;
  ell(c, cx, cy + 1.6, rx, ry);
  c.fill();
  // top face
  c.fillStyle = p.base;
  ell(c, cx, cy, rx, ry);
  c.fill();
  // up-facing light
  c.fillStyle = p.light;
  ell(c, cx - rx * 0.08, cy - 0.7, rx * 0.82, ry * 0.62);
  c.fill();
  // front-rim sheen line
  c.strokeStyle = p.sheen;
  c.lineWidth = 1.1;
  c.beginPath();
  c.ellipse(cx, cy, rx * 0.94, ry * 0.9, 0, Math.PI * 0.15, Math.PI * 0.85);
  c.stroke();
  // hard spec chip on the near rim
  c.fillStyle = p.spec;
  ell(c, cx - rx * 0.45, cy - ry * 0.55, 1.7, 0.8, -0.3);
  c.fill();
}

/**
 * Classic army man, side view facing right (flip mirrors for tan).
 * Cell 48x54, base center (24, 48). Five-value monochrome, splayed theatrical pose.
 * Tan wears a wide-brim brodie helmet so factions differ in silhouette, not just hue.
 */
function soldier(
  c: CanvasRenderingContext2D,
  p: Plastic,
  pose: 'march0' | 'march1' | 'fire',
  flip: boolean
) {
  c.save();
  if (flip) {
    c.translate(48, 0);
    c.scale(-1, 1);
  }

  ovalBase(c, p, 24, 47, 14);

  c.lineCap = 'round';

  // ---- legs (wide theatrical stances)
  c.strokeStyle = p.base;
  c.lineWidth = 5;
  if (pose === 'march0') {
    line(c, 22.5, 32, 15.5, 44.5); // back leg, kicked back
    line(c, 25.5, 32, 32, 44.5); // front leg, striding
  } else if (pose === 'march1') {
    line(c, 23.5, 32, 20.5, 45);
    line(c, 24.5, 32, 27.5, 45);
  } else {
    line(c, 22.5, 32, 16.5, 45); // braced firing stance
    line(c, 25.5, 32, 30, 44.5);
  }
  // inner-leg crevice
  c.strokeStyle = p.crev;
  c.lineWidth = 1.6;
  if (pose === 'march0') line(c, 24, 33, 22, 41);
  else if (pose === 'fire') line(c, 24, 33, 22.5, 41);
  // front-shin light
  c.strokeStyle = p.light;
  c.lineWidth = 1.8;
  if (pose === 'march0') line(c, 26.5, 34, 31, 43);
  else if (pose === 'march1') line(c, 25.4, 34, 27.2, 43.5);
  else line(c, 26.5, 34, 29.3, 43);

  // ---- torso (leaning into the march / braced when firing)
  const lean = pose === 'fire' ? -0.03 : 0.1;
  c.save();
  c.translate(24, 26);
  c.rotate(lean);
  c.fillStyle = p.base;
  rr(c, -5.5, -7.5, 11, 15, 4.5);
  c.fill();
  // backpack (behind = left)
  c.fillStyle = p.base;
  rr(c, -9, -5.5, 4.5, 9, 2);
  c.fill();
  c.fillStyle = p.crev;
  c.globalAlpha = 0.75;
  rr(c, -9, -5.5, 1.6, 9, 1.5);
  c.fill();
  c.globalAlpha = 1;
  // torso occlusion: trailing edge + under-arm
  c.fillStyle = p.crev;
  c.globalAlpha = 0.7;
  rr(c, -5.5, -7.5, 2.6, 15, 3);
  c.fill();
  c.globalAlpha = 1;
  // chest light
  c.fillStyle = p.light;
  rr(c, 0.6, -6.5, 4.6, 9, 3);
  c.fill();
  // shoulder sheen
  c.fillStyle = p.sheen;
  ell(c, 2.4, -5.8, 2.6, 1.3, -0.25);
  c.fill();
  // rim light on backpack top
  c.strokeStyle = RIM;
  c.lineWidth = 1;
  line(c, -8.6, -5.2, -5.2, -6.8);
  c.restore();

  // ---- rifle + arms
  const gunColor = p.crev;
  if (pose === 'fire') {
    // rifle leveled at the shoulder
    c.strokeStyle = gunColor;
    c.lineWidth = 2.8;
    line(c, 19, 22.5, 41.5, 21);
    // stock
    c.lineWidth = 4.2;
    line(c, 19.5, 23, 23.5, 22.6);
    // foregrip hand + trigger hand
    c.strokeStyle = p.base;
    c.lineWidth = 4.4;
    line(c, 26, 25.5, 32.5, 22.3);
    line(c, 23.5, 26, 26.5, 24);
    // barrel spec
    c.fillStyle = p.spec;
    ell(c, 36, 20.6, 2.1, 0.7, -0.05);
    c.fill();
  } else {
    // rifle at port arms (diagonal across chest)
    c.strokeStyle = gunColor;
    c.lineWidth = 2.8;
    line(c, 18.5, 28.5, 36.5, 17.5);
    c.lineWidth = 4;
    line(c, 18.8, 28.3, 22.3, 26.2);
    c.strokeStyle = p.base;
    c.lineWidth = 4.4;
    line(c, 24, 25.5, 30.5, 21.5);
    c.fillStyle = p.spec;
    ell(c, 33, 19.2, 1.9, 0.7, -0.55);
    c.fill();
  }

  // ---- head + helmet
  if (flip) {
    // TAN: brodie wide-brim helmet (silhouette differentiation)
    c.fillStyle = p.base;
    ell(c, 24.5, 15.5, 5.2, 4.4); // head ball
    c.fill();
    c.fillStyle = p.crev;
    c.globalAlpha = 0.6;
    ell(c, 24.5, 17.2, 4.6, 2.6); // face in brim shadow
    c.fill();
    c.globalAlpha = 1;
    // dome
    c.fillStyle = p.base;
    c.beginPath();
    c.arc(24.5, 12.8, 5.6, Math.PI, 0);
    c.closePath();
    c.fill();
    // wide brim
    c.fillStyle = p.base;
    ell(c, 24.5, 13.2, 9.4, 2.5);
    c.fill();
    c.fillStyle = p.light;
    ell(c, 23.6, 12.4, 8, 1.7);
    c.fill();
    // dome light + sheen + spec
    c.fillStyle = p.light;
    c.beginPath();
    c.arc(23.8, 12.4, 4.4, Math.PI, 0);
    c.closePath();
    c.fill();
    c.fillStyle = p.sheen;
    ell(c, 23, 9.9, 2.8, 1.2, -0.3);
    c.fill();
    c.fillStyle = p.spec;
    ell(c, 23.6, 9.1, 1.4, 0.7, -0.3);
    c.fill();
    // rim on brim back edge
    c.strokeStyle = RIM;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(24.5, 13.2, 9.2, 2.3, 0, Math.PI * 1.05, Math.PI * 1.5);
    c.stroke();
  } else {
    // GREEN: M1 pot helmet
    c.fillStyle = p.base;
    ell(c, 24.5, 16, 5, 4.2); // head ball
    c.fill();
    c.fillStyle = p.crev;
    c.globalAlpha = 0.6;
    ell(c, 24.8, 17.4, 4.2, 2.4); // face in helmet shadow
    c.fill();
    c.globalAlpha = 1;
    c.fillStyle = p.base;
    c.beginPath();
    c.arc(24.5, 14, 7, Math.PI * 0.98, Math.PI * 0.02);
    c.quadraticCurveTo(32, 17.6, 30, 18.4);
    c.lineTo(19, 18.4);
    c.quadraticCurveTo(17, 17.6, 17.55, 14);
    c.fill();
    // under-brim crevice
    c.fillStyle = p.crev;
    c.beginPath();
    c.rect(18.6, 16.9, 12, 1.5);
    c.fill();
    // dome light
    c.fillStyle = p.light;
    c.beginPath();
    c.arc(23.6, 13.6, 5.2, Math.PI, Math.PI * 1.98);
    c.closePath();
    c.fill();
    // sheen crescent + hard spec
    c.fillStyle = p.sheen;
    ell(c, 22.4, 10.4, 3.1, 1.4, -0.35);
    c.fill();
    c.fillStyle = p.spec;
    ell(c, 23.2, 9.4, 1.5, 0.8, -0.35);
    c.fill();
    // cool rim on the helmet back edge
    c.strokeStyle = RIM;
    c.lineWidth = 1;
    c.beginPath();
    c.arc(24.5, 14, 6.6, Math.PI * 1.02, Math.PI * 1.35);
    c.stroke();
  }

  c.restore();
}

/** Wind-up robot mini-boss: rounded tin-toy body, gold key, red eye. Cell 76x82. */
function robot(c: CanvasRenderingContext2D, p: Plastic) {
  ovalBase(c, p, 38, 74, 23);

  // wind-up key on the back (right side; robot faces left)
  const gold = '#d9a62e';
  const goldD = '#9a7014';
  c.strokeStyle = goldD;
  c.lineWidth = 3.8;
  c.beginPath();
  c.arc(64, 36, 7.4, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = gold;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(63.5, 35.5, 7.2, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = gold;
  ell(c, 63.5, 35.5, 2.6, 2.6);
  c.fill();
  c.strokeStyle = goldD;
  c.lineWidth = 2.6;
  line(c, 56.5, 35.5, 51, 35.5);
  c.fillStyle = '#f6e3ae';
  ell(c, 61, 30.5, 1.6, 0.9, -0.6);
  c.fill();

  // legs + feet plates
  c.fillStyle = p.base;
  rr(c, 25, 56, 9.5, 14, 3.5);
  c.fill();
  rr(c, 41, 56, 9.5, 14, 3.5);
  c.fill();
  c.fillStyle = p.crev;
  rr(c, 21.5, 67, 15.5, 6, 3);
  c.fill();
  rr(c, 38.5, 67, 15.5, 6, 3);
  c.fill();
  c.fillStyle = p.light;
  rr(c, 26.2, 57, 3.2, 11, 2);
  c.fill();
  rr(c, 42.2, 57, 3.2, 11, 2);
  c.fill();

  // rounded body
  c.fillStyle = p.base;
  rr(c, 16, 24, 43, 35, 10);
  c.fill();
  // trailing-edge occlusion
  c.fillStyle = p.crev;
  c.globalAlpha = 0.65;
  rr(c, 52, 26, 7, 31, 6);
  c.fill();
  c.globalAlpha = 1;
  // face-plate light
  c.fillStyle = p.light;
  rr(c, 18.5, 26, 14, 29, 7);
  c.fill();
  // chest dial
  c.fillStyle = p.crev;
  ell(c, 38, 41, 7.5, 7.5);
  c.fill();
  c.fillStyle = p.base;
  ell(c, 38, 41, 5.6, 5.6);
  c.fill();
  c.strokeStyle = p.crev;
  c.lineWidth = 1.6;
  line(c, 38, 41, 41.5, 38);
  // rivets
  c.fillStyle = p.crev;
  for (const [rx, ry] of [
    [20, 28.5],
    [55, 28.5],
    [20, 55],
    [55, 55],
  ] as const) {
    ell(c, rx, ry, 1.5, 1.5);
    c.fill();
  }

  // dome head + antenna
  c.fillStyle = p.base;
  c.beginPath();
  c.arc(36, 16, 12, Math.PI, 0);
  c.lineTo(48, 22);
  c.quadraticCurveTo(36, 26, 24, 22);
  c.closePath();
  c.fill();
  c.fillStyle = p.light;
  c.beginPath();
  c.arc(33.5, 15.2, 8.6, Math.PI, Math.PI * 1.96);
  c.closePath();
  c.fill();
  c.strokeStyle = p.crev;
  c.lineWidth = 1.8;
  line(c, 36, 4.5, 36, 8.5);
  c.fillStyle = '#e5484d';
  ell(c, 36, 3.6, 2, 2);
  c.fill();
  // eye (faces left)
  c.fillStyle = p.crev;
  ell(c, 27.5, 17.5, 4.2, 4.2);
  c.fill();
  c.fillStyle = '#e5484d';
  ell(c, 27.5, 17.5, 3, 3);
  c.fill();
  c.fillStyle = '#ffd9da';
  ell(c, 26.4, 16.4, 1.1, 1.1);
  c.fill();

  // arm cannon (left)
  c.fillStyle = p.crev;
  rr(c, 4, 36, 15, 8.5, 4);
  c.fill();
  c.fillStyle = p.base;
  rr(c, 5, 37, 12, 5, 2.5);
  c.fill();

  // sheen + hard specs
  c.fillStyle = p.sheen;
  ell(c, 29, 9.6, 4.4, 1.8, -0.25);
  c.fill();
  c.fillStyle = p.spec;
  ell(c, 30.5, 8.2, 2, 1, -0.25);
  c.fill();
  ell(c, 21.5, 29.5, 2.2, 1.1, -0.5);
  c.fill();
  // cool rim on dome back
  c.strokeStyle = RIM;
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(36, 16, 11.4, Math.PI * 1.55, Math.PI * 1.95);
  c.stroke();
}

/** Toy dinosaur boss (M3). Cell 88x74, base center (44, 66), faces left. */
function dino(c: CanvasRenderingContext2D, p: Plastic) {
  ovalBase(c, p, 44, 66, 27);

  c.fillStyle = p.base;
  // tail (right, whipping up)
  c.beginPath();
  c.moveTo(60, 38);
  c.quadraticCurveTo(84, 30, 86, 18);
  c.quadraticCurveTo(77, 34, 58, 45);
  c.closePath();
  c.fill();
  // haunch + body
  ell(c, 52, 42, 20, 15, -0.12);
  c.fill();
  // legs
  rr(c, 38, 48, 10.5, 17, 4.5);
  c.fill();
  rr(c, 55, 48, 10, 15, 4.5);
  c.fill();
  // toes
  c.fillStyle = p.crev;
  rr(c, 35.5, 61, 15, 5, 2.5);
  c.fill();
  rr(c, 53, 60, 13.5, 5, 2.5);
  c.fill();
  // neck + head (left, lunging low)
  c.fillStyle = p.base;
  c.beginPath();
  c.moveTo(36, 36);
  c.quadraticCurveTo(26, 28, 20, 24);
  c.lineTo(32, 20);
  c.quadraticCurveTo(40, 27, 42, 33);
  c.closePath();
  c.fill();
  ell(c, 17, 23, 12, 7.5, -0.18);
  c.fill();
  // open jaw
  c.fillStyle = p.crev;
  c.beginPath();
  c.moveTo(6.5, 24);
  c.lineTo(21, 26.5);
  c.lineTo(9, 30);
  c.closePath();
  c.fill();
  // teeth
  c.fillStyle = p.spec;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(9 + i * 3.6, 24.4 + i * 0.4);
    c.lineTo(10.6 + i * 3.6, 26.3 + i * 0.4);
    c.lineTo(11.6 + i * 3.6, 24.7 + i * 0.4);
    c.closePath();
    c.fill();
  }
  // eye
  c.fillStyle = p.crev;
  ell(c, 15.5, 20, 2, 2);
  c.fill();
  c.fillStyle = '#1e1508';
  ell(c, 15.2, 19.8, 1.2, 1.2);
  c.fill();
  // back plates
  c.fillStyle = p.crev;
  for (const [px, py, r] of [
    [42, 26.5, 5.5],
    [53, 27.5, 6.5],
    [63, 31.5, 5.5],
  ] as const) {
    c.beginPath();
    c.moveTo(px - r, py + 2);
    c.lineTo(px, py - r);
    c.lineTo(px + r, py + 2);
    c.closePath();
    c.fill();
  }
  // belly occlusion
  c.fillStyle = p.crev;
  c.globalAlpha = 0.5;
  ell(c, 52, 52, 16, 5.5);
  c.fill();
  c.globalAlpha = 1;
  // top light
  c.fillStyle = p.light;
  ell(c, 48, 33, 13, 5, -0.15);
  c.fill();
  ell(c, 15, 20.5, 7, 3, -0.2);
  c.fill();
  // sheen + specs
  c.fillStyle = p.sheen;
  ell(c, 46, 31, 6, 2, -0.15);
  c.fill();
  c.fillStyle = p.spec;
  ell(c, 13.5, 18.6, 2.4, 1, -0.3);
  c.fill();
  ell(c, 45, 30, 2.6, 1, -0.15);
  c.fill();
  // rim along the spine
  c.strokeStyle = RIM;
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(34, 29);
  c.quadraticCurveTo(48, 24, 60, 30);
  c.stroke();
}

/** Soft contact shadow, baked radial gradient (bake-time only). */
function shadow(c: CanvasRenderingContext2D) {
  const g = c.createRadialGradient(24, 10, 2, 24, 10, 22);
  g.addColorStop(0, 'rgba(26,14,6,0.4)');
  g.addColorStop(1, 'rgba(26,14,6,0)');
  c.fillStyle = g;
  c.save();
  c.translate(0, 10);
  c.scale(1, 0.4);
  c.translate(0, -10);
  c.beginPath();
  c.arc(24, 10, 22, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Scrap pip: a chip of green plastic, same 5-value language. */
function pip(c: CanvasRenderingContext2D) {
  const p = GREEN_P;
  c.fillStyle = p.base;
  c.beginPath();
  c.moveTo(8, 1.5);
  c.lineTo(14.5, 6);
  c.lineTo(12.5, 13.5);
  c.lineTo(4.5, 14);
  c.lineTo(1.5, 7);
  c.closePath();
  c.fill();
  c.fillStyle = p.crev;
  c.beginPath();
  c.moveTo(12.5, 13.5);
  c.lineTo(4.5, 14);
  c.lineTo(1.5, 7);
  c.lineTo(6, 9);
  c.closePath();
  c.fill();
  c.fillStyle = p.light;
  c.beginPath();
  c.moveTo(8, 1.5);
  c.lineTo(14.5, 6);
  c.lineTo(9, 7.5);
  c.lineTo(4, 5);
  c.closePath();
  c.fill();
  c.fillStyle = p.spec;
  ell(c, 6.6, 4.4, 2.2, 1.2, -0.5);
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

/** Muzzle flash star: white core, warm fringe, 1–2 frame life. */
function muzzle(c: CanvasRenderingContext2D) {
  c.save();
  c.translate(11, 11);
  c.fillStyle = 'rgba(255,190,80,0.85)';
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    c.lineTo(Math.cos(a) * 10, Math.sin(a) * 10);
    c.lineTo(Math.cos(a + 0.63) * 4, Math.sin(a + 0.63) * 4);
  }
  c.closePath();
  c.fill();
  c.fillStyle = '#fffbe8';
  ell(c, 0, 0, 4.2, 4.2);
  c.fill();
  c.restore();
}

/**
 * The Molder — hero of the left side. Chunky red toy injection press:
 * C-frame, hopper of pellets up top, stamping platform, sticker label.
 * Cell 150x180, anchor bottom-center. Piston is a separate sprite.
 */
function molderBody(c: CanvasRenderingContext2D) {
  const red = '#c8452c';
  const redD = '#7e2413';
  const redL = '#e0674b';
  const redSheen = '#f0937b';
  const spec = '#fdeee8';
  const steel = '#8b919b';
  const steelD = '#565b63';
  const steelL = '#aeb4be';
  const gold = '#d9a62e';

  // baked contact shadow under the machine
  const sh = c.createRadialGradient(75, 168, 8, 75, 168, 62);
  sh.addColorStop(0, 'rgba(26,14,6,0.4)');
  sh.addColorStop(1, 'rgba(26,14,6,0)');
  c.fillStyle = sh;
  c.save();
  c.translate(0, 168);
  c.scale(1, 0.22);
  c.translate(0, -168);
  c.beginPath();
  c.arc(75, 168, 62, 0, Math.PI * 2);
  c.fill();
  c.restore();

  // base plinth (top face + front face = high-angle read)
  c.fillStyle = redD;
  rr(c, 12, 150, 126, 20, 8);
  c.fill();
  c.fillStyle = red;
  rr(c, 12, 144, 126, 18, 8);
  c.fill();
  c.fillStyle = redL;
  rr(c, 16, 145.5, 118, 7, 5);
  c.fill();

  // output tray (steel, right side, where soldiers pop out)
  c.fillStyle = steelD;
  rr(c, 62, 138, 78, 12, 5);
  c.fill();
  c.fillStyle = steel;
  rr(c, 62, 134, 78, 10, 5);
  c.fill();
  c.fillStyle = steelL;
  rr(c, 65, 135, 72, 4, 3);
  c.fill();

  // frame column (left)
  c.fillStyle = red;
  rr(c, 18, 34, 30, 116, 10);
  c.fill();
  c.fillStyle = redD;
  c.globalAlpha = 0.75;
  rr(c, 18, 34, 8, 116, 8);
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = redL;
  rr(c, 38, 38, 7, 108, 4);
  c.fill();

  // top crossbeam
  c.fillStyle = red;
  rr(c, 18, 20, 114, 28, 11);
  c.fill();
  c.fillStyle = redD;
  c.globalAlpha = 0.6;
  rr(c, 18, 39, 114, 9, 6);
  c.fill();
  c.globalAlpha = 1;
  c.fillStyle = redL;
  rr(c, 24, 23, 102, 8, 5);
  c.fill();
  c.fillStyle = redSheen;
  rr(c, 28, 24.5, 40, 3.5, 2);
  c.fill();

  // hopper funnel with green pellets
  c.fillStyle = steel;
  c.beginPath();
  c.moveTo(58, 4);
  c.lineTo(112, 4);
  c.lineTo(96, 24);
  c.lineTo(74, 24);
  c.closePath();
  c.fill();
  c.fillStyle = steelL;
  c.beginPath();
  c.moveTo(58, 4);
  c.lineTo(70, 4);
  c.lineTo(80, 24);
  c.lineTo(74, 24);
  c.closePath();
  c.fill();
  c.fillStyle = steelD;
  ell(c, 85, 5, 27, 4.6);
  c.fill();
  // pellets heap
  const gp = GREEN_P;
  c.fillStyle = gp.base;
  ell(c, 85, 4.6, 23, 3.4);
  c.fill();
  for (const [px, py] of [
    [72, 4],
    [80, 2.8],
    [88, 4.4],
    [96, 3.2],
    [84, 5.6],
    [76, 5.8],
    [92, 5.4],
  ] as const) {
    c.fillStyle = gp.light;
    ell(c, px, py, 2.6, 1.7, 0.4);
    c.fill();
  }
  c.fillStyle = gp.spec;
  ell(c, 79, 3.2, 1.4, 0.8, -0.4);
  c.fill();
  ell(c, 90, 4.2, 1.2, 0.7, 0.3);
  c.fill();

  // stamping platform (steel anvil under the piston)
  c.fillStyle = steelD;
  rr(c, 56, 128, 66, 10, 4);
  c.fill();
  c.fillStyle = steel;
  rr(c, 56, 124, 66, 9, 4);
  c.fill();
  c.fillStyle = steelL;
  rr(c, 59, 125, 60, 3.5, 2);
  c.fill();

  // sticker label on the column: cream sticker, worn corner
  c.save();
  c.translate(33, 86);
  c.rotate(-1.5708); // vertical sticker
  c.fillStyle = '#f5e9d0';
  rr(c, -26, -9, 52, 18, 4);
  c.fill();
  c.fillStyle = '#d9c5a0';
  rr(c, -26, 4, 52, 5, 2);
  c.fill();
  // stripes suggesting text
  c.fillStyle = '#c8452c';
  rr(c, -20, -5.5, 40, 6, 3);
  c.fill();
  c.fillStyle = '#8a7a5c';
  rr(c, -16, 3.5, 32, 2.6, 1.3);
  c.fill();
  c.restore();

  // gold bolts
  c.fillStyle = gold;
  for (const [bx, by] of [
    [25, 27],
    [124, 27],
    [25, 140],
    [43, 140],
  ] as const) {
    ell(c, bx, by, 3, 3);
    c.fill();
    c.fillStyle = '#f6e3ae';
    ell(c, bx - 0.9, by - 0.9, 1, 1);
    c.fill();
    c.fillStyle = gold;
  }

  // hard specs on beam + column
  c.fillStyle = spec;
  ell(c, 30, 22.5, 5.5, 1.8, -0.1);
  c.fill();
  ell(c, 41.5, 48, 2, 6, 0);
  c.fill();
}

/** Piston: steel shaft + red ram head with a yellow chevron. Cell 76x74, anchor top-center. */
function molderPiston(c: CanvasRenderingContext2D) {
  const steel = '#8b919b';
  const steelD = '#565b63';
  const steelL = '#aeb4be';
  // shaft
  c.fillStyle = steelD;
  rr(c, 30, 0, 16, 40, 4);
  c.fill();
  c.fillStyle = steel;
  rr(c, 33, 0, 8, 40, 3);
  c.fill();
  c.fillStyle = steelL;
  rr(c, 34.5, 0, 3, 40, 1.5);
  c.fill();
  // spring coils
  c.strokeStyle = steelD;
  c.lineWidth = 2.4;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.ellipse(38, 8 + i * 8, 11, 3.2, 0, 0, Math.PI * 2);
    c.stroke();
  }
  // ram head
  c.fillStyle = '#c8452c';
  rr(c, 8, 38, 60, 26, 8);
  c.fill();
  c.fillStyle = '#7e2413';
  rr(c, 8, 57, 60, 7, 5);
  c.fill();
  c.fillStyle = '#e0674b';
  rr(c, 12, 40, 52, 7, 4);
  c.fill();
  // yellow chevron
  c.fillStyle = '#d9a62e';
  c.beginPath();
  c.moveTo(30, 48);
  c.lineTo(38, 55);
  c.lineTo(46, 48);
  c.lineTo(42, 48);
  c.lineTo(38, 51.4);
  c.lineTo(34, 48);
  c.closePath();
  c.fill();
  // spec
  c.fillStyle = '#fdeee8';
  ell(c, 18, 41.5, 4.6, 1.6, -0.1);
  c.fill();
}

/** Loose pellets sitting in the hopper (shimmer sprite, alpha-pulsed). */
function pellets(c: CanvasRenderingContext2D) {
  const p = GREEN_P;
  for (const [px, py, r] of [
    [8, 8, 3],
    [16, 6, 2.6],
    [24, 8.4, 3],
    [32, 6.4, 2.4],
    [38, 8.2, 2.6],
  ] as const) {
    c.fillStyle = p.sheen;
    ell(c, px, py, r, r * 0.7, 0.3);
    c.fill();
    c.fillStyle = p.spec;
    ell(c, px - 0.8, py - 0.8, r * 0.4, r * 0.28, -0.4);
    c.fill();
  }
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

/** Plastic shard for knockover bursts (white; tinted per faction at runtime). */
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

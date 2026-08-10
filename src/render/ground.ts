import { Texture } from 'pixi.js';
import type { Rng } from '../sim/rng';

/**
 * Bake the zone diorama to an offscreen canvas ONCE (never per-frame).
 * The grade is HOT (ART_NOTES §2): saturated, contrasty, warm — the environment
 * carries the miniature-photo look while the figures stay in their toy pigments.
 * Giant props are baked into the ground composite so the tilt-shift strips blur
 * them consistently for free.
 *
 * Zone 0: bedroom carpet. Zone 1: under the bed (dark). More zones in M3+.
 */

export interface GroundBake {
  texture: Texture;
  canvas: HTMLCanvasElement;
  scale: number;
}

export function bakeGround(w: number, h: number, zone: number, rng: Rng): GroundBake {
  const canvas = document.createElement('canvas');
  const S = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.ceil(w * S);
  canvas.height = Math.ceil(h * S);
  const c = canvas.getContext('2d')!;
  c.scale(S, S);

  if (zone === 1) {
    underBed(c, w, h, rng);
  } else {
    carpet(c, w, h, rng);
  }

  const texture = Texture.from(canvas);
  texture.source.resolution = S;
  return { texture, canvas, scale: S };
}

// ---------------------------------------------------------------- zone 0: carpet

function carpet(c: CanvasRenderingContext2D, w: number, h: number, rng: Rng) {
  // walnut-warm cut-pile — hot enough to grade as miniature photography, but
  // dark/cool enough that pale-bone tan figures pop against it
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#6e3d22');
  g.addColorStop(0.42, '#93552f');
  g.addColorStop(0.62, '#985a33');
  g.addColorStop(1, '#6a3a20');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // loop-pile weave: horizontal wale rows make it read as CARPET, not gradient
  c.lineCap = 'round';
  const rowH = 7;
  for (let y = 0; y < h + rowH; y += rowH) {
    c.strokeStyle = 'rgba(50,22,8,0.16)';
    c.lineWidth = 2.4;
    c.beginPath();
    for (let x = 0; x <= w + 8; x += 8) {
      const yy = y + Math.sin(x * 0.09 + y * 1.7) * 1.6;
      if (x === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
    c.strokeStyle = 'rgba(220,150,95,0.1)';
    c.lineWidth = 1.4;
    c.beginPath();
    for (let x = 0; x <= w + 8; x += 8) {
      const yy = y - 2.4 + Math.sin(x * 0.09 + y * 1.7) * 1.6;
      if (x === 0) c.moveTo(x, yy);
      else c.lineTo(x, yy);
    }
    c.stroke();
  }

  // dense pile speckle
  const darks = ['#5a2d14', '#66351a', '#4c2510'];
  const lights = ['#b57746', '#c28653', '#cf9660'];
  const n = Math.floor((w * h) / 95);
  for (let i = 0; i < n; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 0.7 + rng() * 1.8;
    c.fillStyle = (rng() < 0.52 ? darks : lights)[(rng() * 3) | 0];
    c.globalAlpha = 0.2 + rng() * 0.28;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  // fiber tufts
  c.globalAlpha = 0.14;
  for (let i = 0; i < n / 6; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const a = rng() * Math.PI;
    const len = 3 + rng() * 6;
    c.strokeStyle = rng() < 0.5 ? '#4c2510' : '#cf9660';
    c.lineWidth = 0.8 + rng() * 0.9;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.stroke();
  }
  c.globalAlpha = 1;

  // focus-band lift: the sharp zone reads brighter, like studio light on the action
  const band = c.createLinearGradient(0, h * 0.3, 0, h * 0.85);
  band.addColorStop(0, 'rgba(255,235,205,0)');
  band.addColorStop(0.35, 'rgba(255,235,205,0.09)');
  band.addColorStop(0.65, 'rgba(255,235,205,0.09)');
  band.addColorStop(1, 'rgba(255,235,205,0)');
  c.fillStyle = band;
  c.fillRect(0, 0, w, h);

  // ---- giant props (scale contrast IS the fantasy)
  pencil(c, w * 0.02, h * 0.135, w * 0.9);
  legoBrick(c, w * 0.66, h * 0.225, w * 0.24, '#c33a31', '#8f1f18', '#e05a50');
  legoBrick(c, w * 0.84, h * 0.185, w * 0.19, '#2a63b8', '#1a4187', '#4a86d8');
  midgroundProps(c, w, h, rng);

  // vignette: 12% corner darkening + top/bottom press
  const v = c.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(40,16,4,0.34)');
  v.addColorStop(0.3, 'rgba(40,16,4,0)');
  v.addColorStop(0.72, 'rgba(40,16,4,0)');
  v.addColorStop(1, 'rgba(40,16,4,0.4)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, h);
  const rad = c.createRadialGradient(w / 2, h * 0.55, h * 0.3, w / 2, h * 0.55, h * 0.75);
  rad.addColorStop(0, 'rgba(30,10,2,0)');
  rad.addColorStop(1, 'rgba(30,10,2,0.16)');
  c.fillStyle = rad;
  c.fillRect(0, 0, w, h);
}

/** Giant yellow pencil lying across the top of the frame. */
function pencil(c: CanvasRenderingContext2D, x: number, y: number, len: number) {
  const bodyH = len * 0.062;
  const tipLen = bodyH * 2.6;
  const bodyLen = len - tipLen - bodyH * 1.9;

  c.save();
  c.translate(x, y);
  c.rotate(-0.025);

  // contact shadow
  c.fillStyle = 'rgba(30,10,2,0.3)';
  c.beginPath();
  c.ellipse(len * 0.5, bodyH * 1.18, len * 0.5, bodyH * 0.42, 0, 0, Math.PI * 2);
  c.fill();

  // sharpened tip (left): wood cone + graphite
  c.fillStyle = '#e8c290';
  c.beginPath();
  c.moveTo(0, bodyH * 0.5);
  c.lineTo(tipLen, 0);
  c.lineTo(tipLen, bodyH);
  c.closePath();
  c.fill();
  c.fillStyle = '#caa06a';
  c.beginPath();
  c.moveTo(tipLen * 0.28, bodyH * 0.42);
  c.lineTo(tipLen, bodyH * 0.55);
  c.lineTo(tipLen, bodyH);
  c.closePath();
  c.fill();
  c.fillStyle = '#3a3430';
  c.beginPath();
  c.moveTo(0, bodyH * 0.5);
  c.lineTo(tipLen * 0.3, bodyH * 0.33);
  c.lineTo(tipLen * 0.3, bodyH * 0.7);
  c.closePath();
  c.fill();

  // hex body facets: light top, mid, dark bottom
  const bx = tipLen;
  c.fillStyle = '#f4c33c';
  c.fillRect(bx, 0, bodyLen, bodyH * 0.34);
  c.fillStyle = '#e0a922';
  c.fillRect(bx, bodyH * 0.34, bodyLen, bodyH * 0.4);
  c.fillStyle = '#b7830f';
  c.fillRect(bx, bodyH * 0.74, bodyLen, bodyH * 0.26);
  // spec stripe on the top facet
  c.fillStyle = 'rgba(255,248,220,0.55)';
  c.fillRect(bx + bodyLen * 0.06, bodyH * 0.06, bodyLen * 0.5, bodyH * 0.1);

  // ferrule + eraser (right)
  const fx = bx + bodyLen;
  c.fillStyle = '#9aa1ac';
  c.fillRect(fx, -bodyH * 0.04, bodyH * 0.85, bodyH * 1.08);
  c.fillStyle = '#c6ccd6';
  c.fillRect(fx + bodyH * 0.08, bodyH * 0.05, bodyH * 0.18, bodyH * 0.9);
  c.fillStyle = '#565b63';
  c.fillRect(fx + bodyH * 0.38, -bodyH * 0.04, bodyH * 0.1, bodyH * 1.08);
  c.fillStyle = '#e2808f';
  c.beginPath();
  c.roundRect(fx + bodyH * 0.85, -bodyH * 0.02, bodyH * 1.05, bodyH * 1.04, bodyH * 0.4);
  c.fill();
  c.fillStyle = '#c05a6c';
  c.beginPath();
  c.roundRect(fx + bodyH * 0.85, bodyH * 0.62, bodyH * 1.05, bodyH * 0.4, bodyH * 0.28);
  c.fill();
  c.fillStyle = 'rgba(255,235,240,0.7)';
  c.beginPath();
  c.ellipse(fx + bodyH * 1.2, bodyH * 0.2, bodyH * 0.3, bodyH * 0.12, -0.2, 0, Math.PI * 2);
  c.fill();

  c.restore();
}

/** LEGO-style brick seen from a high angle: bright top with studs, dark front. */
function legoBrick(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  bw: number,
  top: string,
  front: string,
  lightC: string
) {
  const bh = bw * 0.42; // top face depth
  const fh = bw * 0.3; // front face height

  // contact shadow
  c.fillStyle = 'rgba(30,10,2,0.32)';
  c.beginPath();
  c.ellipse(x + bw * 0.5, y + bh + fh * 0.86, bw * 0.58, fh * 0.34, 0, 0, Math.PI * 2);
  c.fill();

  // front face
  c.fillStyle = front;
  c.beginPath();
  c.roundRect(x, y + bh * 0.72, bw, fh + bh * 0.28, bw * 0.02);
  c.fill();
  // top face
  c.fillStyle = top;
  c.beginPath();
  c.roundRect(x, y, bw, bh, bw * 0.025);
  c.fill();
  // top light wash
  c.fillStyle = lightC;
  c.globalAlpha = 0.5;
  c.beginPath();
  c.roundRect(x + bw * 0.02, y + bh * 0.04, bw * 0.96, bh * 0.32, bw * 0.02);
  c.fill();
  c.globalAlpha = 1;

  // studs: 2 rows of 4
  const sr = bw * 0.085;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 4; i++) {
      const sx = x + bw * (0.155 + i * 0.23);
      const sy = y + bh * (0.3 + row * 0.42);
      c.fillStyle = front;
      c.beginPath();
      c.ellipse(sx, sy + sr * 0.24, sr, sr * 0.62, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = top;
      c.beginPath();
      c.ellipse(sx, sy, sr, sr * 0.62, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = lightC;
      c.beginPath();
      c.ellipse(sx - sr * 0.2, sy - sr * 0.12, sr * 0.55, sr * 0.3, -0.2, 0, Math.PI * 2);
      c.fill();
    }
  }
  // hard spec on near edge
  c.fillStyle = 'rgba(255,245,235,0.65)';
  c.beginPath();
  c.roundRect(x + bw * 0.05, y + bh * 0.72 + fh * 0.06, bw * 0.3, fh * 0.09, fh * 0.05);
  c.fill();
}

function midgroundProps(c: CanvasRenderingContext2D, w: number, h: number, rng: Rng) {
  dice(c, w * 0.76, h * 0.54, w * 0.13);
  domino(c, w * 0.62, h * 0.66, w * 0.2, -0.28);
  domino(c, w * 0.68, h * 0.69, w * 0.2, -0.12);
  gluePuddle(c, w * 0.58, h * 0.66, w * 0.13);
  bottleCap(c, w * 0.83, h * 0.69, w * 0.08);
  toyCrate(c, w * 0.25, h * 0.75, w * 0.15);
  jack(c, w * 0.18, h * 0.52, w * 0.045, rng);
}

function dice(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = 'rgba(30,10,2,0.32)';
  c.beginPath();
  c.ellipse(x + s * 0.45, y + s * 0.72, s * 0.58, s * 0.2, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#fff4d8';
  c.beginPath();
  c.roundRect(x, y, s, s * 0.82, s * 0.12);
  c.fill();
  c.fillStyle = '#d7c5a0';
  c.beginPath();
  c.roundRect(x, y + s * 0.58, s, s * 0.24, s * 0.08);
  c.fill();
  c.fillStyle = '#2b2418';
  for (const [px, py] of [
    [0.28, 0.24],
    [0.72, 0.24],
    [0.5, 0.42],
    [0.28, 0.6],
    [0.72, 0.6],
  ] as const) {
    c.beginPath();
    c.ellipse(x + s * px, y + s * py, s * 0.055, s * 0.045, 0, 0, Math.PI * 2);
    c.fill();
  }
}

function domino(c: CanvasRenderingContext2D, x: number, y: number, s: number, r: number) {
  c.save();
  c.translate(x, y);
  c.rotate(r);
  c.fillStyle = 'rgba(30,10,2,0.28)';
  c.beginPath();
  c.ellipse(s * 0.5, s * 0.24, s * 0.55, s * 0.16, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f4ead6';
  c.beginPath();
  c.roundRect(0, 0, s, s * 0.42, s * 0.08);
  c.fill();
  c.strokeStyle = '#8a7a5c';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(s * 0.5, s * 0.06);
  c.lineTo(s * 0.5, s * 0.36);
  c.stroke();
  c.fillStyle = '#2b2418';
  for (const [px, py] of [
    [0.22, 0.16],
    [0.32, 0.29],
    [0.68, 0.16],
    [0.78, 0.29],
  ] as const) {
    c.beginPath();
    c.arc(s * px, s * py, s * 0.035, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function gluePuddle(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = 'rgba(180,220,210,0.38)';
  c.beginPath();
  c.ellipse(x, y, s * 0.72, s * 0.38, -0.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(245,255,250,0.55)';
  c.beginPath();
  c.ellipse(x - s * 0.2, y - s * 0.1, s * 0.25, s * 0.08, -0.4, 0, Math.PI * 2);
  c.fill();
}

function bottleCap(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.fillStyle = 'rgba(30,10,2,0.3)';
  c.beginPath();
  c.ellipse(x, y + r * 0.3, r * 1.2, r * 0.42, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#2a63b8';
  c.beginPath();
  c.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#1a4187';
  c.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r * 0.84, y + Math.sin(a) * r * 0.32);
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.42);
    c.stroke();
  }
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath();
  c.ellipse(x - r * 0.25, y - r * 0.08, r * 0.32, r * 0.08, -0.2, 0, Math.PI * 2);
  c.fill();
}

function toyCrate(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = 'rgba(30,10,2,0.28)';
  c.beginPath();
  c.ellipse(x + s * 0.5, y + s * 0.75, s * 0.58, s * 0.18, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#d9a62e';
  c.beginPath();
  c.roundRect(x, y, s, s * 0.62, s * 0.08);
  c.fill();
  c.fillStyle = '#9a7014';
  c.fillRect(x, y + s * 0.46, s, s * 0.16);
  c.fillRect(x + s * 0.42, y, s * 0.14, s * 0.62);
  c.strokeStyle = '#f6e3ae';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + s * 0.08, y + s * 0.1);
  c.lineTo(x + s * 0.92, y + s * 0.1);
  c.stroke();
}

function jack(c: CanvasRenderingContext2D, x: number, y: number, s: number, rng: Rng) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.4 + rng() * 0.2);
  c.strokeStyle = '#c6ccd6';
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-s, 0);
  c.lineTo(s, 0);
  c.moveTo(0, -s);
  c.lineTo(0, s);
  c.moveTo(-s * 0.7, -s * 0.7);
  c.lineTo(s * 0.7, s * 0.7);
  c.stroke();
  c.fillStyle = '#f4f7fc';
  for (const [px, py] of [
    [-s, 0],
    [s, 0],
    [0, -s],
    [0, s],
  ] as const) {
    c.beginPath();
    c.arc(px, py, s * 0.18, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------- zone 1: under the bed

function underBed(c: CanvasRenderingContext2D, w: number, h: number, rng: Rng) {
  // shadowed hardwood, cool and dusty
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#241a12');
  g.addColorStop(0.5, '#3d2c1c');
  g.addColorStop(1, '#20150d');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // planks
  const planks = 8;
  for (let i = 0; i <= planks; i++) {
    const y = (h / planks) * i + (rng() - 0.5) * 8;
    c.strokeStyle = 'rgba(0,0,0,0.45)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
    // board sheen along top edge of each plank
    c.strokeStyle = 'rgba(160,120,70,0.14)';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, y + 4);
    c.lineTo(w, y + 4);
    c.stroke();
  }
  // wood grain
  c.globalAlpha = 0.14;
  for (let i = 0; i < (w * h) / 380; i++) {
    const x = rng() * w;
    const y = rng() * h;
    c.strokeStyle = rng() < 0.5 ? '#0e0a06' : '#5e4830';
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 8 + rng() * 18, y + (rng() - 0.5) * 2);
    c.stroke();
  }
  c.globalAlpha = 1;

  // moonlight slice from the bed edge
  const beam = c.createLinearGradient(0, 0, w * 0.4, h * 0.25);
  beam.addColorStop(0, 'rgba(140,160,200,0.13)');
  beam.addColorStop(1, 'rgba(140,160,200,0)');
  c.fillStyle = beam;
  c.fillRect(0, 0, w, h * 0.5);

  // dust bunnies + motes
  for (let i = 0; i < 6; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 8 + rng() * 16;
    c.fillStyle = 'rgba(120,105,88,0.12)';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(140,125,105,0.18)';
    c.lineWidth = 1;
    for (let k = 0; k < 7; k++) {
      const a = rng() * Math.PI * 2;
      c.beginPath();
      c.moveTo(x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4);
      c.quadraticCurveTo(
        x + Math.cos(a + 0.6) * r * 0.9,
        y + Math.sin(a + 0.6) * r * 0.9,
        x + Math.cos(a + 1) * r * 1.15,
        y + Math.sin(a + 1) * r * 1.15
      );
      c.stroke();
    }
  }
  for (let i = 0; i < 130; i++) {
    c.fillStyle = '#9a8a72';
    c.globalAlpha = 0.05 + rng() * 0.1;
    c.beginPath();
    c.arc(rng() * w, rng() * h, 0.6 + rng() * 1.4, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;

  // heavy vignette — it's dark under here
  const v = c.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(0,0,0,0.8)');
  v.addColorStop(0.32, 'rgba(0,0,0,0.18)');
  v.addColorStop(0.7, 'rgba(0,0,0,0.12)');
  v.addColorStop(1, 'rgba(0,0,0,0.7)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, h);
}

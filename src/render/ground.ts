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
  coins(c, w * 0.76, h * 0.775, w, rng);

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

/** A few dropped pennies/quarters, giant relative to the soldiers. */
function coins(c: CanvasRenderingContext2D, x: number, y: number, w: number, rng: Rng) {
  const defs = [
    { dx: 0, dy: 0, r: w * 0.085, main: '#c9962e', edge: '#8f6716', lite: '#e8bc55' },
    { dx: w * 0.1, dy: w * 0.045, r: w * 0.07, main: '#b0733a', edge: '#7c4c20', lite: '#d29558' },
    { dx: -w * 0.04, dy: w * 0.075, r: w * 0.06, main: '#c9962e', edge: '#8f6716', lite: '#e8bc55' },
  ];
  for (const d of defs) {
    const cx = x + d.dx;
    const cy = y + d.dy;
    const ry = d.r * 0.42;
    c.fillStyle = 'rgba(30,10,2,0.3)';
    c.beginPath();
    c.ellipse(cx + d.r * 0.05, cy + ry * 0.5, d.r * 1.04, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = d.edge;
    c.beginPath();
    c.ellipse(cx, cy + ry * 0.22, d.r, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = d.main;
    c.beginPath();
    c.ellipse(cx, cy, d.r, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = d.lite;
    c.beginPath();
    c.ellipse(cx - d.r * 0.15, cy - ry * 0.18, d.r * 0.72, ry * 0.62, 0, 0, Math.PI * 2);
    c.fill();
    // embossed profile suggestion
    c.fillStyle = d.main;
    c.beginPath();
    c.ellipse(cx - d.r * 0.08, cy - ry * 0.08, d.r * 0.4, ry * 0.4, 0, 0, Math.PI * 2);
    c.fill();
    // reeded edge ticks
    c.strokeStyle = d.edge;
    c.lineWidth = Math.max(1, d.r * 0.04);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.15 + (i / 9) * 0.7);
      const ex = cx + Math.cos(a) * d.r;
      const ey = cy + ry * 0.22 + Math.sin(a) * ry;
      c.beginPath();
      c.moveTo(ex, ey);
      c.lineTo(ex, ey - ry * 0.2);
      c.stroke();
    }
    // hard spec
    c.fillStyle = 'rgba(255,250,235,0.8)';
    c.beginPath();
    c.ellipse(cx - d.r * 0.35, cy - ry * 0.35, d.r * 0.16, ry * 0.14, -0.4, 0, Math.PI * 2);
    c.fill();
    void rng;
  }
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

  // vignette — dark under here, but the top third must not be a dead void
  const v = c.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(0,0,0,0.52)');
  v.addColorStop(0.32, 'rgba(0,0,0,0.15)');
  v.addColorStop(0.7, 'rgba(0,0,0,0.1)');
  v.addColorStop(1, 'rgba(0,0,0,0.6)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, h);
}

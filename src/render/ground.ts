import { Texture } from 'pixi.js';
import type { Rng } from '../sim/rng';

/**
 * Bake the zone ground to an offscreen canvas ONCE (never per-frame).
 * Zone 0: bedroom carpet. Zone 1: under the bed (dark). More zones in M3+.
 */
export function bakeGround(w: number, h: number, zone: number, rng: Rng): Texture {
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

  const tex = Texture.from(canvas);
  tex.source.resolution = S;
  return tex;
}

function carpet(c: CanvasRenderingContext2D, w: number, h: number, rng: Rng) {
  // warm cut-pile carpet: base wash, dense speckle, sparse fiber strokes
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#8d6e4b');
  g.addColorStop(0.5, '#9a7852');
  g.addColorStop(1, '#7f6244');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // speckle
  const darks = ['#6e5439', '#7a5e40', '#5f4832'];
  const lights = ['#ac8a61', '#b5946b', '#c2a077'];
  const n = Math.floor((w * h) / 110);
  for (let i = 0; i < n; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const r = 0.7 + rng() * 1.7;
    c.fillStyle = (rng() < 0.5 ? darks : lights)[(rng() * 3) | 0];
    c.globalAlpha = 0.25 + rng() * 0.3;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  // fiber strokes
  c.globalAlpha = 0.14;
  c.lineCap = 'round';
  for (let i = 0; i < n / 6; i++) {
    const x = rng() * w;
    const y = rng() * h;
    const a = rng() * Math.PI;
    const len = 3 + rng() * 5;
    c.strokeStyle = rng() < 0.5 ? '#5f4832' : '#c2a077';
    c.lineWidth = 0.8 + rng() * 0.8;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    c.stroke();
  }
  c.globalAlpha = 1;

  // baked vignette (top/bottom darkening sells the high-angle look)
  const v = c.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(30,18,8,0.42)');
  v.addColorStop(0.28, 'rgba(30,18,8,0)');
  v.addColorStop(0.75, 'rgba(30,18,8,0)');
  v.addColorStop(1, 'rgba(30,18,8,0.5)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, h);
}

function underBed(c: CanvasRenderingContext2D, w: number, h: number, rng: Rng) {
  // dark hardwood in shadow, dust motes
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#241a12');
  g.addColorStop(0.5, '#33261a');
  g.addColorStop(1, '#1d140d');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);

  // plank lines (horizontal, receding)
  c.strokeStyle = 'rgba(0,0,0,0.4)';
  const planks = 9;
  for (let i = 1; i < planks; i++) {
    const y = (h / planks) * i + (rng() - 0.5) * 6;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(w, y);
    c.stroke();
  }
  // wood grain flecks
  c.globalAlpha = 0.12;
  for (let i = 0; i < (w * h) / 400; i++) {
    const x = rng() * w;
    const y = rng() * h;
    c.strokeStyle = rng() < 0.5 ? '#0e0a06' : '#4a3826';
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + 6 + rng() * 14, y + (rng() - 0.5) * 2);
    c.stroke();
  }
  // dust motes
  for (let i = 0; i < 120; i++) {
    c.fillStyle = '#8a7a64';
    c.globalAlpha = 0.05 + rng() * 0.1;
    c.beginPath();
    c.arc(rng() * w, rng() * h, 0.6 + rng() * 1.4, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;

  const v = c.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(0,0,0,0.75)');
  v.addColorStop(0.3, 'rgba(0,0,0,0.15)');
  v.addColorStop(0.7, 'rgba(0,0,0,0.1)');
  v.addColorStop(1, 'rgba(0,0,0,0.65)');
  c.fillStyle = v;
  c.fillRect(0, 0, w, h);
}

import { Sprite, Texture } from 'pixi.js';

/**
 * Tilt-shift miniature pass (ART_NOTES §2), the cheap way: blur the baked ground
 * composite ONCE at bake time (ctx.filter — bake-time only, never per-frame),
 * cut top/bottom strips with alpha ramps baked in, and lay them over the world
 * as two static sprites. Zero per-frame cost.
 *
 * Band geometry (fractions of H):
 *   full blur 0 → 0.27, ramp to sharp by 0.39 | sharp 0.39 → 0.71 | ramp to
 *   full blur by 0.80 → 1. Units live in 0.41–0.73; only the extreme bottom of
 *   the band gets a light veil, which reads as depth.
 */

export interface TiltShift {
  top: Sprite;
  bottom: Sprite;
}

export function bakeTiltShift(
  groundCanvas: HTMLCanvasElement,
  h: number,
  scale: number
): TiltShift {
  // blurred copy of the whole composite (10px ≈ 1.2% of H at 844pt)
  const blurPx = Math.max(6, Math.round(h * 0.012)) * scale;
  const blurred = document.createElement('canvas');
  blurred.width = groundCanvas.width;
  blurred.height = groundCanvas.height;
  const bc = blurred.getContext('2d')!;
  bc.filter = `blur(${blurPx}px)`;
  bc.drawImage(groundCanvas, 0, 0);
  // re-draw edges to fight blur's transparent fringe
  bc.filter = `blur(${Math.round(blurPx / 2)}px)`;
  bc.drawImage(groundCanvas, 0, 0);
  bc.filter = 'none';

  const topH = Math.round(h * 0.39);
  const botY = Math.round(h * 0.71);
  const botH = h - botY;

  const top = strip(blurred, scale, 0, topH, (g) => {
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.27 / 0.39, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
  });
  top.sprite.position.set(0, 0);

  const bottom = strip(blurred, scale, botY, botH, (g) => {
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop((0.8 - 0.71) / (1 - 0.71), 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
  });
  bottom.sprite.position.set(0, botY);

  return { top: top.sprite, bottom: bottom.sprite };
}

function strip(
  blurred: HTMLCanvasElement,
  scale: number,
  srcY: number,
  srcH: number,
  stops: (g: CanvasLinearGradient) => void
): { sprite: Sprite } {
  const canvas = document.createElement('canvas');
  canvas.width = blurred.width;
  canvas.height = Math.ceil(srcH * scale);
  const c = canvas.getContext('2d')!;
  c.drawImage(
    blurred,
    0,
    srcY * scale,
    blurred.width,
    srcH * scale,
    0,
    0,
    canvas.width,
    canvas.height
  );
  // slight darken inside the blur zone helps the depth read
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = 'rgba(20,8,2,0.1)';
  c.fillRect(0, 0, canvas.width, canvas.height);
  // alpha ramp
  c.globalCompositeOperation = 'destination-in';
  const g = c.createLinearGradient(0, 0, 0, canvas.height);
  stops(g);
  c.fillStyle = g;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.globalCompositeOperation = 'source-over';

  const tex = Texture.from(canvas);
  tex.source.resolution = scale;
  const sprite = new Sprite(tex);
  return { sprite };
}

type CanvasLinearGradient = CanvasGradient;

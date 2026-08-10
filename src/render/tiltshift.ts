import { Sprite, Texture } from 'pixi.js';

/**
 * Tilt-shift miniature pass (ART_NOTES §2), the cheap way: blur strips of the
 * baked ground ONCE at bake time (ctx.filter — bake-time only, never per-frame)
 * and lay them over the world as two static sprites. Zero per-frame cost.
 *
 * Cost control (perf audit): only the two strip regions are blurred (the sharp
 * middle ~32% is never touched), and the blur runs at HALF device resolution —
 * it's blurred anyway, so the upscale is invisible. ~8x cheaper than blurring
 * the full composite at full res, which stalled mid-game rebakes on phones.
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
  const blurPx = Math.max(6, Math.round(h * 0.012)); // CSS px (≈1.2% of H)

  const topH = Math.round(h * 0.39);
  const botY = Math.round(h * 0.71);
  const botH = h - botY;

  const top = blurStrip(groundCanvas, scale, 0, topH, blurPx, (g) => {
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.27 / 0.39, 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
  });
  top.position.set(0, 0);

  const bottom = blurStrip(groundCanvas, scale, botY, botH, blurPx, (g) => {
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop((0.8 - 0.71) / (1 - 0.71), 'rgba(0,0,0,1)');
    g.addColorStop(1, 'rgba(0,0,0,1)');
  });
  bottom.position.set(0, botY);

  return { top, bottom };
}

function blurStrip(
  ground: HTMLCanvasElement,
  scale: number,
  srcY: number,
  srcH: number,
  blurPx: number,
  stops: (g: CanvasGradient) => void
): Sprite {
  const HALF = 0.5; // blur resolution relative to device pixels
  const pad = blurPx * 2; // sample past the strip edge so the blur doesn't fringe
  const padTop = Math.min(pad, srcY);
  const padH = srcH + padTop + pad;

  // 1. downscale the strip region (+padding) to half res and blur it there
  const small = document.createElement('canvas');
  small.width = Math.max(1, Math.round(ground.width * HALF));
  small.height = Math.max(1, Math.round(padH * scale * HALF));
  const sc = small.getContext('2d')!;
  sc.filter = `blur(${Math.max(2, Math.round(blurPx * scale * HALF * 0.5))}px)`;
  sc.drawImage(
    ground,
    0,
    (srcY - padTop) * scale,
    ground.width,
    padH * scale,
    0,
    0,
    small.width,
    small.height
  );
  sc.filter = 'none';
  // second, lighter pass tightens the gaussian and fights edge fringe
  sc.globalAlpha = 0.6;
  sc.filter = `blur(${Math.max(1, Math.round(blurPx * scale * HALF * 0.25))}px)`;
  sc.drawImage(small, 0, 0);
  sc.filter = 'none';
  sc.globalAlpha = 1;

  // 2. upscale into the final strip canvas, darken slightly, bake the alpha ramp
  const canvas = document.createElement('canvas');
  canvas.width = ground.width;
  canvas.height = Math.max(1, Math.ceil(srcH * scale));
  const c = canvas.getContext('2d')!;
  const offY = (padTop / padH) * small.height;
  c.drawImage(
    small,
    0,
    offY,
    small.width,
    small.height * (srcH / padH),
    0,
    0,
    canvas.width,
    canvas.height
  );
  c.globalCompositeOperation = 'source-atop';
  c.fillStyle = 'rgba(20,8,2,0.1)';
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.globalCompositeOperation = 'destination-in';
  const g = c.createLinearGradient(0, 0, 0, canvas.height);
  stops(g);
  c.fillStyle = g;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.globalCompositeOperation = 'source-over';

  const tex = Texture.from(canvas);
  tex.source.resolution = scale;
  return new Sprite(tex);
}

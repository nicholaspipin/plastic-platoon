import type { SimEvent } from '../sim/sim';

/**
 * WebAudio toy-foley synth. Built lazily on first user gesture (iOS rule).
 * M0: interface + unlock wiring. Full sound set lands in M2.
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      this.ctx = null;
    }
  }

  handleEvent(e: SimEvent) {
    if (this.muted || !this.ctx) return;
    void e; // M2: tok/chunk/blip/snap/thud + pitch ladders
  }
}

import type { SimEvent } from '../sim/sim';

/**
 * WebAudio toy-foley synth (ART_NOTES §3 sound layering, brief §4.6).
 * Toy-box foley, not war: plastic clicks, "tok"s, press chunks, pops.
 * Everything is synthesized — zero sample downloads. Built lazily on first
 * user gesture (iOS rule). Pitch ladders rise on streaks, reset after ~1s idle.
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  // pitch ladders
  private collectStep = 0;
  private lastCollect = 0;
  private killStep = 0;
  private lastKill = 0;
  // rate limiting so 40 rifles don't stack 40 cracks per frame
  private lastFire = 0;
  private lastTok = 0;
  private lastBlip = 0;

  unlock() {
    if (this.ctx) {
      // iOS sets a non-standard 'interrupted' state after calls/Siri — resume
      // from anything that isn't running, or audio dies for the session
      if (this.ctx.state !== 'running') void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      const len = this.ctx.sampleRate * 0.5;
      this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    } catch {
      this.ctx = null;
    }
  }

  handleEvent(e: SimEvent) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    switch (e.type) {
      case 'stamp':
        this.chunk(t);
        break;
      case 'fire':
        // tiny plastic crack, rate-limited, greens only slightly brighter
        if (t - this.lastFire > 0.055) {
          this.lastFire = t;
          this.crack(t, e.faction === 0 ? 1900 : 1500);
        }
        break;
      case 'kill':
        if (e.kind === 'rifleman' || e.kind === 'bazooka' || e.kind === 'gunner') {
          if (t - this.lastTok > 0.045) {
            this.lastTok = t;
            if (t - this.lastKill > 1) this.killStep = 0;
            this.lastKill = t;
            this.tok(t, this.killStep);
            this.killStep = Math.min(this.killStep + 1, 11);
          }
        } else {
          this.thud(t);
        }
        break;
      case 'collect': {
        if (t - this.lastCollect > 1) this.collectStep = 0;
        this.lastCollect = t;
        // rate-limited: a band snap lands dozens of collects in one frame,
        // which would stack into hard clipping
        if (t - this.lastBlip > 0.04) {
          this.lastBlip = t;
          this.blip(t, this.collectStep);
        }
        this.collectStep = Math.min(this.collectStep + 1, 14);
        break;
      }
      case 'band':
        this.snap(t);
        break;
      case 'bandReady':
        this.click(t);
        break;
      case 'buy':
        this.chime(t);
        break;
      case 'waveStart':
        this.drumroll(t);
        break;
      case 'stepTik':
        if (t - this.lastTok > 0.08) {
          this.lastTok = t;
          this.stepTik(t, e.count);
        }
        break;
      default:
        break;
    }
  }

  // ------------------------------------------------------------ voices

  private env(t: number, a: number, peak: number, d: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    g.connect(this.master!);
    return g;
  }

  private noise(t: number, dur: number, filterHz: number, q: number, peak: number, type: BiquadFilterType = 'bandpass') {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = filterHz;
    f.Q.value = q;
    const g = this.env(t, 0.004, peak, dur);
    src.connect(f).connect(g);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  private tone(
    t: number,
    freq: number,
    dur: number,
    peak: number,
    type: OscillatorType = 'sine',
    freqEnd?: number
  ) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = this.env(t, 0.005, peak, dur);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  /** Plastic knock — a toy tipping onto carpet. Pitch ladder on streaks. */
  private tok(t: number, step: number) {
    const p = Math.pow(2, step / 12);
    this.tone(t, 340 * p, 0.07, 0.32, 'triangle', 190 * p);
    this.noise(t, 0.05, 2400 * p, 1.6, 0.2);
  }

  /** Rifle: tiny plastic crack (transient + narrow noise). */
  private crack(t: number, hz: number) {
    this.noise(t, 0.035, hz + Math.random() * 500, 3.5, 0.1);
    this.tone(t, 900 + Math.random() * 240, 0.025, 0.055, 'square', 500);
  }

  /** Molder stamp: mechanical press — deep chunk with metal ring. */
  private chunk(t: number) {
    this.tone(t, 110, 0.16, 0.5, 'sine', 46);
    this.noise(t, 0.08, 420, 1.1, 0.34, 'lowpass');
    this.tone(t + 0.045, 1750, 0.06, 0.09, 'triangle', 1150);
  }

  /** Boss down: deep floor thud + rattle. */
  private thud(t: number) {
    this.tone(t, 82, 0.34, 0.85, 'sine', 34);
    this.noise(t, 0.22, 240, 0.8, 0.5, 'lowpass');
    this.noise(t + 0.06, 0.15, 1500, 1.2, 0.2);
    this.tone(t + 0.1, 250, 0.12, 0.22, 'triangle', 130);
  }

  /** Scrap collect: rising chip-tune blip ladder. */
  private blip(t: number, step: number) {
    const p = Math.pow(2, Math.min(step, 14) / 12);
    this.tone(t, 620 * p, 0.055, 0.15, 'square', 900 * p);
  }

  /** Rubber band: elastic twang + sharp release. */
  private snap(t: number) {
    this.noise(t, 0.04, 3000, 2, 0.42);
    this.tone(t, 300, 0.14, 0.5, 'sawtooth', 60);
    this.tone(t + 0.015, 170, 0.1, 0.3, 'sine', 70);
  }

  /** Band ready again: soft click. */
  private click(t: number) {
    this.tone(t, 1250, 0.04, 0.1, 'triangle', 950);
  }

  /** Low-volume oval-base contact: an army of tiny rigid plastic steps. */
  private stepTik(t: number, count: number) {
    const mass = Math.min(1, count / 90);
    this.tone(t, 620 + Math.random() * 80, 0.035, 0.025 + mass * 0.055, 'triangle', 360);
    this.noise(t, 0.025, 1800 + Math.random() * 500, 1.2, 0.018 + mass * 0.035);
  }

  /** Upgrade: rising two-note toy chime. */
  private chime(t: number) {
    this.tone(t, 660, 0.14, 0.3, 'triangle');
    this.tone(t + 0.09, 990, 0.24, 0.3, 'triangle');
    this.tone(t + 0.09, 1980, 0.18, 0.08, 'sine');
  }

  /** Wave incoming: quick faint drumroll on toy drum. */
  private drumroll(t: number) {
    for (let i = 0; i < 7; i++) {
      const tt = t + i * 0.065;
      this.noise(tt, 0.045, 900 + (i % 2) * 300, 1.4, 0.12 - i * 0.008, 'bandpass');
      this.tone(tt, 190, 0.04, 0.1, 'triangle', 150);
    }
  }
}

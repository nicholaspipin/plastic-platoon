import type { Sim, SimEvent, UpgradeId } from '../sim/sim';

export interface HudCallbacks {
  onBuy: (id: UpgradeId) => void;
  onMute: (muted: boolean) => void;
  onStart: () => void;
}

const UPGRADE_DEFS: { id: UpgradeId; name: string; blurb: string }[] = [
  { id: 'faster', name: 'FASTER MOLD', blurb: 'Stamp soldiers quicker' },
  { id: 'bigger', name: 'BIGGER MOLD', blurb: '+1 soldier per stamp' },
];

/** DOM overlay HUD. The canvas renders the world; this renders the toy packaging. */
export class Hud {
  private root: HTMLElement;
  private scrapEl!: HTMLElement;
  private waveEl!: HTMLElement;
  private battalionEl!: HTMLElement;
  private bandEl!: HTMLElement;
  private bandFillEl!: HTMLElement;
  private muteBtn!: HTMLButtonElement;
  private upgradeBtns = new Map<UpgradeId, HTMLButtonElement>();
  private cb: HudCallbacks;
  private displayedScrap = 0;
  muted = false;

  constructor(root: HTMLElement, cb: HudCallbacks, muted: boolean) {
    this.root = root;
    this.cb = cb;
    this.muted = muted;
    this.build();
  }

  private build() {
    this.root.innerHTML = '';

    const top = div('hud-top');
    this.waveEl = div('chip wave-chip');
    this.waveEl.textContent = 'WAVE 1';
    const right = div('hud-top-right');
    this.scrapEl = div('chip scrap-chip');
    this.scrapEl.innerHTML = `<span class="scrap-ico"></span><span class="scrap-num">0</span>`;
    this.muteBtn = document.createElement('button');
    this.muteBtn.className = 'icon-btn';
    this.muteBtn.innerHTML = speakerSvg(this.muted);
    this.muteBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.muted = !this.muted;
      this.muteBtn.innerHTML = speakerSvg(this.muted);
      this.cb.onMute(this.muted);
    });
    right.append(this.scrapEl, this.muteBtn);
    top.append(this.waveEl, right);

    this.battalionEl = div('chip battalion-chip');
    this.battalionEl.style.display = 'none';

    const bottom = div('hud-bottom');
    this.bandEl = div('band-pill');
    this.bandEl.innerHTML = `<div class="band-fill"></div><span class="band-ico">${bandSvg()}</span><span class="band-label">TAP TO SNAP!</span>`;
    this.bandFillEl = this.bandEl.querySelector('.band-fill') as HTMLElement;

    const shelf = div('shelf');
    for (const def of UPGRADE_DEFS) {
      const b = document.createElement('button');
      b.className = 'buy-btn';
      b.innerHTML = `
        <span class="buy-name">${def.name}</span>
        <span class="buy-blurb">${def.blurb}</span>
        <span class="buy-price"><span class="scrap-ico small"></span><span class="cost">0</span></span>
        <span class="buy-lvl">LV 1</span>`;
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.cb.onBuy(def.id);
      });
      this.upgradeBtns.set(def.id, b);
      shelf.appendChild(b);
    }
    bottom.append(this.bandEl, shelf);

    const badge = div('build-badge');
    badge.textContent = (import.meta.env.VITE_COMMIT_SHA ?? 'dev').slice(0, 7);

    this.root.append(top, this.battalionEl, bottom, badge);
  }

  showIntro(onStart: () => void) {
    const overlay = div('intro-overlay');
    const card = div('intro-card');
    card.innerHTML = `
      <div class="intro-brand">PLASTIC<br>PLATOON</div>
      <div class="intro-sub">The floor is a battlefield</div>
      <button class="cta-btn">TAP TO DEPLOY</button>`;
    overlay.appendChild(card);
    this.root.appendChild(overlay);
    const go = () => {
      overlay.classList.add('closing');
      setTimeout(() => overlay.remove(), 260);
      onStart();
    };
    overlay.addEventListener('pointerdown', go, { once: true });
  }

  handleEvent(e: SimEvent, sim: Sim) {
    switch (e.type) {
      case 'collect': {
        this.scrapEl.classList.remove('pulse');
        void this.scrapEl.offsetWidth; // restart animation
        this.scrapEl.classList.add('pulse');
        break;
      }
      case 'waveStart':
        this.waveEl.classList.remove('pop');
        void this.waveEl.offsetWidth;
        this.waveEl.classList.add('pop');
        break;
      case 'buy': {
        const b = this.upgradeBtns.get(e.id);
        if (b) {
          b.classList.remove('bought');
          void b.offsetWidth;
          b.classList.add('bought');
        }
        break;
      }
      default:
        break;
    }
    void sim;
  }

  update(sim: Sim, dt: number) {
    const waveText = `WAVE ${sim.state.wave}`;
    if (this.waveEl.textContent !== waveText) this.waveEl.textContent = waveText;
    // count-up animation — never snap
    const target = Math.floor(sim.state.scrap);
    if (this.displayedScrap !== target) {
      const diff = target - this.displayedScrap;
      const step = Math.abs(diff) < 3 ? diff : Math.ceil(Math.abs(diff) * Math.min(1, dt * 8)) * Math.sign(diff);
      this.displayedScrap += step;
      (this.scrapEl.querySelector('.scrap-num') as HTMLElement).textContent = fmt(this.displayedScrap);
    }

    for (const [id, b] of this.upgradeBtns) {
      const cost = sim.upgradeCost(id);
      const lvl = sim.state.upgrades[id];
      (b.querySelector('.cost') as HTMLElement).textContent = fmt(cost);
      (b.querySelector('.buy-lvl') as HTMLElement).textContent = `LV ${lvl + 1}`;
      b.classList.toggle('disabled', !sim.canBuy(id));
    }

    const mult = sim.battalionMult;
    if (mult > 1.01) {
      this.battalionEl.style.display = '';
      this.battalionEl.textContent = `BATTALION ×${mult.toFixed(1)}`;
    } else {
      this.battalionEl.style.display = 'none';
    }

    const frac = sim.bandCd <= 0 ? 1 : 1 - sim.bandCd / 6;
    this.bandFillEl.style.transform = `scaleX(${frac})`;
    this.bandEl.classList.toggle('ready', sim.bandCd <= 0);
  }
}

function div(cls: string): HTMLElement {
  const d = document.createElement('div');
  d.className = cls;
  return d;
}

function speakerSvg(muted: boolean): string {
  const slash = muted
    ? `<line x1="3" y1="21" x2="21" y2="3" stroke="#c8452c" stroke-width="3.4" stroke-linecap="round"/>`
    : `<path d="M15.5 8.5 Q18.5 12 15.5 15.5 M17.5 5.5 Q22 12 17.5 18.5" fill="none" stroke="#2b2418" stroke-width="2.2" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
    <path d="M4 9.5 L8 9.5 L12.5 5.5 L12.5 18.5 L8 14.5 L4 14.5 Z" fill="#2b2418" stroke="#2b2418" stroke-width="1.4" stroke-linejoin="round"/>
    ${slash}
  </svg>`;
}

function bandSvg(): string {
  return `<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
    <ellipse cx="12" cy="12" rx="9" ry="6.4" fill="none" stroke="#c8452c" stroke-width="3" transform="rotate(-18 12 12)"/>
  </svg>`;
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
  return String(Math.floor(n));
}

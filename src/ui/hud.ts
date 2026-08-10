import { BAND, TERRITORY } from '../sim/defs';
import type { Sim, SimEvent, UpgradeId } from '../sim/sim';

export interface HudCallbacks {
  onBuy: (id: UpgradeId) => void;
  onMute: (muted: boolean) => void;
  onStart: () => void;
}

const UPGRADE_DEFS: { id: UpgradeId; name: string; blurb: string }[] = [
  { id: 'faster', name: 'FASTER MOLD', blurb: 'Stamp soldiers quicker' },
  { id: 'bigger', name: 'BIGGER MOLD', blurb: '+1 soldier per stamp' },
  { id: 'rifles', name: 'RIFLE DRILL', blurb: '+damage per rank' },
  { id: 'scouts', name: 'SCOUT HOPS', blurb: 'Faster toy steps' },
];

/** DOM overlay HUD. The canvas renders the world; this renders the toy packaging. */
export class Hud {
  private root: HTMLElement;
  private scrapEl!: HTMLElement;
  private waveEl!: HTMLElement;
  private waveTextEl!: HTMLElement;
  private zoneFillEl!: HTMLElement;
  private zoneLabelEl!: HTMLElement;
  private supplyEl!: HTMLElement;
  private dailyEl!: HTMLElement;
  private vaultEl!: HTMLElement;
  private battalionEl!: HTMLElement;
  private bandEl!: HTMLElement;
  private bandFillEl!: HTMLElement;
  private muteBtn!: HTMLButtonElement;
  private upgradeBtns = new Map<UpgradeId, HTMLButtonElement>();
  // cached child refs + last written values: the HUD must not dirty the DOM
  // on frames where nothing changed (mobile main-thread cost)
  private scrapNumEl!: HTMLElement;
  private costEls = new Map<UpgradeId, HTMLElement>();
  private lvlEls = new Map<UpgradeId, HTMLElement>();
  private lastCost = new Map<UpgradeId, string>();
  private lastLvl = new Map<UpgradeId, string>();
  private lastAfford = new Map<UpgradeId, boolean>();
  private lastBattalion = '';
  private lastBandFrac = -1;
  private pulsePending = false;
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
    this.waveEl.innerHTML = `<span class="wave-text">WAVE 1</span><span class="boss-pips"><i></i><i></i><i></i><i></i><i></i></span>`;
    this.waveTextEl = this.waveEl.querySelector('.wave-text') as HTMLElement;
    const right = div('hud-top-right');
    this.scrapEl = div('chip scrap-chip');
    this.scrapEl.innerHTML = `<span class="scrap-ico"></span><span class="scrap-num">0</span>`;
    this.scrapNumEl = this.scrapEl.querySelector('.scrap-num') as HTMLElement;
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

    const zoneStrip = div('zone-strip');
    this.zoneFillEl = div('zone-fill');
    this.zoneLabelEl = div('zone-label');
    this.zoneLabelEl.textContent = 'BEDROOM CARPET';
    const markers = div('zone-markers');
    for (let i = 0; i < TERRITORY.checkpointAt.length; i++) {
      const m = div('zone-marker');
      m.style.left = `${TERRITORY.checkpointAt[i] * 100}%`;
      markers.appendChild(m);
    }
    zoneStrip.append(this.zoneFillEl, markers, this.zoneLabelEl);

    this.battalionEl = div('chip battalion-chip');
    this.battalionEl.style.display = 'none';

    const bottom = div('hud-bottom');
    this.bandEl = div('band-pill');
    this.bandEl.innerHTML = `<div class="band-fill"></div><span class="band-ico">${bandSvg()}</span><span class="band-label">TAP TO SNAP!</span>`;
    this.bandFillEl = this.bandEl.querySelector('.band-fill') as HTMLElement;

    const shelf = div('shelf price-tray');
    for (const def of UPGRADE_DEFS) {
      const b = document.createElement('button');
      b.className = 'buy-btn';
      b.innerHTML = `
        <span class="notify-dot"></span>
        <span class="gloss"></span>
        <span class="buy-name">${def.name}</span>
        <span class="buy-blurb">${def.blurb}</span>
        <span class="buy-price"><span class="scrap-ico small"></span><span class="cost">0</span></span>
        <span class="buy-lvl">LV 1</span>`;
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.cb.onBuy(def.id);
      });
      this.upgradeBtns.set(def.id, b);
      this.costEls.set(def.id, b.querySelector('.cost') as HTMLElement);
      this.lvlEls.set(def.id, b.querySelector('.buy-lvl') as HTMLElement);
      shelf.appendChild(b);
    }
    const next = div('next-unlock');
    next.innerHTML = `<span class="silhouette"></span><span><b>NEXT</b> BAZOOKA BAG</span>`;
    shelf.appendChild(next);

    const hooks = div('reward-hooks');
    this.supplyEl = div('hook-chip supply');
    this.supplyEl.textContent = 'DROP IN 5';
    this.dailyEl = div('hook-chip daily');
    this.dailyEl.textContent = 'DAILY 0/3';
    this.vaultEl = div('hook-chip vault');
    this.vaultEl.textContent = 'VAULT 0%';
    hooks.append(this.supplyEl, this.dailyEl, this.vaultEl);
    bottom.append(this.bandEl, shelf, hooks);

    const badge = div('build-badge');
    badge.textContent = (import.meta.env.VITE_COMMIT_SHA ?? 'dev').slice(0, 7);

    this.root.append(top, zoneStrip, this.battalionEl, bottom, badge);
  }

  showIntro(onStart: () => void) {
    const overlay = div('intro-overlay');
    const logo = div('intro-logo');
    logo.innerHTML = `PLASTIC<br>PLATOON`;
    const prompt = div('intro-prompt');
    prompt.innerHTML = `
      <div class="intro-sub">The floor is a battlefield</div>
      <button class="cta-btn">TAP TO DEPLOY</button>`;
    overlay.append(logo, prompt);
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
        // coalesced: a band snap can land 40+ collects in one frame — restart
        // the pulse at most once per frame (in update), not per event
        this.pulsePending = true;
        break;
      }
      case 'waveStart':
        this.waveEl.classList.remove('pop');
        void this.waveEl.offsetWidth;
        this.waveEl.classList.add('pop');
        break;
      case 'platoon':
        this.battalionEl.style.display = '';
        this.battalionEl.textContent = e.label;
        this.battalionEl.classList.remove('pop');
        void this.battalionEl.offsetWidth;
        this.battalionEl.classList.add('pop');
        break;
      case 'checkpoint':
        this.zoneLabelEl.textContent = e.name.toUpperCase();
        this.zoneLabelEl.classList.remove('pop');
        void this.zoneLabelEl.offsetWidth;
        this.zoneLabelEl.classList.add('pop');
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
    if (this.pulsePending) {
      this.pulsePending = false;
      this.scrapEl.classList.remove('pulse');
      void this.scrapEl.offsetWidth; // restart animation (once per frame max)
      this.scrapEl.classList.add('pulse');
    }

    const waveText = `WAVE ${sim.state.wave}`;
    if (this.waveTextEl.textContent !== waveText) this.waveTextEl.textContent = waveText;
    const bossPips = Array.from(this.waveEl.querySelectorAll('.boss-pips i'));
    const lit = ((sim.state.wave - 1) % 5) + 1;
    for (let i = 0; i < bossPips.length; i++) bossPips[i].classList.toggle('lit', i < lit);
    // count-up animation — never snap
    const target = Math.floor(sim.state.scrap);
    if (this.displayedScrap !== target) {
      const diff = target - this.displayedScrap;
      const step = Math.abs(diff) < 3 ? diff : Math.ceil(Math.abs(diff) * Math.min(1, dt * 8)) * Math.sign(diff);
      this.displayedScrap += step;
      this.scrapNumEl.textContent = fmt(this.displayedScrap);
    }

    for (const [id, b] of this.upgradeBtns) {
      const cost = fmt(sim.upgradeCost(id));
      if (this.lastCost.get(id) !== cost) {
        this.lastCost.set(id, cost);
        this.costEls.get(id)!.textContent = cost;
      }
      const lvl = `LV ${sim.state.upgrades[id] + 1}`;
      if (this.lastLvl.get(id) !== lvl) {
        this.lastLvl.set(id, lvl);
        this.lvlEls.get(id)!.textContent = lvl;
      }
      const afford = sim.canBuy(id);
      if (this.lastAfford.get(id) !== afford) {
        this.lastAfford.set(id, afford);
        b.classList.toggle('disabled', !afford);
        b.classList.toggle('affordable', afford);
      }
    }

    const mult = sim.battalionMult;
    const battalion = mult > 1.01 ? `BATTALION ×${mult.toFixed(1)}` : '';
    if (battalion !== this.lastBattalion) {
      this.lastBattalion = battalion;
      this.battalionEl.style.display = battalion ? '' : 'none';
      if (battalion) this.battalionEl.textContent = battalion;
    }

    const progress = Math.min(1, sim.state.push / TERRITORY.zoneLength);
    this.zoneFillEl.style.transform = `scaleX(${progress})`;
    this.supplyEl.textContent = `DROP IN ${5 - ((sim.state.wave - 1) % 5)}`;
    this.dailyEl.textContent = `DAILY ${Math.min(3, Math.floor(sim.state.wave / 3))}/3`;
    const vault = Math.min(100, Math.floor((sim.state.scrap / Math.max(1, sim.scrapRate * 60 * 60 * 4.5)) * 100));
    this.vaultEl.textContent = sim.scrapRate > 0 ? `VAULT ${vault}%` : 'VAULT 0%';

    const frac = sim.bandCd <= 0 ? 1 : 1 - sim.bandCd / BAND.cd;
    if (Math.abs(frac - this.lastBandFrac) > 0.005) {
      this.lastBandFrac = frac;
      this.bandFillEl.style.transform = `scaleX(${frac})`;
      this.bandEl.classList.toggle('ready', sim.bandCd <= 0);
    }
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

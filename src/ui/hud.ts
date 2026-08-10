import { BATTLE, CLASSES, CLASS_ORDER, MILESTONES, type ClassId } from '../sim/defs';
import type { Mission, Sim, SimEvent } from '../sim/sim';

export interface HudCallbacks {
  onBuyClass: (cls: ClassId) => void;
  onBuyMolderRate: () => void;
  onBuyMoldSize: () => void;
  onToggleProgram: (cls: ClassId) => void;
  onAttack: () => void;
  onClaimMission: (slot: number) => void;
  onMute: (muted: boolean) => void;
}

/** DOM overlay HUD v2: battle header, missions, molder row, unit-card dock. */
export class Hud {
  private root: HTMLElement;
  private cb: HudCallbacks;
  muted = false;

  private battleEl!: HTMLElement;
  private scrapEl!: HTMLElement;
  private scrapNumEl!: HTMLElement;
  private battalionEl!: HTMLElement;
  private boostEl!: HTMLElement;
  private muteBtn!: HTMLButtonElement;
  private missionsEl!: HTMLElement;
  private missionChips: HTMLElement[] = [];
  private molderHpEl!: HTMLElement;
  private molderHpFill!: HTMLElement;
  private lastMolderHp = -1;
  private attackBtn!: HTMLButtonElement;
  private bandEl!: HTMLElement;
  private bandFillEl!: HTMLElement;
  private molderRateBtn!: HTMLButtonElement;
  private moldSizeBtn!: HTMLButtonElement;
  private unitStrip!: HTMLElement;
  private unitCards = new Map<ClassId, HTMLElement>();

  // change-tracking so the DOM is only written when values move
  private displayedScrap = 0;
  private lastBattleText = '';
  private lastBattalion = '';
  private lastBandFrac = -1;
  private lastBoost = '';
  private lastAttack = '';
  private lastMissions: string[] = ['', '', ''];
  private lastCards = new Map<ClassId, string>();
  private lastMolderRate = '';
  private lastMoldSize = '';
  private pulsePending = false;

  constructor(root: HTMLElement, cb: HudCallbacks, muted: boolean) {
    this.root = root;
    this.cb = cb;
    this.muted = muted;
    this.build();
  }

  private build() {
    this.root.innerHTML = '';

    // ---------- top bar
    const top = div('hud-top');
    this.battleEl = div('chip wave-chip');
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
    top.append(this.battleEl, right);

    this.battalionEl = div('chip battalion-chip');
    this.battalionEl.style.display = 'none';
    this.boostEl = div('chip boost-chip');
    this.boostEl.style.display = 'none';

    // molder HP: a toy nameplate + bar in the design language, pinned over the machine
    this.molderHpEl = div('molder-hp');
    this.molderHpEl.innerHTML = `<span class="mh-label">MOLDER</span><div class="mh-bar"><div class="mh-fill"></div></div>`;
    this.molderHpFill = this.molderHpEl.querySelector('.mh-fill') as HTMLElement;
    this.molderHpEl.style.display = 'none';

    // ---------- missions
    this.missionsEl = div('missions-row');
    for (let s = 0; s < 3; s++) {
      const chip = div('mission-chip');
      chip.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.cb.onClaimMission(s);
      });
      this.missionChips.push(chip);
      this.missionsEl.appendChild(chip);
    }

    // ---------- bottom dock
    const dock = div('dock');

    this.bandEl = div('band-pill');
    this.bandEl.innerHTML = `<div class="band-fill"></div><span class="band-ico">${bandSvg()}</span><span class="band-label">TAP TO SNAP!</span>`;
    this.bandFillEl = this.bandEl.querySelector('.band-fill') as HTMLElement;

    this.attackBtn = document.createElement('button');
    this.attackBtn.className = 'attack-btn';
    this.attackBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.cb.onAttack();
    });

    const molderRow = div('molder-row');
    this.molderRateBtn = smallBuy('FASTER MOLD', () => this.cb.onBuyMolderRate());
    this.moldSizeBtn = smallBuy('BIGGER MOLD', () => this.cb.onBuyMoldSize());
    molderRow.append(this.molderRateBtn, this.moldSizeBtn);

    this.unitStrip = div('unit-strip');
    for (const cls of CLASS_ORDER) {
      const card = div('unit-card');
      card.dataset.cls = cls;
      card.innerHTML = `
        <button class="uc-toggle" aria-label="toggle"></button>
        <div class="uc-name">${CLASSES[cls].name}</div>
        <div class="uc-lv">LV 1</div>
        <div class="uc-pips"></div>
        <button class="uc-buy"><span class="scrap-ico small"></span><span class="uc-cost">0</span></button>
        <div class="uc-lock"><span class="uc-lock-ico">🔒</span><span class="uc-lock-b"></span></div>`;
      (card.querySelector('.uc-buy') as HTMLElement).addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.cb.onBuyClass(cls);
      });
      (card.querySelector('.uc-toggle') as HTMLElement).addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        this.cb.onToggleProgram(cls);
      });
      this.unitCards.set(cls, card);
      this.unitStrip.appendChild(card);
    }

    dock.append(this.bandEl, this.attackBtn, molderRow, this.unitStrip);

    const badge = div('build-badge');
    badge.textContent = (import.meta.env.VITE_COMMIT_SHA ?? 'dev').slice(0, 7);

    this.root.append(top, this.battalionEl, this.boostEl, this.molderHpEl, this.missionsEl, dock, badge);
  }

  showIntro(onStart: () => void) {
    // one CTA per frame: the live HUD hides until the player deploys
    this.root.classList.add('intro-open');
    const overlay = div('intro-overlay');
    const card = div('intro-card');
    card.innerHTML = `
      <div class="intro-brand">PLASTIC<br>PLATOON</div>
      <div class="intro-sub">The floor is a battlefield</div>
      <button class="cta-btn">TAP TO DEPLOY</button>`;
    overlay.appendChild(card);
    this.root.appendChild(overlay);
    overlay.addEventListener(
      'pointerdown',
      () => {
        overlay.classList.add('closing');
        this.root.classList.remove('intro-open');
        setTimeout(() => overlay.remove(), 260);
        onStart();
      },
      { once: true }
    );
  }

  handleEvent(e: SimEvent, sim: Sim) {
    switch (e.type) {
      case 'collect':
        this.pulsePending = true;
        break;
      case 'battleStart':
      case 'battleWon':
      case 'battleLost':
        this.battleEl.classList.remove('pop');
        void this.battleEl.offsetWidth;
        this.battleEl.classList.add('pop');
        break;
      case 'buy': {
        const card = this.unitCards.get(e.id as ClassId);
        const el = e.id === 'molderRate' ? this.molderRateBtn : e.id === 'moldSize' ? this.moldSizeBtn : card;
        if (el) {
          el.classList.remove('bought');
          void (el as HTMLElement).offsetWidth;
          el.classList.add('bought');
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
      void this.scrapEl.offsetWidth;
      this.scrapEl.classList.add('pulse');
    }

    // battle header
    let battleText: string;
    if (sim.mode === 'battle') {
      battleText = `⚔ BATTLE ${sim.state.battle} · WAVE ${Math.min(sim.waveIdx, BATTLE.waves)}/${BATTLE.waves}`;
    } else if (sim.mode === 'intermission') {
      battleText = `BATTLE ${sim.state.battle} INCOMING…`;
    } else {
      battleText = `BATTLE ${sim.state.battle}`;
    }
    if (battleText !== this.lastBattleText) {
      this.lastBattleText = battleText;
      this.battleEl.textContent = battleText;
    }

    // scrap count-up
    const target = Math.floor(sim.state.scrap);
    if (this.displayedScrap !== target) {
      const diff = target - this.displayedScrap;
      const step = Math.abs(diff) < 3 ? diff : Math.ceil(Math.abs(diff) * Math.min(1, dt * 8)) * Math.sign(diff);
      this.displayedScrap += step;
      this.scrapNumEl.textContent = fmt(this.displayedScrap);
    }

    // battalion + boost chips
    const mult = sim.battalionMult;
    const battalion = mult > 1.01 ? `BATTALION ×${mult.toFixed(1)}` : '';
    if (battalion !== this.lastBattalion) {
      this.lastBattalion = battalion;
      this.battalionEl.style.display = battalion ? '' : 'none';
      if (battalion) this.battalionEl.textContent = battalion;
    }
    const boostLeft = sim.state.boostUntil - Date.now();
    const boost = boostLeft > 0 ? `2× SCRAP ${Math.floor(boostLeft / 60000)}:${String(Math.floor((boostLeft % 60000) / 1000)).padStart(2, '0')}` : '';
    if (boost !== this.lastBoost) {
      this.lastBoost = boost;
      this.boostEl.style.display = boost ? '' : 'none';
      if (boost) this.boostEl.textContent = boost;
    }

    // attack button
    const attackText =
      sim.mode === 'skirmish'
        ? sim.state.lossStreak > 0
          ? `⚔ RETRY BATTLE ${sim.state.battle}`
          : `⚔ ATTACK — BATTLE ${sim.state.battle}`
        : '';
    if (attackText !== this.lastAttack) {
      this.lastAttack = attackText;
      this.attackBtn.style.display = attackText ? '' : 'none';
      if (attackText) this.attackBtn.textContent = attackText;
    }

    // molder HP nameplate (in battle / while damaged)
    const showHp = sim.mode === 'battle' || sim.molderHp < sim.molderHpMax - 0.01;
    const hpFrac = showHp ? Math.max(0, sim.molderHp / sim.molderHpMax) : -1;
    if (Math.abs(hpFrac - this.lastMolderHp) > 0.004) {
      this.lastMolderHp = hpFrac;
      this.molderHpEl.style.display = showHp ? '' : 'none';
      if (showHp) {
        // pinned above the machine: molderY fraction of the viewport minus its height
        this.molderHpEl.style.top = `calc(${(62).toFixed(1)}vh - 208px)`;
        this.molderHpFill.style.transform = `scaleX(${hpFrac})`;
        this.molderHpEl.classList.toggle('hurt', hpFrac < 0.5);
        this.molderHpEl.classList.toggle('critical', hpFrac < 0.25);
      }
    }

    // band cooldown
    const frac = sim.bandCd <= 0 ? 1 : 1 - sim.bandCd / sim.bandCdMax;
    if (Math.abs(frac - this.lastBandFrac) > 0.005) {
      this.lastBandFrac = frac;
      this.bandFillEl.style.transform = `scaleX(${frac})`;
      this.bandEl.classList.toggle('ready', sim.bandCd <= 0);
    }

    // missions
    for (let s = 0; s < 3; s++) {
      const m: Mission | undefined = sim.state.missions[s];
      if (!m) continue;
      const done = m.progress >= m.target;
      const key = `${m.id}:${Math.min(m.progress, m.target) | 0}:${done}`;
      if (this.lastMissions[s] !== key) {
        this.lastMissions[s] = key;
        const label = m.label.replace('{n}', String(m.target));
        this.missionChips[s].innerHTML = done
          ? `<span class="mc-done">★</span> ${label} <span class="mc-claim">CLAIM ${fmt(m.reward)}${m.medal ? ' +🎖' : ''}</span>`
          : `${label} <span class="mc-prog">${Math.min(m.progress, m.target) | 0}/${m.target}</span>`;
        this.missionChips[s].classList.toggle('done', done);
      }
    }

    // molder buttons
    const rateKey = `${sim.state.molderRateLv}:${fmt(sim.molderRateCost())}:${sim.state.scrap >= sim.molderRateCost()}`;
    if (rateKey !== this.lastMolderRate) {
      this.lastMolderRate = rateKey;
      setSmallBuy(this.molderRateBtn, `LV ${sim.state.molderRateLv + 1}`, fmt(sim.molderRateCost()), sim.state.scrap >= sim.molderRateCost());
    }
    const sizeKey = `${sim.state.moldSizeLv}:${fmt(sim.moldSizeCost())}:${sim.state.scrap >= sim.moldSizeCost()}`;
    if (sizeKey !== this.lastMoldSize) {
      this.lastMoldSize = sizeKey;
      setSmallBuy(this.moldSizeBtn, `LV ${sim.state.moldSizeLv + 1}`, fmt(sim.moldSizeCost()), sim.state.scrap >= sim.moldSizeCost());
    }

    // unit cards
    const unlocked = sim.unlockedClasses();
    for (const cls of CLASS_ORDER) {
      const card = this.unitCards.get(cls)!;
      const isUnlocked = unlocked.includes(cls);
      const lv = sim.state.classLv[cls];
      const cost = sim.classCost(cls);
      const afford = isUnlocked && sim.state.scrap >= cost;
      const on = sim.state.program[cls];
      const key = `${isUnlocked}:${lv}:${fmt(cost)}:${afford}:${on}`;
      if (this.lastCards.get(cls) === key) continue;
      this.lastCards.set(cls, key);

      card.classList.toggle('locked', !isUnlocked);
      card.classList.toggle('afford', afford);
      card.classList.toggle('off', isUnlocked && !on);
      (card.querySelector('.uc-lv') as HTMLElement).textContent = `LV ${lv + 1}`;
      (card.querySelector('.uc-cost') as HTMLElement).textContent = fmt(cost);
      (card.querySelector('.uc-lock-b') as HTMLElement).textContent = `BATTLE ${CLASSES[cls].unlockBattle}`;
      const pips = card.querySelector('.uc-pips') as HTMLElement;
      pips.innerHTML = MILESTONES.map((t) => `<i class="${lv >= t ? 'on' : ''}"></i>`).join('');
      (card.querySelector('.uc-toggle') as HTMLElement).textContent = on ? 'IN MOLD' : 'BENCHED';
    }
  }
}

function div(cls: string): HTMLElement {
  const d = document.createElement('div');
  d.className = cls;
  return d;
}

function smallBuy(name: string, onTap: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'buy-btn small-buy';
  b.innerHTML = `
    <span class="gloss"></span>
    <span class="buy-name">${name}</span>
    <span class="buy-price"><span class="scrap-ico small"></span><span class="cost">0</span></span>
    <span class="buy-lvl">LV 1</span>`;
  b.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    onTap();
  });
  return b;
}

function setSmallBuy(b: HTMLButtonElement, lvl: string, cost: string, afford: boolean) {
  (b.querySelector('.cost') as HTMLElement).textContent = cost;
  (b.querySelector('.buy-lvl') as HTMLElement).textContent = lvl;
  b.classList.toggle('disabled', !afford);
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

export function fmt(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(n >= 1e13 ? 0 : 1) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
  return String(Math.floor(n));
}

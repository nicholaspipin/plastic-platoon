import './cards.css';
import { PRESTIGE } from '../sim/defs';
import type { Sim } from '../sim/sim';
import { fmtDuration, type OfflineResult } from '../sim/offline';

/**
 * M3 cards: the offline "return receipt" and the Back-in-the-Box prestige flow.
 * Diegetic toy packaging: the receipt is a hang-tag, prestige is the toy box.
 */

export function showOfflineCard(root: HTMLElement, result: OfflineResult, onClaim: () => void) {
  const overlay = div('card-overlay');
  const card = div('toy-card');
  card.innerHTML = `
    <div class="card-title">WHILE YOU<br>WERE GONE…</div>
    <div class="card-sub">The platoon held the line</div>
    <div class="receipt-tag">
      <div class="receipt-amount"><span class="scrap-ico"></span><span class="off-num">0</span></div>
      <div class="receipt-away">away ${fmtDuration(result.seconds)}</div>
    </div>
    <button class="card-cta">CLAIM SCRAP</button>`;
  overlay.appendChild(card);
  root.appendChild(overlay);

  // big satisfying count-up to the exact amount
  const numEl = card.querySelector('.off-num') as HTMLElement;
  const t0 = performance.now();
  const dur = 900;
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    const eased = 1 - (1 - k) * (1 - k);
    numEl.textContent = String(Math.floor(result.scrap * eased));
    if (k < 1 && overlay.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  (card.querySelector('.card-cta') as HTMLButtonElement).addEventListener(
    'pointerdown',
    () => {
      onClaim();
      close(overlay);
    },
    { once: true }
  );
}

export class PrestigeUi {
  private fab: HTMLButtonElement;
  private root: HTMLElement;
  private onPrestige: () => void;

  constructor(root: HTMLElement, onPrestige: () => void) {
    this.root = root;
    this.onPrestige = onPrestige;
    this.fab = document.createElement('button');
    this.fab.className = 'prestige-fab';
    this.fab.textContent = '📦 BACK IN THE BOX';
    this.fab.style.display = 'none';
    root.appendChild(this.fab);
  }

  bind(sim: Sim) {
    this.fab.addEventListener('pointerdown', () => this.open(sim));
  }

  update(sim: Sim) {
    const show = sim.canPrestige();
    this.fab.style.display = show ? '' : 'none';
  }

  private open(sim: Sim) {
    const current = sim.state.medals;
    const after = Math.max(current, sim.medalsOnPrestige());
    const gained = after - current;
    const multNow = 1 + current * PRESTIGE.bonusPerMedal;
    const multAfter = 1 + after * PRESTIGE.bonusPerMedal;

    const overlay = div('card-overlay');
    const card = div('toy-card');
    card.innerHTML = `
      <div class="card-title">BACK IN<br>THE BOX</div>
      <div class="card-sub">Pack up the battlefield, keep the medals</div>
      <div class="medal-row">
        <div class="medal-chip">
          <div class="mc-label">MEDALS</div>
          <div class="mc-value">${current} → ${after}</div>
        </div>
        <div class="medal-chip big">
          <div class="mc-label">SCRAP BONUS</div>
          <div class="mc-value">×${multNow.toFixed(1)} → ×${multAfter.toFixed(1)}</div>
        </div>
      </div>
      <div class="prestige-note">Wave, scrap and mold upgrades reset.<br>+${gained} medal${gained === 1 ? '' : 's'} forever — every medal pays +10% scrap.</div>
      <button class="card-cta gold">PACK UP (+${gained} 🎖)</button>
      <button class="card-dismiss">keep fighting</button>`;
    overlay.appendChild(card);
    this.root.appendChild(overlay);

    (card.querySelector('.card-cta') as HTMLButtonElement).addEventListener(
      'pointerdown',
      () => {
        this.onPrestige();
        close(overlay);
      },
      { once: true }
    );
    (card.querySelector('.card-dismiss') as HTMLButtonElement).addEventListener(
      'pointerdown',
      () => close(overlay),
      { once: true }
    );
  }
}

function div(cls: string): HTMLElement {
  const d = document.createElement('div');
  d.className = cls;
  return d;
}

function close(overlay: HTMLElement) {
  overlay.classList.add('closing');
  setTimeout(() => overlay.remove(), 240);
}

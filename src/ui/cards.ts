import './cards.css';
import { CLASSES, PRESTIGE, STREAK, TREE, type ClassId, type TreeNodeId } from '../sim/defs';
import type { Sim } from '../sim/sim';
import { fmtDuration, type OfflineResult } from '../sim/offline';
import { fmt } from './hud';

/** Overlay cards: offline receipt, battle results, unlocks, streak, toy-box tree. */

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
  countUp(card.querySelector('.off-num') as HTMLElement, result.scrap, overlay);
  (card.querySelector('.card-cta') as HTMLButtonElement).addEventListener(
    'pointerdown',
    () => {
      onClaim();
      close(overlay);
    },
    { once: true }
  );
}

/** Quick top toast for battle wins (auto-dismisses; the flow keeps moving). */
export function showWinToast(root: HTMLElement, battle: number, reward: number) {
  const toast = div('win-toast');
  toast.innerHTML = `<span class="wt-star">★</span> BATTLE ${battle} WON! <span class="wt-reward">+${fmt(reward)} <span class="scrap-ico small"></span></span>`;
  root.appendChild(toast);
  setTimeout(() => toast.classList.add('closing'), 2100);
  setTimeout(() => toast.remove(), 2400);
}

export function showLossCard(
  root: HTMLElement,
  info: { battle: number; remaining: number; reward: number; pity: number },
  onRetry: () => void
) {
  const overlay = div('card-overlay');
  const card = div('toy-card loss-card');
  const pct = Math.max(1, Math.round(info.remaining * 100));
  card.innerHTML = `
    <div class="card-title">PUSHED<br>BACK!</div>
    <div class="card-sub">The Molder took one hit too many</div>
    <div class="report-row">
      <div class="report-bar"><div class="report-fill" style="width:${100 - pct}%"></div></div>
      <div class="report-label">Enemy force broken: ${100 - pct}%</div>
    </div>
    <div class="report-salvage">Salvaged <span class="scrap-ico small"></span> ${fmt(info.reward)}</div>
    ${info.pity > 0 ? `<div class="report-pity">HQ sends support: enemy −${Math.round(info.pity * 100)}% next attempt</div>` : ''}
    <button class="card-cta">TRY AGAIN</button>
    <button class="card-dismiss">regroup &amp; shop</button>`;
  overlay.appendChild(card);
  root.appendChild(overlay);
  (card.querySelector('.card-cta') as HTMLButtonElement).addEventListener(
    'pointerdown',
    () => {
      onRetry();
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

export function showUnlockCard(root: HTMLElement, cls: ClassId, onDone: () => void) {
  const def = CLASSES[cls];
  const overlay = div('card-overlay');
  const card = div('toy-card unlock-card');
  card.innerHTML = `
    <div class="unlock-burst"></div>
    <div class="card-sub">NEW MOLD UNLOCKED</div>
    <div class="card-title">${def.name}</div>
    <div class="unlock-blurb">${def.blurb}</div>
    <button class="card-cta">TO THE MOLDER!</button>`;
  overlay.appendChild(card);
  root.appendChild(overlay);
  (card.querySelector('.card-cta') as HTMLButtonElement).addEventListener(
    'pointerdown',
    () => {
      onDone();
      close(overlay);
    },
    { once: true }
  );
}

export function showStreakCard(root: HTMLElement, day: number, reward: number, onClaim: () => void) {
  const overlay = div('card-overlay');
  const card = div('toy-card');
  const cells = Array.from({ length: STREAK.days }, (_, i) => {
    const d = i + 1;
    const cls = d < day ? 'past' : d === day ? 'today' : '';
    const label = d === 7 ? '2×!' : `×${STREAK.rewardMult[i]}`;
    return `<div class="streak-cell ${cls}"><span>D${d}</span><b>${label}</b></div>`;
  }).join('');
  card.innerHTML = `
    <div class="card-title">DAILY<br>SUPPLY DROP</div>
    <div class="card-sub">Day ${day} of ${STREAK.days} — streak survives one missed day</div>
    <div class="streak-row">${cells}</div>
    <div class="receipt-tag">
      <div class="receipt-amount"><span class="scrap-ico"></span><span>${fmt(reward)}</span></div>
      ${day === 7 ? `<div class="receipt-away">+ 2× SCRAP BOOST (${STREAK.boostMinutes} min)</div>` : ''}
    </div>
    <button class="card-cta">CLAIM</button>`;
  overlay.appendChild(card);
  root.appendChild(overlay);
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
  private onBuyNode: (id: TreeNodeId) => void;
  private open = false;

  constructor(root: HTMLElement, onPrestige: () => void, onBuyNode: (id: TreeNodeId) => void) {
    this.root = root;
    this.onPrestige = onPrestige;
    this.onBuyNode = onBuyNode;
    this.fab = document.createElement('button');
    this.fab.className = 'prestige-fab';
    this.fab.textContent = '📦 TOY BOX';
    this.fab.style.display = 'none';
    root.appendChild(this.fab);
  }

  bind(sim: Sim) {
    this.fab.addEventListener('pointerdown', () => this.openBox(sim));
  }

  update(sim: Sim) {
    const show = sim.state.medals > 0 || sim.canPrestige();
    const cls = sim.canPrestige() ? 'prestige-fab hot' : 'prestige-fab';
    if (this.fab.className !== cls) this.fab.className = cls;
    this.fab.style.display = show ? '' : 'none';
  }

  private openBox(sim: Sim) {
    if (this.open) return;
    this.open = true;
    const overlay = div('card-overlay');
    const card = div('toy-card tree-card');
    overlay.appendChild(card);
    this.root.appendChild(overlay);

    const render = () => {
      const gain = sim.medalsOnPrestige();
      const nodes = (Object.keys(TREE) as TreeNodeId[])
        .map((id) => {
          const node = TREE[id];
          const rank = sim.state.tree[id];
          const maxed = rank >= node.maxRanks;
          const cost = maxed ? 0 : node.costPerRank[rank];
          const afford = !maxed && sim.medalPoints >= cost;
          return `
            <button class="tree-node ${maxed ? 'maxed' : afford ? 'afford' : 'locked'}" data-node="${id}">
              <div class="tn-name">${node.name}</div>
              <div class="tn-blurb">${node.blurb}</div>
              <div class="tn-rank">${'●'.repeat(rank)}${'○'.repeat(node.maxRanks - rank)}</div>
              <div class="tn-cost">${maxed ? 'MAX' : `${cost} 🎖`}</div>
            </button>`;
        })
        .join('');
      card.innerHTML = `
        <div class="card-title">THE TOY BOX</div>
        <div class="card-sub">🎖 ${sim.medalPoints} medal point${sim.medalPoints === 1 ? '' : 's'} to spend · +${Math.round(sim.state.medals * PRESTIGE.passivePerMedal * 100)}% scrap forever</div>
        <div class="tree-grid">${nodes}</div>
        ${
          sim.canPrestige()
            ? `<button class="card-cta gold pack-up">PACK UP: +${gain} 🎖 (+${Math.round(gain * PRESTIGE.passivePerMedal * 100)}% scrap)</button>
               <div class="prestige-note">Resets battle progress, scrap and molds. Medals &amp; the tree are forever.</div>`
            : `<div class="prestige-note">Beat Battle ${PRESTIGE.minBattle} to pack up for more medals.</div>`
        }
        <button class="card-dismiss">close the lid</button>`;

      card.querySelectorAll<HTMLElement>('.tree-node').forEach((el) => {
        el.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.onBuyNode(el.dataset.node as TreeNodeId);
          render();
        });
      });
      const pack = card.querySelector('.pack-up') as HTMLButtonElement | null;
      if (pack) {
        let confirming = false;
        pack.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (!confirming) {
            confirming = true;
            pack.textContent = 'SURE? EVERYTHING GOES BACK IN THE BOX';
            setTimeout(() => {
              if (confirming && pack.isConnected) {
                confirming = false;
                render();
              }
            }, 2600);
          } else {
            this.onPrestige();
            this.dismiss(overlay);
          }
        });
      }
      (card.querySelector('.card-dismiss') as HTMLButtonElement).addEventListener(
        'pointerdown',
        () => this.dismiss(overlay),
        { once: true }
      );
    };
    render();
  }

  private dismiss(overlay: HTMLElement) {
    this.open = false;
    close(overlay);
  }
}

function countUp(el: HTMLElement, target: number, overlay: HTMLElement) {
  const t0 = performance.now();
  const dur = 900;
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / dur);
    const eased = 1 - (1 - k) * (1 - k);
    el.textContent = fmt(Math.floor(target * eased));
    if (k < 1 && overlay.isConnected) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
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

# DESIGN2 — The Retention Rework

Synthesis of `research/idle-math.md` (Pecorella math, retention benchmarks),
`research/genre-comps.md` (Art of War: Legions, Battle Cats, Mob Control, Grow
Castle, Egg Inc), and `research/current-game-autopsy.md` (v1's failures).
The v1 *feel* (stamp beat, plastic material, juice) survives; the structure
around it is replaced.

Core loop after rework:
*watch the Molder stamp your squad mix → win a 45–120s battle → spend scrap on
whichever of 8 out-of-phase tracks is cheap → hit a wall battle → the wall names
its counter-class → unlock/level it → win → prestige into the Command Tree →
everything re-runs 3× faster.*

## 1. Campaign spine — battles you can WIN and LOSE

- **Discrete battles** replace endless waves. Battle N = 3 assault waves + every
  5th battle a **Commander battle** (boss). Win = destroy the full battle force.
- **The Molder is now the stakes**: tans that reach it attack it (it has HP,
  visible damage states). Molder breaks → **battle lost**. This reverses v1's
  no-fail decision — deliberately; the autopsy showed safety killed tension.
- **Loss pays**: 50% of the win reward + a battle report card ("Enemy force
  remaining: 12%"). Nothing owned is ever lost. Hidden **pity**: after 2
  consecutive losses on the same battle, −6% enemy HP per further loss (cap
  −25%), reset on win.
- Between attempts the game idles in **skirmish mode**: a light tan trickle
  farms scrap so the screen stays alive while shopping. Big **ATTACK** button
  launches the retry.
- **Difficulty**: enemy strength budget ×1.16 per battle; first intended wall at
  Battle 8–12 (minute ~25–40). **Theaters** every 20 battles: new ground bake,
  tan magnification jump, boss rotation (Robot → Dino → beyond).
- Battle rewards: scrap ≈ budget-linked (×1.14/battle) + first-win bonus ×3.

## 2. Unit roster — the seven molded classes

All seven are drawn (atlas: `{fac}_{class}_{m0|m1|fire}`). Unlock cadence
(compressed from the comps' week to our minutes):

| Battle | Class | Role | Stats vs rifleman baseline |
|---|---|---|---|
| 1 | Rifleman | line infantry | 1× everything |
| 3 | Scout | fast screen | spd 1.6×, hp 0.6×, dmg 0.5×, cheap |
| 6 | MG Gunner | lane DPS | cd 0.35×, dmg 0.55×, range 0.85× |
| 10 | Medic | sustain | heals 2 hp/2.2s to nearby greens, no dmg |
| 14 | Bazooka | armor melter | dmg 4×, cd 2.8×, splash r36, ×3 vs bosses |
| 22 | Sniper | priority picks | range 1.7×, dmg 3×, cd 2.2×, hp 0.7× |
| 30 | Officer | force multiplier | aura +20% dmg r90, +10% scrap while alive |

- **Squad program**: unlocked classes can be toggled on the mold program; the
  Molder stamps the enabled mix on a weighted rotation (riflemen weighted 3×).
- **Per-class upgrade verticals**: each class has a level track (+22% power/lv)
  with **milestone ×2 at lv 10/25/50** (sawtooth pips on the card). Cost bases
  spaced ~6–10× apart, growth 1.10–1.15 — eight out-of-phase curves means
  something is always affordable (TTNP target: 15–45s first 10 min).
- Tans mirror the roster as battles progress (scouts B6+, MG B12+, bazooka
  B18+, officers as Commander escorts); Commander bosses read as **Armored**
  (bazooka counters ×3).

## 3. Prestige — Medals + Command Tree

- `medals = floor(150 · sqrt(lifetimeScrap / S1))`, S1 tuned so a first
  prestige at Battle ~10–12 grants **10–20 medals**. Lifetime basis: every run
  adds medals; ~4× lifetime scrap to double.
- **Passive layer**: +2% scrap income per medal, automatic, never spent.
- **Command Tree** (spend medal points 1:1, persists forever):
  faster-molder ×3 (+25% stamp), plastic-quality ×3 (+20% hp), bayonets ×3
  (+20% dmg), war-bonds ×3 (+30% battle rewards), offline-logistics ×3 (+2h
  offline cap each), elastic ×2 (−1s band cd), starting-kit (begin runs with
  Scout+MG unlocked), veteran-molds (keep milestone ×2s through prestige).
- Gate: Battle 10 beaten. Preview card shows exact medals + new passive %.
  Post-prestige, returning to Battle 10 should take ≤⅓ the original time.

## 4. Return hooks

- **Offline**: 100% of the measured scrap rate, base cap 2h → +2h per
  offline-logistics rank (max 8h). Receipt card as today.
- **Missions, 3 rotating slots**: short (~5 min: "stamp 40 soldiers", "snap 3
  bands"), medium (~1h: "win Battle N", "knock over 150 tans"), daily ("win 5
  battles"). Auto-refill on claim; payouts scrap-scaled; the daily slot pays a
  medal point.
- **Daily streak calendar**: 7-day escalating rewards on first session of the
  day; day 7 = a **2× scrap boost token (10 min)** + golden stamp celebration;
  streak survives one missed day.

## 5. Economy retune

- Molder rate: +12%/lv, cost 15 × 1.07ⁿ (the always-buyable track).
- Mold size (+1/stamp): 80 × 1.35ⁿ (chunky, rarer).
- Class levels: base cost `classBase × 1.12ⁿ`, bases 10/25/60/150/400/1000/2500.
- Scrap per tan ×1.14 per battle keeps income racing costs; K/M/B/T formatting.
- Every purchase in hour one moves visible output ≥20% (merge effects into
  chunky steps rather than +3%s).

## 6. Save v2 + verification

- Save `v:2` with migration from v1 (map wave→battle, keep medals/scrap).
- New headless pacing probe: scripted sim run asserting battle lengths 45–120s,
  first loss inside Battle 8–14 without buying counters, TTNP p50 < 60s in the
  first 15 min, prestige-preview medals in 10–20 range at Battle 10–12.

## Build phases (each ships when its gate passes)

- **P1 — sim spine**: battles/win-lose/molder HP/classes/economy/save v2 +
  pacing probe. Gate: probe + save tests pass.
- **P2 — presentation**: unit cards UI, battle header + ATTACK, win/loss cards,
  class rendering, molder damage states, banners/audio stingers.
- **P3 — meta**: Command Tree, missions, daily streak, offline retune.
- **P4 — tune & ship**: pacing probe green, art/juice review subagent, code
  review, deploy.

## Explicitly deferred (post-session backlog)
Formation staging grid; merge/rarity mold tiers; parts/treasure sets; recon
missions; arena/tournaments; multiplier gates on the lane; radioman/grenadier
classes; ad-doubled rewards (no ad SDK in a web toy).

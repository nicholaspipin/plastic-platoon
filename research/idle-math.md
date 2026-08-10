# Idle/Incremental Game Math & Retention Research

Research compiled 2026-08 to drive the Plastic Platoon rework. All formulas are copy-ready.
Primary sources: Anthony Pecorella (Kongregate) "The Math of Idle Games" I–III + GDC talks
("Idle Games: Mechanics and Monetization of Self-Playing Games", GDC 2015; "Quest for
Progress: The Math and Design of Idle Games", GDC Europe 2016), GameAnalytics benchmarks,
game wikis (AdVenture Capitalist, Cookie Clicker, Egg Inc., Clicker Heroes, Realm Grinder),
and design writing cited inline. Items marked **[synthesis]** are recommendations derived
from the sources rather than a number quoted verbatim.

---

## 1. Progression / cost curves

### 1.1 The core formulas (industry standard)

Cost of the next unit of a generator:

```
cost_next = cost_base * growth^owned
```

Production of a generator type:

```
production_total = production_base * owned * multipliers
```

Bulk-buy cost of n units when you already own k (geometric series):

```
cost(n) = base * growth^k * (growth^n - 1) / (growth - 1)
```

Max affordable units with currency c:

```
max_n = floor( log_growth( c*(growth-1) / (base*growth^k) + 1 ) )
```

(All four from Pecorella, Math of Idle Games Part I.)

### 1.2 Real growth multipliers used by shipped games

| Game / generator | growth | notes |
|---|---|---|
| AdVenture Capitalist, Lemonade Stand | **1.07** | base cost 4 (~3.738 for 2nd), production 1.67/s |
| AdVenture Capitalist, other businesses | **1.07–1.16** | slower generators get higher growth |
| Cookie Clicker, all buildings | **1.15** | the genre's most-copied single number |
| Idle Idol | **1.10** | team reports 11–19% effective growth per upgrade |
| Derivative Clicker tier-1 | **1.10** | cost 5 * 1.1^n |
| Eric Guan's model economy | cost **1.15** vs production **1.10** | deliberate gap = pacing lever |

Rule of thumb: **1.07 = fast, generous curve** (buy often, numbers fly), **1.15 = tight
curve** (each copy is a small event). Use low growth on your workhorse early generator and
higher growth on later/more powerful ones. A difference of 0.01 in the exponent base is
enormous 100 purchases later — tune in a spreadsheet, not in code.

### 1.3 Milestone multipliers (the "sawtooth")

AdCap gives **x2 production at 25, 50, 100, 200, 300, 400 owned** (stacking) of each
business. This is essential: per-generator production is linear in `owned` while cost is
exponential, so without milestone jumps each generator becomes irrelevant fast. Milestones
create "save up for 25" mini-goals and make old generators worth revisiting.

### 1.4 The exponential race (why walls happen)

- Each generator: production grows **linearly** with copies owned, cost grows
  **exponentially**. Exponential always wins ("no matter how big k or how small n" —
  Part I), so every generator individually stalls.
- Stacked tiers produce **polynomial** total growth (Part II: tiers behave like
  1, t, t²/2, t³/6 … → approaches e^t with infinite tiers), but exponential costs still
  outpace it. The stall is *designed in* — it is what makes prestige feel necessary.
- **Soft wall = the moment time-to-next-meaningful-purchase exceeds the player's session
  tolerance.** You tune wall position by choosing growth rates and where milestone/prestige
  relief valves sit, not by adding artificial gates.

### 1.5 Time-to-next-purchase (TTNP) pacing targets **[synthesis]**

Grounded in Pecorella's pacing spreadsheets, "density of goals" (Stankovic, Unity LevelUp:
mid-term mobile motivation window ≈ 5–7 min; frequent achievable goals beat one distant
goal), and observed AdCap/Cookie Clicker first-hour behavior:

| Game phase | Something affordable every… |
|---|---|
| Minutes 0–10 | **15–45 s** |
| Minutes 10–60 | **1–2 min** |
| Hour 1 – Day 2 | **3–10 min** (with a milestone or unlock ≤ 30 min away) |
| Steady state | one purchase per session minimum; wall only when prestige is available |

Perception note: humans notice multiplicative change; **≈20% is the just-noticeable
difference** for game numbers (Weber–Fechner, via Eric Guan). Early upgrades should move
income ≥20%; a +3% upgrade reads as nothing.

### 1.6 Alternative growth (optional flavor)

Derivative/cascade model (Derivative Clicker, Swarm Simulator, Shark Game): tier-N
generators produce tier-(N-1) generators. Total output becomes polynomial of degree =
number of tiers. Good for a "Molder that builds Molder-parts" late-game system; costs must
still be exponential or the game explodes.

---

## 2. Prestige design

### 2.1 Prestige-point formulas from shipped games (Pecorella Part III)

| Game | Formula | Basis | Runs needed to 2x your prestige |
|---|---|---|---|
| AdVenture Capitalist | `angels = 150 * sqrt(lifetime / 1e15)` | lifetime earnings | earn ~**3–4x** lifetime |
| Cookie Clicker | `chips = cbrt(baked_all_time / 1e12)` | lifetime (forfeited) cookies | ~**8x** |
| Egg, Inc. | `Δsoul_eggs = (earnings_this_run / 1e6)^0.14` | **this run only** | ~**128x** (2^7) |
| Realm Grinder | `p = (sqrt(1 + 8*(max_coins/1e12)) - 1) / 2` | max coins held | **4x**, but re-resetting at the same point yields **zero** |
| Clicker Heroes | hero souls ≈ f(levels purchased) + primal bosses | upgrades bought (≈ log of gold) | flat-ish curve |

Design takeaways:

- **sqrt on lifetime earnings (AdCap style) is the friendliest**: every run always adds
  some prestige, even a lazy one; diminishing returns discourage spam-resetting without
  punishing it.
- Cube-root and ^0.14 curves force much longer runs between resets; Egg Inc's per-run
  basis means quitting a run early wastes it — stronger commitment, harsher feel.
- Max-currency bases (Realm Grinder) have the nasty property that a same-point reset earns
  literally nothing — avoid.
- Clicker Heroes' "souls from levels purchased" effectively **takes the log of the growth
  curve**, which is why its prestige feels steady rather than explosive.

### 2.2 What prestige points DO (multiplier design)

| Game | Effect per point | Meta layer on top |
|---|---|---|
| AdCap angels | **+2% income each** (upgradeable to higher %) | *sacrifice* angels to buy upgrades — spending reduces your bonus (interesting tension, but confuses casuals) |
| Cookie Clicker | **+1% CpS per prestige level** | separate **heavenly chips spent in an upgrade TREE** (549 upgrades, permanent-upgrade slots, unlock branches) — level bonus is never lost by spending |
| Egg Inc | **+10% earnings per soul egg**, raised by Soul Food epic research (+1%/level); prophecy eggs multiply soul-egg power `(1.05 + bonuses)^PE` | a second currency (golden eggs) buys **epic research** — a permanent upgrade tree that persists through prestige |
| The Tower (idle TD) | run coins → **Workshop** permanent stat tree; prestige currency → meta unlocks | labs (time-gated research) as third layer |

**Trees beat flat multipliers.** Cookie Clicker's split — an automatic passive bonus
(+1%/level, never spent) PLUS a spendable pool for a visible upgrade tree — is the
best-practice template: the passive part guarantees "every prestige = permanently faster,"
the tree part gives choice, build identity, and long-term goals. AdCap's
spend-your-multiplier model creates regret; avoid for a casual audience.

### 2.3 Timing the first prestige

- Community/design consensus: prestige when progress drops to **10–20% of peak speed**;
  early-game resets can be as fast as every **5–15 minutes** in reset-happy games, easing
  to 30–60+ min loops.
- Egg Inc structures a **sub-prestige staircase**: switching to the next egg tier
  multiplies earnings ~**5x** each step between full prestiges.
- **[synthesis]** For a mobile-web hybrid: gate prestige behind a first-session-reachable
  milestone and target **first prestige at 30–90 min of play** (i.e., end of session 2–4).
  Earlier and the reset means nothing; later and Day-1 players never see your best loop.

### 2.4 "Acceleration, not loss" — concrete techniques

1. **Preview the gain before reset**: "Prestige now: +14 Medals → +28% scrap income."
   Never make the player do the math (cited best practice across prestige guides).
2. **Post-reset speed**: with a tuned first prestige, the player should re-reach their
   previous wall in **1/3 to 1/5 of the original time** (first-run milestones return
   2–5x faster). If your +N% at first prestige doesn't deliver that, raise the first-run
   award, don't lower the wall.
3. **Keep something visible**: permanent unlocks (units, skins, stats, tree nodes) that
   survive reset; show lifetime stats.
4. **Instant gratification on reset**: the first 60 seconds after prestige should be a
   fireworks show of purchases (TTNP back to ~5–15 s).
5. **Diminishing-returns basis (sqrt/lifetime)** so there is no "wrong" time to prestige.

---

## 3. Retention hooks — the numbers

### 3.1 Benchmarks (GameAnalytics, idle genre + 2024/25 market-wide)

| Metric | Idle top 10% | Idle top 25% | All-mobile median (2024/25) |
|---|---|---|---|
| D1 retention | **45.6%** | **39.4%** | top-25% of all games: 26–33% |
| Avg session length | **7 min** | **6 min** | 5–6 min (top-25%: 8–9) |
| Sessions/day | **5.8** | **5.0** | ~4 |
| Daily playtime | **34.9 min** | **21 min** | — |
| Stickiness (DAU/MAU) | **18%** | — | hyper-casual ~10.5% |
| D7 | idle ≫ genre average | — | median 3.4–3.9%, top-25% 7–8% |

Idle/AFK games match or beat RPGs at D7/D30 — retention is the genre's superpower.
Design target for Plastic Platoon: **sessions of 3–8 min, 4–6 per day**.

### 3.2 Unlock cadence (first session / first hour)

Best practice from idle-design literature (Machinations, GameAnalytics, Melvor Idle
analysis): start with an almost-blank UI; reveal each system when it becomes relevant;
show grayed-out "next unlock" teasers; never dump systems in the first 10 minutes; the #1
killer is stagnation — new systems/upgrade paths must keep arriving.

**[synthesis] Concrete cadence that matches AdCap/Egg Inc first-hour behavior:**

| Minute | New thing |
|---|---|
| 0:00–0:30 | first purchase (tap-level) |
| ~2:00 | second generator/unit type |
| ~5:00 | automation (manager / Molder auto-stamp) |
| ~8–10:00 | first milestone x2 + first boss/challenge |
| ~15:00 | third unit + first *lose-able* fight |
| ~20:00 | missions/quests panel |
| ~30:00 | fourth unit or second lane/theater |
| ~45–60:00 | prestige teased with visible counter ("Medals on reset: 12") |

Roughly **one new mechanic every 5 minutes for the first half hour**, then every
10–15 min to the end of hour one.

### 3.3 Daily rewards / streaks

- Daily login rewards appear in ~**95%** of mobile games; escalating 7-day calendars with
  a big day-7 prize are the standard shape.
- Users with a **7+ day streak are 2.3x more likely to engage daily**; dual
  streak+milestone systems cut 30-day churn by ~**35%** (Plotline/Mistplay data).
- Use **forgiving streaks**: 1 missed day doesn't reset to zero (or can be repaired with
  soft currency). Harsh resets churn the exact players you want back.

### 3.4 Offline earnings tuning

| Game | Offline rate | Cap | Cap upgradeable? |
|---|---|---|---|
| AdVenture Capitalist | 100% (businesses with managers) | effectively none | — |
| Egg, Inc. | reduced ("away earnings") | **~2 h base** | yes (research/artifacts) |
| Idle Miner Tycoon | warehouse-limited | **~2 h base** | yes (warehouse level + research tree) |
| Genre norms (design lit) | **50–100% of active rate** | **2–12 h** | almost always sold/earned as upgrades |

Key insight from Pecorella on Egg Inc: a hard 2 h cap **forces re-engagement** and pushes
players through the sub-prestige staircase. Offline cap is not stinginess — it is your
session-scheduling tool, and "raise offline cap/rate" is one of the best upgrade-tree and
ad-reward sinks in the genre.

### 3.5 Appointment mechanics

- Tiered "re-engagement clocks" (Eric Guan's model): fast producer caps every **20 min**,
  mid every **5 h**, slow every **2 days** — one reason to check in on every natural
  schedule, and each player type optimizes a different clock.
- AdCap's classic ad boost: **2x earnings for 4 h** — an appointment AND an ad unit.
- Timed research/labs (The Tower, Egg Inc epic research) give a "come back when it
  finishes" hook without punishing absence.

### 3.6 Quests and goal laddering

- Rotating small mission slots (2–4 concurrent) are standard in top idle hybrids; goals
  must span horizons: "**always one goal ~5 minutes away, one ~an hour away, one
  ~a week away**" (goal-density principle, Stankovic; mid-term mobile window 5–7 min).
- Density of goals exists to guarantee the player is never stuck with zero reachable
  objectives — when blocked on one axis, progress on another.
- Missions should pay in a currency the main loop wants *now* (scrap/boosts), with weekly
  meta-missions paying prestige-adjacent currency.

---

## 4. The fun-failure: why unloseable waves kill engagement

### 4.1 The problem

- Juul (*The Art of Failure*): the enjoyment core of games is **escaping failure** —
  players seek out activities where they can fail because overcoming inadequacy is the
  payoff. A battle that cannot be lost delivers zero of this.
- Pure no-fail idle engagement runs on *habit + number-growth*, which works for the
  economy layer — but if you present a **battle** and it is unloseable, players quickly
  detect that it's a progress bar in costume: no stakes, no decisions, no tension, and the
  combat theming becomes noise. Fail states are what create learning, goal clarity, and
  the "one more try" impulse (Game Wisdom, fail-state hierarchy).
- Loss aversion cuts the other way too: the best-tolerated fail cost is **short-term
  progress only** — severe enough to matter, never destroying accumulated meta progress.

### 4.2 Win/lose structures that work in idle hybrids

**Clicker Heroes (soft-fail damage check):** boss every 5 zones, **30-second timer**;
fail → progression toggles off and you drop back one zone to farm. Losing costs nothing
but signals precisely "your numbers are too small here," and beating a wall you failed
yesterday is the emotional high point of the loop.

**The Tower – Idle Tower Defense (run-based):** every run ends in death; difficulty ramps
sharply by wave 10–15; run coins feed a permanent **Workshop** tree so *every* loss pays;
prestige currency unlocks meta systems. The loop "die → spend → push a little farther" is
the genre-proven "just one more run" engine. Death is the *harvest moment*, not a
punishment.

**[synthesis] Rules for lane-battle idle:**
1. Battles must be discrete (Battle 1, 2, 3…), each with a win state and a lose state.
2. A loss must never touch meta currency — it ends the attempt and pays a consolation.
3. The wall battle should be *tunably* 2–5 attempts away from the current economy state;
   the intended read is "I need +30% power," never "this is random."
4. Losses should look close: player should usually lose with the enemy flag/base visibly
   damaged (below ~20–30% HP) — near-misses drive retry (Juul's near-miss motivation).

### 4.3 Pity / rubber-band systems on repeated loss

From DDA literature and mobile practice:

- Trigger on **consecutive failures of the same content**, adjust gradually, and smooth
  (single wild swings feel rigged; oscillation is the classic DDA failure mode).
- **[synthesis] copyable spec:** after 2 consecutive losses on the same battle, reduce
  enemy HP/damage budget by **5–8% per additional loss, capped at 25–30%** total; reset
  the adjustment on victory; never display it. Optionally surface it *diegetically*
  instead: "Reinforcements arrived!" free buff token after 3 losses (overt pity reads as
  generosity; overt difficulty-lowering reads as insult).
- Alternative/parallel: pity *payouts* — escalate the consolation reward per consecutive
  loss so the economy catches the player up even if difficulty stays fixed.

---

## Directives for Plastic Platoon

Numeric, implementable, in priority order:

1. **Cost curves.** Molder/economy upgrades: `cost = base * 1.07^n` for the primary scrap
   generator, `1.10–1.12` for mid units, `1.15` for elite units and global upgrades.
   Successive unit *types* priced ~10x apart (10, 100, 1e3, 1e4 … scrap).
2. **Milestone sawtooth.** Every unit type gets **x2 output/power at 10, 25, 50, 100, 200
   owned**, shown as a progress pip under the buy button.
3. **TTNP pacing.** First 10 min: something affordable every **15–45 s**; to end of hour
   one: every **1–2 min**. Instrument it — log time-between-purchases and alarm if p50
   exceeds 2 min inside the first session.
4. **Battles are win/lose.** Replace endless waves with **discrete battles of 2–4 min**
   (fits the 3–8 min session with overhead). Enemy strength budget per battle grows
   **x1.15–1.18**; player economy under directive 1 grows faster early, slower later, so
   the first real wall lands at **Battle 8–12, minute 25–40**.
5. **Boss checks.** Every 5th battle is a tan "Commander assault" with a **30-second
   surge timer** (Clicker Heroes pattern): survive/break the line in time or the battle
   ends as a loss. Fail → return to map, farm, retry.
6. **Losses pay.** Defeat awards **50%** of the victory scrap plus a "battle report"
   showing damage dealt and a near-miss bar (enemy base HP remaining). Never lose
   currency, units-owned, or medals on defeat.
7. **Pity rubber-band.** After 2 consecutive losses on the same battle: **-6% enemy HP
   per further loss, cap -25%**, hidden; at 3 losses also drop a visible free
   "Air Support" token. Reset on win.
8. **Prestige (Medals) formula.** `medals = 150 * sqrt(lifetime_scrap / S1)` where `S1` =
   lifetime scrap a normal player has at minute ~60 (tune so first prestige awards
   **10–20 medals**). Lifetime basis + sqrt: every run adds medals; ~**4x lifetime scrap
   to double** medal count.
9. **Medal effects — two layers.** (a) Passive, never spent: **+2% scrap income per
   medal** earned lifetime. (b) Spendable 1:1 medal points in a **Command Tree**
   (Cookie Clicker model): nodes like Starting Sergeant (begin runs with unit 2 unlocked),
   Faster Molder (+25% stamp speed), Offline Logistics (+2 h offline cap), Veteran Mold
   (units keep milestone x2s through prestige). 12–20 nodes at launch.
10. **First prestige at 30–90 min**, gated on beating Battle 10 (the wall from directive
    4). Post-prestige, reaching Battle 10 again must take **≤1/3 of the original time**;
    show a pre-reset preview: "Prestige now: +14 Medals → +28% scrap forever."
11. **Sub-prestige staircase.** Between medal resets, "new Theater" unlocks (Backyard →
    Sandbox → Kitchen Table …) each multiplying scrap value **~5x** (Egg Inc staircase)
    with a fresh enemy skin — this is your content cadence between walls.
12. **Offline earnings.** **100% of Molder rate, capped at 2 h** base; cap upgradeable to
    **8 h** via Command Tree/ads; on return show "While you were away" with a **2x
    ad-double** button, and offer AdCap's classic **2x-for-4-h** ad boost as an
    appointment mechanic.
13. **Unlock cadence, minute marks:** 0:30 first upgrade, 2:00 second unit, 5:00 Molder
    auto-stamp, 8:00 first milestone x2, 10:00 first boss, 15:00 first losable battle +
    third unit, 20:00 missions panel, 30:00 second lane/theater tease, 45:00 medal
    counter appears. One new mechanic ≈ every 5 min for 30 min.
14. **Missions: 3 rotating slots** — one ~5-min goal ("Stamp 50 soldiers"), one ~1-h goal
    ("Win Battle 12"), one daily/weekly goal ("Earn 3 medals this week"), auto-refilled;
    small scrap/boost payouts, weekly slot pays a medal-adjacent reward.
15. **Daily calendar + streak.** 7-day escalating login rewards (day 7 = premium-feel:
    big boost token or exclusive gold-plastic skin); streak survives 1 missed day. Target
    the benchmark envelope: **D1 ≥ 35%, sessions 4–6/day at 4–7 min** — instrument all
    three from day one.
16. **Upgrade feel.** Any single purchase in the first hour should move visible output by
    **≥20%** (just-noticeable difference); merge smaller effects into fewer, chunkier
    upgrades. Use K/M/B/T short-scale number formatting from the start.

---

## Sources

- Pecorella, *The Math of Idle Games* Part I: https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i
- Part II: https://www.gamedeveloper.com/game-platforms/the-math-of-idle-games-part-ii
- Part III (prestige formulas): https://www.gamedeveloper.com/design/the-math-of-idle-games-part-iii
- GDC 2015 talk (mechanics/monetization, retention & ARPPU data): https://archive.org/details/GDC2015Pecorella
- GDC Europe 2016 "Quest for Progress" slides: https://media.gdcvault.com/gdceurope2016/presentations/Pecorella_Anthony_Quest%20for%20Progress.pdf (interactive sheets: kon.gg/idle-math-spreadsheets)
- GameAnalytics idle-genre engagement/benchmarks: https://www.gameanalytics.com/blog/how-to-keep-players-engaged-and-coming-back-to-your-idle-game and https://www.gameanalytics.com/reports/2025-mobile-gaming-benchmarks
- Eric Guan, *Idle Game Design Principles* (re-engagement clocks, JND): https://ericguan.substack.com/p/idle-game-design-principles
- Stankovic, *Density of Goals* (ironSource/Unity LevelUp): https://medium.com/ironsource-levelup/density-of-goals-2620113518bc
- Idle Idol balancing postmortem: https://www.gamedeveloper.com/design/balancing-tips-how-we-managed-math-on-idle-idol
- Machinations, idle design: https://machinations.io/articles/idle-games-and-how-to-design-them
- Cookie Clicker ascension/heavenly chips: https://cookieclicker.fandom.com/wiki/Heavenly_Chips
- Egg Inc earnings bonus/soul eggs: https://egg-inc.fandom.com/wiki/Earnings_Bonus
- AdVenture Capitalist angels: https://adventure-capitalist.fandom.com/wiki/Angel_Investors
- Clicker Heroes boss/zone design: https://blog.clickerheroes.com/how-to-progress-through-clicker-heroes-zones/
- The Tower – Idle Tower Defense design analysis: https://www.bluestacks.com/blog/game-guides/the-tower-idle-tower-defense/ttitd-beginners-guide-en.html
- Daily login/streak data: https://www.plotline.so/blog/streaks-for-gamification-in-mobile-apps , https://business.mistplay.com/resources/daily-login-rewards
- Juul, *The Art of Failure* (MIT Press): https://mitpress.mit.edu/9780262529952/the-art-of-failure/
- Fail-state hierarchy: https://game-wisdom.com/critical/hierarchy-of-fail-states-game-design
- DDA overview: https://www.intechopen.com/chapters/1228576

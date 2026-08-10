# W2 — Concepts: Systems Track

Date: 2026-08-10. Designer hat: systems-first (Balatro / Dragonsweeper / Into the Breach lineage).
Constraint set: w2-synthesis-brief.md (familiar verb + ONE twist; fun ≤60-90s; clip-ability as spec;
one-glance identity; 30+ day moat; 2-6 min rounds; one-thumb portrait; PixiJS/TS/web-first;
rewarded-video + $2.99-4.99 starter; no gacha/fake timers).

## Pre-flight: host-claim audit (searched 2026-08-10 — Wave 1 is already stale)

The "un-mined host toys" list in w1-novel-mechanics.md §6 has been strip-mined since it was compiled.
Verified via web search today:

- **Coin pusher — CLAIMED.** *RACCOIN: Coin Pusher Roguelike* (Doraccoon / **Playstack — Balatro's publisher**),
  Steam, March 31 2026. ~150 coins + ~150 items, six characters. Mostly Positive.
- **Darts — CLAIMED-ish.** *Greedy Darts* (Steam Early Access, Oct 2025): cards modify darts rules/scoring
  across Count-Up, Zero-One, Cricket.
- **Dominoes — CLAIMED.** *Dominova* (Steam, chain-scoring roguelike), *PUPAI* (EA), *Dominoed!* (itch).
- **Dice-poker / Yahtzee — CLAIMED.** *Pip My Dice* (Steam): explicit "Yahtzee roguelike inspired by Balatro."
- **Mahjong — CLAIMED** (*Aotenjo: Infinite Hands*, 2024, prior knowledge — not re-verified today).

Conclusion: the E-space window is closing at "one host per quarter" speed, and Playstack itself is now
farming it. The three concepts below therefore (1) take the one physical arcade host verified still open,
(2) take the deduction-grid path where the moat is solver tech rather than a host claim, and (3) take the
portrait anomaly space where the moat is a content-generation pipeline. All three verified below.

---

# CONCEPT 1 — TICKET GOBLIN
*(space E: Balatro-wrap on an un-mined host — skee-ball, verified open)*

## One-line pitch
Skee-ball Balatro in a cursed midnight boardwalk arcade: flick balls up the lane, break the scoring with
prize-counter junk, and make the machine vomit a physically impossible ribbon of tickets.

## Core verb + the one twist
**Verb:** flick a ball up a skee-ball lane (everyone has done it; aim + power in one thumb-swipe).
**Twist:** the prize counter is the joker shelf. Tickets are chips. Every piece of arcade junk you win
(rubber snake, finger trap, lava lamp, sticky hand) is a passive scoring modifier, and drafted trick balls
(rubber, split, magnet, heavy, ghost) turn each flick into an engine piece. One elegant scoring rule
generates the depth: **the Ladder** — each ball that lands in a ring of equal-or-higher value than the last
adds +1 to your multiplier; a drop or gutter breaks it. The two tiny 100-pockets are always available, so
every single flick is a greed decision.

## First 60 seconds
Portrait lane fills the screen, ball at the bottom, nine-ball rack visible. Text: "Flick." First flick lands
a 20 — tickets chatter out of the slot, the goblin behind the prize counter grins. Second flick, a 30 —
"LADDER x2" pops. By ball five the player has discovered the 100-pockets by missing one into the gutter.
Frame 1 quota ("counter closes at 150 🎟") is beatable by anyone. After the frame: the prize counter slides
up — three prizes, priced in the tickets you just won. Buy the rubber snake ("gutter balls bounce back
once"). No tutorial beyond the word "Flick."

## The clip moment
Vertical, center-framed, escalating: a split-ball drops into BOTH 100-pockets at Ladder x8 while the rubber
snake resurrects a gutter ball that climbs back up the lane on its own — the ticket counter becomes an
odometer blur, and a physical ribbon of tickets spews out of the slot, piles up the bottom of the screen in
real time, and buries the goblin, who keeps eating them. 10-15 seconds, no context needed, the pile IS the
scoreboard. (Ticket-spew is skee-ball's native "pack rip" — the single most emotionally loaded 10 seconds
of the arcade, per the TCG Pocket lesson.)

## Share artifact
The **prize-counter photo**: an auto-composed polaroid of your goblin posing with every prize won this run,
ticket total as a receipt stub stapled to the corner, machine seed printed as the date stamp. Daily-machine
runs add a rank ("Top 4% of today's machine").

## Daily / retention shape
- **Daily Machine** (D1-D7): one seeded cabinet per day for everyone — same lane physics quirk, same prize
  pool, one attempt scored on a leaderboard. Streak calendar of receipt stubs.
- **Cabinet ladder** (D7-D30): new cabinets unlock with new lane geometry and rule mutators (tilted lane,
  moving rings, "lights out" frames, the pier's haunted cabinet) — Balatro's deck/stake structure re-themed
  as a boardwalk of machines.
- **Prize collection book** (D30+): the plush-you-could-never-afford meta. Absurd flagship prizes
  (250,000 🎟 giant plush) are real long-arc goals that mint status.

## Depth / moat (why a clone in 8 weeks is shallow)
1. **Physics feel is craft, not spec.** The flick→ramp→ring flight is hand-tuned game feel; clones copy the
   rule and ship a mushy lane (same reason Peggle-likes rarely land).
2. **Physical synergies, not spreadssheet synergies.** Prize/ball interactions are *simulated* (magnet ball +
   metal ring insert + bumper peg = discovered, not read off a card). 100+ items whose interactions must be
   tuned in the sim take months to copy at quality — Block Blast's A/B moat, but in physics.
3. **The Ladder is skill-expressive**: leaderboards separate players by aim discipline, not just build luck,
   which keeps daily-machine competition alive for months.
4. Mascot brand (the goblin is the ad — Capybara Go lesson) compounds while clones stay generic.

## Monetization fit
- Rewarded video: +1 bonus ball on a failed frame; reroll the prize counter; one "double ticket" frame/day.
- Starter pack ($3.99): remove ads + two cabinets + goblin skin. Supporter pack: cosmetic prize skins,
  golden tickets (visual only). No timers, no gacha — prize pool contents are always visible (EU DFA safe).

## Buildability
PixiJS v8 + TS: one ball simulated at a time (trivial perf vs RACCOIN's 300-body pile), fake-3D lane via
perspective scaling + drop shadow, runtime atlas for prizes, WebAudio for ticket-chatter foley (existing
toy-foley synth pipeline reuses directly). Deterministic seeded physics for daily machines (fixed timestep).
**Hardest risk:** making the 2.5D ball flight feel true — ramp launch arc, ring lip physics, and readable
depth in portrait perspective. Mitigate with a hand-rolled ballistic model (not a physics engine) tuned via
the existing screenshot/perf harness.

## Originality check (searched)
- Closest: **RACCOIN: Coin Pusher Roguelike** (Playstack, 2026) — proves "arcade cabinet + roguelite
  economy" works, but its verb is passive pile-physics (drop and watch), PC/landscape. Ticket Goblin's verb
  is an aimed skill-shot with a streak rule — closer to darts than to a pusher — and is mobile-portrait-native.
- **Greedy Darts** (2025 EA) — aim + cards, but PC, dartboard host, no physical-item sim.
- **Macho Mick** (Steam) — skee-ball appears only as one cabinet in a 3D arcade hall, not as a system host.
- Mobile "Skee Ball" apps (e.g. *Skee Arcade Ball Bowling Roll*) — pure sims, zero economy.
- **No skee-ball roguelite exists on any platform as of 2026-08-10.** The host's native ticket/prize-counter
  economy mapping onto chips/jokers is this concept's unfair advantage: the re-theme explains itself.

---

# CONCEPT 2 — DEADWEIGHT
*(space I: deduction-grid retheme — the Dragonsweeper path, on Battleship Solitaire's information system)*

## One-line pitch
Battleship Solitaire as a deep-sea salvage dive: the row/column tonnage numbers tell you where the wrecks
sleep — every dredge costs air, mines lie about their weight, and you can always surface... or take one
more breath.

## Core verb + the one twist
**Verb:** tap grid cells to reveal, guided by row/column count clues — Battleship Solitaire's solved,
100-year-old information system (fleet manifest + line tonnage totals), which millions already play in
puzzle apps and newspapers.
**Twist:** the Dragonsweeper move — bolt a push-your-luck economy onto the pure logic. Every reveal costs
**Air**. Completing a whole wreck (all its cells) banks salvage × depth multiplier. Mines *count toward the
line tonnage numbers* (the devilish rule: the clues are honest, but they aggregate treasure and death into
one number — deduction is separating them via the manifest). Surface any time to keep your haul; drown and
lose half. Deduction skill converts 1:1 into economy: perfect logic wastes zero air, and saved air IS the
push-your-luck budget for the next, richer depth.

## First 60 seconds
Portrait 8×10 seabed, sonar numbers along both edges, manifest strip at top (2× skiff, 1× trawler, 1× ferry,
3 mines). Air gauge: 24. Guided step 1: "This row reads 0 — sweep it" (free-clears teach that logic = free
information). Guided step 2: "This column reads 4 and only 4 cells are left — dredge." First wreck completes
by second 40: hull sections hoist with a winch *clunk-clunk-clunk*, value counter rolls. Then the game asks
its whole question at once: air says 19, the next number is ambiguous, and the SURFACE button starts
glowing. Round = one dive, 90-120s; run = 3 dives (shallows → midwater → abyss), 4-6 minutes.

## The clip moment
**The manifest cascade**: when the last ambiguous wreck is placed, every remaining unknown resolves at once —
the whole board zeroes out in a chain of auto-reveals, wrecks hoist in sequence bottom-to-top while the air
needle bounces on E, and the final tonnage stamps as the diver breaks the surface. The best runs end as
"zero-air full-clears" — a last-second-save clip with a visible countdown, dense enough for 10-15s vertical.
Failure clips too: greed dive at 2 air, tap, mine, screen floods.

## Share artifact
Wordle-square-native: the daily dive exports a small grid of ⬛🟦🟨🟥 (silt / swept-by-logic / dredged /
mine) + "Air left: 3" + tonnage — your *path through the deduction*, spoiler-free, instantly comparable.
Everyone had the same seabed; the squares argue about who solved it cleaner.

## Daily / retention shape
- **The Daily Dive** (D1-D7): one authored-difficulty, guaranteed-no-guess seed for everyone, one attempt.
  Streak = consecutive surfacing days.
- **Expedition runs** (D7-D30): 3-dive roguelite runs with kit drafting between dives — extra tank, diagonal
  sonar ping, magnetometer (marks mines in one line), salvage claw (auto-completes a wreck missing 1 cell).
  Kit changes which *deductions* are cheap, so builds change how the same puzzle type is read — that's the
  systems depth, not stat inflation.
- **Depth ladder** (D30+): abyss strata add new manifest entries that bend the information system one rule
  at a time — eels (2-cell wrecks that *move* one cell when you miss), ghost ships (count in rows but not
  columns), pressure (numbers only visible within 2 cells of a revealed tile). Each stratum is a fresh
  deduction dialect on the same grammar.

## Depth / moat (why a clone in 8 weeks is shallow)
1. **Generator + solver is the moat.** Guaranteed-no-guess boards with a *tuned difficulty curve* (measured
   in deduction-chain length, not mine count) require a constraint solver and months of curve calibration —
   exactly the invisible craft that made Dragonsweeper feel authored. Clones will ship guessy boards and
   players feel the difference in a day.
2. **The economy grades skill continuously.** Pure Battleship Solitaire is binary (solved/not); Air turns
   every inference into marginal value, which is what makes leaderboards and dailies argue-able for months.
3. **Rule-dialect content pipeline** (eels, ghost ships, pressure) is systemic content: cheap for us to add
   against the solver, expensive for cloners to re-derive.
4. Thumb-shaped and senior-legible (big tiles, no timer in daily mode) — quietly serves the Vita audience
   the autopsies flagged as the biggest demographic gap.

## Monetization fit
- Rewarded video: +4 emergency air (once per dive); second daily attempt; kit reroll.
- Starter pack ($2.99): remove ads + expedition mode + dive-suit cosmetics. Supporter: chart-room themes,
  brass sonar skins. Daily always free and complete (Wordle trust posture; EU DFA safe — air is earned or
  watched, never sold as consumable currency).

## Buildability
The easiest of the three: pure grid UI in PixiJS, zero physics, tiny atlas, WebAudio winch/sonar foley.
Solver runs in a worker or at build time (daily seeds pre-validated server-side/CI). Deterministic,
interrupt-safe, offline-friendly.
**Hardest technical risk:** the generator/solver — producing no-guess boards whose *hardest step* matches a
target difficulty tier. It's a known constraint-propagation problem (Battleship Solitaire solvers exist in
literature) but the difficulty-grading layer is original work. Prototype the solver first; if grading fails,
fall back to human-curated seed pools (Dragonsweeper shipped hand-tuned).

## Originality check (searched)
- **Battleship Solitaire** apps and dailies (App Store, Google Play *Fleet*, solitaire.org, lukerissacher.com)
  — the host exists everywhere as a pure logic puzzle; none has an economy, push-your-luck, or meta layer.
- **Dragonsweeper** — the system template (solved classic + HP economy), but its host is Minesweeper
  adjacency; Deadweight's information grammar (line totals + shape manifest) plays completely differently:
  it's about *fitting shapes*, not local adjacency, so deductions are global and cascade harder.
- **SUBSTRATUM** (itch) — sonar + finite resources underwater, but it's roguelite *navigation*, not grid
  deduction. **Dave the Diver / Dredge** — theme neighbors only.
- **No Battleship-information-system game with a push-your-luck salvage economy exists as of 2026-08-10.**

---

# CONCEPT 3 — SCROLLBACK
*(space F: mobile anomaly-spotting, portrait 30s-loop rounds — The Exit 8's rule on the device in your hand)*

## One-line pitch
It's 3 AM and your feed is wrong: doomscroll a haunted phone, scroll back the moment you spot the anomaly,
and survive eight clean screens in a row to be allowed to fall asleep.

## Core verb + the one twist
**Verb:** doomscrolling — the single most practiced gesture on Earth, on a pixel-perfect fake phone (feed,
DMs, status bar, notifications, lock screen).
**Twist:** The Exit 8's loop rule ported to the surface it was always meant for: **if the screen is clean,
scroll on; if ANYTHING is wrong, scroll back.** Wrong call resets your count; eight consecutive right calls
ends the night. The systemic layer on top: a **Clarity streak** multiplies score per call and, past streak 5,
triggers the **deep scroll** — the feed accelerates, anomalies get one tier subtler, and per-call score goes
exponential; you may "log off" any time to bank, or push for a perfect night. Staring (press-and-hold to
zoom) buys certainty but burns **Battery** — the run clock. Phone dies, night's over.

## First 60 seconds
Cold open, no menu: a phone lock screen, 2:57 AM, thumb-swipe up — you're in the feed. Three posts of
recurring cast accounts (the gym friend, the aunt, the meme page). Fourth screen: the aunt's post appears
*twice* — one word different. First instinct-check lands in under 30 seconds. Scroll back → soft chime,
"1/8," clock ticks to 3:04. A wrong call rewinds the clock with a sound like a breath. The rule is fully
learned in one mistake; nothing else is ever taught.

## The clip moment
Streak 7, deep scroll: the feed is *almost* normal — but the status bar clock is counting backwards and one
profile picture is looking at the camera. Creator pauses: "…did you catch it?" Exit 8 proved
audience-plays-along is the clip format for this genre; portrait UI makes the clip literally
frame-identical to the game. The alternate clip is the payoff: on 8/8 the phone's battery hits 4:44 AM,
every post's face turns to the camera at once, and the screen goes dark to a real-feeling *thunk* of the
phone hitting the bed. Both are 10-15s verticals with zero cropping needed.

## Share artifact
The **Sleep Report**: a fake sleep-tracker card — night streak calendar (moon phases), time "fell asleep,"
battery remaining, Clarity peak, and a spoiler-safe icon of what got you ("👁 post, screen 6"). Daily-night
players compare which screen ended them — discussion-bait without spoilers, Wordle-style.

## Daily / retention shape
- **The Daily Night** (D1-D7): one authored 8-screen sequence, identical for everyone, one attempt — the
  shared-suffering Wordle loop. Streak calendar is the retention spine.
- **Insomnia mode** (D7-D30): endless ranked deep-scroll — how far past 8 can you ride the multiplier before
  banking? Leaderboard is score, not survival, so the push-your-luck system (not content) carries replay.
- **Amulet draft** (D7+): pre-night pick of one "screen protector" — blue-light filter (timestamps glow if
  wrong, colors muted), cracked glass (one free wrong call, −20% battery), grip case (slower feed) — small
  rule benders that change *which anomaly classes you can trust yourself on*.
- **Living cast** (D30+): the feed's recurring accounts post new content weekly; your learned sense of their
  "normal" IS the difficulty system, and it deepens the longer you play — familiarity as progression.

## Depth / moat (why a clone in 8 weeks is shallow)
1. **The anomaly grammar engine.** The fake OS is componentized (posts, avatars, timestamps, notification
   stack, status bar), and anomalies are *generated perturbations* with graded subtlety across classes
   (identity, time, language, layout, physics, gaze). Clones hand-author 40 anomalies and are memorized in
   a week; a perturbation grammar mints thousands and lets difficulty be tuned per-class from telemetry.
2. **Baseline familiarity compounds.** Difficulty comes from knowing the cast's normal — a per-player,
   time-deepening moat no asset-flip can copy.
3. **The wager system separates it from every Exit 8-like**: Battery/stare/deep-scroll makes it a score
   game with risk texture, not a binary spot-check — that's the 30-day skill ceiling.
4. Tone craft (dread without jumpscare-spam, 4:44 mythology) is brand; the Sleep Report is a native
   distribution loop.

## Monetization fit
- Rewarded video: "the glitch forgives you" — undo one wrong call (once per night); battery top-up in
  insomnia mode.
- Starter pack ($2.99): remove ads + phone skins (retro LCD, e-ink, cursed beta OS) + amulet slot #2.
  Seasonal anomaly packs later ("October the feed gets worse"). Daily night always free. No fake scarcity.

## Buildability
Cheapest to prototype, hardest to write: pure PixiJS/DOM UI composition, zero physics, trivial 60fps,
interrupt-safe by nature (it's a phone pretending to be a phone). Content pipeline = JSON post templates +
perturbation rules; Claude is a legitimate content-generation co-author here (cast posts, anomaly variants)
with human curation as the taste gate.
**Hardest risk:** (a) anomaly quality control — subtle-but-fair is an editorial craft, mitigated by the
grading engine + playtest telemetry; (b) app-store review of fake-UI/horror — mitigated by web-first launch
(itch/Poki/own domain per the brief), stylized non-brand OS, and store submission only after the design is
proven.

## Originality check (searched)
- **The Exit 8** (+ official smartphone ports, and mobile Exit 8-likes: *AnomalyMuseum*, *AnomalyNightMuseum*,
  *AnomalyMovieTheater*, *Exit Subway Anomaly*) — all are 3D walk-through spaces ported to touch; none is
  feed-native, none has a scoring/push-your-luck system, and w1 research confirms the portrait 30s-round
  slot is empty.
- **Doomscroll** (Steam, 2025-26) — closest by title: a "watch shorts to fall asleep while a stalker drains
  sanity" survival-horror. No anomaly deduction, no rounds, no call/response rule — different game.
- **Simulacra / A Normal Lost Phone** — found-phone narrative games; fixed stories, no systemic loop.
- **Reels-U** (itch) — doomscrolling framing, but it's a content-sorting office game, not anomaly deduction.
- **No feed-native, round-based anomaly-deduction game with a streak/wager economy exists as of 2026-08-10.**

---

## Cross-concept notes for Wave 3

- **Portfolio spread:** Ticket Goblin = physics-feel bet (highest clip ceiling, highest craft risk);
  Deadweight = solver-tech bet (lowest build risk, strongest daily/senior reach); Scrollback = content-grammar
  bet (fastest to prototype, tone-dependent). All three share the seeded-daily + share-artifact + streak spine,
  so the existing save/offline/harness infrastructure amortizes across whichever wins.
- **Timing pressure ranking:** space E is closing fastest (RACCOIN proved the lane to every Balatro-like dev;
  skee-ball won't stay open two quarters). Space F's window is wide but shallow (Exit 8-like fatigue is a
  risk by 2027). Space I has no timing pressure — solver moats age well.
- **Kill-tests before committing** (one week each): Ticket Goblin — does the flick feel great in a grey-box
  lane? Deadweight — can the solver grade difficulty? Scrollback — do 20 generated anomalies fool playtesters
  at the intended rates?

## Originality-check sources

- RACCOIN: https://store.steampowered.com/app/3784030/RACCOIN_Coin_Pusher_Roguelike/ ;
  https://www.gematsu.com/2025/08/raccoin-coin-pusher-roguelike-announced-for-pc
- Greedy Darts: https://steamcommunity.com/app/3212590
- Dominova: https://store.steampowered.com/app/3399130/Dominova/ ; PUPAI: https://store.steampowered.com/app/4166120/PUPAI/ ;
  Dominoed!: https://sprucebyte.itch.io/dominoed
- Pip My Dice: https://store.steampowered.com/app/2797650/Pip_My_Dice/
- Macho Mick: https://store.steampowered.com/app/2778920/Macho_Mick/
- Battleship Solitaire ecosystem: https://apps.apple.com/us/app/battleship-solitaire/id6759176308 ;
  https://play.google.com/store/apps/details?id=com.fishtailgames.fleet ; https://www.solitaire.org/daily-battleship/ ;
  https://en.wikipedia.org/wiki/Battleship_(puzzle)
- SUBSTRATUM: https://hot-diggity-dog.itch.io/substratum
- Exit 8-like mobile field: https://store.steampowered.com/curator/45967956-Exit-8-likes-Anomaly-Games/list/165942 ;
  https://play.google.com/store/apps/details?id=exit8.subway.anomalies ;
  https://tvtropes.org/pmwiki/pmwiki.php/Main/AnomalySpottingGame
- Doomscroll (Steam): https://store.steampowered.com/app/3873730/Doomscroll/
- Reels-U: https://gabutgaming.itch.io/reels-u

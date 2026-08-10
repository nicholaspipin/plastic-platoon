# W2 Concepts — Sensory Toy Track

Generated 2026-08-10. Lens: the core is a TOY — real physics, sound, haptics, touch
pleasure — that is fun before any rule exists, wrapped in a light goal economy.
Drawn from open spaces D (real-physics ASMR), G (audio/haptics-as-info),
J (crowd-as-brush), A/C garnishes (sensors, real-world data). All three: one thumb,
portrait, PixiJS v8 + TS at 60fps on mid phones (thousands of cheap particles,
no full fluid sim). Format per w2-synthesis-brief.md.

Formula check (brief §"the formula"): each concept = a verb everyone already knows
(drag / drag / lift) + exactly one twist (the cursor is a living flock / you move the
field not the medium / the chain siphons itself), fun in ≤60s, clip moment specced,
one-glance identity, and a feel-tuning moat clones can't copy in 8 weeks.

---

## Concept 1 — ROOST

**Name (working title):** ROOST

**One-line pitch:** You are the wind beneath 3,000 starlings — drag your thumb and
the whole evening sky bends, ripples, and sings around it.

**Core verb + the one twist:** Verb = drag (everyone's first touchscreen gesture).
Twist: you never touch a character — your thumb is a pressure/wind field, and the
"cursor" is an emergent murmuration of thousands of birds running real flocking
physics. Toy grammar: **hold** = thermal (flock gathers into a rising column),
**drag** = current they surf in ribbons, **flick** = fear-pulse that propagates
bird-to-bird as a visible traveling wave (the signature murmuration shimmer),
**release** = flock relaxes into a lazy torus. Audio is generated from flock state:
density drives a granular wingbeat bed, turn-rate sweeps a whoosh filter,
compression raises pitch — you can track the flock with your eyes closed
(space G garnish; works beautifully in earbuds).

**First 60 seconds:** No menu. Dusk sky, flock already alive and swirling.
Line 1: "They feel your thumb." Player drags — the flock chases in a ribbon.
Line 2: "Flick." — a wave ripples through 3,000 birds. A hawk silhouette glides in;
birds near it panic visibly, and the player instinctively pulls the flock aside —
fear teaches itself, no third tutorial step needed. Then a tree glows at the bottom:
"Bring them home." The player funnels the flock in; birds pour into branches one by
one, the counter climbs, stars come out. First round complete in ~90 seconds; every
round is one dusk, 2–4 minutes, interrupt-safe (the flock just keeps flying).

**The clip moment:** Hawk dives — the flock splits into two lobes, snaps back
through itself in a vortex ring, then pours into the roost tree like liquid, sound
on (whoosh crescendo → sudden hush → chirping). 10–15s, portrait, center-framed,
no UI. A cropped screenshot (black bird-ribbon on orange dusk) is unmistakable.

**Share artifact:** The "sky signature" — a long-exposure-style render of your
round's flock-density trails: a unique swirl fingerprint, stamped with date, roost
count, and birds lost. Everyone's dusk looks different; grid of them reads like
generative art. Secondary: your persistent roost tree at night.

**Daily/retention shape:** One daily dusk, seeded by weather — optionally your REAL
local weather (space C): wind gusts shove the flock, rain tightens it, fog shrinks
audio range. One daily hawk pattern; par = birds lost; global roost-count board.
Streaks grow a persistent roost tree (nests, fledglings, lights). Monthly migration
seasons re-theme the backdrop (pier, reedbed, city wires). D30 hooks: rare morphs
(leucistic starling) appear inside YOUR flock to spot and lure; flock cap grows
3,000 → 5,000 with device-tiered unlocks.

**Depth/moat:** The moat is feel: the exact cohesion/alignment/fear/wind constants
that make the flock read as *alive* (not a screensaver) take months of tuning, and
the procedural audio graph is welded to the sim. Cloners will ship generic boids
that neither sing nor scare. Weather/season content pipeline and the persistent
tree add a liveops cadence lever (brief P8).

**Monetization fit:** Rewarded video = double-flock dusk, rare-bird lure, HD sky-
signature export. Starter pack ($3.99) = remove ads + golden-hour/storm palettes +
two roost dioramas. Supporter pack = aviary cosmetic set + name-a-bird. No power
sold; generosity front-loaded (brief P6).

**Buildability:** 3–5k boids with a spatial hash grid, typed arrays, fixed
timestep; neighbor updates staggered (each bird re-queries every 3rd frame —
perceptually invisible). Birds are 2-frame wingbeat sprites from the existing
runtime-atlas pipeline in a Pixi v8 ParticleContainer. Audio via the existing
WebAudio synth (filtered noise + granular bed). Comfortably under the p95 17.5ms
budget. **Hardest risk:** neighbor-query spikes when the flock compresses — cap
neighbors per cell, jitter the update stagger, and let the perf harness degrade to
2,500 birds on weak devices.

**Originality check (searched 2026-08-10):** Closest existing:
[MURMURATION](https://murmuration-pink.vercel.app/) — an interactive web art demo
(~800 boids, cursor-as-predator, desktop, no goals, no audio design) — and
[Flock! (THQ, 2009)](https://en.wikipedia.org/wiki/Flock!), a delisted UFO-herds-
sheep puzzler with no murmuration feel. Swarm Simulator is an idle numbers game.
No mobile title owns thumb-steered murmuration as a toy — exactly the vacancy
w1-novel-mechanics §7.10 documents. ROOST differs by being portrait/one-thumb,
goal-wrapped (roosting rounds), audio-generative, and weather-daily.

---

## Concept 2 — IRONBLOOM

**Name (working title):** IRONBLOOM

**One-line pitch:** Drag a real magnet under a plate of 10,000 iron filings —
they crackle into blooming field-line flowers, and today's picture is hiding
in the iron.

**Core verb + the one twist:** Verb = drag (a magnet under glass). Twist: you never
touch the medium — everything moves through a genuinely simulated magnetic field
(dipole superposition), so filings chain into arcs, ridges, bridges and standing
spikes exactly like the childhood toy — behavior no attract-particles fake can
produce. Toy grammar: **drag** = filings rake into comet trails along field lines,
**hold** = spikes rise under your thumb ("fur standing up"), **double-tap** =
polarity flip → repulsion bloom (a crackling ring burst), **second magnet**
(unlocked) = filing bridges arcing pole-to-pole. Sound is information (space G):
the crackle is granular synthesis driven by filings-snapped-per-frame — you hear
exactly how much iron you're moving; fast strokes through loose filings give the
ASMR "shhh"; haptics tick in aggregate.

**First 60 seconds:** A plate of scattered filings. "Slide." — arcs leap to your
magnet. "Hold." — spikes rise. "Double-tap." — repulsion bloom. Then a faint
stencil appears in the glass (a cat): "Fill the cat with iron." The player herds
filings into the silhouette; a fill % ticks up; at par the picture *develops* like
a photograph — contrast snaps in, a date stamp slams down. First finished artwork
inside 90 seconds. Daily round 2–5 minutes; zen freeplay plate always one tap away.

**The clip moment:** 12 seconds: scattered chaos → confident herding trails → the
polarity-flip flourish scattering a perfect ring → the picture develops with the
stamp slam and crackle-to-silence cut. Alt clip: "petting the plate" — spike waves
rising and falling under fast strokes, pure ASMR. Cropped screenshot = black iron
strands on backlit glass; instantly identifiable.

**Share artifact:** The developed daily picture rendered from your *actual* final
filing strands — every player's cat is drawn in different iron — plus a compact
result card: date / fill % / strokes vs par (the Wordle-square analog: same
silhouette, everyone's iron is different).

**Daily/retention shape:** One global stencil per day, par scored in magnet strokes
(golf). Album of developed plates = the collection meta (brief P5) — flipping
through your month of iron pictures is the D30 anchor. Weekly puzzle mode: pinned
magnets + limited placements that must auto-herd the filings (the light rule layer
deepens without touching the toy). Magnet kit unlocks over weeks — horseshoe, ring,
electromagnet (hold-to-pulse) — each a genuinely different field topology, i.e. a
new brush, not a stat.

**Depth/moat:** Real field physics + the density tricks that make clumping/ridging
read as *true* (see buildability) + count-driven crackle audio = months of feel
work. The existing "magnet ASMR" shovelware is attract-only particles and reads
fake within seconds — that contrast IS the marketing (w1 §4: huge watching
audience, served only by fake physics). Stencil pipeline costs us nothing (any
silhouette works), so dailies are effectively infinite; custom-stencil-from-photo
is a UGC engine cloners won't bother with.

**Monetization fit:** Rewarded = replay today's plate / hint magnet / HD export.
Starter pack = remove ads + plate skins (brass filings, glow-in-dark, black sand on
white). Supporter = workshop cosmetics + custom-stencil-from-photo (edge detection
runs locally). No consumables, no timers.

**Buildability:** Closed-form dipole field, k ≤ 3 magnets → 10k filings × k evals
per frame, trivial in typed arrays (no neighbor queries at all — cheaper than
boids). Filings are short oriented line sprites (Pixi v8 instanced mesh, or
ParticleContainer with half-rate rotation updates for far particles). Clumping via
an O(n) coarse density grid: filings decelerate in crowded cells → ridges form
along field lines like real life; spikes are a vertical-scale + shadow cheat
(2.5D). **Hardest risk:** making the iron read as *real* — naive field-following
looks like a hair-comb screensaver; the density-feedback slowdown + strand-joining
at rest is the make-or-break week of tuning.

**Originality check (searched 2026-08-10):** Closest existing: educational field
simulators — [Luminous Learner's bar-magnet lab](https://luminouslearner.com/science/physics/physics-tool/magnetic-field-bar-magnet-simulator/)
and [ExploreLearning Gizmos](https://gizmos.explorelearning.com/find-gizmos/lesson-info?resourceId=631)
— which are labs, not games (no goals, no audio craft, desktop). Physical
ancestors: Wooly Willy, 3D filing viewers. Mobile "magnet/sand ASMR" apps are
fake-physics shovelware. Nothing combines a real field sim + ASMR sound design +
a daily stencil economy. IRONBLOOM is the Dragonsweeper move applied to a beloved
physical toy nobody has digitized honestly.

---

## Concept 3 — SIPHON

**Name (working title):** SIPHON

**One-line pitch:** Lift a single bead of a 2,000-bead chain out of its jar and the
chain fountains *upward* on its own — steer the living arc before the jar runs dry.

**Core verb + the one twist:** Verb = lift-and-drag one point of a chain (grabbing
a necklace out of a bowl — everyone's done it). Twist: the chain self-siphons — the
real, famously "impossible" Mould effect / chain fountain — so after your first
pull, physics takes over and you're steering a fountain that arcs *above* the jar
rim, rising higher as it drains faster. Toy grammar: **touch the chain anywhere**
= pinch a bead (loupe magnifier under your thumb), **pull over the rim** = the
siphon ignites, **then the same thumb slides the catch-glass** under the falling
stream; **flick the stream** = whip waves travel down the chain; beads land in
coils that audibly stack. Sound is information (space G): per-bead clatter granular
(pitch from velocity) plus an accelerating zipper-whir that tells you drain speed
by ear; haptic buzz ramps with chain speed — every round is a crescendo.

**First 60 seconds:** A glass jar of pearl chain. "Pull one bead out." The chain
pours — then, gasp, lifts clear of the rim into a floating arc. "Catch it." The
glass slides under your thumb; beads coil in with rising clatter. First jar drains
in ~45 seconds; the coil glistens; your glass is placed on a shelf. Round two adds
one floating ring to thread mid-air. Rounds are 1–4 minutes (a jar = a round),
naturally interrupt-safe between jars.

**The clip moment:** The fountain at full drain speed arcing nearly a screen-height
above the jar, whipping in a spiral through three rings, landing in a perfect coil
— 10–15 seconds, portrait, sound ON (the crescendo sells it). The phenomenon looks
physically impossible on sight; Steve Mould's videos of the real effect have 10M+
views. Five seconds of this genuinely triggers "wait, what is that?"

**Share artifact:** Your shelf. Every finished round leaves a glass containing your
*actual* coil (deterministic replay freezes the final pose). Share card = shelf
photo + round stats: drain time / beads spilled / rings threaded. Tapping a jar on
the shelf replays its pour sound — the shelf is a music box of your best rounds.

**Daily/retention shape:** Daily rig — jar position, ring/peg layout, chain
material, a breeze — global leaderboard on clean drain time (zero spills).
Chain materials are the collection: brass (heavy, low clatter), glass (bright),
bell-chain (lands melodically), glow (light trails) — each a real physics + sound
variant, not a reskin. The shelf is the persistent meta; shelf rooms fill over
weeks. Weekly two-chain rigs: interleave two colors into one glass without
tangling → marbled coils. D30 is mastery: riding the arc higher (speed vs control)
is a genuine skill curve with visible expression.

**Depth/moat:** A *stable, steerable* chain fountain is hard physics tuning —
academic papers still argue about why the effect exists at all
([Biggins & Warner and successors](https://arxiv.org/abs/1612.09319)). Fast-follow
cloners will ship floppy verlet ropes that never fountain, and the difference is
visible in one second of footage — the effect itself is the moat. Add the per-bead
granular audio engine and the deterministic coil-replay shelf and an 8-week clone
is transparently hollow.

**Monetization fit:** Rewarded = retry today's rig / day-pass for a premium chain
material. Starter pack = remove ads + material pack + a shelf room. Supporter =
golden jar + custom chain colorways. Leaderboard and shelf are free forever.

**Buildability:** 2,000-node position-based-dynamics chain, 6–8 constraint
iterations, typed arrays — well within budget (constraint chains are cheap; this is
not fluid). Beads render via ParticleContainer; self-collision only near the pile
via spatial hash (for coiling), never O(n²). **Hardest risk:** the fountain itself
— the real mechanism (the pile "kicking back" as links lever off it) is delicate,
so the plan is feel-first: inject a calibrated upward impulse at the pickup point,
tuned against reference footage, rather than hoping it emerges. Second risk:
tunneling at high chain speed → substeps + swept capsules for the fast head
segment only. Both risks are prototype-week-one questions with clear fallbacks.

**Originality check (searched 2026-08-10):** No chain-fountain game exists on any
platform — searches for the effect return only physics papers, Steve Mould/Spangler
demos, and [Wikipedia](https://en.wikipedia.org/wiki/Chain_fountain). Closest
games: "Bead Toy ASMR" (gears-and-beads fidget app, no fountain, shallow physics)
and Rope And Balls-style hypercasual rope toys. The signature phenomenon — the
entire hook — is unclaimed.

---

## Appendix — direction checked and rejected

**Safecracking-by-feel** (dial + haptics/audio-as-info, space G): rejected on
originality. ["Unlock it: Safe Cracker Puzzle"](https://apps.apple.com/lc/app/unlock-it-safe-cracker-puzzle/id6738165926)
(iOS, 2024+) already ships exactly this — haptic dial, sound cues, arcade/time-
attack modes — and Sophie's Safecracking Simulator covers it on itch. The G-space
strengths were folded into all three concepts instead (ROOST's flock-you-can-hear,
IRONBLOOM's crackle-as-quantity, SIPHON's speed-by-ear), which also keeps each toy
usable eyes-free in earbuds without betting a whole product on the vacated slot.

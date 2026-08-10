# W2 — Life-Integrated Concepts (Open Spaces B, C, G, H)

Generated 2026-08-10. Three concepts that live inside the player's day rather than
demanding sessions. Slate thesis binding all three: **"the real world is the only
timer."** No fake scarcity, no artificial cooldowns — the sky, your feet, and the
clock are the game's economy. This is simultaneously the EU-Digital-Fairness-Act
answer, the anti-dark-pattern brand story, and a moat: clones that fake the
real-world data miss the entire point.

Coverage: Concept 1 = spaces C+H (real-world-data rules + daily ritual/share
square). Concept 2 = space G (+C) (earbud/walking + daylight rules). Concept 3 =
space B (+C) (widget/Live-Activity-first + weather/moon rules). Every concept has
a web-playable core for the Poki/itch funnel; native-surface work is flagged as
risk per concept.

---

## Concept 1 — OUT TO DRY (working title)

### One-line pitch
Competitive laundry: hang a line of washing against your city's real weather
forecast, then watch the actual sky decide your score at sunset.

### Core verb + the one twist
**Verb:** placing items on a timeline (solitaire-style planning — everyone
understands hanging laundry instantly). **Twist:** the odds table is your city's
real hourly forecast, and the game resolves against the weather that *actually
happens*. The forecast is the dealt hand; the sky is the house.

### First 60 seconds
Open in browser. "Where's your line?" — geolocate or type a city (or tap "Play
yesterday" for the instant demo, see Buildability). Today's basket slides in:
five garments, each a readable card (JEANS: needs 5 dry-hours. SILK SCARF: max
wind 2. THE DUVET: 6 hours, huge payout, ruined by any rain). Above the line, a
sky timeline of the next 16 hours — sun strength, wind arrows, and rain
percentages drawn as approaching cloud walls. Drag jeans onto the 9am–2pm span;
a live odds ticker responds: "83% full dry · +1.2x." Drag the duvet across the
3pm 40% shower hour and the ticker goes "+3.1x IF you ride the storm." Two
guided steps total (drag, confirm). Tap HANG IT. The line bounces, cloth ripples,
pegs clack. "See you at sunset." (Web demo: the day time-lapses in 15 seconds
instead.) The core judgment — how much do I trust this forecast? — lands inside
the first minute because everyone already has an opinion about their weather app.

Second beat of the day: at sunset the reveal cinematic replays the observed
weather over your line, resolving garment by garment. And at any moment, if
rain-radar nowcast detects rain actually starting at your location, you get a
push: **"RAIN AT YOUR LINE — 90 SECONDS"** — open to a frantic one-thumb snatch
minigame, saving what you can grab before the wall of water crosses the yard.

### The clip moment (10–15s vertical)
The sunset reveal: center-framed clothesline, sky sweeping gold → bruised
purple, wind ripping the sheets sideways, a rain wall sliding in from frame
left while the duvet's dry-meter ticks 94… 96… 97% — and the player snatches it
one second before the downpour, "+3.1x RODE THE STORM" slamming on screen.
Alternate clip with legs: the real-life version — creators filming themselves
sprinting to their actual washing line when the game's rain alert fires. A game
that makes people run through their garden is inherently TikTok-native.

### Share artifact
**"The Line"** — a horizontal strip, instantly legible, deeply weird to
non-players: top row is the day's sky as weather glyphs hour by hour
([sun][sun][cloud][wind][rain]...), bottom row is tiny garment icons in their
final state (crisp / damp / SOAKED), plus verdict text: "Full dry · +3.1x ·
RODE THE STORM" and a city badge ("LONDON LEAGUE · Dry streak: 9").
- **Spoiler-free by construction:** there is no answer to spoil — it's your sky.
- **Identity-flexing twice over:** skill (the multiplier you dared) and climate
  identity (a Seattle +2x is understood to be worth more than a Phoenix +2x —
  climate handicap leagues make this explicit and hilarious).
- **Intriguing to non-players:** a row of weather glyphs with little clothes
  under it and "RODE THE STORM" reads as a mystery that takes one question to
  resolve — and the answer ("it's competitive laundry against real weather") is
  itself a repeatable joke.
- Same-city recipients had the *same sky* and played it differently — instant
  watercooler comparison, the Wordle property re-derived from geography instead
  of a shared word.

### Daily/retention shape
The ritual is **two-beat**: a 90-second morning plan (slots into the existing
check-the-weather habit — we are colonizing a ritual people already perform
daily) and a 30-second sunset reveal, with occasional adrenaline snatch alerts
between. D7: city league week (fair because everyone in your city gets the same
sky and the same seeded basket), wardrobe growth, dry-streak protection
decisions on risky days. D30: the seasons themselves rotate the meta — autumn
wind metas, winter indoor-line unlock, spring pollen (whites risk!), monsoon
events — the content pipeline is the atmosphere, which ships new content daily
forever at zero marginal cost. Underserved-audience fit (space L): 30+ women,
seniors, and the entire UK/Ireland/Australia "will it rain on my washing"
culture — a demographic no game is courting and utility apps already prove
cares (see Originality).

### Depth/moat
- Forecast-vs-observed scoring tuned per climate (probability calibration,
  regional radar quirks, humidity/drying physics) — weeks of tuning that a
  clone will get wrong in ways players feel immediately ("it said 20% and I
  lost my streak" must feel fair, which is a craft problem).
- City leagues are a network effect: the 40th player in your city makes your
  league better; a clone starts with empty cities.
- The two-beat ritual + snatch alerts form a habit shape clones can't shortcut.
- Honest-timer brand: the anti-dark-pattern stance is the marketing.

### Monetization fit
Rewarded video: a second line slot today, a peg pack (pegs are the placement
resource), or "insurance" after a soaking (recover 50% of a lost multiplier —
grief relief, not power). Starter pack $3.99: heirloom wardrobe (new garment
cards = new puzzle pieces, not power), backyard cosmetic themes, supporter flag
on your share strip. Later: seasonal pass keyed to real seasons. Nothing here is
a fake timer — the only clock is the sky, which is the EU-DFA-proof design.

### Buildability
Lowest-risk concept of the three. PixiJS: verlet-strip cloth sim (cheap, juicy,
already in the wheelhouse with the existing shader/atlas pipeline), sky gradient
shaders, particle rain. Weather: Open-Meteo (free, keyless) — hourly forecast +
historical archive + minutely precipitation nowcast. No server for MVP
(client-side, seeded baskets from city+date hash); leagues need a small backend
later. **Web/Poki funnel solved by "Yesterday Mode":** play any real city on any
real past day with the resolve time-lapsed to 15 seconds — instant full loop in
the browser, infinitely replayable, and it doubles as the tutorial. The live-day
mode is the retention product on top. Hardest technical risk: nowcast/radar
precision varies by region (snatch alerts must degrade gracefully to hourly
checks where minute-scale radar is unavailable); second risk: disputes when the
observed-weather station disagrees with the player's window ("it rained here!")
— mitigate with generous benefit-of-the-doubt scoring and a "contest the sky"
flavor button that grants mercy once per week.

### Originality check (searched)
Searched: "laundry drying game real weather forecast," "game that uses your real
local weather as gameplay mechanic," "Weatherlings," name collision "Out to
Dry." Findings: the laundry-weather niche is exclusively **utility apps** — Hang
the Washing?, Washcast, DryCast, DryTime, Drying Buddy — which prove the
audience obsession but contain zero game (no wager, no score, no ritual, no
share). Closest actual *games* using real weather as rules: **Weatherlings**
(MIT, 2009 — real-city weather data powering creature card battles; academic,
educational, long dead) and **Weather Farmer** (idle clean-energy game reading
local weather; passive modifier, no daily judgment loop). Pokémon GO uses local
weather as a spawn modifier, not as the rules. Nothing found that (a) turns the
forecast into a dealt hand, (b) scores against observed reality, or (c) has any
daily-ritual/share shape. Name "Out to Dry" — no game collision found.

---

## Concept 2 — SOFTFOOT (working title)

### One-line pitch
An earbud stealth game played with your actual footsteps — freeze mid-stride
when the giant stops snoring, because it can hear your feet.

### Core verb + the one twist
**Verb:** walking — the thing the player was going to do anyway — plus the
universally understood children's-game verb of *freezing* (red light/green
light, musical statues). **Twist:** the phone's motion sensors listen to your
real gait, and your footstep rhythm is the game's only controller. Monsters in
spatial audio hear you walk; stealth means controlling your actual feet.

### First 60 seconds
(Web demo, the Poki funnel:) Two pads on screen — LEFT FOOT, RIGHT FOOT. "Drum
your fingers to walk." A knight vignette trudges through the Sleeping Giant's
garden; a colossal snore rumbles in warm stereo, lootable chimes glitter ahead.
Text: "While it snores, walk." You drum, treasure chimes accumulate. Twenty
seconds in, the snore *catches* — hitch of silence — "FREEZE." You stop
drumming; a heartbeat swells, an enormous nostril-wind sweeps left to right
across the stereo field, then the snore resumes. That gasp-and-freeze is the
whole toy and it lands in under 30 seconds. (Native/walk mode: identical, except
the pads are your legs, the screen is off in your pocket, and the freeze is your
actual body going statue-still on a sidewalk.)

### The clip moment (10–15s vertical)
A creator filmed from across the street, earbuds in, walking normally — then
mid-crosswalk they snap into a full statue freeze for three seconds (captioned
monster audio: "...the Marchwarden stirs..."), hold, exhale, and tiptoe
exaggeratedly out of frame as loot chimes tick up on the overlay. It is Lethal
Company's lesson in daylight: the game manufactures *human* comedy — the
funniest thing in frame is always the player's body. The duet/stitch format
writes itself ("freeze check: could you pass?"), and every clip teaches the
mechanic in one viewing.

### Share artifact
**The Gait Sigil** — your walk rendered as a circular seal: cadence steadiness
becomes ring geometry (a smooth walker's sigil is clean and concentric; a
chaotic one is jagged and wild), close calls notch the rim as heartbeat ticks,
haul rarity gilds the edges, distance shown as "leagues," expedition name
generated from real conditions ("Dusk Crossing, Light Rain"). **No map, no
route, no location — privacy is a design feature**, not a compliance apology,
and it's what makes sharing safe and universal. Everyone's sigil is different
because everyone's walk is different — it is literally a fingerprint of how you
move, which makes it the purest identity-flex artifact possible: "this is what
my walk sounds like to a monster." Non-players see a beautiful arcane seal and
ask the acquisition question. Weekly artifact: seven small sigils in a strip —
your week of walks, streak legible at a glance.

### Daily/retention shape
The game colonizes walks the player already takes: commute, dog, school run,
lunch loop. Expeditions size themselves to the walk — there is no "session
length," there is your life. Real daylight at your latitude gates the ecology
(space C): dusk species, dawn species, night-only fauna for late dog-walkers,
which makes winter genuinely different from summer. A daily worldwide
"migration" seeds the same rare creature ecology for everyone — shared scarcity,
watercooler talk, streamer same-seed walks. D7: streaks framed as walks taken
(health-positive, never guilt-toned), bestiary filling in. D30: gait mastery —
learned skills like tempo-hold (match the Marchwarden's drumbeat), silent-heel,
slow-drift — plus gear that changes what your footsteps *sound like* to the
world (moss shoes muffle heel strikes and change which creatures notice you).
Retention is structural: the trigger is leaving the house.

### Depth/moat
- **Feel moat:** cadence detection that works across pockets, hands, gaits, and
  phone models is hard, unglamorous tuning. A clone with 300ms of freeze latency
  feels broken in the first minute — this is exactly the kind of moat (craft,
  not content) that survives the 8-week clone window.
- Audio production pipeline (the game IS its sound design) plus a bestiary
  content line that compounds.
- The web finger-drumming toy is a self-marketing funnel clones won't bother
  building.
- Community layer: sigil collections and migration events.

### Monetization fit
Web demo: rewarded video between expeditions (Poki-native). Native: starter
pack $4.99 — expedition gear + a species pack + cosmetic soundscape ("walk
through the Bone Orchard instead"). Rewarded video: "echo charm" — retry a
busted expedition's final stretch. Supporter pack: composer-tier ambient
soundscapes. No energy systems: your legs are the energy system, which is the
honest-timer thesis again.

### Buildability
PixiJS for vignettes/results screens (light rendering load — the display is
your ears). WebAudio synth + stereo/HRTF panning is already a proven strength
of the stack (toy-foley audio shipped in v1). Step/cadence detection via
DeviceMotion works on mobile web today (iOS needs one permission tap, screen
on). The web finger-drum demo is pure existing stack. **Hardest technical risk
(flagged, and it is the biggest of the slate): pocketed, screen-locked play
requires native background audio + pedometer access** — Expo custom dev client
with iOS background-audio mode + CMPedometer / Android sensor batching; step
data while backgrounded is platform-fussy and battery-sensitive. Mitigation
path: v1 ships as "screen-dimmed, phone-in-hand or armband" web/PWA + Expo
foreground mode (fully playable), background/pocket mode is the headline native
update. Design insurance: the game never needs the screen mid-run, so every
improvement in background capability is pure upside, not a redesign.

### Originality check (searched)
Searched: "audio-only walking game real footsteps stealth," "walking game
reacts to your walking pace cadence pedometer," "Zombies, Run! alternatives
2025," name "Softfoot." Findings: the walking-game field — **ZRX (Zombies,
Run!)**, The Walk, MistyWay, WalkScape, Pikmin Bloom, Fit for Battle — is
uniformly *audio drama or RPG meta layered over step counts or GPS pace*. ZRX
is the closest: its zombie chases ask you to speed up ~20% — a coarse,
occasional pace check inside an exercise-motivation frame. Nothing found uses
**live footstep cadence as a continuous, fine-grained stealth input** (freeze
within a beat, tempo-matching, gait texture), and nothing makes the audio world
*react to your feet* rather than narrate at them. The extinct Papa Sangre line
(2010–2013) did audio-stealth footsteps — but virtual ones, via screen taps,
seated. Softfoot is Papa Sangre's mechanic finally connected to actual legs.
Audio-game tags on itch (Robo Walk, FOOTSTEPS) are screen-adjacent hobby
projects, seated, keyboard-driven. Name "Softfoot" — no game collision found.

---

## Concept 3 — STILLCAST (working title)

### One-line pitch
A fishing game that lives on your lock screen: your float sits in the Dynamic
Island for hours, and when the fish bite — in real weather, at real hours — you
get five seconds to hook it.

### Core verb + the one twist
**Verb:** fishing — the most pre-loved waiting game humanity owns, and the
perfect fiction for a game made of micro-moments. **Twist:** the pond runs on
real time and your real conditions (weather, daylight, moon, temperature), and
it lives on the phone's ambient surfaces — the bite happens at an unpredictable
real moment on your lock screen, converting the glance you were already making
into a five-second skill window. Fishing is the one fiction where "mostly
nothing happens" is not a compromise but the *point*.

### First 60 seconds
(Web core:) A pond in "brook time" (clock runs ~12x). Pull back and release —
the cast arcs with real physics, plops, ripples settle, ambient audio breathes.
While waiting you can skim stones and flick chum (a genuine fidget toy — the
waiting hand is never empty). At ~30 seconds the float twitches... then
plunges: a one-thumb tension minigame — hold to keep the line in the green band
as the fish surges, 5 seconds — and the reveal card slams in: species art,
size, and the conditions stamp. Cast again immediately. Fun lands inside 45
seconds, and the whole loop is interrupt-safe by construction. (Native mode:
same game at 1x — you cast before pocketing the phone, and the day happens to
you.)

### The clip moment (10–15s vertical)
A raw screen recording of an actual lock screen, 2:47 AM. The Dynamic Island
float bobs once... twice... *plunges* — thumb slams it, the tension bar dances,
cut to the reveal: "MOONLIT GAR — 61 cm — new moon · light rain · 2:47 AM."
The timestamp is the flex; the format ("caught this on my LOCK SCREEN") is a
what-is-that-app machine. Daylight variant: the Island wiggling during a
lecture/meeting and the agonized decision *not* to tap it.

### Share artifact
Two-tier, both location-free:
- **The Catch Card** — species art, size percentile bar, and the **conditions
  stamp**: moon glyph + weather glyph + exact clock time. The stamp is the
  genius loci: "new moon · storm · 2:47 AM" tells a story about *you* (night
  owl, dawn patrol, storm angler) without spoiling anything — there is nothing
  to spoil, only kinship: anyone who shared your storm shared your bite window,
  so cards spark "were you up for the night bite?" threads.
- **The Bite Chart** (weekly) — a 7×24 grid, one cell per hour, glowing where
  fish bit your line. It is unintentionally a heatmap of your week's rhythm —
  when you were awake, when the world was quiet — and non-players who see this
  gorgeous cryptic grid ask the question. Identity-flexing at the level of *how
  you live*, which no leaderboard can fake.

### Daily/retention shape
The game runs on the player's existing 100-glances-a-day habit and asks for
nothing new — it just makes a handful of those glances wonderful. Real ecology
is the calendar: species gated by season, weather, moon phase, and temperature
("the Ice Pike only bites below 0°C") — which creates regional identity,
cross-climate trade-show culture ("you can catch WHAT in Norway?"), and a D30+
almanac that deepens the longer you play. Fronts, tides, and heatwaves are
events authored by the atmosphere, free, forever. **The ethical stance is
load-bearing:** no fake bites ever (the game never lies to farm opens), missed
bites are logged as "nibble intel" that improves your almanac (absence is
knowledge, not punishment), quiet hours honored. That trust is what makes the
lock-screen presence feel like a pet, not a slot machine — and it is the
EU-DFA-clean version of the mechanic every dark-pattern game wishes it had.

### Depth/moat
- The bite-ecology simulation tuned to real meteorology (a fishing almanac that
  is *actually true* for your sky) is months of invisible tuning.
- The native-surface engineering (a skill window on a lock screen) is genuinely
  hard — the 8-week clone will be a session fishing game with fake weather,
  which is a different and already-crowded product.
- Collection pipeline (600+ species ceiling, seasonal rotations) compounds.
- The honest-timer/no-fake-bites covenant is a brand moat: it is the one thing
  a dark-pattern cloner constitutionally cannot copy.

### Monetization fit
Rewarded video (web-forward): instant re-cast, double bait charge. Starter pack
$3.99: tackle box + rod cosmetic + three rare baits. Supporter pack: koi-pond
cosmetics, custom float skins (your float is your lock-screen avatar — cosmetic
pressure in the most visible pixel real estate the player owns). Later:
seasonal almanac pass keyed to real seasons. No energy, no fake timers — the
weather is the gacha, and it's free.

### Buildability
PixiJS water shaders + physics flick-cast are squarely in the existing
wheelhouse; weather infrastructure is *shared with Out to Dry* (Open-Meteo +
sunrise/moon math — one client library serves both concepts). Bite scheduling
is deterministic and client-side (seeded from conditions + player state — no
server for MVP). The web core (brook-time ponds, compressed clock) is a
complete, Poki-shippable game independent of any native work. **Hardest
technical risk (flagged, per the mission's caution): the entire native surface
layer** — interactive widgets, Live Activities, and Dynamic Island via Expo
config plugins wrapping WidgetKit (iOS) and Glance/notifications (Android).
Specific dangers: Live Activities can't run arbitrary game logic (updates are
pushed states, not code), so the 5-second hook window may need to be "tap the
Island → app opens into the fight in under 1 second" rather than fully
in-widget; Android's surface is fragmented (rely on expanded notifications +
widget). Mitigation: the design survives the compromise — the bite alert is the
magic, and a sub-second app-open fight is still the clip. Ship order: web pond
→ Expo app with push bites → widget/Island layer.

### Originality check (searched)
Searched: "lock screen fishing game widget Live Activity Dynamic Island,"
"fishing game home screen widget bites while phone locked," "fishing game real
weather moon phase," name "Bobber"/"Stillcast." Findings: **no lock-screen or
widget-native fishing game exists** — searches return only generic widget
documentation. Closest existing games, by facet: **Creatures of the Deep**
(Infinite Dreams — the best mobile fishing game, but session-based with
*in-game* weather, not your sky, not ambient); **Bobber Fishing** (relaxing
session float-fishing sim — also claims the Bobber name, hence Stillcast);
**Hooked Inc** (idle fishing clicker, fake timers everywhere — the anti-model);
**Widgetable** (proves lock-screen creature *presence* at massive Gen-Z scale,
but it's a pet display, not a game with skill moments); **Rusty's Retirement**
(2024 — proves the ambient-second-surface play thesis on desktop);
Animal Crossing's real clock proves calendar-fiction retention. Nobody combines
real-conditions bite ecology + ambient surface + a timed skill window. Name
"Stillcast" — no collision found (only "Still Game," a Scottish sitcom).

---

## Slate notes (for the synthesis round)

- **Shared infrastructure:** Concepts 1 and 3 share the entire weather/astro
  client (Open-Meteo, sunrise/moon math, condition-seeded determinism) — picking
  either de-risks the other as a follow-up. Concept 2 shares the WebAudio synth
  investment from v1.
- **Risk ladder (lowest → highest native risk):** Out to Dry (push
  notifications only) → Stillcast (widgets/Live Activities, but web core
  standalone) → Softfoot (background sensors + audio, but foreground mode
  playable day one).
- **All three pass the brief's formula:** familiar verb (laundry/red-light-
  green-light/fishing) + exactly one twist (real forecast as odds / real feet as
  controller / real conditions on the lock screen); fun in ≤60s via web modes;
  clip moments that are human and center-framed; share artifacts that are
  spoiler-free identity objects; no match-3, no idle battler, no Wordle
  reskins, no step-counter gacha (steps are never currency in Softfoot — the
  *rhythm* is the input).

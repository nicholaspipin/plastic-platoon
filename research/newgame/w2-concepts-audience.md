# W2 — Audience-First Concepts (3)

Research date: 2026-08-10. Method: web research pass on demographic/behavioral gaps
(second-screen viewing, sleep/night-shift data, accessibility studies, senior gaming,
parent gaming, commuter/earbud data), then concept generation per the w2 synthesis
brief. Each concept targets ONE audience, and every design decision (session shape,
input, palette, audio, monetization) is derived from that audience's real context.

## The three underserved audiences (research summary)

1. **Second-screen TV watchers (35–54 skew).** 67% of US TV watchers use a second
   device while watching; second-screening among ages 45–54 jumped from 39% (2022)
   to 52% (Nov 2025); 81.9% of the US population projected to be active second-screen
   users by 2027. An entire listicle genre ("best games to play while watching TV")
   exists to recommend games that were designed for something else — the classic
   makeshift-solution signal. No flagship game is *designed* for divided attention.

2. **The 3am cohort: insomniacs + night-shift workers.** 84M US adults (33%) rate
   their sleep fair/poor; ~4 in 10 have trouble falling asleep 3+ nights/week; ~1 in
   10 workers are on night shifts and over half of those have a diagnosable sleep
   disorder. They are already on their phones at 3am — but every game they open is
   bright, loud, and engineered to escalate arousal. Pokémon Sleep ($234.9M lifetime)
   proved people pay for sleep-adjacent play, yet nothing serves the awake-at-3am
   moment itself.

3. **Blind and low-vision (BLV) players.** 285M+ people worldwide are blind or
   low-vision (43M fully blind). CHI 2025 research documents that BLV people actively
   play mobile games and that the overwhelming majority of titles are inaccessible.
   Existing supply is ~80 utilitarian "Blindfold" audio games (iOS-only, dated) and a
   handful of 2015-era premium audio adventures. No modern, generous, collection-driven
   audio-first game exists — and the same design doubles as the vacant "earbud game"
   slot for sighted commuters (brief gap G).

---

## Concept 1 — PENNYFALL

**Audience: second-screen TV watchers (35–54, couch, sound off)**

- **One-line pitch:** A real-physics coin pusher built to live on the couch arm —
  drop a coin, look up at your show, look back down to an avalanche — with
  Balatro-style "charm coins" that turn the tray into a physics engine you build.

- **Core verb + the one twist:** Everyone has played (or watched) a coin pusher —
  drop coins, push the pile toward the ledge. The twist: **the pusher only cycles
  when you drop** (turn-based physics, nothing is ever lost while you look away),
  and **charm coins** — magnet, bumper, glue, splitter, tilt — permanently alter the
  tray's physics for the run, so you're building a compounding avalanche engine, not
  feeding a slot machine.

- **First 60 seconds:** Cold open on a tray already loaded near the ledge. "Tap to
  drop." First drop → push cycle → six coins tumble off the edge with a soft
  haptic *thunk* per coin. Second drop teaches aiming (thumb slides along the top
  edge). Third drop dislodges your first charm coin — a magnet — and the game shows
  it warping the next drop's fall. That's the whole tutorial: three drops, one
  avalanche, one "oh, the coins can be weird."

- **The clip moment:** The overload avalanche. A tray groaning with 300+ coins and
  three stacked charms goes critical from a single drop — slow-mo, the pile shears,
  coins cascade over the ledge for a full 8 seconds while the haul counter spins.
  Center-framed, portrait, needs no sound (it's a silent-couch game — the clip works
  muted, like its audience watches everything).

- **Share artifact:** The end-of-episode **Haul Card** — a stylized receipt: coins
  dropped, biggest single avalanche, charms used, rarest prize fished off the ledge,
  and a one-line title ("The Night of the Triple Magnet"). One tap to share as an
  image.

- **Daily/retention shape:** Runs are "episodes" (~20–25 min of intermittent play —
  deliberately the length of a TV episode, but playable in 2-min glances because
  nothing moves without you). Daily: a new **tray layout + charm pool** each day,
  same seed for everyone — comparing hauls is the water-cooler loop. D7: charm
  collection book + weekly "network premiere" tray with a twist rule. D30: prestige
  "seasons" that add new charm families and tray furniture (bumpers, side ledges,
  waterfalls).

- **Depth/moat:** The charm-synergy space is the moat — real deterministic physics
  means charm interactions (magnet + splitter + tilt) produce genuinely emergent
  avalanches that fake-physics cloners can't reproduce; cloning the *look* without
  the physics sim produces a visibly dead tray. Layered on top: daily-seed
  leaderboard culture and a hand-tuned charm economy that takes months of balancing.

- **Monetization fit:** Rewarded video: reroll today's charm pool, or one "golden
  drop" (a guaranteed charm dislodge) per episode. Starter pack ($3.99): remove
  interstitials + third charm slot + tray skin. Supporter pack ($9.99): foil charms
  and tray furniture, cosmetic only. No coin-regen timers (Coin Dozer's model is
  exactly what the EU Digital Fairness Act era punishes) — episodes replace energy.

- **Buildability:** PixiJS v8 renders the tray as instanced coin sprites over a 2D
  physics sim (Rapier2D WASM or planck.js) with a fixed timestep; the turn-based
  push cycle is a buildability gift — physics only simulates in short bursts after a
  drop, then everything sleeps, keeping p95 frame time honest on mid phones.
  Hardest technical risk: 300+ dynamic bodies during avalanche spikes — mitigated by
  aggressive body sleeping, coin merging at rest, and capping the active window.

- **Audience evidence:** 67% of US TV watchers use a second screen while watching
  (CivicScience); second-screening among 45–54s nearly doubled 2022→2025, 39%→52%
  (MNTN Research); 81.9% of the US projected to second-screen by 2027 (Arena.im /
  eMarketer). Demand is visible and unserved: Mistplay, AtayGames, Cozy Gaming Nook
  all publish "games to play while watching TV" listicles recommending Coin Master
  and merge games — titles designed for other contexts. The coin-pusher verb itself
  is mass-proven: Coin Dozer has 100M+ installs and a 4.6★ rating on a 15-year-old,
  ad-stuffed, timer-gated implementation, and coin-pusher ASMR is a standing TikTok
  genre.

- **Originality check:** Closest existing game: **Coin Dozer** (Game Circus, 100M+
  installs) and its Vegas-style clones. All use always-moving pushers (punishing
  inattention), coin-regen timers, pseudo-physics, and interstitial walls — the
  exact opposite of a divided-attention design. No coin pusher has run-based
  modifier engines (the Balatro wrap, brief open space E), turn-based push cycles,
  or a daily shared seed. Pennyfall is "coin pusher as engine-builder for people
  who are mostly watching something else" — a positioning no incumbent occupies.

---

## Concept 2 — LAST LANTERN

**Audience: the 3am cohort — insomniacs and night-shift workers**

- **One-line pitch:** The only game whose win condition is you falling asleep —
  sort drifting embers into lanterns as the game dims itself, slows itself, and
  finally tucks the screen into black.

- **Core verb + the one twist:** Sorting — the most retention-proven,
  small-team-friendly puzzle verb of 2025–26 — done by lazily dragging drifting
  motes of ember-light into matching lanterns. The twist: **progress makes the game
  dimmer, slower, and quieter.** Every completed lantern lowers the lights, drops
  the tempo, and simplifies the field. The session is designed to extinguish
  itself; reaching "lights out" — or drifting off before it — is winning.

- **First 60 seconds:** True-black screen, one warm amber lantern, five embers
  drifting like dust in a sunbeam. Drag one in: a soft chime rolls off, the lantern
  glows and *breathes*. Two colors appear; a wrong-colored ember simply drifts back
  out — there is no failure, no buzzer, nothing to spike you awake. By 60 seconds
  the first lantern seals, the screen steps 10% darker, and the pace visibly eases.
  The pleasure — slow, fluid, glowing sort-physics — lands immediately.

- **The clip moment:** A 12-second timelapse: the full arc of one session, screen
  stepping from warm amber to near-black, lantern by lantern, ending on a black
  frame with a tiny caption: "this game's win screen is you, asleep." The
  counter-programming premise ("a game that wants you to stop playing") is the
  hook; creators film themselves losing the fight to stay awake.

- **Share artifact:** The **Night Log** — a morning card, auto-composed: a
  constellation-style trail of the lanterns you lit, when your last touch happened
  ("drifted off at 1:42"), and a gentle line ("the moths finished lantern 7 without
  you"). Shared to group chats the way people share sleep scores and Wordle
  squares — a streak of "nights kept," never a streak you can lose loudly.

- **Daily/retention shape:** It's a nightly ritual by definition — the game only
  fully unlocks after local sunset, and content follows real-world night data
  (brief open space C): the actual moon phase sets the palette, cloudy nights bring
  rare moth species, solstices are events. D7: a moth/ember species almanac that
  fills only by playing on different real nights. D30: seasonal night-sky changes
  and "long night" arcs for shift workers who need 20 minutes, not 5.

- **Depth/moat:** The moat is tuning, credibility, and calendar. Calm-but-absorbing
  is a razor's edge a fast-follower can't A/B into in 8 weeks: the dimming curve,
  drift physics, and audio ramps are the product. The real-world night-data content
  calendar (moon, weather, season) takes months of content to copy, and the
  positioning — the trusted "3am game," aligned with 2025 findings that passive
  phone use doesn't wreck sleep the way active-arousing use does — is a brand moat:
  a cloner with interstitials instantly breaks the promise.

- **Monetization fit:** Audience-derived rule: **no ads at night, ever** — an
  interstitial at 3am is product suicide. Rewarded video exists only in the
  optional daytime "prep" screen (choose tomorrow night's lantern shape, preview a
  moth). Core: $4.99 **Nightstand pack** (remove all ads permanently + alarm-safe
  mode + extra lantern sets) — positioned exactly like Calm's paywall, priced like
  a mobile game. Supporter pack for cosmetic night skies. This is the
  counter-"greedy" generosity play (pattern P6) aimed at people at their most
  fragile hour.

- **Buildability:** Trivially within the stack: PixiJS v8 additive-blend glow
  sprites, simple attractor drift physics, WebAudio synth drones already proven in
  the current project. True-black OLED rendering and Screen Wake Lock API on web;
  the Expo shell provides background-audio continuation and do-not-disturb-safe
  behavior. Hardest risk is not technical but design tuning — "calm but absorbing
  enough to displace rumination" needs real playtesting with the target cohort
  (night-shift Discord/Reddit communities are recruitable for exactly this).

- **Audience evidence:** 84M US adults (33%) rate sleep quality fair/poor
  (Casper-Gallup); nearly 4 in 10 adults struggle to fall asleep 3+ nights/week;
  ~1 in 10 workers are night-shift and >50% of them have a sleep disorder
  (ScienceAlert, 2025); insomnia prevalence 38.7% in a 13,025-worker shift study.
  A 2025 Frontiers in Psychiatry study found 1 hour of active screen use in bed
  raises insomnia risk 59% — while passive use (music, podcasts) does not, which
  is precisely the behavioral profile Last Lantern is engineered to match. The
  money is proven adjacent: Pokémon Sleep $234.9M lifetime / 28M downloads, Sleep
  Cycle $37M — but both serve bedtime tracking, not the 3am wake window, and
  neither is a playable game in that moment.

- **Originality check:** Closest existing games: **Pokémon Sleep** (a tracker you
  don't play at night), **I Love Hue** (calm color-sorting, but bright-white UI and
  session-agnostic), Alto's Odyssey Zen Mode (goal-less, not night-designed), and
  the Calm/Headspace apps (not games). Searched for "games designed for insomnia /
  3am / night shift": nothing purpose-built exists — sleep-tech is trackers and
  soundscapes, games are arousal machines. A game whose difficulty curve runs
  *downward* toward a self-extinguishing black screen has, as far as I can find,
  never been shipped commercially.

---

## Concept 3 — BITE (tagline: "fishing, by ear")

**Audience: blind and low-vision players (with a sighted eyes-closed halo)**

- **One-line pitch:** A fishing game you can play with your eyes closed — the cast,
  the bite, the fight, and the trophy all live in stereo sound and haptics, and
  every fish is a song you learn to recognize.

- **Core verb + the one twist:** Fishing — hold to charge, release to cast, strike
  on the bite, manage tension to reel. Universally understood, naturally
  turn-shaped, calm. The twist: **audio is the entire information system** (brief
  gap G). The lure's sink is a falling pitch; fish circle in the stereo field; each
  species has a unique musical motif; the fight is a tension tone you keep out of
  the red by feel — reel when it slackens, ease when it screams. Sight is optional
  by design, not by accommodation.

- **First 60 seconds:** The game speaks for itself — literally; every menu
  self-voices (no screen-reader gymnastics). "Hold anywhere. Feel the cast." Charge
  hum rises, release, splash panned to where your thumb let go. Pitch falls as the
  lure sinks. Within 20 seconds: a motif approaches from the left, circles, then —
  a sharp *knock* plus haptic snap. Tap. Hooked. A 25-second first fight with a
  forgiving tension band, then the catch fanfare and the fish "sings" its motif as
  its card is read aloud. First catch inside a minute, eyes closed.

- **The clip moment:** A creator, eyes shut or phone face-down, narrating the
  stereo field ("it's circling left… wait… NOW") and landing a legendary on the
  strike — the screen shows a minimal, beautiful ripple-and-waveform scene so the
  vertical clip reads instantly. The "I played a whole game with my eyes closed"
  challenge is a proven short-form format, and BLV creators (a vocal, underserved
  community) get a game that's finally *theirs* to showcase.

- **Share artifact:** The **fish card that plays its song** — a web link/image
  combo: species, weight, water, and a tap-to-hear sound signature. For the
  community, "name that fish from the motif" is a shareable audio quiz baked into
  every catch.

- **Daily/retention shape:** A real-data **tide table** (open space C): actual
  local weather, moon phase and time of day set what's biting — dawn and rain
  genuinely matter, giving a reason to return at different real times. D7: species
  almanac + gear you can *hear* (a better reel is a cleaner drag sound; a better
  rod widens the tension band audibly — upgrades as audio, not stats). D30:
  seasonal waters, rare weather-locked legendaries, and community "listening
  tournaments" (everyone fishes the same seeded water for a day).

- **Depth/moat:** The moat is the audio craft plus the community. A competent clone
  can copy a fishing minigame in 8 weeks; it cannot copy 60+ composed fish motifs,
  a tuned binaural mix that conveys distance/direction/species/mood, self-voicing
  UX that the BLV community certifies as actually good, or the trust of
  AudioGames.net / AppleVis — communities that make-or-break accessible games and
  reward the first mover with fierce loyalty and press (AFB AccessWorld reviews,
  accessibility awards). Ears, once trained on Bite's language, are switching
  costs.

- **Monetization fit:** Audience-first monetization: most video ad creatives are
  inaccessible to this audience, so the model leans premium-generous — free core
  with a $4.99 **Deep Waters** pack (new biomes + remove all ads) and supporter
  packs; rewarded video (fully skippable, audio-described placements only) offers
  sonar pings and applies mainly to the sighted halo audience. Web D2C (own domain,
  ~95% keep) matters doubly here because store discovery fails BLV users anyway —
  the community finds games through AppleVis/forums and direct links.

- **Buildability:** PixiJS for the minimal ripple/waveform scene (cheap, 60fps
  anywhere); the real build is WebAudio — PannerNode HRTF for the stereo field,
  the existing synth pipeline for motifs and tension tones; self-voicing UI via
  pre-rendered speech + an ARIA DOM mirror for menus. Haptics: Android web has
  navigator.vibrate; iOS Safari does not — the Expo shell (already built) provides
  real Core Haptics on iOS, making native the flagship platform and web the
  instant-try funnel. Hardest technical risk: iOS web audio unlock quirks and
  making the fight readable through audio alone — mitigated by the toy being
  testable in week one with eyes-closed playtests.

- **Audience evidence:** 285M+ people worldwide are blind or low-vision, 43M blind
  (WHO figures via Tencent accessibility publication). A CHI 2025 paper ("How Users
  Who are Blind or Low Vision Play Mobile Games") documents that BLV people play
  mobile games in numbers, face pervasive barriers, and that accessible titles see
  strong retention; AFB's AccessWorld ran a low-vision gaming survey in spring 2025
  — the community actively evaluates and publicizes what little exists. Supply
  side: the Blindfold Games library (~80 utilitarian audio games, iOS-only) has
  served thousands of players for a decade without modern production values, and
  the standing "best games for blind players" listicles recommend 2015-era titles —
  the same makeshift-solution signal as the other audiences. Halo market: the
  earbud-gaming context is enormous (mobile = 64.8% of the $2.7B gaming-earbud
  market; passive listening is the default commute behavior), and no flagship
  "earbud game" exists.

- **Originality check:** Closest existing games: **A Blind Legend** (2015, premium
  binaural adventure — linear story, no live loop, no collection), **The Vale:
  Shadow of the Crown** (2021, PC/console), **Blindfold Games** suite (dated,
  utilitarian, iOS-only), and visually-driven fishing games (Fishing Clash, Tiny
  Fishing) that are inaccessible. Searched for audio-only / eyes-free fishing
  games: none exist on any storefront I can find. Bite is the first
  collection-driven, live-ops, F2P-generous audio-first game — and the first
  fishing game where the species IS its sound.

---

## Recommendation note (non-binding)

All three pass the general bar (fun in 60s, clip-able, PixiJS-web, one-thumb
portrait). **Pennyfall** has the largest immediately reachable audience and the
strongest fit with the existing physics/juice/perf tooling; **Last Lantern** is the
cheapest to build and the most clip-viral premise; **Bite** has the deepest moat
and press story but the highest audio-engineering risk and the most niche core
audience. If sequencing: Pennyfall or Last Lantern first, Bite as the
reputation-defining second release.

## Sources

- Second screen: https://civicscience.com/what-are-americans-doing-while-they-watch-tv-a-majority-turn-to-a-second-screen/ ; https://research.mountain.com/trends/second-screening-among-older-tv-viewers-has-nearly-doubled/ ; https://arena.im/audience-engagement/second-screen-strategy-trends-2025/ ; https://www.digitalturbine.com/blog/second-screening-understanding-usage-and-audiences ; https://www.mistplay.com/blog/games-to-play-while-watching-tv ; https://thecozygamingnook.com/chill-games-you-can-play-while-half-watching-tv/ ; https://marlvel.ai/apps/coin-dozer ; https://apps.apple.com/us/app/-/id372836496
- Sleep/night: https://aasm.org/americans-are-doomscrolling-at-bedtime-prioritizing-screen-time-over-sleep/ ; https://www.healthline.com/health-news/screen-time-bedtime-insomnia-risk ; https://www.frontiersin.org/news/2025/03/31/hours-screen-use-after-bed-increases-insomnia-risk-frontiers-psychiatry ; https://www.sciencealert.com/most-night-shift-workers-have-a-sleep-disorder-study-confirms ; https://pmc.ncbi.nlm.nih.gov/articles/PMC11949791/ ; https://www.thensf.org/wp-content/uploads/2025/03/NSF_SIA_2025-Report_final.pdf ; https://respawn.outlookindia.com/gaming/gaming-news/pok%C3%A9mon-sleep-hits-2349m-revenue-on-3rd-anniversary ; https://appfigures.com/resources/insights/20251003?f=1
- BLV/accessibility: https://dx.doi.org/10.1145/3706598.3714205 (CHI 2025) ; https://afb.org/aw/spring2025/low-vision-game-survey ; https://www.tencent.com/en-us/articles/2202298.html ; https://apps.apple.com/us/app/blindfold-games/id1456544613 ; https://afb.org/aw/16/12/15494 ; https://www.perkins.org/resource/audio-games-for-blind-low-vision-gamers/ ; https://www.iamhable.com/en-am/blogs/article/8-best-mobile-games-for-blind-and-visually-impaired-players-2025-edition ; https://www.maximizemarketresearch.com/market-report/gaming-earbuds-market/185646/
- Parents/seniors context (investigated, not selected): https://www.activisionblizzardmedia.com/insights/blogs/2024/2/7-facts-about-the-87-percent-of-moms-who-game ; https://www.blog.udonis.co/mobile-marketing/mobile-games/modern-mobile-gamer

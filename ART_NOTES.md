# ART_NOTES.md — Plastic Platoon Art Direction Research
Research pass for the "premium toybox miniature" look. 2D, PixiJS, portrait mobile.
Four areas: (1) the plastic toy material itself, (2) tilt-shift miniature grading, (3) game juice technique canon, (4) hybrid-casual UI patterns. Each section ends with implementation directives an implementer can apply directly.

---

## 1. Classic Green Army Men — Material & Figure Study

### The material
- Classic army men are **injection-molded low-density polyethylene (LDPE)** — slightly flexible, waxy, "almost like rubber" to the touch (TimMee describes theirs as "slightly flexible LDPE plastic with medium detail, and very little flashing"). Cheaper knockoffs use harder, brittler plastic with more flash.
- **Single-pigment monochrome**: the color is *in* the plastic, not painted. There is zero painted detail — every feature (belt, helmet strap, face, rifle) is read purely through **relief + light**, i.e., shadow in crevices and specular on raised edges. This is the core rendering rule for the whole game: detail = value shifts within one hue, never a second hue and never black outlines.
- **Surface finish**: LDPE has a low-to-medium waxy sheen — broader and softer than shiny polystyrene, but under hard light (sun, lamp) it still produces **small, hard-edged, near-white specular hot spots** on curved peaks: helmet dome, shoulders, knee, rifle barrel, base rim. Close-up toy photography shows two distinct highlight types: a **broad milky sheen** (the pigment color lifted toward white) plus a **tiny blown-out hot spot** with a hard edge. Light wraps softly around limbs (slight subsurface/translucency at thin parts — bayonets, antenna glow faintly when backlit).

### Manufacturing artifacts (the "authenticity kit")
- **Molded as one piece** — figure, weapon, gear, and base all fused. Weapons are chunky and fused to the body (no negative space between rifle and chest on many poses).
- **Mold seam**: a faint raised parting line runs vertically around the entire silhouette (side of helmet, down arms/legs, around the base edge).
- **Flash/burrs**: thin translucent webs of excess plastic in concave joins — armpits, between legs, under rifle — plus fuzzy burrs on the base rim. TimMee-quality figures have little; cheap bag soldiers have lots.
- **Ejector-pin marks**: shallow circular rings visible on the backs of figures.
- **The base**: an **oval/rounded pill base ~2–3 mm thick**, same color as the figure, often slightly warped so figures lean a few degrees. The base is the single strongest "I am a toy" signal.

### Color (real-world reference ranges)
- Classic "OD Green" toy plastic sits in the **army-green / dark olive drab band**:
  - Army Green **#4B5320** (the canonical dark reference)
  - FS 34087 Dark Olive Drab ≈ **#4A4E28**
  - Olive-drab camo ≈ **#544F3D**; CSS darkolivegreen **#556B2F**
  - TimMee OD figures photographed in daylight read lighter/yellower, ≈ **#5E6B3C–#6B7A45**
  - Avoid CSS "olivedrab" **#6B8E23** — too bright/yellow, reads as lime, not toy.
- Classic tan is a warm desert khaki, not pink-beige: real figures read ≈ **#C0A068–#D2B48C** (web "tan" #D2B48C is the light end).
- Historic faction colors if we ever expand: **gray** (German), **butter yellow** (Japanese), **blue** (police/allies), plus modern novelty colors. All follow the same monochrome rule.

### Poses (the classic TimMee/BMC canon — use these, they are the icon set)
Standing firing rifleman · kneeling firing rifleman · prone rifleman · **crawling rifleman** (on belly, rifle cradled) · **bazookaman** (tube on shoulder) · **minesweeper** (walking, detector swept out front — perfect scout) · **radio operator** (kneeling, handset to ear — perfect support/buff unit) · 60 mm mortar crew · prone LMG gunner · flamethrower · bayonet charger (lunging) · grenade thrower (arm cocked way back) · officer with pistol/binoculars (pointing). Roughly 12 poses per classic 48-piece bag. Poses are theatrical and splayed — wide stances, exaggerated gesture — because that's what survives at small size.

### How the plastic reads at small sizes
- At a distance the figure collapses to **silhouette + base**. The monochrome material gives almost no internal contrast at <64 px tall, so pose readability lives entirely in the outline. Real bags of soldiers are identifiable pose-by-pose from across a room purely by silhouette.
- The strongest small-size cues, in order: (1) oval base, (2) silhouette of pose/weapon, (3) hue (green vs tan), (4) top-light sheen.

### → Implementation directives
1. **Five-value monochrome recipe — GREEN plastic** (all one hue family, no outlines):
   - Crevice/shadow `#3B4423` — under helmet brim, between legs, panel lines, base underside
   - Base tone `#5A6B3C` — dominant fill
   - Light tone `#82955C` — up-facing planes (top of helmet, shoulders, thighs)
   - Waxy sheen `#B7C68F` — narrow band inside the light tone on curved peaks
   - Specular hot spot `#F4F8E8` — hard-edged, tiny (1–2 px at gameplay scale), on helmet dome + weapon barrel only. No soft gradient on this one — hard edge is what says "plastic".
2. **Five-value recipe — TAN plastic**: crevice `#8A6F42` · base `#C4A46A` · light `#DEC28E` · sheen `#F0DDB4` · specular `#FFFBEF`.
3. **Rim light**: cool 1 px rim `#DDE7F0` at ~35–40% opacity along the top/back silhouette edge (reads as "photographed indoors under a window"). Optional warm bounce on undersides tinted by the floor (carpet red bounce, hardwood amber bounce) at ~15%.
4. **Every unit stands on an oval base**: ellipse width ≈ 60–70% of figure height, ellipse height ≈ 20–25% of its own width, same 5-value recipe, bright sheen line on the front rim, plus a separate soft contact-shadow ellipse under it (black at ~25% alpha, 1.15× base width).
5. **Toybox authenticity details** (cheap, high payoff): give each unit a random lean of **±3–4°**; add a faint 1 px lighter seam segment on part of the silhouette on close-up/large sprites; reserve flash webs and ejector rings for portrait/UI-scale art only (they vanish at gameplay scale).
6. **Silhouette-first sprite design**: design each unit pose as a black silhouette at 48–64 px first; if the class isn't identifiable, fix the pose, not the shading. Overscale weapons ~120% and exaggerate the classic splayed stances.
7. **Faction = hue only.** Green vs tan must be distinguishable in grayscale by value too (tan is lighter) — that's our colorblind safety net. Never add team outlines or icons on the figure itself.
8. Deaths: don't despawn — fall over sideways *still attached to the base* (see Permanence, §3).

---

## 2. Tilt-Shift / Miniature-Faking Grade

### Why it works
Extremely shallow depth of field only occurs when the lens is centimeters from the subject (macro). Blur bands above and below a sharp focus band make the brain infer the scene is tiny. Two more cues complete the illusion: a **high camera angle looking down** (you look *down* at tabletops, *out* at landscapes) and a **hot, saturated, contrasty grade** (miniatures are hand-painted in vivid colors and lit by close studio lights). Tutorials consistently say the effect fails on eye-level shots — the down-angle is mandatory.

### The technique list (from Photoshop-era tutorials + game shader implementations)
1. **Shoot from high overhead**, looking down at 45–70°.
2. **Horizontal blur bands** top and bottom; sharp band across the middle where the subject sits. Photoshop's Tilt-Shift filter uses: solid lines = end of fully-sharp zone, dashed lines = end of transition zone, full blur beyond.
3. **Blur amounts**: Photoshop tilt-shift default ≈ **12 px**; Gaussian-blur-and-mask tutorials use **15–20 px** on typical web-res photos — i.e., roughly **1.0–1.5% of frame height** at max blur.
4. **Transition sharpness**: not a hard cut — a smooth ramp (shader implementations use `smoothstep` on `|uv.y − focusY|`), but a *fairly fast* ramp; a lazy ramp reads as "blurry photo" instead of "miniature".
5. **Grade it hot**: saturation **+20 to +30** (tutorials repeatedly land on +20, +25, +30 — "hand-painted model look"), modest contrast lift, optionally slight warm shift.
6. Optional: fine grain, vignette; skip zoom/distortion (Photoshop tutorial verdict: adds nothing).
7. Game-shader caveat: pure screen-space y-bands break if a tall object crosses the band — irrelevant for our top-down 2D scenes, which is exactly the camera where the cheap version works best.

### → Implementation directives
1. **Band geometry (fractions of screen height H, portrait)**:
   - Focus center at **y = 0.55·H** (the action zone, sitting above the thumb UI)
   - Fully sharp band: **0.39·H → 0.71·H** (≈ 32% of screen)
   - Transition ramps: **0.12·H** on each side (`smoothstep`)
   - Full blur beyond **0.27·H (top)** and **0.83·H (bottom)**.
2. **Blur radii**: max **1.2% of H at top** (≈10 px at 844 pt), **0.8% of H at bottom** (bottom is mostly covered by UI; cheaper and avoids blurring under buttons). Never blur the UI layer — tilt-shift applies to world containers only.
3. **PixiJS**: pixi-filters ships a `TiltShiftFilter`; alternately (cheaper on low-end phones) render the ground/background layer once to a RenderTexture, blur it, and cross-fade sharp↔blurred copies with a vertical gradient alpha mask — zero per-frame filter cost for static camera scenes. Units in the focus band stay on the sharp layer.
4. **Grade**: global `ColorMatrixFilter` — **saturation ×1.25, contrast +8–10%, brightness +2–3%**. Bake this into environment art if filter cost matters; keep runtime grade for screenshots/marketing parity.
5. **Vignette**: corner darkening ~**12%** (radial, multiply). Optional 2–3% opacity static grain on top of world layer.
6. **Camera drawing rule**: draw all environments as if seen from **~55–65° above horizontal** — floor dominates the frame, props foreshortened, tops of furniture visible. No horizon, no sky, ever. The floor *is* the world.
7. Saturation discipline: the *environment* gets graded hot (carpet reds, hardwood ambers, tile blues), but keep the soldier greens/tans in their §1 recipes — the monochrome figures against a hot background is exactly the real toy-photo look.

---

## 3. Game Juice — The Two Canonical Technique Lists

### "Juice it or Lose it" (Martin Jonasson & Petri Purho, 2012)
They take a gray Breakout clone and layer effects until it's gleeful. Their thesis: juice is **non-essential audiovisual feedback layered on top of a game that already works** — "maximum output for minimum input." Technique list demonstrated:
- **Tween everything** — nothing ever teleports or pops; every property change is eased (they use a tween library with bounce/elastic/back easings). Blocks *animate in* with staggered entrance bounces.
- **Ball**: stretch along velocity vector, rotate to direction of travel, trailing afterimages/particle trail.
- **Paddle**: squash & stretch on impact.
- **Blocks**: jelly-wobble when hit; on destruction they *fall out of the world* with gravity + spin (not vanish).
- **Particles** on every collision; confetti/debris on destruction.
- **Screen shake** on impacts.
- **Sound**: pitched, randomized hit sounds; layered; musical.
- **Music-reactive environment**: background gradient pulses to the music.
- **Personality**: eyes and smiles on the paddle/ball/blocks; the paddle's eyes track the ball. Bouncy title text.

### "The Art of Screenshake" (Jan Willem Nijman / Vlambeer, 2013)
A dull side-scrolling shooter improved by ~30 stacked tricks, in this order:
1. Basic animation & sound → 2. **Lower enemy HP** → 3. **Higher rate of fire** → 4. More enemies → 5. **Bigger bullets** → 6. **Muzzle flash** (big, bright, 1–2 frames) → 7. **Faster bullets** → 8. **Less accuracy** (random spread makes autofire feel alive) → 9. **Impact effects** (something visual at the point of every hit) → 10. **Hit animation** (enemies flash/flinch) → 11. **Enemy knockback** → 12. **Permanence** (corpses stay where they die) → 13. **Camera lerp** (camera eases toward target) → 14. **Camera position** (offset toward where you're aiming/facing) → 15. **Screen shake** → 16. **Player knockback** (firing pushes you back) → 17. **Sleep / hit-stop** (freeze the whole game a beat on impact — summaries of the talk quote sleeps up to 100–200 ms for big hits) → 18. **Gun delay** → 19. **Gun kick** (weapon sprite recoils a few px per shot) → 20. Strafing → 21. **Shell casings** (more permanence) → 22. **More bass** in the sounds → 23. Super machinegun → 24. Random explosions → 25. Faster/more enemies → 26. Even higher rate of fire → 27. **Camera kick** (directional camera punch, not just random shake) → 28. **Bigger explosions** → 29. **Smoke/dust** (even more permanence) → 30. **Meaning** (stakes/death makes the feedback matter).
Nijman's shake rule: shake with **random offsets each frame** (not a smooth sine), scaled to impact size, decaying fast — and know when to stop stacking.

### → Implementation directives (concrete numbers for Plastic Platoon)
1. **Trauma-based screen shake** (industry-standard formalization): keep `trauma ∈ [0,1]`; add 0.2 per shot landed, 0.4 per soldier death, 0.7 per grenade/bazooka. Each frame: `shake = trauma²`; `offsetX/Y = maxOffset · shake · random(−1,1)` re-rolled per frame; optional roll `angle = 0.02 rad · shake · random(−1,1)`. Decay `trauma −= 1.5·dt`. `maxOffset = 2.5% of screen height` (≈20 px @ 844). Apply to the world container, never the UI. Add **camera kick**: on bazooka fire, punch camera 6–8 px opposite the firing direction, spring back critically damped over ~150 ms.
2. **Hit-stop**: scale `PIXI.Ticker` delta to 0 (or 0.05) for: **30 ms** normal hit, **60–90 ms** soldier death, **120–150 ms** bazooka/grenade detonation. UI and the frozen-frame particles keep rendering.
3. **Muzzle flash**: 1–2 frames (33–50 ms) — white-core/yellow-fringe star sprite, 2–3× barrel width, plus additive light circle; slight random rotation+scale each shot.
4. **Knockback**: shooter recoil 2–3 px (snap back over 80 ms); hit target knocked 6–12 px along bullet vector, ease-out 100 ms. Gun-kick the weapon sprite 2 px into the figure per shot.
5. **Permanence — our signature version**: dead army men **tip over sideways, base and all**, and stay (cap ~100 persistent corpses, fade oldest at 0.5 α). Shell casings pop out per shot (tiny brass rects, 2-bounce gravity, stay 10 s). Scorch decals on carpet/tile from explosions. A battlefield littered with fallen plastic *is* the toybox fantasy.
6. **Tween everything**: nothing appears or disappears without easing. Standard pop-in: scale 0 → 1.1 → 1.0, back-ease, 250 ms. Standard pop-out: scale → 1.1 → 0, 150 ms. Units squash 1.1×/0.9× for 80 ms when hit; wobble (damped 3 Hz rotation ±4°) when a shot lands nearby.
7. **Inaccuracy**: give all autofire ±4–6° random spread + bigger-than-realistic bullets (tracer rectangles ~3× "real" size) moving fast (cross the play area in ~0.3 s).
8. **Sound layering**: every shot = 3 layers (transient click + mid-body + 80–120 Hz bass thump), pitch-randomized ±10%; duck music ~20% during barrages. Kill confirm = distinct higher "plastic clack" (we're toys — hits should sound like plastic on plastic, a great theming hook).
9. **Personality pass (Juice-it lesson)**: idle soldiers breathe (scale-y ±1.5%, ~1 Hz, phase-randomized); victory poses; the *environment* reacts — carpet fibers puff, dust motes kick up.

---

## 4. Hybrid-Casual / Idle UI Patterns (2024–2026)

### What current hits do
- **Trend direction (GameRefinery/Liftoff 2024–26)**: vertical-first layouts, faster onboarding, fewer launch popups, cleaner store screens, contextual UI (show controls only when relevant); hybrid-casual = casual readability + midcore meta (overarching currencies, live events, loss-aversion mechanics). Rewarded-ad multipliers everywhere.
- **Chunky buttons**: big rounded rectangles with a **darker extruded bottom edge** (the fill color shifted ~30–40% darker as a solid bottom lip), light-to-dark vertical gradient fill, heavy rounded white type with dark shadow. Press = button translates down onto its own extrusion. This is the de-facto standard across Eatventure / Mob Control / Archero-likes and Duolingo-style products.
- **Coin fly-to-counter** (Game Economist Consulting's breakdown of the best implementations): winner pattern (Brawl Stars) — coins **burst outward and spread around** the source (never a straight line), **pause mid-animation** so the player admires the reward, then fly to the wallet counter; the counter **ticks up to exactly the awarded amount** (never mismatch); each arrival gets a chip-like tick sound and a counter pulse. Beatstar adds flip/spin with light reflection and per-currency signature sounds ("rich, weighty audio that suggests abundance").
- **Offline earnings popup**: "Welcome back! You were away 2 h and earned 240 gold" — dim backdrop, coin-pile art, big animated number, **Claim** + **Claim ×2 (watch ad)** buttons; earnings computed `floor((now − last)/tick) · rate` and **capped** (typically a few hours) to create a reason to return.
- **Reward claim moments**: darkened backdrop + **rotating starburst rays** behind the reward + scale-bounce reveal + confetti; chest-opening beats pause for a tap ("anticipation tap") before the payout.
- **Upgrade button states**: affordable = saturated green/gold, **pulsing glow**, occasionally a bounce or gloss-sweep; unaffordable = desaturated gray, price shown in red/gray, no animation; red **badge counters** on tabs showing how many upgrades are affordable (loss-aversion pull).
- **Thumb zone** (portrait): natural/easy zone = **bottom 30–40% of screen, centered**; top corners are the hard zone (worse on >6.5″ phones, where hard zone grows to the top third). Primary actions bottom-center; read-only info can live top. Minimum touch target **44×44 pt** (WCAG 2.1); casual games go much bigger.

### → Implementation directives
1. **Button construction (Pixi Graphics or CSS)**: two stacked rounded rects. Face: vertical gradient, e.g. CTA green `#8BE04A → #5CBF2A`; extrusion: `#3E8C1B`, height = **10% of button height (min 6 px)**, radius = **28% of button height**. 1.5 px inner top highlight `rgba(255,255,255,0.45)`. Label: 800–900-weight rounded font, white, drop shadow `0 / 2px / 0 / rgba(0,0,0,0.35)`. Secondary/premium CTA in gold `#FFD34D → #FFA928`, extrusion `#C77800`. CSS equivalent: `border-radius: 24px; box-shadow: 0 8px 0 #3E8C1B; active: transform: translateY(6px); box-shadow: 0 2px 0 #3E8C1B;`
2. **Button sizes**: primary CTA ≈ **70% screen width × 64 pt**; grid upgrade buttons ≥ 56 pt tall; nothing tappable under 44×44 pt.
3. **Affordable state**: scale pulse 1.00→1.04, sine, ~1 s period + outer glow (CTA color at 40% α, 8 px). Diagonal white gloss-sweep across the face every 2.5 s. **Unaffordable**: grayscale the whole button (face `#B9BEC4`, extrusion `#8A9096`), keep price legible, kill all animation. State flip itself gets a 150 ms pop (that flip is a reward moment).
4. **Coin fly**: on payout spawn 8–16 coin sprites at source → burst outward 60–90 px with random angles over 150 ms (ease-out) → **hold 150 ms** → each coin flies to the counter along a quadratic Bézier with 30–40 ms stagger, 350–450 ms flight, ease-in. Per arrival: counter scale-pulses to 1.15 (80 ms) + rising-pitch tick. Counter tick-up total must equal award exactly. Coin sprite: gold `#FFD54A`, rim `#C98A00`, hard white specular dot (same plastic language as §1).
5. **Offline earnings popup** (shown on session start if away > 2 min): backdrop `rgba(0,0,0,0.6)`; cream panel `#FFF6E3`, radius 28 px, dark-cocoa title "While you were away…"; away-duration line; pile of coins art; earned amount counting up ~0.8 s; buttons: **CLAIM** (green spec above) and **CLAIM ×2 🎬** (gold spec, rewarded ad); offline accrual capped at **4 h** at 60% of active rate. Coin-fly (directive 4) plays on claim.
6. **Starburst**: 12–16 wedge rays, alternating `#FFE066` / `#FFC933`, rotating 10°/s behind any reward icon, additive, masked to a circle; reward icon enters with 0→1.15→1.0 back-ease + one-shot confetti (20–30 quads in faction green/tan/gold — on-theme).
7. **Badging**: red `#FF3B30` circle, white bold count, 2 px white ring, overlapping the parent's top-right corner by ~25%; appears with a back-ease pop and re-pulses when the count increases.
8. **Portrait layout (thumb-zone map)**: bottom 0–12% H = tab bar / nav; 12–35% H = primary interaction zone (deploy cards, upgrade buttons, main CTA bottom-center); 35–78% H = battlefield (the tilt-shift focus band from §2 sits here); top 8% = read-only HUD (coin/gem counters top-left & top-right, settings/pause a small top corner button). Never put a must-tap-in-combat control above 40% H.
9. **Restraint rules (2025-era polish)**: max one popup at session start (the offline-earnings one); upgrades surface contextually next to the thing they affect; every currency gain, however small, gets at least a floating "+N" text with 300 ms rise-and-fade.

---

## Sources
- Army men: Wikipedia "Army men" (en.wikipedia.org/wiki/Army_men) · TimMee OD Green 48pc product page (timmeeusa.com) · Toy Soldier Central "All About Army Men" · GreatBigStuff giant army man (mold-ring note) · Strong National Museum of Play.
- Colors: colorkit.co/color/4b5320 · rgbcolorcode.com/color/olive-drab · encycolorpedia.com/4b5320 · chasetactical.com OD green history.
- Tilt-shift: photoshopessentials.com Tilt-Shift CS6 tutorial (12 px default, +20 saturation) · jefzlim.blogspot.com fake-miniature tutorial (15–20 px Gaussian, ~30% saturation) · iso.500px.com tilt-shift tutorial · petapixel.com fake tilt-shift tutorial · godotshaders.com tilt-shift shaders · noveltech.dev Unity URP tilt-shift.
- Juice: "Juice it or Lose it" (Jonasson & Purho, GDC 2012 / youtube Fy0aCDmgnxg) · "The Art of Screenshake" (Nijman, 2013 / youtube SkgkIXZ_13Y) · artificials.ch/game-feeling (full 30-trick list) · theengineeringofconsciousexperience.com (timestamped list) · fguillen's "checkbox of juiciness" gist · abagames.github.io "Making Games Juicy".
- Hybrid-casual UI: gameeconomistconsulting.com "The Best Currency Animations of All-Time" · edvins.io "Rebuilding the Welcome Back mechanic" · machinations.io idle-game design · games.themindstudios.com idle clicker best practices · parachutedesign.ca & elaris.software thumb-zone guides · gamerefinery.com 2024–25 trend reports · appfollow.io mobile gaming trends 2026 · Supercent (Medium) hyper-casual UI guide.

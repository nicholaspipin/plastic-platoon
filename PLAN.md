# PLASTIC PLATOON — PLAN

## 0. Situation

The brief references a validated prototype at `reference/plastic-platoon-prototype.html`. **That file does not exist** in the repo or anywhere on this machine (searched Downloads/Documents/Desktop/OneDrive). The brief's §3.1 (core loop) and §3.2 (exact baseline numbers) fully specify the prototype's mechanics and tuning, so the game is rebuilt from spec. Logged in DECISIONS.md #1.

## 1. Architecture

### Stack
- **PixiJS v8 (WebGL) + Vite + TypeScript**, static output → GitHub Pages. (Brief's preferred stack; see DECISIONS.md #2.)
- **DOM overlay for UI**, canvas for the world. The toy-packaging UI kit (blister packs, sticker labels, chunky extruded buttons, popups) is dramatically cheaper and better-looking in HTML/CSS than in-canvas. Canvas keeps: units, VFX, props, ground, tilt-shift pass, scrap pips. DOM keeps: counters, upgrade buttons, cards/popups, build badge. (DECISIONS.md #3.)
- **Audio:** hand-rolled WebAudio synth (no samples). Unlocked on first gesture; mute persisted.

### Module layout (`src/`)
```
main.ts            boot, Pixi app, resize, DPR cap, loop wiring
sim/
  sim.ts           fixed-timestep simulation (60 Hz), all game rules
  units.ts         unit pools + stats (green, tan, bosses)
  waves.ts         wave scheduling/scaling
  economy.ts       scrap, upgrades, costs
  save.ts          versioned localStorage save/load + migration stub
  offline.ts       (M3) offline earnings calc
  prestige.ts      (M3) medals math
render/
  renderer.ts      Pixi stage layers, interpolation, camera shake
  atlas.ts         runtime-baked sprite atlas (unit poses, shards, props)
  ground.ts        baked ground/carpet texture per zone
  tiltshift.ts     pre-blurred overlay strips (top/bottom bands)
  particles.ts     pooled shards / pips / tracers / floaters
  juice.ts         shake budget, hit-stop, flashes, tweens
ui/
  hud.ts           DOM HUD: scrap counter, wave banner, buttons
  cards.ts         intro card, offline card, prestige box (M3)
  toykit.css       toy-packaging design system
audio/
  sfx.ts           WebAudio synth: tok/chunk/blip/snap/thud + pitch ladders
```

### Core technical rules (from §5)
- Fixed-timestep sim (60 Hz) + interpolated render; hit-stop pauses **sim only**.
- All world drawing = sprite blits from atlases baked **once** at load. No per-frame gradients/shadowBlur/full-screen canvas2d filters.
- Pools for units, shards, pips, tracers, floating numbers. Zero allocations in frame loop.
- Rendered-unit cap (~200) + battalion multiplier beyond it.
- devicePixelRatio capped at 2.
- Save schema `{ v: 1, ... }` with migration switch from day one.

### Tooling
- **Screenshots + perf probe: Playwright** (dev dependency, chromium). Deterministic captures via dev query params (`?shot=load|kill|midbattle|upgrade` triggers scripted sim fast-forward + fixed RNG seed). Screenshots saved to `shots/` for fresh-context subagent review. Perf probe fast-forwards sim to high wave count, then measures real frame times; asserts p95 < 16.7 ms; logs WebGL renderer string (headless = SwiftShader caveat noted in results). (DECISIONS.md #4.)
- **Deploy:** GitHub Actions → `actions/deploy-pages`. Vite `base: '/plastic-platoon/'`. Build badge = `VITE_COMMIT_SHA` short hash stamped bottom-corner; "dev" locally.
- **PWA:** manifest + iOS standalone meta tags + generated icons (180/192/512). Minimal service worker: network-first for `index.html`, cache-first for hashed assets — offline-capable without stale-badge risk. (DECISIONS.md #5.)

## 2. Milestones

**M0 — Pipeline & parity.** Scaffold, Actions deploy, badge, PWA shell. Port §3.1/§3.2 mechanics 1:1: molder stamps greens, marching/firing lines, tan waves + scaling, robot mini-boss every few waves, scrap economy + FASTER/BIGGER upgrades, rubber-band AoE, unit cap + battalion multiplier, localStorage save. Placeholder-but-clean art. Gate: live URL plays per spec; perf probe passes; zero console errors.

**M1 — Art pass.** Baked plastic-material units (3-tone + hard specular + contact shadow + oval base), tilt-shift band overlay, carpet diorama + 2–4 giant props, march cycle on twos, idle life, toy-packaging UI kit. Gate: ≥3 implement→screenshot→critique→fix passes, then fresh-context art-review subagent grades §4.7 all-yes.

**M2 — Juice & audio.** Full §4.4 table (knockover shards+pips, robot hit-stop+shake, stamp squash/flash, band anticipation+kick, upgrade celebration, wave incoming, collect ticks), §4.6 synth SFX + pitch ladders, haptics, `prefers-reduced-motion` fallbacks. Gate: event-by-event verification against the juice table (screenshot bursts + code review by subagent; no screen-recording tooling available — logged caveat).

**M3 — Idle layer.** Offline earnings card (rate × capped elapsed), Back-in-the-Box prestige with medal multiplier preview, zone 2 (Under the Bed), +2 upgrade verticals (RIFLES dmg, SCOUT speed), boss #2 (toy dinosaur), save hardening. Gate: scripted full-loop test — play, close, return, claim, prestige, verify persistence.

**Final:** perf audit subagent + code review subagent, DECISIONS/ART_NOTES/PLAN committed, live URL verified.

## 2.5 Directive 2 — Army Feel Pass

Owner feedback supersedes conflicting earlier details: the game must feel like commanding a large plastic army, not scattered figures on a carpet.

**D2-M1 ships now**
- Rigid-toy locomotion: remove leg-cycle read in runtime motion; use base-pivot waddles, scout hops, robot key shuffle, and death wobble-settle.
- Army scale: tune early economy and caps for 60-150 rendered figures in mid-game, with reserve battalion multiplier above the render cap.
- Formation system: greens auto-slot into ranks/columns behind an advance line; every 20 soldiers forms a named platoon with banner identity.
- Territory push: add a scrolling-front meter, checkpoint landmarks, and a hold/advance chalk line set by horizontal hold-drag. Tap remains rubber-band snap.
- Mobile layout: replace the two-card shelf feel with compact bottom price-tag tray buttons, LV badges, affordability dots, next-unlock tease, daily/supply/vault hooks.
- Toybox content: add three hazards, two new enemy/event types, one neutral chaos event, and at least three functional props in the battlefield.
- Progression: first 15-minute beat sheet and tuning constants move to `BALANCE.md` / `src/sim/balance.ts`; deferred content moves to `BACKLOG.md`.

**D2 gates**
- Portrait screenshots at 390x844 and 430x932.
- Three screenshot-review passes against Art Checklist + D2 movement/baseplate + current screenshot fixes.
- Perf probe with 150+ units and formation logic.
- Push to `main` and verify live URL.

## 3. Risks

| Risk | Mitigation |
|---|---|
| Headless perf probe ≠ real iPhone | Probe catches regressions/GC churn; log renderer string + caveat; keep worst-case draw calls low by design (atlas blits, ParticleContainer) |
| Pages deploy misconfig (base path, 404s) | Verify live URL by fetching it + browser screenshot after first deploy |
| Runtime-baked art looks "programmer art" | Mandatory 3× screenshot-critique loop + fresh-context art reviewer; ART_NOTES.md recipes drive the vector drawing |
| iOS audio/gesture quirks | Standard unlock-on-first-touch pattern; audio graph built lazily |
| Save corruption across versions | `v` field + migration switch + try/catch load with reset fallback |
| Scope blowout in M3 | Zone 2 + 1 extra boss + 2 upgrades is the floor; more zones only if time allows |

# Plastic Platoon Plan

## Scope

Build Plastic Platoon as a portrait-first mobile web idle lane-battle game using PixiJS v8, Vite, and TypeScript. The target is a static build suitable for GitHub Pages and iOS home-screen launch. The brief is the source of truth.

## Current Workspace Facts

- No existing repository is present in this workspace.
- The referenced prototype `reference/plastic-platoon-prototype.html` is not present in the workspace or attachment folder.
- Git, Node, npm, and GitHub CLI are available locally.
- GitHub Pages deployment may require a GitHub account/repo target. If no authenticated remote is available, local build and commit will be completed and deployment recorded as blocked.

## Architecture

- **Runtime:** PixiJS v8 renderer mounted into a full-screen fixed canvas.
- **Build:** Vite + TypeScript with static output in `dist/`.
- **Simulation:** fixed timestep loop with render interpolation. Hit-stop pauses simulation while render/audio continue.
- **State:** versioned localStorage save with migration stub from day one.
- **Rendering layers:** baked procedural textures for terrain, props, molder, units, projectiles, particles, UI accents, and post overlays.
- **Object lifecycle:** reusable pools for units, particles, pips, tracers, floaters, and effects.
- **Performance posture:** cap devicePixelRatio at 2, avoid per-frame gradients/filters, batch lightweight effects through containers, and keep the visible unit count capped with battalion multipliers.
- **Input:** touch-first global rubber-band snap plus bottom-zone upgrade controls.
- **Audio:** WebAudio graph created only after first gesture; mute flag persists.
- **PWA:** manifest and Apple standalone metadata preserved/implemented.

## Milestones

### M0 - Pipeline & Prototype Parity

- Scaffold Vite + TypeScript + PixiJS app.
- Add GitHub Pages-friendly build scripts and static PWA metadata.
- Implement molder, green/tan units, waves, basic firing, knockdowns, scrap currency, rubber-band snap, two baseline upgrades, boss wave, local save, and build badge.
- Add automated perf probe simulating high wave pressure.

### M1 - Premium Toybox Art Pass

- Write `ART_NOTES.md` from research before art code.
- Bake glossy molded-plastic unit sprites with oval bases, hard specular hits, occlusion tones, mold seams, and contact shadows.
- Add carpet diorama, oversized props, tilt-shift strips, hot saturation/contrast grade, breathing molder, march cycles, and toy-packaging UI.
- Run three screenshot/self-review passes at required game moments and fix issues.

### M2 - Juice & Audio

- Add shards, pip arcs, hit-stop, screen shake, shockwaves, stamp feedback, upgrade bursts, wave incoming dust, synthetic foley, haptics, and reduced-motion fallbacks.
- Verify each event has visible feedback and SFX after first gesture.

### M3 - Idle Layer & Extension

- Add offline earnings with claim card.
- Add Back in the Box prestige with Medal multiplier preview and confirm flow.
- Add zones: Bedroom Carpet, Under the Bed, Hallway Hardwood, Kitchen Tile.
- Add RIFLES and SCOUTS upgrade lines.
- Add second boss archetype such as RC tank.

## Verification Gates

- `npm run build` succeeds.
- Console error check via Playwright returns zero errors.
- Required screenshots captured: initial load, first kill, mid-battle, upgrade purchase.
- Three screenshot review passes are documented.
- Perf probe reports p95 frame time below 16.7ms for the synthetic 3-minute high-pressure run, with caveats recorded for headless hardware.
- Save/load, offline claim, prestige, and mute persistence are manually tested.

## Risks

- **Missing prototype:** Exact feel parity cannot be guaranteed without `reference/plastic-platoon-prototype.html`; I will recreate behavior from the brief’s numbers and log the decision.
- **GitHub deployment:** Creating/pushing a repo and enabling Pages depends on an authenticated GitHub setup and may require owner action.
- **Scope size:** Full M0-M3 with three screenshot loops, subagent reviews, perf audit, and deployment is substantial. I will prioritize a coherent playable vertical slice first, then broaden.
- **PixiJS package/network:** npm install may fail if the registry is unavailable; fallback would be vanilla canvas with explicit decision logging.
- **Headless performance:** Browser automation performance on this machine is not a reliable proxy for a mid-range iPhone; the probe will be treated as a regression signal, not real-device proof.

## Decision Log Hook

All product and technical judgment calls will be recorded in `DECISIONS.md` as they are made.

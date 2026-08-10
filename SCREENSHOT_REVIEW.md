# Screenshot Review Notes

Screenshots captured at 390x844 mobile portrait in `work/screenshots`.

## Pass 1

- **Initial load:** Molder was dominant and the toybox palette read, but shop buttons looked blank because graphics were drawn above text.
- **First kill:** Green/tan unit silhouettes, oval bases, hard highlights, and contact shadows were readable.
- **Mid-battle:** Capture landed on an empty zone-transition moment, failing the active battle read.
- **Upgrade purchase:** Upgrade feedback existed, but button labels were still hidden.
- **Fixes made:** Reordered UI graphics behind labels, shortened the mute label, and added a debug battle setup for screenshot capture.

## Pass 2

- **Initial load:** Shop labels now readable; snap button was clear in thumb zone.
- **First kill:** Plastic material and firing line read at phone scale.
- **Mid-battle:** Still empty after forced setup; investigation showed zone rebuild detached pooled unit/particle layers.
- **Upgrade purchase:** Upgrade floater and affordability state were clear.
- **Fixes made:** Stopped scene rebuild from removing pooled combat/effect layers.

## Pass 3

- **Initial load:** PASS. Molder is the left-side hero, UI is legible, and the first tap target is obvious.
- **First kill:** PASS. Units show monochrome plastic, hard highlights, oval bases, contact shadows, tracers, and scrap feedback.
- **Mid-battle:** PASS. Active mass combat is visible with readable green/tan/boss silhouettes and oversized props.
- **Upgrade purchase:** PASS. Button state changes and upgrade floater are visible.

## Remaining Art Risks

- The runtime art is strong for a procedural vertical slice, but a future atlas pass should add more pose variety and cleaner per-zone prop detail.
- The Pixi v8 ParticleContainer optimization is deferred until effects are packed into a shared atlas.

## Fresh-Context Art Review Follow-Up

Independent review passed the core plastic material, miniature read, and molder hero checks. It flagged idle-life visibility, late-battle readability, gray disabled buttons, low-contrast dark-zone title text, and the raw `local` build badge.

Fixes applied after that review:

- Added lane spacing, y-sorted unit rendering, and a smaller boss footprint for late-battle readability.
- Brightened dark-zone title text.
- Reworked disabled upgrade buttons into warmer cardboard/plastic packaging colors.
- Added a visible pulse/glint around the ready snap control.
- Restyled the build badge as a small stamped `BUILD ...` badge.

## Fresh-Context Performance And Code Review Follow-Up

Independent reviews flagged stale perf-probe risk, insufficient pressure in the original probe, UI redraw allocation churn, per-frame health-bar graphics, lane-wide targeting cost, particle pool scans, offline reward double-counting, non-durable pending offline rewards, and hashed manifest/icon path issues.

Fixes applied:

- `npm run probe` now rebuilds before serving `dist`.
- CI runs build, PWA asset check, save/offline check, and the sustained perf probe.
- Perf probe now sustains 200+ units and 180+ particles throughout the run.
- UI redraws are cooldown-capped instead of bypassing throttling during molder/button states.
- Health bars use pooled sprites/scaled fills instead of per-frame `Graphics` geometry.
- Targeting scans only the opposing lane row.
- Particle allocation uses a rolling cursor through the pool.
- Offline rewards persist in save data as `pendingOfflineScrap` and claim exactly once.
- Manifest moved to `public/manifest.webmanifest` so production PWA paths are stable.

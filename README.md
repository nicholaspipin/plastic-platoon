# Plastic Platoon

Green vs tan. The floor is a battlefield.

A mobile-web idle lane-battle game: plastic army men stamped out of a toy
injection-mold press fight tan invaders across giant household environments.
Styled as "premium toybox miniature" — tilt-shift grade, molded-plastic
material read, toy-packaging UI.

**Play:** https://nicholaspipin.github.io/plastic-platoon/
(add to home screen on iOS for full-bleed standalone mode)

## Stack

PixiJS v8 (WebGL) + Vite + TypeScript. All art is baked at runtime to sprite
atlases (no asset downloads); audio is a WebAudio toy-foley synth. Fixed
60Hz sim with interpolated render; save in localStorage (versioned schema).

## Development

```bash
npm install
npx playwright install chromium   # for shots/probe tooling
npm run dev
```

- `npm run build` — typecheck + production build to `dist/`
- `npm run shots` — deterministic screenshot set (needs `npm run preview` running)
- `npm run perf` — perf probe: fast-forwards to heavy late-game, asserts p95 frame time

Dev query params: `?seed=N` (deterministic RNG), `?nosave=1` (ignore/skip save).
Dev console API: `window.__pp` (`ff(seconds)`, `setScrap(n)`, `buy(id)`, `frameStats()`, `resetSave()`).

Pushes to `main` auto-deploy via GitHub Actions → Pages. The build badge
(bottom-left corner in game) shows the deployed commit.

## Docs

- [PLAN.md](PLAN.md) — architecture + milestones
- [DECISIONS.md](DECISIONS.md) — every judgment call, including the
  parallel-session resolution (see `alt/parallel-vertical-slice` branch)
- [ART_NOTES.md](ART_NOTES.md) — art-direction research the visuals are built from

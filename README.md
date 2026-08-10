# Plastic Platoon

Green vs tan. The floor is a battlefield.

A mobile-web idle battle game: plastic army men stamped out of a toy
injection-mold press fight a tan campaign across giant household environments.
Styled as "premium toybox miniature" — tilt-shift grade, molded-plastic
material read, toy-packaging UI.

**The loop (V2):** win discrete battles (lose and the tans smash your Molder —
2-minute overtime surges keep fights honest), unlock the classic seven-pose
roster (rifleman, scout, MG, medic, bazooka, sniper, officer), program the mold,
level each class through ×2 milestones, hit a wall, prep, break it — then pack
everything Back in the Box for medals and a permanent Command Tree. Rotating
missions, a 7-day streak calendar, and capped offline earnings bring you back.
Design rationale: [DESIGN2.md](DESIGN2.md) + [research/](research/).

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
- `npm run perf` — perf probe: worst-case battle, asserts p95 frame time
- `node scripts/pacing-probe.mjs` — a greedy bot plays 75 sim-minutes; asserts
  battle lengths, wall placement, TTNP, and prestige pacing (the design gate)
- `node scripts/save-flow-test.mjs` — offline/prestige/tree/migration flows

Dev query params: `?seed=N` (deterministic RNG), `?nosave=1` (ignore/skip save).
Dev console API: `window.__pp` (`ff(seconds)`, `setScrap(n)`, `buy(id)`, `frameStats()`, `resetSave()`).

Pushes to `main` auto-deploy via GitHub Actions → Pages. The build badge
(bottom-left corner in game) shows the deployed commit.

## Docs

- [PLAN.md](PLAN.md) — architecture + milestones
- [DECISIONS.md](DECISIONS.md) — every judgment call, including the
  parallel-session resolution (see `alt/parallel-vertical-slice` branch)
- [ART_NOTES.md](ART_NOTES.md) — art-direction research the visuals are built from

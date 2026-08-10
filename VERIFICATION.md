# Verification Log

## 2026-08-09

Commands run successfully:

- `npm run build`
- `npm run pwa:check`
- `npm run save:check`
- `npm run screenshots`
- `npm run probe`

Latest sustained perf probe:

- Rebuilds production bundle before testing.
- Simulates 180 seconds at 60Hz.
- Sustains at least 218 active units and 235 active particles.
- CPU frame-cost p95: about 0.5ms.
- Long CPU frames over 16.7ms: 1 / 10800.
- Console errors: 0.

Screenshot review:

- Required captures are produced in `work/screenshots`: initial load, first kill, mid-battle, and upgrade purchase.
- Three visual passes were completed and documented in `SCREENSHOT_REVIEW.md`.
- Fresh-context art review feedback was applied: cleaner build badge, brighter dark-zone title, warmer disabled shop states, snap pulse, y-sorted/less crowded combat.

Automated flow coverage:

- PWA manifest, icon, and service worker asset paths are checked after build.
- Offline rewards persist as pending rewards across reloads.
- Offline claim credits scrap exactly once and clears the pending reward.

Known caveat:

- Headless Chromium RAF timing can be throttled on this machine, so the perf gate asserts deterministic CPU frame cost under sustained pressure. Real iPhone validation is still required before treating the 60fps target as device-proven.

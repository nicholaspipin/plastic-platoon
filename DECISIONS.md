# DECISIONS LOG

Judgment calls made autonomously, per the brief's operating rules. Newest last.

1. **Missing prototype — rebuild from spec.** `reference/plastic-platoon-prototype.html` does not exist in the repo and was not found anywhere on this machine. The brief's §3.1 (core loop description) and §3.2 (exact tuning numbers) fully specify it, so mechanics are rebuilt directly from those sections instead of blocking on the owner. If the file turns up later, diff behavior against it.

2. **Stack: PixiJS v8 + Vite + TypeScript** (the brief's preferred option). WebGL sprite batching + ParticleContainer trivially clears the 200-units-plus-particles @60fps bar, and the tilt-shift pass is cheap as pre-blurred overlay sprites. Vanilla canvas was viable but puts atlas batching, pooling, and the blur pass entirely by hand for no gain.

3. **UI is a DOM overlay, not canvas.** The §4.5 toy-packaging kit (chunky extruded buttons, sticker labels, cards, price tags) is native CSS territory: cheaper to build, crisper text, free accessibility, easy bounce/snap animations. Canvas renders the world; DOM renders HUD/shop/popups. Scrap pips fly in-canvas and finish at the DOM counter's screen position.

4. **Screenshot loop + perf probe via Playwright** (npm dev dep, chromium). Deterministic dev hooks: query params + seeded RNG + sim fast-forward API (`window.__pp`) so "first kill / 60s mid-battle / upgrade purchase" shots are reproducible. Perf probe fast-forwards the sim to a high-wave worst case, then measures ~30s of real render frames and asserts p95 < 16.7 ms — 3 sim-minutes of load are covered by fast-forward; measuring 3 real-time minutes per run would only add waiting, not information. Headless GL is SwiftShader (software); probe logs the renderer string and results carry a real-device caveat, as the brief anticipates.

5. **Minimal service worker included.** Network-first for `index.html`, cache-first for content-hashed assets. Gives instant repeat loads + offline launch from home screen without the stale-build-badge risk of cache-first HTML.

6. **M2 gate adaptation.** The brief asks for a screen-recording review of the juice pass. No screen-recording tooling is available headlessly on this setup; substituted: rapid screenshot bursts around each juice event + a fresh-context subagent auditing the implementation event-by-event against the §4.4 table.

7. **Repo name `plastic-platoon`**, public, under `nicholaspipin`. Public because GitHub Pages on private repos requires a paid plan feature; nothing sensitive ships.

8. **No fail state.** Tans halt at a stop line (`LAYOUT.tanStopX`) near the Molder rather than destroying it — a stalled push reads as "buy an upgrade", not "game over". Idle games punish loss aversion poorly; the brief is silent on lose conditions, so the friendliest interpretation wins. Greens likewise never chase targets past 86% of screen width, so the firing line stays on camera.

9. **Perf probe thresholds account for vsync.** rAF frame *deltas* on a healthy 60Hz run are exactly ~16.7ms, so asserting `p95 < 16.7` fails a perfect run. Bar is p95 < 17.5ms (one vsync + 5% jitter) plus p99 < 25ms (hitch guard), measured over a pure-render window; a second window with synthetic taps is reported but not gated, since Playwright's CDP input injection itself causes 50–100ms spikes (measured: game pure-render p99 = 16.8ms while taps-window max = 100ms). Probe machine exposes a real GPU (Intel Arc via ANGLE), so the SwiftShader caveat mostly doesn't apply here; on-device verification still recommended.

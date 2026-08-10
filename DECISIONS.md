# Plastic Platoon Decisions

## 2026-08-09

- **Prototype unavailable:** The brief references `reference/plastic-platoon-prototype.html`, but no such file exists in this workspace or attachment set. I will rebuild the feel from the documented numbers and mechanics, then verify by screenshots and play probes.
- **Use PixiJS v8:** The brief recommends PixiJS v8 and its batching model is appropriate for 200+ units plus particles. I will use PixiJS unless package installation fails.
- **Use TypeScript:** TypeScript helps keep the sim/render/save schema boundaries explicit and lowers risk as systems accumulate.
- **GitHub Pages target, local first:** The requested deployment target is GitHub Pages. I will prepare static output and workflow files, initialize a local repo, and attempt GitHub setup only if an authenticated remote can be determined without owner credentials.
- **Runtime art first:** Visual assets will be baked procedurally at load into reusable textures to meet the no-heavy-assets constraint.
- **M0-M3 vertical slice in one codebase:** Because this session begins from an empty workspace, I will prioritize a playable end-to-end vertical slice with the M3 systems present, then iterate screenshots and tuning.
- **Sites plugin not used for hosting:** The site-building skill was reviewed, but the brief explicitly requires GitHub Pages rather than OpenAI Sites hosting, so the build path will stay Vite static output.
- **ParticleContainer deferred:** PixiJS v8 `ParticleContainer` batches particles with a shared texture assumption. This vertical slice needs shards, pips, sparks, tracers, dust, and rings with separate textures, so I am using a pooled `Container` of sprites first and leaving texture-atlas ParticleContainer batching as the follow-up optimization.
- **Expo shell uses the deployed web build:** The Expo setup wraps the GitHub Pages build in `react-native-webview` instead of porting PixiJS into React Native. This keeps the Vite/Pixi game as the source of truth and lets native shells track the live static deployment. Set `EXPO_PUBLIC_PLASTIC_PLATOON_URL` to point the shell at a local Vite server when needed.

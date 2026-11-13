# IMPLEMENTATION_LOG — Deep Space Odyssey

## 2026-11-13 — Session 1

### Stage 0 — Audit
- Workspace empty → new project. Chose Vite 8, React 19, three.js r187, JavaScript.
- Wrote PROJECT_SPEC.md, TECHNICAL_ARCHITECTURE.md, IMPLEMENTATION_PLAN.md.
- Decided against R3F, GSAP and the `postprocessing` package (see architecture doc).

### Stage 1 — Spacecraft & environment
- `Engine` with two-scene rendering, HalfFloat composer (bloom → CinematicPass → OutputPass/ACES).
- `SkyStars`, `SkyDome` (baked haze), `WrappedField` (mid-field + dust), `WarpTunnel`.
- `ShipExterior` (primitives + canvas panel textures + PMREM environment).
- `Cockpit` with real window openings, shutters, sliding hatch, corridor, `CockpitScreens`.
- `IntroSequence` (orbit + boarding timeline) on a small `Animator` with skip/cancel tokens.
- Fixes after first render: ship was an unlit silhouette (added a camera-side key light for the arrival shot);
  radiator emissive too strong; title moved low so the ship owns the frame.

### Stage 2 — Celestial objects
- `PlanetBaker` + `surfaces.js` (13 procedural surfaces) → `Planet` shader (bump from height, clouds + cloud
  shadows, specular oceans, night emissive, ring shadow, companion light) and atmosphere shells.
- `Rings` (1-D profile texture, lit/back-lit, planet shadow), `AsteroidBelt` (InstancedMesh).
- `Nebula` (instanced billboards from a baked 2×2 atlas + dust + embedded stars).
- `SpiralGalaxy`, `EllipticalGalaxy`, `IrregularGalaxy`, `GlobularCluster`.
- Fixes: planets and nebulae over-exposed (sun intensity 1.6–1.9 → 1.05–1.3, bloom threshold 0.82 → 0.98,
  nebula opacity down); Earth twilight band far too wide and red; Jupiter bands rebuilt from 1-D noise;
  Great Red Spot was hidden below the console sill (moved the vantage south, set initial spin).

### Stage 3 — Interactions
- `CameraController`, `PickingSystem` (ray vs. POI spheres, deck occlusion test), `NavigationSystem`,
  navigation panel, target card, control bar, view presets, keyboard shortcuts.

### Stage 4 — Cinematic & audio
- `EventSystem`: flyby, nebula passage, galaxy reveal (deck lights dim, music swells).
- `AudioSystem`: buses, generated reverb, generative pad + bells per mood, engine, nebula bed, warp loop,
  ~17 one-shots.

### Stage 5 — Polish & optimisation
- `QualityManager` (tiers + adaptive resolution), Reduced Motion path, performance read-out.
- Portrait/tablet: wider vertical FOV, bottom-sheet panels.
- Replaced deprecated `THREE.Clock` with `THREE.Timer`; PCFSoft → PCF shadows (r187).
- One-shot voice counter switched from `onended` events to end-time tracking after the counter was seen
  creeping upward under rapid skipping.
- Interior relit twice (too dark → too flat → dim with readable silhouettes); glass haze reduced; seats moved
  out of the centre of the view.

### Verification performed
See PROJECT_STATUS.md → "Implemented and checked" and "Measured". Real-GPU frame rate and audio listening
were **not** possible in this environment.

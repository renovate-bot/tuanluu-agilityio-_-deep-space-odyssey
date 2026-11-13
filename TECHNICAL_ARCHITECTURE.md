# TECHNICAL_ARCHITECTURE — Deep Space Odyssey

## Stage 0 audit result
- Workspace was empty: no existing source, framework or assets. Fresh project.
- Stack: **Vite 8 + React 19 + three.js r187**, plain JavaScript (ES modules), Web Audio API.
- No GSAP / R3F / postprocessing package: timelines use a small in-house tween/sequence util, and post-processing
  uses three's own `EffectComposer`. Fewer dependencies, smaller bundle, full control of the render loop.
- Constraint: no licensed models/textures/audio available → everything is procedural (GLSL + Web Audio).
- Constraint: the build machine has no GPU, so real-GPU FPS cannot be measured here (see PROJECT_STATUS).

## Split of responsibilities
```
React (DOM)  ── reads/writes ──►  store (tiny observable)  ◄── reads/writes ──  Engine (three.js, imperative)
```
React never touches three objects; the engine never touches the DOM except its canvas. They talk through
`src/store/store.js` (state) and `engine.actions` (commands).

## Rendering
- **Floating origin**: the ship never moves. `universe.root.position = -shipPosition`, so precision stays high
  even though destinations are hundreds of thousands of units apart.
- **Two scenes, one frame**: universe scene (near 5, far 4e6) is rendered first, then depth is cleared and the
  cockpit scene (near 0.05, far 200, metres) is drawn on top. Window openings are real holes in cockpit geometry.
- Ship orientation `shipQuat` × look orientation (yaw/pitch) = universe camera; cockpit camera uses look only.
- Post chain: Render(universe) → Render(cockpit) → UnrealBloom → CinematicPass (warp lens distortion, chromatic
  fringe, vignette, grain, grade) → OutputPass (ACES tone mapping, sRGB).

## Depth layers of the universe
1. `SkyStars` — points on a sphere that follows the camera (infinitely far), twinkle, colour temperature, clusters, Milky-Way band.
2. Far objects in `universe.root` — galaxies, nebulae, suns.
3. Sector objects — planets, moons, rings, asteroid belt.
4. `StarField` — mid-field stars wrapped around the ship: true parallax while travelling, stretched into streaks in warp.
5. `SpaceDust` — near particles drifting past the glass.
6. Cockpit scene.

## Procedural assets
- `PlanetBaker` renders each planet's 3D-noise surface into an equirect render target once (albedo + height/mask),
  so runtime shading is a few texture taps instead of per-pixel fbm.
- `NebulaTextures` bakes a small set of fbm cloud sprites; `Nebula` composes dozens of differently rotated,
  scaled and tinted billboards plus embedded stars.
- Galaxies are single `Points` draws with differential rotation in the vertex shader.
- Asteroids are one `InstancedMesh`.

## Lazy loading
Only the start sector is generated behind the loading screen. Other sectors are separate dynamic `import()` chunks,
built on demand by `Universe.ensureSector(id)` during the warp charge phase.

## Systems (`src/systems`)
| System | Responsibility |
|---|---|
| CameraController | input → damped yaw/pitch/zoom with limits, reset, programmatic look |
| NavigationSystem | destination state machine: align → charge → warp → arrive; skip; reduced motion path |
| WarpDrive | warp factor → star streaks, lens distortion, cabin light, FOV |
| EventSystem | cinematic events (flyby, nebula passage, galaxy reveal) as cancellable sequences |
| IntroSequence | arrival orbit and boarding timeline |
| PickingSystem | ray vs. POI spheres, hover + select, Focus / Observe |
| AudioSystem | Web Audio graph: music, ship, sfx buses; moods; one-shot voice limiting |
| QualityManager | tiers + adaptive pixel ratio from measured frame time |

## Performance rules
No allocations in the frame loop (scratch vectors), instancing for repeated meshes, baked textures, sector visibility
culling by distance, pixel-ratio cap, adaptive resolution, bloom at half resolution, `dispose()` on every object.

## Folder map
```
src/
  components/   React UI (Loading, Intro, HUD, Navigation, TargetInfo, ControlBar, Audio, Settings, Help)
  config/       destinations, celestial data, quality tiers
  engine/       Engine (renderer, loop, composer)
  scenes/       Universe + per-sector builders (SolarSystem, NebulaSector, DeepSpace, GalaxySector, ExoSystem)
  systems/      see table
  objects/      Stars, Planets, Galaxies, Nebula, Spacecraft, Cockpit
  shaders/      shared GLSL chunks
  post/         CinematicPass
  store/        observable store + React hook
  utils/        tween, math, rng, dispose
```

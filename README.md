# Deep Space Odyssey

An immersive, single-page 3D voyage: you board the exploration vessel **ODYSSEY-01**, stand on its observation
deck and travel between planets, nebulae and galaxies, looking out through real panoramic windows.

Everything you see and hear is generated in the browser: planet surfaces, nebulae, galaxies and the starfield
are GLSL shaders and particles, and all sound is synthesised with the Web Audio API. There are no downloaded
models, textures or audio files.

## Run it

Requirements: Node.js 20+ and a browser with WebGL 2 (current Chrome, Edge, Firefox or Safari).

```bash
npm install
npm run dev        # development server with hot reload → http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build → http://localhost:4173
```

`dist/` is a static site with relative asset paths: host it on any static host (GitHub Pages, Netlify,
Vercel, S3, nginx) or from a sub-folder.

## Controls

| Input | Action |
|---|---|
| Drag (mouse or one finger) | Look around the deck |
| W A S D / arrow keys | Look with the keyboard |
| Mouse wheel, pinch, `+` / `−` | Zoom |
| Click / tap a celestial body | Open its target card → **Focus** or **Observe** |
| `N` | Navigation panel (choose a destination → **Engage warp drive**) |
| `R` | Reset view |
| `M` | Mute / unmute |
| `Space` | Skip the running sequence (boarding, warp, cinematic event) |
| `H` | Controls help |
| `Esc` | Close the open panel |

Settings (bottom bar): render quality (Auto / High / Medium / Low), **Reduced Motion**, and a live
**performance read-out** (FPS, resolution scale, draw calls) for measuring on your own hardware.

## What is in it

- **Arrival & boarding**: the ship adrift before a blue-violet nebula → fly in → hatch closes → systems boot →
  engines start → shutters open on the universe.
- **Observation deck**: 3D interior with a forward bay window, roof glazing, two side windows, live instrument
  screens, holographic projector, light from outside casting shadows across the deck.
- **Eight destinations**: Earth Orbit, Mars Orbit (with asteroid field), Jupiter System (Galilean moons),
  Saturn System (rings with mutual shadows, Titan), Nebula Sector, Deep Space, Galaxy View, Unknown Exoplanet
  (fictional, binary star, two moons).
- **Warp travel**: align → charge → warp (star streaks, tunnel, stylised aberration) → drop-out flash.
- **Cinematic events**: Planetary Flyby, Nebula Passage, Galaxy Reveal, Warp Jump. All skippable.
- **Audio**: generative ambient score with a different harmony per sector, engine hum that follows drive state,
  electronics, door, boot, UI, AI chime, warp charge / jump / arrival, nebula ambience.

Real bodies show figures from NASA planetary fact sheets. Invented bodies are tagged **FICTIONAL** in the UI.
Scene scale and distances are artistic, and ranges are labelled *simulated*.

## Project layout

```
src/
  components/   React UI: Intro, HUD, Navigation, PlanetInfo, AudioControls, Settings
  config/       destinations, celestial data (facts), world layout, quality tiers
  engine/       Engine.js – renderer, two-scene frame loop, post-processing, UI actions
  scenes/       Universe (floating origin, lazy sectors) + one builder per sector
  systems/      CameraController, NavigationSystem, EventSystem, IntroSequence, PickingSystem,
                AudioSystem, QualityManager
  objects/      Stars, Planets, Galaxies, Nebula, Spacecraft, Cockpit
  shaders/      shared GLSL noise
  post/         CinematicPass (grade, vignette, grain, fades)
  store/        tiny observable store shared by UI and engine
  utils/        Animator (timelines), bake (render-to-texture), math, rng, dispose
```

Design documents: `PROJECT_SPEC.md`, `TECHNICAL_ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`.
Living status: `PROJECT_STATUS.md`, `IMPLEMENTATION_LOG.md`, `NEXT_STEPS.md`.

## Continuing development

Read `PROJECT_STATUS.md` and `NEXT_STEPS.md` first, then verify against the source: a feature listed in a
plan is not necessarily implemented. Open the app with `?debug` in the URL to get `window.__engine`
(for example `__engine.timeScale = 4` fast-forwards sequences, `__engine.actions.engage('saturn')` jumps).

## Notes

- Sound never starts before the first click (browser autoplay policy and courtesy).
- Sound is in-cabin cinematic design. Space itself is silent.
- Original work: no designs, characters or assets from existing films or games are used.

## Deploy (Netlify)

`netlify.toml` holds the build settings (`npm run build`, publish `dist`, Node 22). In Netlify choose "Add new project", "Import an existing project", pick this GitHub repository and deploy; every push to `main` then redeploys.

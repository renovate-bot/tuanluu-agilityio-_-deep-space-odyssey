# PROJECT_STATUS — Deep Space Odyssey

_Last updated: 2026-11-13 (end of first build session, Stages 0–5 pass 1)_

## Current stage
**Stage 5 (polish & optimisation), first pass complete.** The site builds, runs end to end and every control
is wired. What remains is tuning on real GPU hardware (see "Not verified").

## Implemented and checked in a headless browser
Checked = exercised with Playwright + Chromium (software WebGL), screenshots reviewed, console clean.

| Area | Status |
|---|---|
| Loading screen with real progress steps, fatal error screen (no WebGL 2, context lost, start-up failure) | done |
| Arrival: ship exterior, blue-violet nebula, slow push-in, title + ENTER | done |
| Boarding: fly-in → hatch closes/locks → power-up flicker → 4 screens wake → engine start → shutters open; skippable | done |
| Observation deck: bay window (3 panes), roof glazing, 2 side windows, consoles, 4 live canvas screens, hologram, seats, shadow-casting exterior light | done |
| Stars: sky sphere with band + clusters + twinkle, baked galactic haze, wrapped mid-field with parallax and warp streaks, near dust | done |
| Planets: Earth (clouds, night lights, ocean glint, atmosphere), Moon, Mars, Jupiter (Great Red Spot) + 4 Galilean moons, Saturn + rings (mutual shadows) + Titan, fictional Vespera + 2 moons + binary star | done |
| Asteroid field (InstancedMesh, GPU tumble) | done |
| Nebulae: Azure Veil (blue), Violet Shroud (purple), Crimson Expanse (red), Aurum Cloud (golden) | done |
| Galaxies: spiral (baked disc + particles + dust lanes), elliptical, irregular, globular cluster | done |
| Camera: drag / touch / WASD / arrows, wheel / pinch / ± zoom, damping, limits, reset, 5 view presets, portrait FOV widening | done |
| Navigation panel, 8 destinations, ALIGN → CHARGE → WARP → ARRIVE, skip, load failure abort | done |
| Picking with hover label, target card (facts, simulated range, FICTIONAL tag), Focus, Observe | done |
| Cinematic events: Planetary Flyby, Nebula Passage, Galaxy Reveal, Warp Jump | done |
| Audio: generative score (8 moods), engine hum following drive state, electronics, door/lock/boot/screens/shutter, UI, AI chime, warp charge/jump/arrival, nebula bed; mute + 3 volumes; starts only after ENTER | done (see "Not verified") |
| Quality tiers, adaptive pixel ratio / bloom from measured frame time, Reduced Motion, performance read-out | done |
| Lazy sectors (dynamic `import()` + on-demand baking), background streaming after boarding | done |
| Responsive layout: 1280×720 desktop and 820×1180 tablet (touch drag) checked, no panel overflow | done |

## Measured in this session
- 16 consecutive jumps across all 8 destinations: GPU geometries 140 → 140, textures 42 → 42, JS heap 21 MB → 21 MB.
  No growth, no stuck animations.
- Production build: about 1 MB of JS (≈ 275 kB gzip) in lazy chunks, 14 kB CSS. No external assets.
- Console: no errors or warnings during boarding, all 8 jumps, 3 events, panels.
- Reduced Motion jump: warp tunnel never shown, fade used instead, no arrival event.

## Not verified (needs a real machine)
- **Frame rate.** The build machine has no GPU; only software rendering was available (a few FPS), so the
  60 FPS target is **unmeasured**. Use Settings → Performance read-out on target hardware.
- **How the audio sounds.** The audio graph was verified to start and run (AudioContext running, music and
  engine active) but nobody has listened to it. Levels and timbre need an ear.
- Safari / Firefox, and real phones. Only Chromium was run.
- High tier (4× MSAA, 2048 textures, 170k galaxy stars) was only rendered for a few frames here.

## Known issues / rough edges
- Earth's night lights read as clumps rather than fine city grids up close.
- Jupiter's band edges could use finer turbulence; the Great Red Spot is fairly pale.
- Nebula cloud texture shows a slightly "veined" look when the ship is deep inside it.
- Ship exterior is primitive-built; fine for the arrival shot, not for close inspection.
- Cockpit seats and consoles are simple boxes (kept dark on purpose).
- Changing quality tier changes resolution/bloom immediately; star counts and texture sizes need a reload (the UI says so).
- No ambient occlusion or depth of field pass (deliberately skipped for performance).

## Key technical decisions
1. Vite + React (UI only) + plain three.js engine. No R3F/GSAP: one imperative render loop, tiny bundle.
2. Floating origin: the ship stays at (0,0,0); `universe.root` is offset by `-ship.pos`.
3. Two scenes per frame: universe first, clear depth, cockpit on top → windows are true openings.
4. All assets procedural; expensive noise is baked once into render targets.
5. Sectors are lazily imported and built; warp charge doubles as their loading window.
6. UI ↔ engine through one observable store + `engine.actions`. React never touches three objects.
7. Wrapped star fields follow a capped "visual" position so warp speed does not alias them.
8. Sound is synthesised; one-shot voices are capped by tracking end times.

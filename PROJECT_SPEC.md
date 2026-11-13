# PROJECT_SPEC — Deep Space Odyssey

> We are not building a website about space. We are building the feeling of being inside space.

## 1. Product
A single-page, real-time 3D experience. The visitor boards the exploration vessel **ODYSSEY-01**, stands in
its observation deck, and travels between eight destinations while looking out through panoramic windows.

## 2. Experience phases
| Phase | What happens | Acceptance |
|---|---|---|
| Loading | Procedural assets are generated; progress bar reflects real steps | No blank screen; errors shown, not swallowed |
| Arrival | Ship drifting before a blue-violet nebula, slow camera approach, title + `ENTER THE UNIVERSE` | No audio before the click |
| Boarding | Fly to the ship, hatch closes, systems boot one by one, engine starts, shutters open on the universe | Continuous, skippable |
| Observation deck | 3D cockpit: one huge front window, two side windows, console, holo screens | Windows are real openings in 3D geometry |
| Exploration | Look around, pick celestial bodies, navigate, warp | Every button does something real |

## 3. Destinations
Earth Orbit · Mars Orbit · Jupiter System · Saturn System · Nebula Sector · Deep Space · Galaxy View · Unknown Exoplanet.

## 4. Celestial content
- Deep space: layered starfield (sky sphere at infinity, wrapped mid-field with real parallax, near dust), twinkle, distant clusters.
- Nebulae: blue, purple, red, golden. Layered billboards with GPU-baked fbm textures, embedded stars and dust.
- Planets: Earth (oceans, continents, clouds, night lights, atmosphere), Mars, Jupiter (bands, Great Red Spot, Galilean moons),
  Saturn (rings with mutual shadows, Titan), fictional exoplanet with two moons and a binary star.
- Galaxies: spiral (particles, differential rotation, dust lanes), elliptical, irregular.
- Asteroid belt (InstancedMesh).

## 5. Interaction
- Look: mouse drag / touch drag / WASD / arrows, wheel or pinch to zoom, damped, clamped, Reset View.
- Navigation: choose destination → briefing → ENGAGE → align, charge, warp, arrive.
- Point of interest: click a body → holographic info card (name, type, simulated range, description, FICTIONAL tag when invented) → Focus / Observe.
- Cinematic events: Planetary Flyby, Nebula Passage, Galaxy Reveal, Warp Jump.

## 6. Audio (all synthesized with the Web Audio API)
Generative ambient music with per-sector mood, engine hum that follows engine state, electronics, boot, door,
UI, AI chime, warp charge/jump/arrival, sector ambience. Mute, master/music/effects volume. Starts only after a user gesture.
This is in-cabin cinematic sound design; it does not claim sound propagates in vacuum.

## 7. UI
Top HUD, collapsible navigation panel, target card, bottom control bar (View, Warp, Navigation, Audio, Settings, Reset),
help overlay. Thin lines, cyan/white, transparent backgrounds, never covering the window centre.

## 8. Truthfulness rules
- Real bodies carry real, sourced figures (NASA fact sheets). Invented bodies are tagged **FICTIONAL**.
- Ranges are labelled *simulated*. Scene scale is artistic, not physical, and the UI says so.
- Performance numbers are only reported when measured.

## 9. Non-goals
No routes, login, blog, backend, or external 3D/texture/audio downloads.

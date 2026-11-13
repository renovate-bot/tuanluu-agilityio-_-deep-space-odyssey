# PROJECT_STATUS — Deep Space Odyssey

_Last updated: 2026-11-13 (Solar System enhancement, Stages 1–5). The section "Solar System enhancement" below supersedes older lines where they differ._

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
| Planets: Earth (clouds, night lights, ocean glint, atmosphere), Moon, Mars, Jupiter + 4 Galilean moons, Saturn + rings (mutual shadows) + Titan, fictional Vespera + 2 moons + binary star | done |
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
- Jupiter: the Great Red Spot exists and was seen during the flyby, but it is not reliably in view from the parked position (it was out of frame in the last check). Band edges could use finer turbulence.
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

## Update 2026-11-13: languages

English and Vietnamese are both implemented (switch on the title screen and in Settings, choice remembered). To add a language, copy `src/i18n/vi.js`, register it in `src/i18n/index.js` (`LANGS`, `tr`, `trTarget`, `trRange`).


## Solar System enhancement (2026-11-13)

All five stages of the enhancement brief are implemented and were exercised in a headless browser
(Playwright + Chromium, software WebGL, 1280×720, Low and High tiers). Screenshots: `docs/screenshots/`.

### Gap analysis (state before → after)

| Area | Before | After |
|---|---|---|
| Spaceship interior | Small bay window, dark boxy deck, observer far from the glass | Observer moved to the glass so the panoramic pane fills the view; chamfered frame, polished trim, side-pane gussets, overhead annunciator panels, leather seats, warmer and brighter cabin light |
| Exterior environment | Planets were separate fixed "stages", no Sun body | One Solar System: a real Sun at the origin, every planet on its own inclined orbit, orbit paths, asteroid belt ring |
| Planets | Earth, Mars, Jupiter, Saturn only | Sun + all eight planets, Moon, Phobos, Deimos, 4 Galilean moons, Titan, Triton. Pluto is not included and never listed as a planet |
| Lighting | Per-destination fake key light | All bodies lit from the Sun's actual position; ring shadows on Saturn and Uranus; cabin tint follows the nearest body |
| Camera | Free look only, fixed parking spots | Free look + three observation distances per world (Far Orbit, Close Approach, Cinematic Flyby); ship travels with the body along its orbit |
| Navigation | 8 hand-placed destinations | Tabs: Solar System (Overview, Sun, Mercury … Neptune, Asteroid Belt) and Beyond (nebula, deep space, galaxy, exoplanet); flight brief with real figures; ENGAGE NAVIGATION |
| Overview | None | Solar System Overview vantage (3D) and a holographic Solar System Map (key `O`), selectable, closes with `Esc` |
| Audio | Mood per sector | Additionally reacts to proximity (filter opens, low rumble near large bodies), flyby swell |
| Performance | Lazy sectors, adaptive resolution | Same, extended: every planet is a lazy sector; belt uses one InstancedMesh patch + a point ring; detail texture shared |

### What each body has
- **Sun**: animated convecting photosphere (domain-warped noise), limb darkening, sunspots with penumbra, faculae, streaming corona, wide glow that fades as you approach.
- **Mercury**: grey cratered, airless. **Venus**: two cloud decks drifting at different speeds, thick warm atmosphere, no surface.
- **Earth**: oceans with sun glint, continents, moving clouds, atmosphere, night lights, Moon in orbit, extra surface detail fading in up close.
- **Mars**: rust terrain, darker regions, polar caps, thin atmosphere, Phobos and Deimos.
- **Jupiter**: bands with zonal flow animation, Great Red Spot turned to face the ship on arrival, Io, Europa, Ganymede, Callisto.
- **Saturn**: multi-band 3D rings with Cassini Division, planet shadow on rings and ring shadow on planet, Titan, ring-plane flyby through drifting ice.
- **Uranus**: cyan, axial tilt ≈ 98°, thin rings. **Neptune**: deep blue, dark storm, bright cirrus, retrograde Triton.
- **Asteroid belt**: between Mars and Jupiter, a faint ring from far away and an instanced field up close.

### Scale: what is real and what is simulated
- Card facts (distance from Sun, diameter, orbital and rotation periods) are real figures.
- The 3D scene uses a **cinematic scale**: orbit radii are compressed (Neptune is 15× Mercury's distance, not 77×), planets are enlarged, one Earth year takes 30 minutes, moons orbit close in. Ranges on screen are labelled **SIMULATED RANGE**; the map states that it is schematic.
- Orbits are circular with approximate real inclinations. Surfaces are procedural, not NASA maps (see below).

### Measured in this session
- Three rounds over 13 destinations (39 jumps): GPU geometries 163 → 166 → 166, textures 50 → 56 → 56, JS heap 19 MB flat, no stuck animations.
- Console: no errors or warnings in all scripted runs (every planet far/close, flybys at Venus/Jupiter/Saturn, overview, map, Vietnamese UI).
- Full UI path in Vietnamese: nav panel → Saturn → engage → un-skipped warp → arrival card → Close Approach → map. No untranslated labels found.
- Frame rate on the software renderer was about 3.5 FPS on Low. This says nothing about a real GPU. **Real-GPU frame rate is unmeasured; 60 FPS is not claimed.**

### Limitations
- Textures are procedural GLSL, baked at start-up. NASA/JPL maps were not used: the build environment could not fetch them, and licences could not be verified offline. Continents, craters and storms are plausible, not real geography.
- Not verified: real-GPU frame rate, how the audio sounds, Safari/Firefox, phones, narrow layouts in Vietnamese.
- Flybys for Mercury, Mars, Uranus, Neptune and the belt use the shared path and were not individually reviewed frame by frame (Venus, Jupiter, Saturn were).
- Seats and consoles are still primitive-built; the cockpit is better framed and lit, but it is not a modelled interior.
- The Sun's close-up is stylised: granulation and spots are simple, and there are no prominences.
- Faint orbit lines are visible from inside the ecliptic. They are dimmed there and brighten from above.
- Kuiper Belt and Pluto (dwarf planet) were optional and are not implemented.

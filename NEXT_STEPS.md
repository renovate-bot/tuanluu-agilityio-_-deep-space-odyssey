# NEXT_STEPS — Deep Space Odyssey

Ordered by priority. Read PROJECT_STATUS.md first and confirm against the source before starting.

## 1. Verify on real hardware (blocking for "done")
1. Run `npm run dev` on a desktop with a discrete GPU. Enable Settings → Performance read-out.
   Record FPS at each destination, during warp and inside the nebula, at High/Medium/Low. Target: 60.
2. If the nebula interior or Galaxy View dips: lower `nebulaDensity` / `galaxyStars` in `src/config/quality.js`,
   or render nebula billboards into a half-resolution target.
3. Listen to the whole audio path with headphones: boarding, idle, each mood, warp, nebula. Tune levels in
   `AudioSystem.js` (bus gains, `MOODS`, one-shot gains). Check there are no clicks at chord changes.
4. Test Safari (WebGL 2 + AudioContext resume), Firefox, an iPad and a mid-range Android tablet.

## 2. Visual upgrades
1. Earth: finer city lights (higher-frequency mask or a dedicated 4096 night bake on High).
2. Jupiter: make the Great Red Spot reliably visible from the parked view (fix the spin set in `onArrive`, `src/scenes/SolarSystem.js`), make it stronger; flow-map animation of bands; small white ovals.
3. Nebula: second atlas with softer puffs to break up the veined look when inside; optional god-ray sprite.
4. Ship exterior: more greebles, hull lettering; cockpit: bevelled consoles, proper seats, more decals.
5. Optional post: subtle depth of field for Observe mode, SSAO/GTAO on the deck (High only).
6. Planet-shine: let a nearby lit planet tint the cabin light, not only the star.

## 3. Experience
1. Auto-tour ("cinematic mode") that visits destinations by itself.
2. Hologram projector that shows the selected destination instead of a generic globe.
3. On-screen target brackets for bodies in view (toggle).
4. Short spoken AI lines (pre-rendered or SpeechSynthesis) behind a setting.
5. More events: ring-plane crossing at Saturn, eclipse at Earth, binary sunrise at Vespera.

## 4. Engineering
1. Add automated smoke tests (the Playwright scripts used in session 1 are described in IMPLEMENTATION_LOG).
2. Unload far sectors on Low tier to cap GPU memory.
3. TypeScript migration if the team prefers it.
4. Deploy: any static host; `dist/` uses relative paths.

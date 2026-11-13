# IMPLEMENTATION_PLAN — Deep Space Odyssey

Each stage ends with: docs updated → features checked in a headless browser → app still builds → leftovers logged.

| Stage | Scope | Exit check |
|---|---|---|
| 0 Audit | Workspace audit, spec, architecture, this plan | Docs exist, self-review done |
| 1 Spacecraft & environment | Engine, store, sky stars, mid-field stars, dust, ship exterior, cockpit with windows, intro + boarding | Can board the ship and see space through the glass |
| 2 Celestial objects | Planet baker + shaders, moons, rings, sun, nebulae, galaxies, asteroid belt, lighting | Each sector shows a distinct, deep vista |
| 3 Interactions | Camera controller, picking, Focus/Observe, navigation panel, warp travel, sector transitions | Can travel to all 8 destinations and inspect bodies |
| 4 Cinematic & audio | Flyby, nebula passage, galaxy reveal, warp polish, full audio system | Events play; audio layers respond to state |
| 5 Polish & optimisation | UI polish, quality tiers, adaptive resolution, reduced motion, touch, error handling, tests | Build passes, no console errors, checklist in PROJECT_STATUS |

## Self-review of Stage 0
- Risk: fill-rate from nebula billboards → mitigated by baked textures, capped layer counts per tier.
- Risk: procedural planets looking like "coloured balls" → dedicated shader per body, height-derived normals, atmosphere shells, clouds, night side.
- Risk: no real GPU in the build environment → ship an in-app performance readout so numbers can be measured on real hardware.
- Risk: scope → prefer fewer, stronger moments (brief §14).

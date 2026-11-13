import * as THREE from 'three';
import { Planet } from '../objects/Planets/Planet.js';
import { Rings, createThinRingTexture } from '../objects/Planets/Rings.js';
import { AsteroidBelt, BeltRing } from '../objects/Planets/AsteroidBelt.js';
import { RADII } from '../config/world.js';
import { BELT } from '../config/solar.js';
import { poi, moonSystem } from './helpers.js';

const SUN_COLOR = 0xfff4e6;

/**
 * One builder per planet. The planet's position is owned by the orbital model (ctx.positions) and copied
 * in every frame; the planet's own point of interest already exists, so builders only return their moons'.
 */
function planetSector(ctx, id, cfg, { moons = [], rings = null, after = null } = {}) {
  const planet = new Planet(ctx.renderer, { name: id, surface: id, radius: RADII[id], textureSize: ctx.tier.planetTex, sunColor: SUN_COLOR, ...cfg });
  const pos = ctx.positions[id];
  planet.group.position.copy(pos);
  if (cfg.lean) planet.group.rotation.x = cfg.lean;
  ctx.root.add(planet.group);
  const ring = rings ? new Rings(planet, rings) : null;
  const sys = moons.length ? moonSystem(ctx, planet, moons, SUN_COLOR) : null;
  const extra = after ? after(planet) : null;
  const _d = new THREE.Vector3(), _q = new THREE.Quaternion();
  return {
    planet,
    pois: sys ? sys.pois : [],
    /** Turn the globe so the surface feature at object longitude `lon` faces a point in universe space. */
    face(lon, from) {
      _d.copy(from).sub(pos).normalize().applyQuaternion(_q.copy(planet.group.quaternion).invert());
      planet.spin.rotation.y = lon - Math.atan2(_d.z, _d.x);
    },
    update(dt, time, camera) {
      planet.group.position.copy(pos);
      planet.update(dt, time, ctx.sun, camera);
      if (ring) ring.update();
      if (sys) sys.update(dt, time, camera);
      if (extra && extra.update) extra.update(dt, time, camera);
    },
    dispose() { if (ring) ring.dispose(); if (extra && extra.dispose) extra.dispose(); planet.dispose(); if (sys) sys.dispose(); },
  };
}

export const buildMercury = (ctx) => planetSector(ctx, 'mercury', {
  tilt: 0.0006, rotationSpeed: 0.004, bump: 20, sunIntensity: 1.5, ambient: 0.002, detail: 0.5, detailScale: [40, 20],
});

export const buildVenus = (ctx) => planetSector(ctx, 'venus', {
  tilt: 0.046, rotationSpeed: -0.003, clouds: 0.85, cloudColor: 0xf6e6bc, cloudSpeed: -0.0045, bump: 0.25, sunIntensity: 1.35,
  atmoColor: 0xf2c878, twilight: 0xff8a3a, atmoInner: 0.7, detail: 0.04, detailScale: [22, 44],
  atmospheres: [{ scale: 1.05, color: 0xffd890, twilight: 0xff9440, strength: 0.95, falloff: 2.6 }, { scale: 1.12, color: 0xffc070, twilight: 0xff7a30, strength: 0.25, falloff: 2.0 }],
});

export const buildEarth = (ctx) => planetSector(ctx, 'earth', {
  tilt: 0.41, rotationSpeed: 0.012, cloudSpeed: 0.0011, clouds: 0.95, bump: 9, spec: 1.1, sunIntensity: 1.3,
  atmoColor: 0x4f8dff, twilight: 0xff7a3c, atmoInner: 0.75, emissiveColor: 0xffb060, emissiveNight: 1.1, emissiveDay: 0, detail: 0.3,
  atmospheres: [{ scale: 1.045, color: 0x4f9bff, twilight: 0xff7033, strength: 1.0, falloff: 3.2 }],
}, {
  moons: [{ id: 'moon', surface: 'moon', radius: RADII.moon, orbit: 5200, speed: 0.008, phase: 2.3, incl: 0.09, bump: 14 }],
});

export const buildMars = (ctx) => planetSector(ctx, 'mars', {
  tilt: 0.44, rotationSpeed: 0.011, clouds: 0.5, cloudColor: 0xe8c6a0, cloudSpeed: 0.0006, bump: 5, sunIntensity: 1.25,
  atmoColor: 0xd9814f, twilight: 0x6fa0ff, atmoInner: 0.35, detail: 0.45,
  atmospheres: [{ scale: 1.022, color: 0xe08a55, twilight: 0x7fa8ff, strength: 0.55, falloff: 2.6 }],
}, {
  moons: [
    { id: 'phobos', surface: 'phobos', radius: RADII.phobos, orbit: 900, speed: 0.06, phase: 0.4, incl: 0.02, bump: 16 },
    { id: 'deimos', surface: 'phobos', radius: RADII.deimos, orbit: 1750, speed: 0.022, phase: 3.3, incl: 0.03, bump: 12 },
  ],
});

const GRS_LON = 1.0;
export function buildJupiter(ctx) {
  const s = planetSector(ctx, 'jupiter', {
    tilt: 0.054, rotationSpeed: 0.014, bump: 0.35, sunIntensity: 1.15, flow: 0.022, flowBands: 8.27, detail: 0.07, detailScale: [20, 64],
    atmoColor: 0xd8b48a, twilight: 0x8a5a3a, atmoInner: 0.3,
    atmospheres: [{ scale: 1.02, color: 0xe6c8a0, twilight: 0xb07048, strength: 0.5, falloff: 2.4 }],
  }, {
    moons: [
      { id: 'io', surface: 'io', radius: RADII.io, orbit: 5600, speed: 0.03, phase: 0.6, incl: 0.01, bump: 6 },
      { id: 'europa', surface: 'europa', radius: RADII.europa, orbit: 7900, speed: 0.019, phase: 2.2, incl: 0.02, bump: 8, spec: 0.5 },
      { id: 'ganymede', surface: 'ganymede', radius: RADII.ganymede, orbit: 11400, speed: 0.012, phase: 4.1, incl: 0.01, bump: 10 },
      { id: 'callisto', surface: 'callisto', radius: RADII.callisto, orbit: 16500, speed: 0.008, phase: 5.2, incl: 0.02, bump: 10 },
    ],
  });
  // on arrival the Great Red Spot is just rotating into view on the sunlit side
  s.onArrive = (from) => s.face(GRS_LON + 0.35, from);
  return s;
}

export function buildSaturn(ctx) {
  let debris = null;
  const s = planetSector(ctx, 'saturn', {
    tilt: 0.466, lean: 0.12, rotationSpeed: 0.018, bump: 0.3, sunIntensity: 1.05, flow: 0.016, flowBands: 9, detail: 0.05, detailScale: [18, 60],
    atmoColor: 0xe6d3a0, twilight: 0x9a7a4a, atmoInner: 0.3,
    atmospheres: [{ scale: 1.02, color: 0xf0dcae, twilight: 0xb08850, strength: 0.45, falloff: 2.4 }],
  }, {
    rings: {},
    moons: [{ id: 'titan', surface: 'titan', radius: RADII.titan, orbit: 12500, speed: 0.01, phase: 1.1, incl: 0.3, bump: 0.5, atmo: { scale: 1.09, color: 0xf0a040, strength: 0.9, falloff: 2.2 } }],
    after(planet) {
      // Ice blocks in the ring plane along the lane the ring flyby follows: the ring gets real thickness
      // where the ship skims it. Built in ring-local coordinates (ring normal = local +Y).
      const R = planet.radius, lane = 1.92 * R, len = 2.6 * R;
      debris = new AsteroidBelt({ count: Math.round(ctx.tier.asteroids * 1.4), length: len, width: 520, thickness: 9, seed: 31, bendY: 0, bendZ: (len * len) / (2 * lane), sizeScale: 0.035, shade: [0.5, 0.35], roughness: 0.55 });
      debris.group.visible = false;
      planet.group.add(debris.group);
      return { update(dt, time) { if (debris.group.visible) debris.update(time); }, dispose() { debris.dispose(); } };
    },
  });
  /** Lay the debris lane under a point given in the ring frame (angle around the ring normal). */
  s.setRingLane = (angle, visible) => {
    const R = s.planet.radius, lane = 1.92 * R;
    debris.group.visible = visible;
    debris.group.position.set(Math.cos(angle) * lane, 0, -Math.sin(angle) * lane);
    debris.group.rotation.y = angle + Math.PI / 2;
  };
  return s;
}

export const buildUranus = (ctx) => planetSector(ctx, 'uranus', {
  tilt: 1.706, rotationSpeed: -0.014, clouds: 0.5, cloudColor: 0xe8ffff, cloudSpeed: 0.001, bump: 0.25, sunIntensity: 1.1, flow: 0.01, flowBands: 6, detail: 0.04, detailScale: [14, 50],
  atmoColor: 0x8fe6ea, twilight: 0x3a8a9a, atmoInner: 0.55,
  atmospheres: [{ scale: 1.035, color: 0x9ff0f4, twilight: 0x4aa0b0, strength: 0.8, falloff: 2.6 }],
}, { rings: { inner: 1.62, outer: 2.02, texture: createThinRingTexture(), shadow: 0.25 } });

export const buildNeptune = (ctx) => planetSector(ctx, 'neptune', {
  tilt: 0.494, rotationSpeed: 0.015, clouds: 0.9, cloudColor: 0xf2f6ff, cloudSpeed: 0.0022, bump: 0.3, sunIntensity: 1.1, flow: 0.02, flowBands: 8.73, detail: 0.05, detailScale: [16, 56],
  atmoColor: 0x3f6dff, twilight: 0x2a3aa0, atmoInner: 0.6,
  atmospheres: [{ scale: 1.035, color: 0x4f80ff, twilight: 0x3040c0, strength: 0.9, falloff: 2.8 }],
}, {
  moons: [{ id: 'triton', surface: 'triton', radius: RADII.triton, orbit: 5200, speed: -0.011, phase: 2.0, incl: 0.4, bump: 8, spec: 0.3 }],
});

export function buildBelt(ctx) {
  const frame = new THREE.Group(); // turns with the belt's mean motion
  ctx.root.add(frame);
  const ring = new BeltRing({ count: ctx.tier.asteroids * 4, inner: BELT.inner, outer: BELT.outer, pixelRatio: ctx.pixelRatio });
  frame.add(ring.points);
  // the dense, navigable patch the ship parks beside
  const len = 46000;
  const patch = new AsteroidBelt({ count: ctx.tier.asteroids, length: len, bendY: 0, bendZ: (len * len) / (2 * BELT.orbit) });
  patch.group.position.set(BELT.orbit, 0, 0);
  patch.group.rotation.y = Math.PI / 2;
  frame.add(patch.group);
  return {
    pois: [],
    update(dt, time) { frame.rotation.y = ctx.belt.angle; patch.update(time); },
    setPixelRatio(pr) { ring.setPixelRatio(pr); },
    dispose() { ring.dispose(); patch.dispose(); ctx.root.remove(frame); },
  };
}

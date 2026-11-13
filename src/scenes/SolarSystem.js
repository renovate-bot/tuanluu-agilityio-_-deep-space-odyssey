import * as THREE from 'three';
import { Planet } from '../objects/Planets/Planet.js';
import { Rings } from '../objects/Planets/Rings.js';
import { AsteroidBelt } from '../objects/Planets/AsteroidBelt.js';
import { WORLD, RADII } from '../config/world.js';
import { poi, moonSystem } from './helpers.js';

const SUN_COLOR = 0xfff4e6;

export function buildEarth(ctx) {
  const earth = new Planet(ctx.renderer, {
    name: 'Earth', surface: 'earth', radius: RADII.earth, textureSize: ctx.tier.planetTex, tilt: 0.41,
    rotationSpeed: 0.012, cloudSpeed: 0.0011, clouds: 0.95, bump: 9, spec: 1.1, sunColor: SUN_COLOR, sunIntensity: 1.3,
    atmoColor: 0x4f8dff, twilight: 0xff7a3c, atmoInner: 0.75, emissiveColor: 0xffb060, emissiveNight: 1.1, emissiveDay: 0,
    atmospheres: [{ scale: 1.045, color: 0x4f9bff, twilight: 0xff7033, strength: 1.0, falloff: 3.2 }],
  });
  earth.group.position.fromArray(WORLD.earth);
  ctx.root.add(earth.group);

  const moons = moonSystem(ctx, earth, [
    { id: 'moon', surface: 'moon', radius: RADII.moon, orbit: 5200, speed: 0.008, phase: 2.3, incl: 0.09, bump: 14 },
  ], SUN_COLOR);

  return {
    planet: earth,
    pois: [poi('earth', earth.group.position, RADII.earth, { observe: [-1.0, 0.25, 1.55] }), ...moons.pois],
    update(dt, time, camera) { earth.update(dt, time, ctx.sun, camera); moons.update(dt, time, camera); },
    dispose() { earth.dispose(); moons.dispose(); },
  };
}

export function buildMars(ctx) {
  const mars = new Planet(ctx.renderer, {
    name: 'Mars', surface: 'mars', radius: RADII.mars, textureSize: ctx.tier.planetTex, tilt: 0.44,
    rotationSpeed: 0.011, clouds: 0.5, cloudColor: 0xe8c6a0, cloudSpeed: 0.0006, bump: 16, sunColor: SUN_COLOR, sunIntensity: 1.25,
    atmoColor: 0xd9814f, twilight: 0x6fa0ff, atmoInner: 0.35,
    atmospheres: [{ scale: 1.022, color: 0xe08a55, twilight: 0x7fa8ff, strength: 0.55, falloff: 2.6 }],
  });
  mars.group.position.fromArray(WORLD.mars);
  ctx.root.add(mars.group);

  const belt = new AsteroidBelt({ count: ctx.tier.asteroids });
  belt.group.position.fromArray(WORLD.mars).add(new THREE.Vector3(5200, -500, -9000));
  belt.group.rotation.y = 0.5;
  ctx.root.add(belt.group);
  const beltPos = belt.group.position.clone();

  return {
    planet: mars,
    pois: [poi('mars', mars.group.position, RADII.mars, { observe: [-0.9, 0.3, 1.6] }), poi('belt', beltPos, 2600, { observe: [0.2, 0.5, 2.2] })],
    update(dt, time, camera) { mars.update(dt, time, ctx.sun, camera); belt.update(time); },
    dispose() { mars.dispose(); belt.dispose(); },
  };
}

export function buildJupiter(ctx) {
  const jupiter = new Planet(ctx.renderer, {
    name: 'Jupiter', surface: 'jupiter', radius: RADII.jupiter, textureSize: ctx.tier.planetTex, tilt: 0.054,
    rotationSpeed: 0.02, spin0: 1.84, bump: 1.5, sunColor: SUN_COLOR, sunIntensity: 1.15,
    atmoColor: 0xd8b48a, twilight: 0x8a5a3a, atmoInner: 0.3,
    atmospheres: [{ scale: 1.02, color: 0xe6c8a0, twilight: 0xb07048, strength: 0.5, falloff: 2.4 }],
  });
  jupiter.group.position.fromArray(WORLD.jupiter);
  ctx.root.add(jupiter.group);

  const moons = moonSystem(ctx, jupiter, [
    { id: 'io', surface: 'io', radius: RADII.io, orbit: 5600, speed: 0.03, phase: 0.6, incl: 0.01, bump: 6 },
    { id: 'europa', surface: 'europa', radius: RADII.europa, orbit: 7900, speed: 0.019, phase: 2.2, incl: 0.02, bump: 8, spec: 0.5 },
    { id: 'ganymede', surface: 'ganymede', radius: RADII.ganymede, orbit: 11400, speed: 0.012, phase: 4.1, incl: 0.01, bump: 10 },
    { id: 'callisto', surface: 'callisto', radius: RADII.callisto, orbit: 16500, speed: 0.008, phase: 5.2, incl: 0.02, bump: 10 },
  ], SUN_COLOR);

  return {
    planet: jupiter,
    pois: [poi('jupiter', jupiter.group.position, RADII.jupiter, { observe: [-0.85, -0.3, 1.5] }), ...moons.pois],
    update(dt, time, camera) { jupiter.update(dt, time, ctx.sun, camera); moons.update(dt, time, camera); },
    dispose() { jupiter.dispose(); moons.dispose(); },
  };
}

export function buildSaturn(ctx) {
  const saturn = new Planet(ctx.renderer, {
    name: 'Saturn', surface: 'saturn', radius: RADII.saturn, textureSize: ctx.tier.planetTex, tilt: 0.466,
    rotationSpeed: 0.018, bump: 1.2, sunColor: SUN_COLOR, sunIntensity: 1.05,
    atmoColor: 0xe6d3a0, twilight: 0x9a7a4a, atmoInner: 0.3,
    atmospheres: [{ scale: 1.02, color: 0xf0dcae, twilight: 0xb08850, strength: 0.45, falloff: 2.4 }],
  });
  saturn.group.position.fromArray(WORLD.saturn);
  saturn.group.rotation.x = 0.12;
  ctx.root.add(saturn.group);
  const rings = new Rings(saturn, {});

  const moons = moonSystem(ctx, saturn, [
    { id: 'titan', surface: 'titan', radius: RADII.titan, orbit: 12500, speed: 0.01, phase: 1.1, incl: 0.3, bump: 0.5, atmo: { scale: 1.09, color: 0xf0a040, strength: 0.9, falloff: 2.2 } },
  ], SUN_COLOR);

  return {
    planet: saturn,
    pois: [poi('saturn', saturn.group.position, RADII.saturn * 1.5, { observe: [-1.3, 0.75, 2.1] }), ...moons.pois],
    update(dt, time, camera) { saturn.update(dt, time, ctx.sun, camera); rings.update(); moons.update(dt, time, camera); },
    dispose() { rings.dispose(); saturn.dispose(); moons.dispose(); },
  };
}

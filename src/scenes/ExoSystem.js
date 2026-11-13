import * as THREE from 'three';
import { Planet } from '../objects/Planets/Planet.js';
import { Nebula } from '../objects/Nebula/Nebula.js';
import { GlowSprite } from '../objects/Stars/GlowSprite.js';
import { WORLD, RADII } from '../config/world.js';
import { poi, moonSystem, v3 } from './helpers.js';

/** Fictional system: the ocean world Vespera, two moons, a blue-white + orange binary, a red nebula behind. */
export function buildExo(ctx) {
  const starA = v3(WORLD.exoStarA), starB = v3(WORLD.exoStarB);
  const exo = new Planet(ctx.renderer, {
    name: 'Vespera', surface: 'exo', radius: RADII.exo, textureSize: ctx.tier.planetTex, tilt: 0.3,
    rotationSpeed: 0.009, cloudSpeed: 0.0016, clouds: 0.7, cloudColor: 0xf3c8ff, bump: 18, spec: 0.55, specColor: 0xcfe0ff,
    sunColor: 0xdfe8ff, sunIntensity: 1.15, atmoColor: 0x39d6c8, twilight: 0xff4fd0, atmoInner: 0.8,
    emissiveColor: 0x45ffe6, emissiveNight: 1.8, emissiveDay: 0.06,
    atmospheres: [
      { scale: 1.04, color: 0x35e0d0, twilight: 0xff50c8, strength: 0.9, falloff: 3.0 },
      { scale: 1.11, color: 0x9a5cff, twilight: 0xff3fa0, strength: 0.55, falloff: 2.0 },
    ],
  });
  exo.group.position.fromArray(WORLD.exo);
  ctx.root.add(exo.group);

  const companion = { dir: new THREE.Vector3(), color: new THREE.Color(0xff9a4a).multiplyScalar(0.45) };
  const local = { ...ctx, sun: starA, companion };
  const moons = moonSystem(local, exo, [
    { id: 'exoMoonA', surface: 'exoMoonIce', radius: RADII.exoMoonA, orbit: 4300, speed: 0.012, phase: 0.9, incl: 0.25, bump: 8, spec: 0.8 },
    { id: 'exoMoonB', surface: 'exoMoonRust', radius: RADII.exoMoonB, orbit: 7800, speed: 0.007, phase: 3.6, incl: -0.12, bump: 12 },
  ], 0xdfe8ff);

  const sA = new GlowSprite({ size: 46000, color: 0xbcd4ff, intensity: 1.5, core: 4, coreSize: 0.035, streak: 0.5, rays: 0.5 });
  sA.object.position.copy(starA);
  const sB = new GlowSprite({ size: 26000, color: 0xffa25a, intensity: 1.2, core: 3, coreSize: 0.03, streak: 0.3, rays: 0.4 });
  sB.object.position.copy(starB);
  ctx.root.add(sA.object, sB.object);

  const k = ctx.tier.nebulaDensity;
  const crimson = new Nebula(ctx.renderer, {
    radius: RADII.crimson, seed: 93, count: Math.round(56 * k), dust: Math.round(10 * k), stars: Math.round(320 * k), lobes: 7, flatten: 0.6, opacity: 0.32,
    palette: [[0.75, 0.06, 0.1], [1.0, 0.2, 0.22], [1.0, 0.45, 0.3], [0.6, 0.1, 0.4]], pixelRatio: ctx.pixelRatio,
  });
  crimson.group.position.fromArray(WORLD.crimson);
  ctx.root.add(crimson.group);

  const pivot = starA.clone();
  const rel = starB.clone().sub(starA);
  let ang = 0;
  return {
    nebulae: [crimson],
    pois: [
      poi('exo', exo.group.position, RADII.exo, { observe: [-0.9, 0.3, 1.5] }),
      ...moons.pois,
      poi('exoStarA', starA, 2500, { pickRadius: 5000, observeDist: 60000, observe: [0.4, 0.2, 1] }),
      poi('exoStarB', sB.object.position, 1500, { pickRadius: 3500, observeDist: 50000, observe: [0.4, 0.2, 1] }),
      poi('crimson', v3(WORLD.crimson), RADII.crimson * 0.7, { observe: [0.3, 0.2, 2.6] }),
    ],
    update(dt, time, camera) {
      // slow mutual orbit of the companion
      ang += dt * 0.004;
      sB.object.position.copy(rel).applyAxisAngle(THREE.Object3D.DEFAULT_UP, ang).add(pivot);
      companion.dir.copy(sB.object.position).sub(exo.group.position).normalize();
      exo.setCompanionLight(companion.dir, companion.color);
      exo.update(dt, time, starA, camera);
      moons.update(dt, time, camera);
      crimson.update(time);
      sA.uniforms.uTime.value = time; sB.uniforms.uTime.value = time;
    },
    setPixelRatio(pr) { crimson.setPixelRatio(pr); },
    dispose() { exo.dispose(); moons.dispose(); sA.dispose(); sB.dispose(); crimson.dispose(); ctx.root.remove(sA.object, sB.object); },
  };
}

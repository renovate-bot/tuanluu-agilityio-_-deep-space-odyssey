import * as THREE from 'three';
import { SkyStars } from '../objects/Stars/SkyStars.js';
import { SkyDome } from '../objects/Stars/SkyDome.js';
import { WrappedField } from '../objects/Stars/WrappedField.js';
import { WarpTunnel } from '../objects/Stars/WarpTunnel.js';
import { GlowSprite } from '../objects/Stars/GlowSprite.js';
import { Sun } from '../objects/Stars/Sun.js';
import { Orbits } from '../objects/Planets/Orbits.js';
import { PLANETS, SUN, BELT, orbitPosition, angularSpeed } from '../config/solar.js';
import { disposeDetailTexture } from '../utils/textures.js';
import { disposeNebulaAtlas } from '../objects/Nebula/NebulaTextures.js';
import { WORLD, RADII } from '../config/world.js';
import { poi, v3 } from './helpers.js';

// Sector builders live in their own chunks and are fetched the first time a sector is needed.
const LOADERS = {
  nebula: () => import('./NebulaSector.js').then((m) => m.buildNebula),
  earth: () => import('./SolarSystem.js').then((m) => m.buildEarth),
  jupiter: () => import('./SolarSystem.js').then((m) => m.buildJupiter),
  saturn: () => import('./SolarSystem.js').then((m) => m.buildSaturn),
  mars: () => import('./SolarSystem.js').then((m) => m.buildMars),
  belt: () => import('./SolarSystem.js').then((m) => m.buildBelt),
  venus: () => import('./SolarSystem.js').then((m) => m.buildVenus),
  mercury: () => import('./SolarSystem.js').then((m) => m.buildMercury),
  uranus: () => import('./SolarSystem.js').then((m) => m.buildUranus),
  neptune: () => import('./SolarSystem.js').then((m) => m.buildNeptune),
  deep: () => import('./DeepSpace.js').then((m) => m.buildDeep),
  galaxy: () => import('./GalaxySector.js').then((m) => m.buildGalaxy),
  exo: () => import('./ExoSystem.js').then((m) => m.buildExo),
};
export const SECTOR_IDS = Object.keys(LOADERS);

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/**
 * Everything outside the hull. Owns the floating-origin root, the always-present star layers and the
 * lazily built sectors, and exposes the list of points of interest.
 */
export class Universe {
  constructor(renderer, scene, tier, pixelRatio) {
    this.renderer = renderer;
    this.scene = scene;
    this.tier = tier;
    this.pixelRatio = pixelRatio;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.sun = v3(WORLD.sun);
    this.sectors = new Map(); // id → built sector
    this.pending = new Map(); // id → promise
    this.pois = [];
    this.nebulae = [];
    this.fieldPos = new THREE.Vector3();
    this._streak = new THREE.Vector3();

    this.dome = new SkyDome(renderer, { size: tier.planetTex });
    this.sky = new SkyStars({ count: tier.skyStars, pixelRatio });
    this.field = new WrappedField({ count: tier.fieldStars, box: 60000, size: 22, seed: 3, streaks: true, color: [0.9, 0.95, 1.0], pixelRatio });
    this.dust = new WrappedField({ count: tier.dust, box: 320, size: 0.22, seed: 8, drift: 1.6, color: [0.75, 0.85, 1.0], colorVar: 0.15, opacity: 0.5, pixelRatio });
    this.dust.uniforms.uScale.value = 900;
    this.tunnel = new WarpTunnel();
    scene.add(this.dome.object, this.sky.object, this.field.object, this.dust.object, this.tunnel.object);

    // ── Solar System model: positions exist from the first frame, globes are built lazily on top ──
    this.positions = { sun: this.sun };
    this.angles = {};
    for (const p of PLANETS) { this.angles[p.id] = p.phase; this.positions[p.id] = orbitPosition(p, p.phase); }
    this.belt = { angle: BELT.phase, position: new THREE.Vector3() };
    this.positions.belt = this.belt.position;
    this.advance(0);

    // The Sun: a real body up close, a glare when it is a point in the sky.
    this.sunBody = new Sun({ radius: SUN.radius, detail: tier.nebulaDensity });
    this.root.add(this.sunBody.group);
    this.sunSprite = new GlowSprite({ size: 90000, color: 0xffe2b8, intensity: 1.5, core: 0, coreSize: 0.04, streak: 0.4, rays: 0.5 });
    this.sunSprite.object.position.copy(this.sun);
    this.sunSprite.object.renderOrder = 4;
    this.root.add(this.sunSprite.object);
    this.pois.push(poi('sun', this.sun, RADII.sun, { pickRadius: RADII.sun * 1.3, body: SUN }));
    for (const p of PLANETS) this.pois.push(poi(p.id, this.positions[p.id], RADII[p.id] * (p.id === 'saturn' ? 1.5 : 1), { pickRadius: RADII[p.id] * (p.id === 'saturn' ? 2.3 : 1.1), body: p }));
    this.pois.push(poi('belt', this.belt.position, 2600, { observe: [0.25, 0.5, 2.4] }));

    this.orbits = new Orbits(PLANETS, pixelRatio);
    this.root.add(this.orbits.group);

    // key light for lit meshes (asteroids, the ship exterior)
    this.keyLight = new THREE.DirectionalLight(0xfff1dd, 2.6);
    this.fillLight = new THREE.DirectionalLight(0x5d7cff, 0.5);
    this.hemi = new THREE.HemisphereLight(0x3a4a7a, 0x06070c, 0.35);
    scene.add(this.keyLight, this.keyLight.target, this.fillLight, this.fillLight.target, this.hemi);
  }

  /** Step the orbital model. Called first in the frame so everything else sees this frame's positions. */
  advance(dt) {
    for (const p of PLANETS) {
      this.angles[p.id] += angularSpeed(p) * dt;
      orbitPosition(p, this.angles[p.id], this.positions[p.id]);
    }
    this.belt.angle += angularSpeed(BELT) * dt;
    this.belt.position.set(Math.cos(this.belt.angle) * BELT.orbit, 0, -Math.sin(this.belt.angle) * BELT.orbit);
  }

  isLoaded(id) { return this.sectors.has(id); }

  /** Build a sector if needed. Safe to call repeatedly; concurrent calls share one promise. */
  ensure(id) {
    if (this.sectors.has(id)) return Promise.resolve(this.sectors.get(id));
    if (this.pending.has(id)) return this.pending.get(id);
    const loader = LOADERS[id];
    if (!loader) return Promise.reject(new Error(`Unknown sector "${id}"`));
    const p = (async () => {
      const build = await loader();
      await nextFrame(); // let the current frame present before the heavy bake
      const sector = build({ renderer: this.renderer, root: this.root, tier: this.tier, pixelRatio: this.pixelRatio, sun: this.sun, positions: this.positions, belt: this.belt });
      this.sectors.set(id, sector);
      this.pois.push(...sector.pois);
      if (sector.nebulae) this.nebulae.push(...sector.nebulae);
      this.pending.delete(id);
      await nextFrame();
      return sector;
    })();
    p.catch(() => this.pending.delete(id));
    this.pending.set(id, p);
    return p;
  }

  poiById(id) { return this.pois.find((p) => p.id === id); }

  /**
   * @param ship { pos, velocity (units/s), speed }
   * @param warp 0..1 visual warp amount
   */
  update(dt, time, camera, ship, warp) {
    this.root.position.copy(ship.pos).multiplyScalar(-1);
    this.root.updateMatrixWorld(true);

    for (const s of this.sectors.values()) s.update(dt, time, camera);
    this.sunSprite.uniforms.uTime.value = time;
    // close in, the disc and corona carry the Sun; the wide glow would only wash the surface out
    this.sunSprite.uniforms.uIntensity.value = 1.5 * (0.12 + 0.88 * THREE.MathUtils.smoothstep(ship.pos.length() / this.sunBody.radius, 5, 40));
    this.sunBody.update(time, ship.pos.length());
    this.orbits.update(this.positions);
    this.orbits.setElevation(THREE.MathUtils.smoothstep(Math.abs(ship.pos.y) / Math.max(ship.pos.length(), 1), 0.08, 0.45));

    this.dome.update(camera);
    this.sky.update(time, camera);

    // The wrapped fields follow a capped "visual" position: at warp the true speed would alias them into noise.
    const speed = ship.speed;
    const visual = Math.min(speed, 7000 + 30000 * warp);
    if (speed > 1e-3) {
      this.fieldPos.addScaledVector(ship.velocity, (visual / speed) * dt);
      this._streak.copy(ship.velocity).multiplyScalar((-1 / speed) * Math.min(visual * 0.11, 4200) * warp);
    } else this._streak.set(0, 0, 0);
    this.field.update(dt, this.fieldPos, this._streak, 1);
    this.dust.update(dt, this.fieldPos, null, 0.5);

    if (speed > 1e-3) this._dir = (this._dir || new THREE.Vector3()).copy(ship.velocity).multiplyScalar(1 / speed);
    this.tunnel.update(time, warp, this._dir || THREE.Object3D.DEFAULT_UP);
    this.sky.material.uniforms.uAberr.value = warp * 0.9;
    if (this._dir) this.sky.material.uniforms.uFwd.value.copy(this._dir);
    this.sky.material.uniforms.uDim.value = 1 - 0.35 * warp;
  }

  /** Colour and strength of nebula light at the ship, for cabin tinting and audio. */
  nebulaInfluence(pos, outColor) {
    let amount = 0;
    outColor.setRGB(0, 0, 0);
    for (const n of this.nebulae) {
      const d = n.group.position.distanceTo(pos);
      const a = THREE.MathUtils.smoothstep(n.radius * 1.9 - d, 0, n.radius * 1.3);
      if (a > amount) { amount = a; if (n.tint) outColor.copy(n.tint); }
    }
    return amount;
  }

  setLightDirections(shipPos, keyWorld, fillWorld) {
    this.keyLight.position.copy(keyWorld).sub(shipPos).normalize().multiplyScalar(100);
    this.fillLight.position.copy(fillWorld).sub(shipPos).normalize().multiplyScalar(100);
  }

  setPixelRatio(pr) {
    this.pixelRatio = pr;
    this.sky.material.uniforms.uPixelRatio.value = pr;
    this.field.setPixelRatio(pr);
    this.dust.setPixelRatio(pr);
    this.orbits.setPixelRatio(pr);
    for (const s of this.sectors.values()) if (s.setPixelRatio) s.setPixelRatio(pr);
  }

  dispose() {
    for (const s of this.sectors.values()) s.dispose();
    this.sectors.clear();
    for (const o of [this.dome, this.sky, this.field, this.dust, this.tunnel, this.sunSprite, this.sunBody, this.orbits]) o.dispose();
    disposeDetailTexture();
    disposeNebulaAtlas();
    this.scene.remove(this.root, this.dome.object, this.sky.object, this.field.object, this.dust.object, this.tunnel.object, this.keyLight, this.fillLight, this.hemi);
  }
}

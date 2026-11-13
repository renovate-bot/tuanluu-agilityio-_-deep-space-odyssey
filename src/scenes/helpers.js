import * as THREE from 'three';
import { Planet } from '../objects/Planets/Planet.js';
import { CELESTIAL } from '../config/celestial.js';

/** Build a point-of-interest record. `position` is a live Vector3 in universe coordinates. */
export function poi(id, position, radius, extra = {}) {
  const data = CELESTIAL[id];
  if (!data) throw new Error(`No celestial data for "${id}"`);
  return { id, ...data, position, radius, pickRadius: extra.pickRadius || radius, observe: extra.observe || [-0.6, 0.3, 1.6], observeDist: extra.observeDist };
}

/** Moons on simple circular orbits around a parent planet, positioned directly in universe coordinates. */
export function moonSystem(ctx, parent, defs, sunColor) {
  const moons = defs.map((d) => {
    const planet = new Planet(ctx.renderer, {
      name: d.id, surface: d.surface, radius: d.radius, textureSize: ctx.tier.moonTex, rotationSpeed: d.speed,
      bump: d.bump ?? 8, spec: d.spec ?? 0, sunColor, sunIntensity: 1.2, ambient: 0.003,
      atmospheres: d.atmo ? [d.atmo] : [], atmoColor: d.atmo ? d.atmo.color : 0, atmoInner: d.atmo ? 0.5 : 0,
    });
    ctx.root.add(planet.group);
    return { def: d, planet, angle: d.phase };
  });
  const place = (m) => {
    const { orbit, incl } = m.def;
    m.planet.group.position.set(
      parent.group.position.x + Math.cos(m.angle) * orbit,
      parent.group.position.y + Math.sin(m.angle) * orbit * Math.sin(incl) + orbit * Math.sin(incl) * 0.5,
      parent.group.position.z + Math.sin(m.angle) * orbit,
    );
  };
  moons.forEach(place);
  return {
    moons,
    pois: moons.map((m) => poi(m.def.id, m.planet.group.position, m.def.radius, { pickRadius: m.def.radius * 2.2, observe: [-0.8, 0.3, 1.7] })),
    update(dt, time, camera) {
      for (const m of moons) {
        m.angle += m.def.speed * dt;
        place(m);
        m.planet.update(dt, time, ctx.sun, camera);
        if (ctx.companion) m.planet.setCompanionLight(ctx.companion.dir, ctx.companion.color);
      }
    },
    dispose() { for (const m of moons) m.planet.dispose(); },
  };
}

export const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

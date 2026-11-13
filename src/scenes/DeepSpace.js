import { Nebula } from '../objects/Nebula/Nebula.js';
import { GlobularCluster } from '../objects/Galaxies/SmallGalaxies.js';
import { WORLD, RADII } from '../config/world.js';
import { poi, v3 } from './helpers.js';

export function buildDeep(ctx) {
  const k = ctx.tier.nebulaDensity;
  const aurum = new Nebula(ctx.renderer, {
    radius: RADII.aurum, seed: 77, count: Math.round(54 * k), dust: Math.round(12 * k), stars: Math.round(300 * k), lobes: 6, flatten: 0.45, opacity: 0.26,
    palette: [[0.9, 0.42, 0.08], [1.0, 0.68, 0.2], [1.0, 0.85, 0.5], [0.75, 0.25, 0.1]], pixelRatio: ctx.pixelRatio,
  });
  aurum.group.position.fromArray(WORLD.aurum);
  const cluster = new GlobularCluster({ radius: RADII.cluster, count: Math.round(11000 * k), pixelRatio: ctx.pixelRatio });
  cluster.group.position.fromArray(WORLD.cluster);
  ctx.root.add(aurum.group, cluster.group);
  return {
    nebulae: [aurum],
    pois: [
      poi('aurum', v3(WORLD.aurum), RADII.aurum * 0.7, { observe: [0.2, 0.2, 2.6] }),
      poi('cluster', v3(WORLD.cluster), RADII.cluster, { observe: [0.3, 0.2, 2.4] }),
    ],
    update(dt, time) { aurum.update(time); cluster.update(dt); },
    setPixelRatio(pr) { aurum.setPixelRatio(pr); cluster.setPixelRatio(pr); },
    dispose() { aurum.dispose(); cluster.dispose(); },
  };
}

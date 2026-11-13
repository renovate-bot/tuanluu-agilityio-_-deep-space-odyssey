import { Nebula } from '../objects/Nebula/Nebula.js';
import { WORLD, RADII } from '../config/world.js';
import { poi, v3 } from './helpers.js';

export function buildNebula(ctx) {
  const k = ctx.tier.nebulaDensity;
  const azure = new Nebula(ctx.renderer, {
    radius: RADII.azure, seed: 12, count: Math.round(70 * k), dust: Math.round(9 * k), stars: Math.round(520 * k), lobes: 7, opacity: 0.34,
    palette: [[0.05, 0.16, 0.75], [0.1, 0.42, 1.0], [0.18, 0.75, 0.95], [0.45, 0.3, 1.0]], pixelRatio: ctx.pixelRatio,
  });
  azure.group.position.fromArray(WORLD.azure);
  const violet = new Nebula(ctx.renderer, {
    radius: RADII.violet, seed: 48, count: Math.round(44 * k), dust: Math.round(6 * k), stars: Math.round(260 * k), lobes: 5, opacity: 0.32,
    palette: [[0.42, 0.1, 0.85], [0.75, 0.18, 0.8], [0.95, 0.3, 0.55], [0.3, 0.25, 1.0]], pixelRatio: ctx.pixelRatio,
  });
  violet.group.position.fromArray(WORLD.violet);
  ctx.root.add(azure.group, violet.group);
  return {
    nebulae: [azure, violet],
    pois: [
      poi('azure', v3(WORLD.azure), RADII.azure * 0.75, { observe: [0.3, 0.2, 2.6] }),
      poi('violet', v3(WORLD.violet), RADII.violet * 0.7, { observe: [0.6, 0.2, 2.6] }),
    ],
    update(dt, time) { azure.update(time); violet.update(time); },
    setPixelRatio(pr) { azure.setPixelRatio(pr); violet.setPixelRatio(pr); },
    dispose() { azure.dispose(); violet.dispose(); },
  };
}

import { SpiralGalaxy } from '../objects/Galaxies/SpiralGalaxy.js';
import { EllipticalGalaxy, IrregularGalaxy } from '../objects/Galaxies/SmallGalaxies.js';
import { WORLD, RADII } from '../config/world.js';
import { poi, v3 } from './helpers.js';

export function buildGalaxy(ctx) {
  const t = ctx.tier;
  const spiral = new SpiralGalaxy(ctx.renderer, { radius: RADII.galaxy, count: t.galaxyStars, pixelRatio: ctx.pixelRatio, textureSize: t.galaxyTex });
  spiral.group.position.fromArray(WORLD.galaxy);
  spiral.group.rotation.set(0.35, 0.4, -0.22);
  const elliptical = new EllipticalGalaxy({ radius: RADII.elliptical, count: Math.round(t.galaxyStars * 0.2), pixelRatio: ctx.pixelRatio });
  elliptical.group.position.fromArray(WORLD.elliptical);
  elliptical.group.rotation.set(0.5, 0.2, 0.7);
  const irregular = new IrregularGalaxy({ radius: RADII.irregular, count: Math.round(t.galaxyStars * 0.16), pixelRatio: ctx.pixelRatio });
  irregular.group.position.fromArray(WORLD.irregular);
  irregular.group.rotation.set(-0.3, 1.2, 0.4);
  ctx.root.add(spiral.group, elliptical.group, irregular.group);
  const all = [spiral, elliptical, irregular];
  return {
    spiral,
    pois: [
      poi('galaxy', v3(WORLD.galaxy), RADII.galaxy * 0.6, { observe: [-0.3, 0.9, 1.5] }),
      poi('elliptical', v3(WORLD.elliptical), RADII.elliptical * 0.6, { observe: [0.2, 0.3, 2.4] }),
      poi('irregular', v3(WORLD.irregular), RADII.irregular * 0.6, { observe: [0.2, 0.3, 2.4] }),
    ],
    update(dt) { for (const g of all) g.update(dt); },
    setPixelRatio(pr) { for (const g of all) g.setPixelRatio(pr); },
    dispose() { for (const g of all) g.dispose(); },
  };
}

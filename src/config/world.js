// Layout of the simulated universe, in scene units. Scale is artistic: bodies are enlarged and distances
// compressed so that each vista reads well from the observation deck. Planet positions are not here: they
// move, and come from config/solar.js. AU is only a rough yardstick for star-to-star read-outs.
export const AU = 64000;

export const WORLD = {
  sun: [0, 0, 0],
  // nebulae sit well above the ecliptic so no planetary orbit passes through them
  azure: [-250000, 300000, 380000],
  violet: [-205000, 290000, 352000],
  deep: [-600000, 700000, 900000],
  aurum: [-480000, 730000, 640000],
  cluster: [-585000, 698000, 878000],
  galaxy: [1200000, 900000, -2000000],
  elliptical: [650000, 1120000, -2350000],
  irregular: [1580000, 720000, -1750000],
  exo: [-900000, -550000, -500000],
  exoStarA: [-975000, -532000, -468000],
  exoStarB: [-966000, -529500, -473000],
  crimson: [-1150000, -610000, -850000],
  overview: [0, 0, 0],
};

export const RADII = {
  sun: 6000, mercury: 230, venus: 570, earth: 600, moon: 163, mars: 320, phobos: 26, deimos: 20, jupiter: 2600, saturn: 2200, uranus: 1100, neptune: 1050, exo: 900,
  io: 74, europa: 64, ganymede: 107, callisto: 98, titan: 105, triton: 58, exoMoonA: 150, exoMoonB: 95,
  galaxy: 320000, elliptical: 110000, irregular: 80000, azure: 45000, violet: 32000, aurum: 70000, crimson: 110000, cluster: 2600,
};

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

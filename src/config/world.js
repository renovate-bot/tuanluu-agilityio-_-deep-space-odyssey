// Layout of the simulated universe, in scene units. Scale is artistic: bodies are enlarged and distances
// compressed so that each vista reads well from the observation deck. One AU is 63,246 units along the
// Sun→planet axis so the heliocentric ranges shown in the UI match real orbital distances.
export const AU = 63246;

export const WORLD = {
  sun: [0, 0, 0],
  earth: [60000, 0, 20000], // 1.00 AU
  mars: [91700, 1930, -28950], // 1.52 AU
  jupiter: [314800, -6300, 94400], // 5.20 AU
  saturn: [573700, 15800, -177900], // 9.5 AU
  azure: [-250000, 40000, 380000],
  violet: [-205000, 30000, 352000],
  deep: [-600000, 400000, 900000],
  aurum: [-480000, 430000, 640000],
  cluster: [-585000, 398000, 878000],
  galaxy: [1200000, 600000, -2000000],
  elliptical: [650000, 820000, -2350000],
  irregular: [1580000, 420000, -1750000],
  exo: [-900000, -150000, -500000],
  exoStarA: [-975000, -132000, -468000],
  exoStarB: [-966000, -129500, -473000],
  crimson: [-1150000, -210000, -850000],
};

export const RADII = {
  sun: 1400, earth: 600, moon: 163, mars: 320, jupiter: 2600, saturn: 2200, exo: 900,
  io: 74, europa: 64, ganymede: 107, callisto: 98, titan: 105, exoMoonA: 150, exoMoonB: 95,
  galaxy: 320000, elliptical: 110000, irregular: 80000, azure: 45000, violet: 32000, aurum: 70000, crimson: 110000, cluster: 2600,
};

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];

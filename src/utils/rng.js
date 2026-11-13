// Small deterministic PRNG so every visit sees the same universe.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gaussian sample (Box–Muller) from a uniform generator. */
export function gauss(rand) {
  let u = 0;
  while (u === 0) u = rand();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * rand());
}

/** Uniform point on the unit sphere written into `out` (array, offset). */
export function onSphere(rand, out, o = 0, r = 1) {
  const z = rand() * 2 - 1;
  const a = rand() * Math.PI * 2;
  const s = Math.sqrt(1 - z * z);
  out[o] = Math.cos(a) * s * r;
  out[o + 1] = z * r;
  out[o + 2] = Math.sin(a) * s * r;
}

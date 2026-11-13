// The Solar System model. CINEMATIC SCALE, stated plainly:
//  - Orbital distances are compressed and are NOT proportional to the real ones (see `orbit`, scene units).
//  - Sizes keep the real ordering; the terrestrial planets keep their real ratios to each other and so do the
//    giants, but the giants are shrunk relative to the rocky worlds so both can be framed from the same deck.
//  - Orbital periods keep their real ratios. One Earth year takes YEAR seconds of viewing time.
//  - Spin rates are slowed/sped to be watchable; direction (retrograde Venus, Uranus) and the ordering of
//    fast and slow rotators follow the real planets.
// Real figures shown in the interface come from config/celestial.js, never from this file.
import * as THREE from 'three';

export const YEAR = 1800; // seconds per Earth orbit
const DEG = Math.PI / 180;

// views: vantage points in planet radii, in the frame (S = towards the Sun, U = up, T = S × U).
const VIEW = { far: [1.5, 0.55, 3.7], close: [1.05, 0.28, 1.95], lookFar: [0, 0, -0.35], lookClose: [0, 0, -0.25] };
const FLYBY = [[1.5, 0.2, 1.55], [1.2, 0.1, 0.8], [1.14, 0.12, -0.2], [1.5, 0.4, -1.4]];

export const SUN = { id: 'sun', radius: 6000, mood: 'galaxy', cabin: [1.0, 0.85, 0.6], light: 3.2, views: { far: [0, 0.22, 9.5], close: [0, 0.1, 4.2], lookFar: [0, 0, 0], lookClose: [0.9, 0, 0] } };

export const PLANETS = [
  { id: 'mercury', color: 0xb8aea0, orbit: 31000, period: 0.2408, incl: 7.0, node: 0.84, phase: 4.1, radius: 230, mood: 'desert', cabin: [1.0, 0.86, 0.7], light: 3.0 },
  { id: 'venus', color: 0xf2d08a, orbit: 47000, period: 0.6152, incl: 3.39, node: 1.34, phase: 0.6, radius: 570, mood: 'giant', cabin: [1.0, 0.82, 0.55], light: 2.7 },
  { id: 'earth', color: 0x6fa8ff, orbit: 64000, period: 1.0, incl: 0.0, node: 0, phase: 2.3, radius: 600, mood: 'home', cabin: [0.5, 0.65, 1.0], light: 2.4 },
  { id: 'mars', color: 0xe07a4a, orbit: 86000, period: 1.8808, incl: 1.85, node: 0.86, phase: 5.2, radius: 320, mood: 'desert', cabin: [1.0, 0.55, 0.35], light: 2.0 },
  { id: 'jupiter', color: 0xe0b88a, orbit: 200000, period: 11.862, incl: 1.3, node: 1.75, phase: 1.0, radius: 2600, mood: 'giant', cabin: [1.0, 0.76, 0.5], light: 1.6,
    views: { far: [1.6, 0.35, 4.3], close: [1.1, -0.3, 2.0], lookClose: [0, -0.25, -0.2] }, flyby: [[1.5, -0.1, 1.6], [1.2, -0.3, 0.75], [1.15, -0.25, -0.2], [1.5, 0.1, -1.3]] },
  { id: 'saturn', color: 0xead8a0, orbit: 300000, period: 29.457, incl: 2.49, node: 1.98, phase: 3.5, radius: 2200, mood: 'giant', cabin: [1.0, 0.86, 0.6], light: 1.4,
    views: { far: [1.9, 1.7, 4.9], close: [1.5, 0.75, 2.9], lookFar: [0, -0.1, -0.3], lookClose: [0, -0.1, -0.3] }, flybyFrame: 'ring', ringTilt: [0.12, 0.466],
    flyby: [[2.9, 0.42, 1.7], [2.25, 0.07, 0.95], [1.92, 0.014, 0.0], [1.6, 0.03, -0.95], [1.1, 0.3, -2.1]] },
  { id: 'uranus', color: 0x9fe8ee, orbit: 400000, period: 84.011, incl: 0.77, node: 1.29, phase: 5.9, radius: 1100, mood: 'void', cabin: [0.55, 0.9, 1.0], light: 1.1 },
  { id: 'neptune', color: 0x5f85ff, orbit: 480000, period: 164.79, incl: 1.77, node: 2.3, phase: 2.9, radius: 1050, mood: 'alien', cabin: [0.4, 0.55, 1.0], light: 0.95 },
];
for (const p of PLANETS) {
  p.views = { ...VIEW, ...(p.views || {}) };
  p.flyby = p.flyby || FLYBY;
}
SUN.flyby = null;

export const BELT = {
  id: 'belt', orbit: 132000, inner: 108000, outer: 160000, period: 4.6, phase: 0.2, radius: 2600, mood: 'void', cabin: [0.8, 0.78, 0.75], light: 1.5,
  views: { far: [1.5, 0.75, 2.8], close: [0.55, 0.22, 1.0], lookFar: [0, 0, -0.6], lookClose: [0, 0, -0.5] },
  flyby: [[0.5, 0.2, 1.6], [0.16, 0.05, 0.3], [0.1, 0.03, -1.6], [0.45, 0.2, -3.2]],
};

export const planetById = (id) => (id === 'sun' ? SUN : id === 'belt' ? BELT : PLANETS.find((p) => p.id === id));

/** Heliocentric position on a circular, inclined orbit. `angle` grows counter-clockwise seen from the north. */
export function orbitPosition(body, angle, out = new THREE.Vector3()) {
  const r = body.orbit;
  return out.set(Math.cos(angle) * r, r * Math.sin(body.incl * DEG) * Math.sin(angle - body.node), -Math.sin(angle) * r);
}

export const angularSpeed = (body) => (2 * Math.PI) / (body.period * YEAR);

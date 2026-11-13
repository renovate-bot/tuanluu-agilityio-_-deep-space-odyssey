import { WORLD, RADII, add, scale } from './world.js';
import { PLANETS, SUN, BELT } from './solar.js';

// Two kinds of destination:
//   kind 'body'   – a moving Solar System body. The ship parks relative to it (see systems/Vantage.js) and
//                   travels with it along its orbit. Vantage points come from config/solar.js.
//   kind 'static' – a fixed place. `pos`: where the ship parks, `look`: what the bow points at,
//                   `approach`: optional start of an arrival cruise, `event`: cinematic played on arrival.
// `sectors`: lazily built scene chunks required before arrival. `mood`: music harmony + ambience.
// `cabin`: colour the outside world casts into the deck. `sector`: HUD read-out (real heliocentric distance).
const at = (id, offsetRadii) => add(WORLD[id], scale(offsetRadii, RADII[id]));

export const START = {
  id: 'start', kind: 'static', light: { at: 'azure', intensity: 0.9 }, name: 'UNCHARTED', sector: 'UNKNOWN', sectors: ['nebula'],
  pos: add(WORLD.azure, [26000, 9000, 118000]), look: add(WORLD.azure, [-8000, 0, 0]),
  mood: 'drift', cabin: [0.25, 0.4, 0.9],
};

const BODY_TEXT = {
  sun: ['THE SUN', 'SOL · 0 AU', 'The star itself: a convecting surface, sunspots and the corona streaming away from the limb.'],
  mercury: ['MERCURY', 'SOL · 0.39 AU', 'The innermost planet: a small, airless, cratered world under a huge and fierce Sun.'],
  venus: ['VENUS', 'SOL · 0.72 AU', 'A world wrapped in unbroken golden cloud, turning slowly backwards beneath a racing upper haze.'],
  earth: ['EARTH', 'SOL · 1.00 AU', 'Home. Oceans, drifting weather and city lights on the night side, with the Moon in attendance.'],
  mars: ['MARS', 'SOL · 1.52 AU', 'The red planet: rust deserts, a canyon system, polar caps and two tiny moons.'],
  jupiter: ['JUPITER', 'SOL · 5.20 AU', 'The giant: sliding cloud belts, the Great Red Spot and the four Galilean moons.'],
  saturn: ['SATURN', 'SOL · 9.58 AU', 'The ringed planet. The flyby skims the ring plane with ice drifting past the glass.'],
  uranus: ['URANUS', 'SOL · 19.2 AU', 'A pale cyan ice giant rolling on its side, circled by thin dark rings.'],
  neptune: ['NEPTUNE', 'SOL · 30.1 AU', 'The outermost planet: deep blue, dark storms, bright methane cirrus and Triton.'],
  belt: ['ASTEROID BELT', 'SOL · 2.1 – 3.3 AU', 'Rock and metal left over from planet formation, tumbling between Mars and Jupiter.'],
};

const bodyDest = (def) => {
  const [name, sector, blurb] = BODY_TEXT[def.id];
  return {
    id: def.id, kind: 'body', group: 'solar', body: def.id, poi: def.id, name, sector, blurb,
    sectors: def.id === 'sun' ? [] : [def.id], mood: def.mood, cabin: def.cabin, light: { at: 'sun', intensity: def.light },
  };
};

export const DESTINATIONS = [
  {
    id: 'overview', kind: 'static', group: 'solar', name: 'SOLAR SYSTEM OVERVIEW', sector: 'ABOVE THE ECLIPTIC', sectors: ['belt'], poi: 'sun',
    blurb: 'High above the plane of the planets: the Sun, the inner worlds and their orbits laid out below.',
    pos: [70000, 150000, 270000], look: [0, -25000, 0], light: { at: 'sun', intensity: 1.6 }, mood: 'drift', cabin: [1.0, 0.9, 0.75],
  },
  bodyDest(SUN),
  ...PLANETS.slice(0, 4).map(bodyDest),
  bodyDest(BELT),
  ...PLANETS.slice(4).map(bodyDest),
  {
    id: 'nebula', kind: 'static', group: 'beyond', light: { at: 'azure', intensity: 1.3 }, name: 'NEBULA SECTOR', sector: 'AZURE VEIL', sectors: ['nebula'], poi: 'azure', fictional: true,
    blurb: 'Into the gas itself: a slow passage through glowing clouds and drifting dust.',
    pos: add(WORLD.azure, [9000, 2500, 26000]), look: add(WORLD.azure, [-6000, 0, -8000]), approach: add(WORLD.azure, [22000, 7000, 82000]),
    mood: 'nebula', cabin: [0.3, 0.45, 1.0], event: 'nebula',
  },
  {
    id: 'deep', kind: 'static', group: 'beyond', light: { at: 'aurum', intensity: 0.3 }, name: 'DEEP SPACE', sector: 'INTERSTELLAR VOID', sectors: ['deep'], poi: 'cluster', fictional: true,
    blurb: 'Nothing nearby for light-years. Engines idle; only a distant cluster and the faint band of the galaxy.',
    pos: WORLD.deep, look: WORLD.cluster,
    mood: 'void', cabin: [0.35, 0.4, 0.6],
  },
  {
    id: 'galaxy', kind: 'static', group: 'beyond', light: { at: 'galaxy', intensity: 0.8 }, name: 'GALAXY VIEW', sector: 'INTERGALACTIC SPACE', sectors: ['galaxy'], poi: 'galaxy', fictional: true,
    blurb: 'Far outside the disc, where an entire spiral galaxy fits inside the forward window.',
    pos: at('galaxy', [-0.42, 0.8, 1.12]), look: at('galaxy', [0.03, -0.06, 0]), approach: at('galaxy', [-1.5, 2.3, 4.4]),
    mood: 'galaxy', cabin: [0.6, 0.6, 1.0], event: 'galaxy',
  },
  {
    id: 'exo', kind: 'static', group: 'beyond', light: { at: 'exoStarA', intensity: 2.2 }, name: 'UNKNOWN EXOPLANET', sector: 'VESPER BINARY', sectors: ['exo'], poi: 'exo', fictional: true,
    blurb: 'An uncharted world of violet seas beneath two suns. Fictional destination.',
    pos: at('exo', [-1.2, 0.4, 2.2]), look: at('exo', [-0.55, 0.0, 0]), approach: at('exo', [-4.5, 1.6, 5.8]),
    mood: 'alien', cabin: [0.7, 0.4, 1.0], event: 'flyby',
  },
];

export const destinationById = (id) => (id === 'start' ? START : DESTINATIONS.find((d) => d.id === id));

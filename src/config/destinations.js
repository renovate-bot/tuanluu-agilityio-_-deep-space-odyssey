import { WORLD, RADII, add, scale } from './world.js';

// `sectors`: lazily built scene chunks required before arrival.
// `pos`: where the ship parks. `look`: what the bow points at. `approach`: optional start of the arrival cruise.
// `mood`: selects music harmony + ambience. `cabin`: colour the outside world casts into the deck.
const body = (id, offsetRadii) => add(WORLD[id], scale(offsetRadii, RADII[id]));

export const START = {
  id: 'start', light: { at: 'azure', intensity: 0.9 }, name: 'UNCHARTED', sector: 'UNKNOWN', sectors: ['nebula'],
  pos: add(WORLD.azure, [26000, 9000, 118000]), look: add(WORLD.azure, [-8000, 0, 0]),
  mood: 'drift', cabin: [0.25, 0.4, 0.9],
};

export const DESTINATIONS = [
  {
    id: 'earth', light: { at: 'sun', intensity: 2.4 }, name: 'EARTH ORBIT', sector: 'SOL · 1.00 AU', sectors: ['earth'], poi: 'earth',
    blurb: 'Home. High orbit above the day–night terminator, with the Moon rising beyond the limb.',
    pos: body('earth', [-1.15, 0.5, 2.15]), look: body('earth', [-0.55, 0.05, 0]), approach: body('earth', [-4.2, 1.5, 5.4]),
    mood: 'home', cabin: [0.3, 0.5, 1.0], event: 'flyby',
  },
  {
    id: 'mars', light: { at: 'sun', intensity: 2.0 }, name: 'MARS ORBIT', sector: 'SOL · 1.52 AU', sectors: ['mars'], poi: 'mars',
    blurb: 'The red planet from orbit, with a stream of asteroids drifting in the distance.',
    pos: body('mars', [-1.3, 0.35, 2.3]), look: body('mars', [-0.5, 0.0, 0]), approach: body('mars', [-5.0, 1.2, 6.0]),
    mood: 'desert', cabin: [1.0, 0.45, 0.25], event: 'flyby',
  },
  {
    id: 'jupiter', light: { at: 'sun', intensity: 1.6 }, name: 'JUPITER SYSTEM', sector: 'SOL · 5.20 AU', sectors: ['jupiter'], poi: 'jupiter',
    blurb: 'A close pass over the cloud tops of the largest planet, with the Galilean moons in attendance.',
    pos: body('jupiter', [-1.2, -0.35, 2.3]), look: body('jupiter', [-0.4, -0.36, 0]), approach: body('jupiter', [-3.8, 0.7, 5.6]),
    mood: 'giant', cabin: [1.0, 0.72, 0.45], event: 'flyby',
  },
  {
    id: 'saturn', light: { at: 'sun', intensity: 1.4 }, name: 'SATURN SYSTEM', sector: 'SOL · 9.5 AU', sectors: ['saturn'], poi: 'saturn',
    blurb: 'Above the ring plane, where the planet\'s shadow falls across a hundred thousand kilometres of ice.',
    pos: body('saturn', [-1.9, 0.95, 3.1]), look: body('saturn', [-0.5, -0.1, 0]), approach: body('saturn', [-5.5, 0.35, 7.5]),
    mood: 'giant', cabin: [1.0, 0.85, 0.55], event: 'flyby',
  },
  {
    id: 'nebula', light: { at: 'azure', intensity: 1.3 }, name: 'NEBULA SECTOR', sector: 'AZURE VEIL', sectors: ['nebula'], poi: 'azure', fictional: true,
    blurb: 'Into the gas itself: a slow passage through glowing clouds and drifting dust.',
    pos: add(WORLD.azure, [9000, 2500, 26000]), look: add(WORLD.azure, [-6000, 0, -8000]), approach: add(WORLD.azure, [22000, 7000, 82000]),
    mood: 'nebula', cabin: [0.3, 0.45, 1.0], event: 'nebula',
  },
  {
    id: 'deep', light: { at: 'aurum', intensity: 0.3 }, name: 'DEEP SPACE', sector: 'INTERSTELLAR VOID', sectors: ['deep'], poi: 'cluster', fictional: true,
    blurb: 'Nothing nearby for light-years. Engines idle; only a distant cluster and the faint band of the galaxy.',
    pos: WORLD.deep, look: WORLD.cluster,
    mood: 'void', cabin: [0.35, 0.4, 0.6],
  },
  {
    id: 'galaxy', light: { at: 'galaxy', intensity: 0.8 }, name: 'GALAXY VIEW', sector: 'INTERGALACTIC SPACE', sectors: ['galaxy'], poi: 'galaxy', fictional: true,
    blurb: 'Far outside the disc, where an entire spiral galaxy fits inside the forward window.',
    pos: body('galaxy', [-0.42, 0.8, 1.12]), look: body('galaxy', [0.03, -0.06, 0]), approach: body('galaxy', [-1.5, 2.3, 4.4]),
    mood: 'galaxy', cabin: [0.6, 0.6, 1.0], event: 'galaxy',
  },
  {
    id: 'exo', light: { at: 'exoStarA', intensity: 2.2 }, name: 'UNKNOWN EXOPLANET', sector: 'VESPER BINARY', sectors: ['exo'], poi: 'exo', fictional: true,
    blurb: 'An uncharted world of violet seas beneath two suns. Fictional destination.',
    pos: body('exo', [-1.2, 0.4, 2.2]), look: body('exo', [-0.55, 0.0, 0]), approach: body('exo', [-4.5, 1.6, 5.8]),
    mood: 'alien', cabin: [0.7, 0.4, 1.0], event: 'flyby',
  },
];

export const destinationById = (id) => (id === 'start' ? START : DESTINATIONS.find((d) => d.id === id));

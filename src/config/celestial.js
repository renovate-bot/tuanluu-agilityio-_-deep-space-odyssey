// Point-of-interest data shown in the holographic target card.
// Real bodies use figures from NASA planetary fact sheets (mean radius, mean orbital distance, sidereal rotation).
// Anything invented for this experience is flagged `fictional: true` and labelled as such in the UI.
// `range`: how scene units are converted for the *simulated* range read-out.
import { RADII, AU } from './world.js';

const km = (id, realRadiusKm) => ({ unit: 'km', perUnit: realRadiusKm / RADII[id] });

export const CELESTIAL = {
  sun: {
    name: 'SOL', type: 'G2V main-sequence star', range: { unit: 'AU', perUnit: 1 / AU },
    description: 'The star at the centre of the Solar System. It holds 99.86% of the system\'s mass and fuses hydrogen into helium in its core.',
    facts: [['Mean radius', '695,700 km'], ['Surface temp.', '≈ 5,772 K'], ['Age', '≈ 4.6 billion years']],
    more: 'Light leaving the Sun\'s surface takes about 8 minutes 20 seconds to reach Earth. The glare seen here is dimmed by the deck\'s adaptive glass.',
  },
  earth: {
    name: 'EARTH', type: 'Terrestrial planet', range: km('earth', 6371),
    description: 'An ocean world: about 71% of its surface is water. The thin blue line on the horizon is the whole of its breathable atmosphere.',
    facts: [['Mean radius', '6,371 km'], ['Distance from Sun', '1 AU (149.6 million km)'], ['Rotation', '23 h 56 min'], ['Moons', '1']],
    more: 'On the night side, the faint gold webs are city lights. Cloud systems are driven by a rotation fast enough to wind them into spirals.',
  },
  moon: {
    name: 'THE MOON', type: 'Natural satellite of Earth', range: km('moon', 1737.4),
    description: 'Earth\'s only natural satellite. Dark basalt plains (maria) and bright cratered highlands record four billion years of impacts.',
    facts: [['Mean radius', '1,737 km'], ['Distance from Earth', '≈ 384,400 km'], ['Orbital period', '27.3 days']],
    more: 'The Moon is tidally locked: the same face always turns towards Earth. Its orbit is drawn much closer here than in reality.',
  },
  mars: {
    name: 'MARS', type: 'Terrestrial planet', range: km('mars', 3389.5),
    description: 'A cold desert world coloured by iron oxide dust. Its carbon-dioxide atmosphere is less than 1% as dense as Earth\'s at the surface.',
    facts: [['Mean radius', '3,390 km'], ['Distance from Sun', '1.52 AU'], ['Rotation', '24 h 37 min'], ['Moons', '2 (Phobos, Deimos)']],
    more: 'Olympus Mons, roughly 22 km high, is the tallest known volcano in the Solar System; Valles Marineris runs about 4,000 km along the equator. Terrain here is generated, not mapped.',
  },
  belt: {
    name: 'ASTEROID BELT', type: 'Circumstellar debris field', range: { unit: 'km', perUnit: 10.6 },
    description: 'Rocky and metallic remnants of planet formation orbiting between Mars and Jupiter. The largest member, Ceres, is about 940 km across.',
    facts: [['Location', '≈ 2.1 – 3.3 AU'], ['Largest body', 'Ceres (dwarf planet)']],
    more: 'Artistic licence: the real belt is almost entirely empty space, with asteroids typically hundreds of thousands of kilometres apart. It is shown far denser here.',
  },
  jupiter: {
    name: 'JUPITER', type: 'Gas giant', range: km('jupiter', 69911),
    description: 'The largest planet: more than twice the mass of all the other planets combined. Its stripes are jet streams of ammonia cloud.',
    facts: [['Mean radius', '69,911 km'], ['Distance from Sun', '5.2 AU'], ['Rotation', '≈ 9 h 56 min'], ['Known moons', '95 (as of 2023)']],
    more: 'The Great Red Spot is an anticyclonic storm wider than Earth that has been observed continuously since the 19th century.',
  },
  io: {
    name: 'IO', type: 'Galilean moon of Jupiter', range: km('io', 1821.6),
    description: 'The most volcanically active body known. Tidal flexing by Jupiter powers hundreds of volcanoes that repaint its sulphur surface.',
    facts: [['Mean radius', '1,822 km'], ['Orbital period', '1.77 days']],
  },
  europa: {
    name: 'EUROPA', type: 'Galilean moon of Jupiter', range: km('europa', 1560.8),
    description: 'A shell of water ice scored by long reddish fractures. Strong evidence points to a global salt-water ocean beneath the crust.',
    facts: [['Mean radius', '1,561 km'], ['Orbital period', '3.55 days']],
  },
  ganymede: {
    name: 'GANYMEDE', type: 'Galilean moon of Jupiter', range: km('ganymede', 2634.1),
    description: 'The largest moon in the Solar System, bigger than the planet Mercury, and the only moon known to generate its own magnetic field.',
    facts: [['Mean radius', '2,634 km'], ['Orbital period', '7.15 days']],
  },
  callisto: {
    name: 'CALLISTO', type: 'Galilean moon of Jupiter', range: km('callisto', 2410.3),
    description: 'An ancient, dark surface saturated with impact craters, among the most heavily cratered in the Solar System.',
    facts: [['Mean radius', '2,410 km'], ['Orbital period', '16.7 days']],
  },
  saturn: {
    name: 'SATURN', type: 'Gas giant', range: km('saturn', 58232),
    description: 'A hydrogen-helium giant less dense than water, circled by rings of water ice ranging from dust grains to house-sized blocks.',
    facts: [['Mean radius', '58,232 km'], ['Distance from Sun', '9.5 AU'], ['Rotation', '≈ 10 h 33 min'], ['Main rings span', '≈ 270,000 km']],
    more: 'The main rings are enormous yet typically only about 10 metres thick. The dark gap is the Cassini Division. A persistent hexagonal jet stream circles the north pole.',
  },
  titan: {
    name: 'TITAN', type: 'Moon of Saturn', range: km('titan', 2574.7),
    description: 'The only moon with a dense atmosphere: a nitrogen haze thicker than Earth\'s air, above lakes and seas of liquid methane and ethane.',
    facts: [['Mean radius', '2,575 km'], ['Orbital period', '15.9 days']],
  },
  azure: {
    name: 'AZURE VEIL', type: 'Emission & reflection nebula', fictional: true, range: { unit: 'ly', perUnit: 14 / RADII.azure },
    description: 'An imagined stellar nursery. Blue light is starlight scattered by dust; the glowing knots are gas ionised by newborn stars within.',
    facts: [['Classification', 'Imaginary object'], ['Simulated span', '≈ 28 light-years']],
    more: 'Real analogues: reflection nebulae such as the Pleiades nebulosity are blue because fine dust scatters short wavelengths most efficiently.',
  },
  violet: {
    name: 'VIOLET SHROUD', type: 'Emission nebula', fictional: true, range: { unit: 'ly', perUnit: 10 / RADII.violet },
    description: 'An imagined companion cloud to the Azure Veil where red hydrogen emission and blue scattered light blend into violet.',
    facts: [['Classification', 'Imaginary object'], ['Simulated span', '≈ 20 light-years']],
  },
  crimson: {
    name: 'CRIMSON EXPANSE', type: 'H II emission nebula', fictional: true, range: { unit: 'ly', perUnit: 40 / RADII.crimson },
    description: 'An imagined cloud of ionised hydrogen. In real H II regions this deep red comes from the hydrogen-alpha line at 656 nm.',
    facts: [['Classification', 'Imaginary object'], ['Simulated span', '≈ 80 light-years']],
  },
  aurum: {
    name: 'AURUM CLOUD', type: 'Dusty reflection nebula', fictional: true, range: { unit: 'ly', perUnit: 25 / RADII.aurum },
    description: 'An imagined golden nebula: thick dust lit from within by cool, old stars, with dark lanes silhouetted against the glow.',
    facts: [['Classification', 'Imaginary object'], ['Simulated span', '≈ 50 light-years']],
  },
  cluster: {
    name: 'GLOBULAR CLUSTER GC-7', type: 'Globular star cluster', fictional: true, range: { unit: 'ly', perUnit: 60 / RADII.cluster },
    description: 'An imagined cluster. Real globular clusters pack hundreds of thousands of very old stars into a sphere roughly a hundred light-years wide.',
    facts: [['Classification', 'Imaginary object'], ['Typical age (real clusters)', '10 – 13 billion years']],
  },
  galaxy: {
    name: 'HELIX CROWN', type: 'Barred spiral galaxy', fictional: true, range: { unit: 'ly', perUnit: 55000 / RADII.galaxy },
    description: 'An imagined grand-design spiral. Like the Milky Way, real spirals of this kind span about 100,000 light-years and hold hundreds of billions of stars.',
    facts: [['Classification', 'Imaginary object'], ['Simulated diameter', '≈ 110,000 light-years'], ['Structure', 'Bar, 2 major arms, dust lanes']],
    more: 'Blue arms trace young, hot stars; the golden bulge is old stars; pink knots are star-forming hydrogen clouds; dark lanes are dust in silhouette. Each point drawn stands for millions of stars.',
  },
  elliptical: {
    name: 'ELLIPTICAL E3-A', type: 'Elliptical galaxy', fictional: true, range: { unit: 'ly', perUnit: 30000 / RADII.elliptical },
    description: 'An imagined elliptical: a smooth swarm of old, yellow stars with almost no gas left to form new ones.',
    facts: [['Classification', 'Imaginary object']],
  },
  irregular: {
    name: 'IRREGULAR IR-9', type: 'Irregular galaxy', fictional: true, range: { unit: 'ly', perUnit: 9000 / RADII.irregular },
    description: 'An imagined irregular dwarf galaxy with no bulge or arms, alive with blue clusters and pink star-forming regions.',
    facts: [['Classification', 'Imaginary object']],
  },
  exo: {
    name: 'VESPERA', type: 'Ocean exoplanet', fictional: true, range: km('exo', 8200),
    description: 'An imagined world of violet seas and obsidian continents. Mineral veins and shallow waters glow after dark, and its mountains dwarf any on Earth.',
    facts: [['Classification', 'Imaginary world'], ['Simulated radius', '8,200 km'], ['Host', 'Binary star (blue-white + orange)'], ['Moons', '2']],
    more: 'Everything about Vespera is invented for this voyage: no such planet has been observed.',
  },
  exoMoonA: {
    name: 'VESPERA I · "GLASS"', type: 'Icy moon', fictional: true, range: km('exoMoonA', 1350),
    description: 'An imagined ice moon threaded with turquoise fractures.',
    facts: [['Classification', 'Imaginary object']],
  },
  exoMoonB: {
    name: 'VESPERA II · "EMBER"', type: 'Rocky moon', fictional: true, range: km('exoMoonB', 860),
    description: 'An imagined small, rust-coloured, heavily cratered moon.',
    facts: [['Classification', 'Imaginary object']],
  },
  exoStarA: {
    name: 'VESPER A', type: 'Blue-white primary star', fictional: true, range: { unit: 'AU', perUnit: 1 / AU },
    description: 'The imagined primary of a close binary. Real binary systems are common: roughly half of Sun-like stars have a companion.',
    facts: [['Classification', 'Imaginary object']],
  },
  exoStarB: {
    name: 'VESPER B', type: 'Orange companion star', fictional: true, range: { unit: 'AU', perUnit: 1 / AU },
    description: 'The imagined cooler companion, orbiting its brighter partner.',
    facts: [['Classification', 'Imaginary object']],
  },
};

export function formatRange(units, range) {
  const v = units * range.perUnit;
  if (range.unit === 'km') {
    if (v >= 1e9) return `${(v / 1e9).toFixed(2)} billion km`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)} million km`;
    return `${Math.round(v).toLocaleString('en-US')} km`;
  }
  if (range.unit === 'AU') return `${v.toFixed(2)} AU`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)} million ly`;
  if (v >= 1000) return `${Math.round(v).toLocaleString('en-US')} ly`;
  return `${v.toFixed(1)} ly`;
}

// Point-of-interest data shown in the holographic target card.
// Real bodies use figures from NASA planetary fact sheets (mean radius, mean orbital distance, sidereal rotation).
// Anything invented for this experience is flagged `fictional: true` and labelled as such in the UI.
// `range`: how scene units are converted for the *simulated* range read-out.
import { RADII, AU } from './world.js';

const km = (id, realRadiusKm) => ({ unit: 'km', perUnit: realRadiusKm / RADII[id] });

export const CELESTIAL = {
  sun: {
    name: 'THE SUN', type: 'G2V main-sequence star', range: km('sun', 695700),
    description: 'The star at the centre of the Solar System. It holds 99.86% of the system\'s mass and fuses hydrogen into helium in its core.',
    facts: [['Diameter', '1,391,400 km'], ['Surface temperature', '≈ 5,772 K'], ['Rotation period', '≈ 25 days (equator)'], ['Age', '≈ 4.6 billion years']],
    more: 'Light leaving the Sun\'s surface takes about 8 minutes 20 seconds to reach Earth. The granulation, sunspots and corona shown here are generated, and the glare is dimmed by the deck\'s adaptive glass.',
  },
  mercury: {
    name: 'MERCURY', type: 'Terrestrial planet', range: km('mercury', 2439.7),
    description: 'The smallest planet and the closest to the Sun. With almost no atmosphere to hold heat, its surface swings from about 430 °C by day to −180 °C at night.',
    facts: [['Distance from Sun', '0.39 AU (57.9 million km)'], ['Diameter', '4,879 km'], ['Orbital period', '88 days'], ['Rotation period', '58.6 days'], ['Moons', '0']],
    more: 'Mercury turns exactly three times for every two orbits. Its surface is saturated with impact craters, among them the 1,550 km wide Caloris basin. Terrain here is generated, not mapped.',
  },
  venus: {
    name: 'VENUS', type: 'Terrestrial planet', range: km('venus', 6051.8),
    description: 'Almost Earth\'s twin in size, but hidden under a dense carbon-dioxide atmosphere and clouds of sulphuric acid. The surface is the hottest of any planet, about 465 °C.',
    facts: [['Distance from Sun', '0.72 AU (108.2 million km)'], ['Diameter', '12,104 km'], ['Orbital period', '224.7 days'], ['Rotation period', '243 days (retrograde)'], ['Moons', '0']],
    more: 'Venus turns backwards, and so slowly that its day is longer than its year, while the upper clouds race round the planet in about four days. Only the cloud tops are visible from space, so no surface is drawn here.',
  },
  earth: {
    name: 'EARTH', type: 'Terrestrial planet', range: km('earth', 6371),
    description: 'An ocean world: about 71% of its surface is water. The thin blue line on the horizon is the whole of its breathable atmosphere.',
    facts: [['Distance from Sun', '1.00 AU (149.6 million km)'], ['Diameter', '12,742 km'], ['Orbital period', '365.25 days'], ['Rotation period', '23 h 56 min'], ['Moons', '1']],
    more: 'On the night side, the faint gold webs are city lights. Cloud systems are driven by a rotation fast enough to wind them into spirals. Continents here are generated, not Earth\'s real map.',
  },
  moon: {
    name: 'THE MOON', type: 'Natural satellite of Earth', range: km('moon', 1737.4),
    description: 'Earth\'s only natural satellite. Dark basalt plains (maria) and bright cratered highlands record four billion years of impacts.',
    facts: [['Diameter', '3,475 km'], ['Distance from Earth', '≈ 384,400 km'], ['Orbital period', '27.3 days']],
    more: 'The Moon is tidally locked: the same face always turns towards Earth. Its orbit is drawn much closer here than in reality.',
  },
  mars: {
    name: 'MARS', type: 'Terrestrial planet', range: km('mars', 3389.5),
    description: 'A cold desert world coloured by iron oxide dust. Its carbon-dioxide atmosphere is less than 1% as dense as Earth\'s at the surface.',
    facts: [['Distance from Sun', '1.52 AU (227.9 million km)'], ['Diameter', '6,779 km'], ['Orbital period', '687 days'], ['Rotation period', '24 h 37 min'], ['Moons', '2 (Phobos, Deimos)']],
    more: 'Olympus Mons, roughly 22 km high, is the tallest known volcano in the Solar System; Valles Marineris runs about 4,000 km along the equator. Terrain here is generated, not mapped.',
  },
  phobos: {
    name: 'PHOBOS', type: 'Moon of Mars', range: km('phobos', 11.1),
    description: 'The larger and inner moon of Mars: a dark, grooved, potato-shaped body that circles the planet in under eight hours.',
    facts: [['Mean diameter', '≈ 22 km'], ['Orbital period', '7 h 39 min']],
    more: 'Drawn here as a sphere and far larger than true scale so that it can be seen at all.',
  },
  deimos: {
    name: 'DEIMOS', type: 'Moon of Mars', range: km('deimos', 6.2),
    description: 'The smaller, outer moon of Mars, with a smoother surface blanketed in loose dust.',
    facts: [['Mean diameter', '≈ 12 km'], ['Orbital period', '30.3 hours']],
    more: 'Drawn here as a sphere and far larger than true scale so that it can be seen at all.',
  },
  belt: {
    name: 'ASTEROID BELT', type: 'Circumstellar debris field', range: { unit: 'km', perUnit: 10.6 },
    description: 'Rocky and metallic remnants of planet formation orbiting between Mars and Jupiter. The largest member, Ceres, is about 940 km across.',
    facts: [['Distance from Sun', '≈ 2.1 – 3.3 AU'], ['Largest body', 'Ceres (dwarf planet)'], ['Orbital period', '≈ 3 – 6 years']],
    more: 'Artistic licence: the real belt is almost entirely empty space, with asteroids typically hundreds of thousands of kilometres apart. It is shown far denser here.',
  },
  jupiter: {
    name: 'JUPITER', type: 'Gas giant', range: km('jupiter', 69911),
    description: 'The largest planet: more than twice the mass of all the other planets combined. Its stripes are jet streams of ammonia cloud.',
    facts: [['Distance from Sun', '5.20 AU (778.6 million km)'], ['Diameter', '139,820 km'], ['Orbital period', '11.86 years'], ['Rotation period', '≈ 9 h 56 min'], ['Known moons', '95 (as of 2023)']],
    more: 'The Great Red Spot is an anticyclonic storm wider than Earth that has been observed continuously since the 19th century.',
  },
  io: {
    name: 'IO', type: 'Galilean moon of Jupiter', range: km('io', 1821.6),
    description: 'The most volcanically active body known. Tidal flexing by Jupiter powers hundreds of volcanoes that repaint its sulphur surface.',
    facts: [['Diameter', '3,643 km'], ['Orbital period', '1.77 days']],
  },
  europa: {
    name: 'EUROPA', type: 'Galilean moon of Jupiter', range: km('europa', 1560.8),
    description: 'A shell of water ice scored by long reddish fractures. Strong evidence points to a global salt-water ocean beneath the crust.',
    facts: [['Diameter', '3,122 km'], ['Orbital period', '3.55 days']],
  },
  ganymede: {
    name: 'GANYMEDE', type: 'Galilean moon of Jupiter', range: km('ganymede', 2634.1),
    description: 'The largest moon in the Solar System, bigger than the planet Mercury, and the only moon known to generate its own magnetic field.',
    facts: [['Diameter', '5,268 km'], ['Orbital period', '7.15 days']],
  },
  callisto: {
    name: 'CALLISTO', type: 'Galilean moon of Jupiter', range: km('callisto', 2410.3),
    description: 'An ancient, dark surface saturated with impact craters, among the most heavily cratered in the Solar System.',
    facts: [['Diameter', '4,821 km'], ['Orbital period', '16.7 days']],
  },
  saturn: {
    name: 'SATURN', type: 'Gas giant', range: km('saturn', 58232),
    description: 'A hydrogen-helium giant less dense than water, circled by rings of water ice ranging from dust grains to house-sized blocks.',
    facts: [['Distance from Sun', '9.58 AU (1,433 million km)'], ['Diameter', '116,460 km'], ['Orbital period', '29.46 years'], ['Rotation period', '≈ 10 h 33 min'], ['Main rings span', '≈ 270,000 km']],
    more: 'The main rings are enormous yet typically only about 10 metres thick. The dark gap is the Cassini Division. A persistent hexagonal jet stream circles the north pole. Saturn has more known moons than any other planet.',
  },
  titan: {
    name: 'TITAN', type: 'Moon of Saturn', range: km('titan', 2574.7),
    description: 'The only moon with a dense atmosphere: a nitrogen haze thicker than Earth\'s air, above lakes and seas of liquid methane and ethane.',
    facts: [['Diameter', '5,150 km'], ['Orbital period', '15.9 days']],
  },
  uranus: {
    name: 'URANUS', type: 'Ice giant', range: km('uranus', 25362),
    description: 'An ice giant tipped almost onto its side: its axis is tilted about 98°, so it rolls round the Sun with each pole facing sunlight for decades. Methane in the atmosphere gives it its cyan colour.',
    facts: [['Distance from Sun', '19.2 AU (2,870 million km)'], ['Diameter', '50,724 km'], ['Orbital period', '84 years'], ['Rotation period', '17 h 14 min (retrograde)'], ['Known rings', '13']],
    more: 'The rings of Uranus are narrow and dark, made of material that reflects only a few per cent of the light that reaches it. They are drawn brighter here so that they can be seen.',
  },
  neptune: {
    name: 'NEPTUNE', type: 'Ice giant', range: km('neptune', 24622),
    description: 'The most distant planet, and the windiest: its clouds are driven at more than 2,000 km/h. Sunlight here is about 900 times weaker than at Earth.',
    facts: [['Distance from Sun', '30.1 AU (4,495 million km)'], ['Diameter', '49,244 km'], ['Orbital period', '164.8 years'], ['Rotation period', '16 h 6 min'], ['Largest moon', 'Triton']],
    more: 'Voyager 2 photographed a Great Dark Spot in 1989; it had vanished by 1994, and other dark storms have come and gone since. The storm drawn here is illustrative.',
  },
  triton: {
    name: 'TRITON', type: 'Moon of Neptune', range: km('triton', 1353.4),
    description: 'Neptune\'s largest moon orbits backwards, a sign that it was captured rather than formed in place. Its nitrogen-ice surface is one of the coldest known, about −235 °C.',
    facts: [['Diameter', '2,707 km'], ['Orbital period', '5.88 days (retrograde)']],
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

import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { useT } from '../../i18n/index.js';
import { PLANETS, BELT } from '../../config/solar.js';
import { DESTINATIONS } from '../../config/destinations.js';
import { DestinationBrief } from './NavigationPanel.jsx';
import { IconClose } from '../HUD/icons.jsx';

// Schematic: orbits are evenly spaced so all eight fit on one screen. Angles are live.
const SLOTS = [...PLANETS.slice(0, 4), BELT, ...PLANETS.slice(4)];
const R0 = 46, STEP = 33;
const slotR = (i) => R0 + i * STEP;
const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;

/** Heliocentric distance (scene units) → radius on the schematic, interpolating between orbit slots. */
function mapRadius(r) {
  if (r <= SLOTS[0].orbit) return (r / SLOTS[0].orbit) * slotR(0);
  for (let i = 1; i < SLOTS.length; i++) {
    if (r <= SLOTS[i].orbit) return slotR(i - 1) + ((r - SLOTS[i - 1].orbit) / (SLOTS[i].orbit - SLOTS[i - 1].orbit)) * STEP;
  }
  return Math.min(slotR(SLOTS.length - 1) + 26, slotR(SLOTS.length - 1) + ((r - SLOTS[SLOTS.length - 1].orbit) / 200000) * 26);
}

/** Holographic overview of the Solar System: live positions, the ship, and course selection. */
export default function SystemMap() {
  const actions = useActions();
  const t = useT();
  const open = useStore((s) => s.panel === 'map');
  const map = useStore((s) => s.map);
  const selected = useStore((s) => s.navSelected);
  const sectorId = useStore((s) => s.sectorId);
  const travel = useStore((s) => s.travel);
  if (!open) return null;
  const angles = map ? map.angles : Object.fromEntries(SLOTS.map((p) => [p.id, p.phase]));
  const sel = DESTINATIONS.find((d) => d.id === selected && d.group === 'solar');
  const C = 340;
  const pt = (r, a) => [C + r * Math.cos(a), C - r * Math.sin(a)];
  const ship = map ? map.ship : null;
  const inSystem = ship && ship.r < 700000 && Math.abs(ship.y) < 120000;
  const shipPt = ship ? pt(mapRadius(ship.r), ship.angle) : null;
  const close = () => actions.togglePanel('map');
  return (
    <div className="modal map" role="dialog" aria-modal="true" aria-label={t('Solar System map')} onClick={close}>
      <div className="panel map__box" onClick={(e) => e.stopPropagation()}>
        <div className="panel__head">
          <h2>{t('SOLAR SYSTEM MAP')}</h2>
          <button className="icon-btn" onClick={close} aria-label={t('Close')}><IconClose /></button>
        </div>
        <div className="map__body">
          <svg viewBox="0 0 680 680" className="map__svg" role="img" aria-label={t('Solar System map')}>
            <defs>
              <radialGradient id="mapSun"><stop offset="0" stopColor="#fff6dc" /><stop offset="0.5" stopColor="#ffc46a" /><stop offset="1" stopColor="#ffc46a" stopOpacity="0" /></radialGradient>
            </defs>
            {[0, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={C} y1={C} x2={C + 330 * Math.cos((i * Math.PI) / 3)} y2={C + 330 * Math.sin((i * Math.PI) / 3)} className="map__grid" />)}
            {SLOTS.map((p, i) => (p.id === 'belt'
              ? <circle key={p.id} cx={C} cy={C} r={slotR(i)} className="map__belt" />
              : <circle key={p.id} cx={C} cy={C} r={slotR(i)} className={`map__orbit${selected === p.id ? ' is-selected' : ''}`} />))}
            <g className="map__node" onClick={() => actions.selectDestination('sun')} tabIndex={0} role="button" aria-label={t('THE SUN')} onKeyDown={(e) => e.key === 'Enter' && actions.selectDestination('sun')}>
              <circle cx={C} cy={C} r={26} fill="url(#mapSun)" />
              <circle cx={C} cy={C} r={9} fill="#fff3d0" />
              {selected === 'sun' && <circle cx={C} cy={C} r={18} className="map__ring" />}
            </g>
            {SLOTS.map((p, i) => {
              const [x, y] = pt(slotR(i), angles[p.id] ?? p.phase);
              const isBelt = p.id === 'belt';
              const size = isBelt ? 3 : 3 + Math.sqrt(p.radius) * 0.13;
              const name = DESTINATIONS.find((d) => d.id === p.id).name;
              return (
                <g key={p.id} className="map__node" onClick={() => actions.selectDestination(p.id)} tabIndex={0} role="button" aria-label={t(name)} onKeyDown={(e) => e.key === 'Enter' && actions.selectDestination(p.id)}>
                  <circle cx={x} cy={y} r={16} fill="transparent" />
                  {isBelt ? <rect x={x - 3} y={y - 3} width={6} height={6} transform={`rotate(45 ${x} ${y})`} fill="#b9ad9f" /> : <circle cx={x} cy={y} r={size} fill={hex(p.color)} />}
                  {p.id === 'saturn' && <ellipse cx={x} cy={y} rx={size * 1.9} ry={size * 0.6} fill="none" stroke={hex(p.color)} strokeWidth="1" transform={`rotate(-20 ${x} ${y})`} />}
                  {selected === p.id && <circle cx={x} cy={y} r={size + 6} className="map__ring" />}
                  {sectorId === p.id && <circle cx={x} cy={y} r={size + 10} className="map__here" />}
                  <text x={x + size + 9} y={y + 3.5} className="map__label">{t(name)}</text>
                </g>
              );
            })}
            {shipPt && inSystem && (
              <g className="map__ship" transform={`translate(${shipPt[0]} ${shipPt[1]})`}>
                <path d="M0 -7 L5 6 L0 3 L-5 6 Z" />
                <text x={9} y={-8} className="map__label map__label--ship">ODYSSEY-01</text>
              </g>
            )}
            {travel && sel && shipPt && inSystem && (() => {
              const i = SLOTS.findIndex((p) => p.id === sel.id);
              if (i < 0) return null;
              const [x, y] = pt(slotR(i), angles[sel.id]);
              return <line x1={shipPt[0]} y1={shipPt[1]} x2={x} y2={y} className="map__course" />;
            })()}
          </svg>
          <div className="map__side">
            {sel
              ? <DestinationBrief dest={sel} disabled={!!travel} here={sel.id === sectorId} onEngage={() => { actions.togglePanel('map'); actions.engage(sel.id); }} />
              : <p className="fine">{t('Select a world on the map to plot a course.')}</p>}
            {ship && !inSystem && <p className="fine map__out">{t('ODYSSEY-01 is outside the planetary system.')}</p>}
            <p className="fine map__note">{t('Schematic. Positions along each orbit are live; orbit spacing and sizes are not to scale.')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

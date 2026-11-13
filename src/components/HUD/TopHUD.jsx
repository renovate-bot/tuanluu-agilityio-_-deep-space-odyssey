import { useStore } from '../../store/store.js';
import { useT } from '../../i18n/index.js';

// How good the link home is, by where the ship currently sits.
const SIGNAL = { earth: 'STRONG', mars: 'STRONG', jupiter: 'NOMINAL', saturn: 'NOMINAL', nebula: 'ATTENUATED', start: 'ATTENUATED', exo: 'FAINT', deep: 'NO CARRIER', galaxy: 'NO CARRIER' };

export default function TopHUD() {
  const t = useT();
  const sectorName = useStore((s) => s.sectorName);
  const sectorId = useStore((s) => s.sectorId);
  const engine = useStore((s) => s.engineStatus);
  const travel = useStore((s) => s.travel);
  const event = useStore((s) => s.event);
  const signal = travel ? 'DOPPLER SHIFT' : SIGNAL[sectorId] || SIGNAL[String(sectorId).replace('observe:', '')] || 'NOMINAL';
  const mode = travel ? 'TRANSIT' : event || 'EXPLORATION MODE';
  return (
    <header className="hud-top">
      <div className="hud-top__id">
        <strong>ODYSSEY-01</strong>
        <span className="hud-top__mode">{t(mode)}</span>
      </div>
      <dl className="hud-top__data">
        <div><dt>{t('SECTOR')}</dt><dd>{t(sectorName)}</dd></div>
        <div><dt>{t('ENGINE')}</dt><dd className={engine === 'WARP' || engine === 'CHARGING' ? 'is-hot' : ''}>{t(engine)}</dd></div>
        <div className="hud-top__signal"><dt>{t('SIGNAL')}</dt><dd>{t(signal)}</dd></div>
      </dl>
    </header>
  );
}

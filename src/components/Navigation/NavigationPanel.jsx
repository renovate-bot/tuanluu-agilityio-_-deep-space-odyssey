import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { useT } from '../../i18n/index.js';
import { DESTINATIONS } from '../../config/destinations.js';
import { IconClose, IconChevron } from '../HUD/icons.jsx';

export default function NavigationPanel() {
  const actions = useActions();
  const t = useT();
  const open = useStore((s) => s.navOpen);
  const selected = useStore((s) => s.navSelected);
  const sectorId = useStore((s) => s.sectorId);
  const travel = useStore((s) => s.travel);
  if (!open) return null;
  const sel = DESTINATIONS.find((d) => d.id === selected);
  return (
    <aside className="panel nav" aria-label={t('Navigation')}>
      <div className="panel__head">
        <h2>{t('NAVIGATION')}</h2>
        <button className="icon-btn" onClick={actions.toggleNav} aria-label={t('Collapse navigation')}><IconClose /></button>
      </div>
      <ul className="nav__list">
        {DESTINATIONS.map((d, i) => {
          const current = d.id === sectorId;
          return (
            <li key={d.id}>
              <button
                className={`nav__item${selected === d.id ? ' is-selected' : ''}${current ? ' is-current' : ''}`}
                onClick={() => actions.selectDestination(d.id)} onMouseEnter={actions.uiHover} aria-pressed={selected === d.id}
              >
                <span className="nav__idx">{String(i + 1).padStart(2, '0')}</span>
                <span className="nav__name">{t(d.name)}<small>{t(d.sector)}</small></span>
                {current ? <em>{t('HERE')}</em> : <IconChevron />}
              </button>
            </li>
          );
        })}
      </ul>
      {sel && (
        <div className="nav__brief">
          <h3>{t(sel.name)}{sel.fictional && <span className="tag">{t('FICTIONAL')}</span>}</h3>
          <p>{t(sel.blurb)}</p>
          <button className="btn btn--primary" disabled={!!travel || sel.id === sectorId} onClick={() => actions.engage(sel.id)}>
            {t(sel.id === sectorId ? 'HOLDING POSITION' : 'ENGAGE WARP DRIVE')}
          </button>
        </div>
      )}
      {!sel && <p className="fine nav__hint">{t('Select a destination to see the flight brief.')}</p>}
    </aside>
  );
}

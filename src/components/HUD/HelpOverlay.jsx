import { useEffect, useState } from 'react';
import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { useT } from '../../i18n/index.js';
import { IconClose } from './icons.jsx';

const ROWS = [
  ['Drag', 'Look around the deck'],
  ['W A S D / arrows', 'Look with the keyboard'],
  ['Scroll / pinch / + −', 'Zoom the view'],
  ['Click a world', 'Scan it, then choose a distance or a flyby'],
  ['N', 'Navigation panel'],
  ['O', 'Solar System map'],
  ['R', 'Reset view'],
  ['M', 'Mute / unmute'],
  ['Space', 'Skip the current sequence'],
  ['H', 'This help'],
];

export default function HelpOverlay() {
  const actions = useActions();
  const t = useT();
  const open = useStore((s) => s.panel === 'help');
  const [hint, setHint] = useState(true);

  // a short hint on first arrival; it leaves by itself
  useEffect(() => {
    const t = setTimeout(() => setHint(false), 14000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {hint && !open && (
        <div className="hint" role="note">
          <span>{t('DRAG to look')}</span><span>{t('SCROLL to zoom')}</span><span>{t('CLICK a world to scan')}</span>
          <button className="icon-btn" onClick={() => setHint(false)} aria-label={t('Dismiss hint')}><IconClose /></button>
        </div>
      )}
      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label={t('Controls')} onClick={() => actions.togglePanel('help')}>
          <div className="panel modal__box" onClick={(e) => e.stopPropagation()}>
            <div className="panel__head"><h2>{t('CONTROLS')}</h2><button className="icon-btn" onClick={() => actions.togglePanel('help')} aria-label={t('Close')}><IconClose /></button></div>
            <dl className="keys">{ROWS.map(([k, v]) => (<div key={k}><dt>{t(k)}</dt><dd>{t(v)}</dd></div>))}</dl>
            <p className="fine">{t('Scale and distances are artistic, not physical. Objects marked FICTIONAL are invented for this voyage. All sound is in-cabin sound design; space itself is silent.')}</p>
          </div>
        </div>
      )}
    </>
  );
}

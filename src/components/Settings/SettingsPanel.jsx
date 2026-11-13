import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { useT } from '../../i18n/index.js';
import LanguageSwitch from './LanguageSwitch.jsx';

const QUALITIES = ['auto', 'high', 'medium', 'low'];

export default function SettingsPanel() {
  const actions = useActions();
  const t = useT();
  const quality = useStore((s) => s.quality);
  const reduced = useStore((s) => s.reducedMotion);
  const showStats = useStore((s) => s.showStats);
  const needsReload = useStore((s) => s.qualityNeedsReload);
  return (
    <div className="panel popover" role="dialog" aria-label={t('Settings')}>
      <div className="panel__head"><h2>{t('SETTINGS')}</h2></div>
      <fieldset className="seg seg--two">
        <legend>{t('LANGUAGE')}</legend>
        <LanguageSwitch full />
      </fieldset>
      <fieldset className="seg">
        <legend>{t('RENDER QUALITY')}</legend>
        <div>
          {QUALITIES.map((q) => (
            <button key={q} className={quality === q ? 'is-on' : ''} aria-pressed={quality === q} onClick={() => actions.setQuality(q)}>{t(q.toUpperCase())}</button>
          ))}
        </div>
      </fieldset>
      <p className="fine">{t('AUTO adapts resolution to your measured frame rate. Resolution and bloom change immediately')}{needsReload ? t('; star counts and texture sizes change after a reload.') : '.'}</p>
      {needsReload && <button className="btn" onClick={() => location.reload()}>{t('RELOAD TO APPLY FULLY')}</button>}
      <label className="toggle">
        <input type="checkbox" checked={reduced} onChange={(e) => actions.setReducedMotion(e.target.checked)} />
        <span>{t('REDUCED MOTION')}<small>{t('Replaces warp streaks, shake and flashes with a fade')}</small></span>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={showStats} onChange={(e) => actions.setShowStats(e.target.checked)} />
        <span>{t('PERFORMANCE READ-OUT')}<small>{t('Frame rate, resolution scale, draw calls')}</small></span>
      </label>
      <button className="btn btn--ghost" onClick={() => actions.togglePanel('help')}>{t('SHOW CONTROLS')}</button>
    </div>
  );
}

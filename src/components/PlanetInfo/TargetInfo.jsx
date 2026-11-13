import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { useT, useLang, trTarget, trRange } from '../../i18n/index.js';
import { IconClose } from '../HUD/icons.jsx';

const MODES = { far: 'FAR ORBIT', close: 'CLOSE APPROACH', flyby: 'CINEMATIC FLYBY' };

/** Holographic card for the selected celestial body. */
export default function TargetInfo() {
  const actions = useActions();
  const t = useT();
  const lang = useLang();
  const target = trTarget(useStore((s) => s.target), lang);
  const range = useStore((s) => s.targetRange);
  const observing = useStore((s) => s.observing);
  const travel = useStore((s) => s.travel);
  const viewMode = useStore((s) => s.viewMode);
  const event = useStore((s) => s.event);
  if (!target) return null;
  return (
    <aside className="panel target" aria-label={`${t('Target')}: ${target.name}`} key={target.id}>
      <div className="panel__head">
        <h2>{target.name}</h2>
        <button className="icon-btn" onClick={actions.clearTarget} aria-label={t('Close target')}><IconClose /></button>
      </div>
      <p className="target__type">{target.type}{target.fictional && <span className="tag">{t('FICTIONAL')}</span>}</p>
      <dl className="target__facts">
        <div className="is-range"><dt>{t('SIMULATED RANGE')}</dt><dd>{trRange(range, lang) || '—'}</dd></div>
        {target.facts.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
      </dl>
      <p className="target__desc">{target.description}</p>
      {observing && target.more && <p className="target__more">{target.more}</p>}
      {target.modes ? (
        <>
          <div className="target__modes" role="group" aria-label={t('Observation distance')}>
            {target.modes.map((m) => (
              <button key={m} className={`btn${viewMode === m ? ' btn--primary' : ''}`} aria-pressed={viewMode === m} disabled={!!travel || (m === 'flyby' && event === 'CINEMATIC FLYBY')} onClick={() => actions.approach(m)}>{t(MODES[m])}</button>
            ))}
          </div>
          <div className="target__actions target__actions--one"><button className="btn btn--ghost" onClick={actions.focus} disabled={!!travel}>{t('FOCUS')}</button></div>
        </>
      ) : (
        <div className="target__actions">
          <button className="btn" onClick={actions.focus} disabled={!!travel}>{t('FOCUS')}</button>
          <button className="btn btn--primary" onClick={actions.observe} disabled={!!travel}>{t('OBSERVE')}</button>
        </div>
      )}
    </aside>
  );
}

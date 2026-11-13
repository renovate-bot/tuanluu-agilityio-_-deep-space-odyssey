import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { IconClose } from '../HUD/icons.jsx';

/** Holographic card for the selected celestial body. */
export default function TargetInfo() {
  const actions = useActions();
  const target = useStore((s) => s.target);
  const range = useStore((s) => s.targetRange);
  const observing = useStore((s) => s.observing);
  const travel = useStore((s) => s.travel);
  if (!target) return null;
  return (
    <aside className="panel target" aria-label={`Target: ${target.name}`} key={target.id}>
      <div className="panel__head">
        <h2>{target.name}</h2>
        <button className="icon-btn" onClick={actions.clearTarget} aria-label="Close target"><IconClose /></button>
      </div>
      <p className="target__type">{target.type}{target.fictional && <span className="tag">FICTIONAL</span>}</p>
      <dl className="target__facts">
        <div className="is-range"><dt>SIMULATED RANGE</dt><dd>{range || '—'}</dd></div>
        {target.facts.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
      </dl>
      <p className="target__desc">{target.description}</p>
      {observing && target.more && <p className="target__more">{target.more}</p>}
      <div className="target__actions">
        <button className="btn" onClick={actions.focus} disabled={!!travel}>FOCUS</button>
        <button className="btn btn--primary" onClick={actions.observe} disabled={!!travel}>OBSERVE</button>
      </div>
    </aside>
  );
}

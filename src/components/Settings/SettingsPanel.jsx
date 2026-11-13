import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';

const QUALITIES = ['auto', 'high', 'medium', 'low'];

export default function SettingsPanel() {
  const actions = useActions();
  const quality = useStore((s) => s.quality);
  const reduced = useStore((s) => s.reducedMotion);
  const showStats = useStore((s) => s.showStats);
  const needsReload = useStore((s) => s.qualityNeedsReload);
  return (
    <div className="panel popover" role="dialog" aria-label="Settings">
      <div className="panel__head"><h2>SETTINGS</h2></div>
      <fieldset className="seg">
        <legend>RENDER QUALITY</legend>
        <div>
          {QUALITIES.map((q) => (
            <button key={q} className={quality === q ? 'is-on' : ''} aria-pressed={quality === q} onClick={() => actions.setQuality(q)}>{q.toUpperCase()}</button>
          ))}
        </div>
      </fieldset>
      <p className="fine">AUTO adapts resolution to your measured frame rate. Resolution and bloom change immediately{needsReload ? '; star counts and texture sizes change after a reload.' : '.'}</p>
      {needsReload && <button className="btn" onClick={() => location.reload()}>RELOAD TO APPLY FULLY</button>}
      <label className="toggle">
        <input type="checkbox" checked={reduced} onChange={(e) => actions.setReducedMotion(e.target.checked)} />
        <span>REDUCED MOTION<small>Replaces warp streaks, shake and flashes with a fade</small></span>
      </label>
      <label className="toggle">
        <input type="checkbox" checked={showStats} onChange={(e) => actions.setShowStats(e.target.checked)} />
        <span>PERFORMANCE READ-OUT<small>Frame rate, resolution scale, draw calls</small></span>
      </label>
      <button className="btn btn--ghost" onClick={() => actions.togglePanel('help')}>SHOW CONTROLS</button>
    </div>
  );
}

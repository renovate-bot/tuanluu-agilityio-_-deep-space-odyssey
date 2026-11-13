import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { useT } from '../../i18n/index.js';

function Slider({ label, value, onChange }) {
  const t = useT();
  return (
    <label className="slider">
      <span>{label}</span>
      <input type="range" min="0" max="1" step="0.01" value={value} onChange={(e) => onChange(parseFloat(e.target.value))} aria-label={`${label} ${t('volume')}`} />
      <output>{Math.round(value * 100)}</output>
    </label>
  );
}

export default function AudioPanel() {
  const actions = useActions();
  const t = useT();
  const muted = useStore((s) => s.muted);
  const master = useStore((s) => s.volMaster);
  const music = useStore((s) => s.volMusic);
  const sfx = useStore((s) => s.volSfx);
  return (
    <div className="panel popover" role="dialog" aria-label={t('Audio')}>
      <div className="panel__head"><h2>{t('AUDIO')}</h2></div>
      <label className="toggle">
        <input type="checkbox" checked={!muted} onChange={(e) => actions.setMuted(!e.target.checked)} />
        <span>{t(muted ? 'SOUND OFF' : 'SOUND ON')}</span>
      </label>
      <Slider label={t('MASTER')} value={master} onChange={(v) => actions.setVolume('volMaster', v)} />
      <Slider label={t('MUSIC')} value={music} onChange={(v) => actions.setVolume('volMusic', v)} />
      <Slider label={t('SHIP & EFFECTS')} value={sfx} onChange={(v) => actions.setVolume('volSfx', v)} />
      <p className="fine">{t('Synthesised live in your browser. In-cabin sound design: space itself is silent.')}</p>
    </div>
  );
}

import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { useT } from '../../i18n/index.js';
import { IconView, IconWarp, IconNav, IconAudio, IconMuted, IconSettings, IconReset } from './icons.jsx';
import AudioPanel from '../AudioControls/AudioPanel.jsx';
import SettingsPanel from '../Settings/SettingsPanel.jsx';

const VIEWS = [['front', 'FORWARD'], ['left', 'PORT WINDOW'], ['right', 'STARBOARD WINDOW'], ['up', 'OVERHEAD'], ['console', 'CONSOLE']];

function Tool({ label, active, onClick, children, disabled }) {
  const actions = useActions();
  return (
    <button className={`tool${active ? ' is-active' : ''}`} onClick={onClick} onMouseEnter={actions.uiHover} aria-pressed={!!active} aria-label={label} title={label} disabled={disabled}>
      {children}
      <span>{label}</span>
    </button>
  );
}

export default function ControlBar() {
  const actions = useActions();
  const t = useT();
  const panel = useStore((s) => s.panel);
  const navOpen = useStore((s) => s.navOpen);
  const muted = useStore((s) => s.muted);
  const travel = useStore((s) => s.travel);
  const navSelected = useStore((s) => s.navSelected);
  const sectorId = useStore((s) => s.sectorId);
  const armed = navSelected && navSelected !== sectorId && !travel;
  return (
    <footer className="bar">
      {panel === 'view' && (
        <div className="panel popover popover--view" role="menu" aria-label={t('View presets')}>
          <div className="panel__head"><h2>{t('VIEW')}</h2></div>
          {VIEWS.map(([id, label]) => (<button key={id} className="menu-item" role="menuitem" onClick={() => actions.setView(id)}>{t(label)}</button>))}
        </div>
      )}
      {panel === 'audio' && <AudioPanel />}
      {panel === 'settings' && <SettingsPanel />}
      <nav className="bar__tools" aria-label={t('Ship controls')}>
        <Tool label={t('VIEW')} active={panel === 'view'} onClick={() => actions.togglePanel('view')} disabled={!!travel}><IconView /></Tool>
        <Tool label={t(armed ? 'ENGAGE' : 'WARP DRIVE')} active={armed} onClick={actions.warp} disabled={!!travel}><IconWarp /></Tool>
        <Tool label={t('NAVIGATION')} active={navOpen} onClick={actions.toggleNav} disabled={!!travel}><IconNav /></Tool>
        <Tool label={t('AUDIO')} active={panel === 'audio'} onClick={() => actions.togglePanel('audio')}>{muted ? <IconMuted /> : <IconAudio />}</Tool>
        <Tool label={t('SETTINGS')} active={panel === 'settings'} onClick={() => actions.togglePanel('settings')}><IconSettings /></Tool>
        <Tool label={t('RESET VIEW')} onClick={actions.resetView} disabled={!!travel}><IconReset /></Tool>
      </nav>
    </footer>
  );
}

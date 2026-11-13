import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
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
        <div className="panel popover popover--view" role="menu" aria-label="View presets">
          <div className="panel__head"><h2>VIEW</h2></div>
          {VIEWS.map(([id, label]) => (<button key={id} className="menu-item" role="menuitem" onClick={() => actions.setView(id)}>{label}</button>))}
        </div>
      )}
      {panel === 'audio' && <AudioPanel />}
      {panel === 'settings' && <SettingsPanel />}
      <nav className="bar__tools" aria-label="Ship controls">
        <Tool label="VIEW" active={panel === 'view'} onClick={() => actions.togglePanel('view')} disabled={!!travel}><IconView /></Tool>
        <Tool label={armed ? 'ENGAGE' : 'WARP DRIVE'} active={armed} onClick={actions.warp} disabled={!!travel}><IconWarp /></Tool>
        <Tool label="NAVIGATION" active={navOpen} onClick={actions.toggleNav} disabled={!!travel}><IconNav /></Tool>
        <Tool label="AUDIO" active={panel === 'audio'} onClick={() => actions.togglePanel('audio')}>{muted ? <IconMuted /> : <IconAudio />}</Tool>
        <Tool label="SETTINGS" active={panel === 'settings'} onClick={() => actions.togglePanel('settings')}><IconSettings /></Tool>
        <Tool label="RESET VIEW" onClick={actions.resetView} disabled={!!travel}><IconReset /></Tool>
      </nav>
    </footer>
  );
}

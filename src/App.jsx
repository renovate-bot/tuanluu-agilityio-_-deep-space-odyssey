import { useEffect, useRef } from 'react';
import { useStore } from './store/store.js';
import { useEngine, ActionsContext } from './hooks/useEngine.js';
import LoadingScreen from './components/Intro/LoadingScreen.jsx';
import IntroOverlay from './components/Intro/IntroOverlay.jsx';
import TopHUD from './components/HUD/TopHUD.jsx';
import ControlBar from './components/HUD/ControlBar.jsx';
import StatusLine from './components/HUD/StatusLine.jsx';
import HoverLabel from './components/HUD/HoverLabel.jsx';
import StatsReadout from './components/HUD/StatsReadout.jsx';
import NavigationPanel from './components/Navigation/NavigationPanel.jsx';
import TargetInfo from './components/PlanetInfo/TargetInfo.jsx';
import HelpOverlay from './components/HUD/HelpOverlay.jsx';
import SystemMap from './components/Navigation/SystemMap.jsx';
import { useT } from './i18n/index.js';

export default function App() {
  const canvasRef = useRef(null);
  const actions = useEngine(canvasRef);
  const phase = useStore((s) => s.phase);
  const error = useStore((s) => s.error);
  const t = useT();

  // global shortcuts
  useEffect(() => {
    if (!actions) return undefined;
    const onKey = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.code === 'Escape') actions.escape();
      else if (e.code === 'KeyR') actions.resetView();
      else if (e.code === 'KeyN') actions.toggleNav();
      else if (e.code === 'KeyM') actions.toggleMute();
      else if (e.code === 'KeyH') actions.togglePanel('help');
      else if (e.code === 'KeyO' && phase === 'explore') actions.togglePanel('map');
      else if (e.code === 'Space' && (phase === 'boarding' || phase === 'explore')) { e.preventDefault(); actions.skip(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, phase]);

  return (
    <ActionsContext.Provider value={actions}>
      <canvas ref={canvasRef} className="stage" aria-label={t('Interactive 3D view from the observation deck of the starship Odyssey-01')} />
      {error ? (
        <div className="fatal" role="alert">
          <h1>DEEP SPACE ODYSSEY</h1>
          <p>{t(error)}</p>
          <button className="btn" onClick={() => location.reload()}>{t('RELOAD')}</button>
        </div>
      ) : (
        <>
          {phase === 'loading' && <LoadingScreen />}
          {actions && phase === 'intro' && <IntroOverlay />}
          {actions && (phase === 'boarding' || phase === 'explore') && <StatusLine />}
          {actions && phase === 'explore' && (
            <>
              <TopHUD />
              <NavigationPanel />
              <TargetInfo />
              <ControlBar />
              <HoverLabel />
              <HelpOverlay />
              <SystemMap />
              <StatsReadout />
            </>
          )}
        </>
      )}
    </ActionsContext.Provider>
  );
}

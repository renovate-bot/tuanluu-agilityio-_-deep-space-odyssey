import { useActions } from '../../hooks/useEngine.js';

export default function IntroOverlay() {
  const actions = useActions();
  return (
    <div className="intro">
      <ul className="intro__status" aria-label="Ship status">
        <li>EXPLORATION SYSTEM ONLINE</li>
        <li>GALACTIC SECTOR: UNKNOWN</li>
        <li>MISSION: INTERSTELLAR EXPLORATION</li>
      </ul>
      <div className="intro__center">
        <h1 className="intro__title">DEEP SPACE ODYSSEY</h1>
        <p className="intro__tag">Beyond the stars. Beyond imagination.</p>
        <button className="intro__enter" onClick={actions.enter} autoFocus>
          <span>ENTER THE UNIVERSE</span>
        </button>
        <p className="intro__note">Sound begins when you enter · Best on a desktop with headphones</p>
      </div>
    </div>
  );
}

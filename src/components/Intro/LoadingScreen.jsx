import { useStore } from '../../store/store.js';

export default function LoadingScreen() {
  const progress = useStore((s) => s.loadProgress);
  const label = useStore((s) => s.loadLabel);
  const pct = Math.round(progress * 100);
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="loading__mark" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="56" height="56"><circle cx="32" cy="32" r="13" fill="none" stroke="currentColor" strokeWidth="1.2" /><ellipse cx="32" cy="32" rx="28" ry="8" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-22 32 32)" /></svg>
      </div>
      <div className="loading__title">DEEP SPACE ODYSSEY</div>
      <div className="loading__bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={{ transform: `scaleX(${progress})` }} /></div>
      <div className="loading__label"><span>{label}</span><span>{pct}%</span></div>
    </div>
  );
}

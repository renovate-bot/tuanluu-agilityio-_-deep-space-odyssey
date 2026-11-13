import { useEffect, useState } from 'react';
import { useStore } from '../../store/store.js';
import { useActions } from '../../hooks/useEngine.js';
import { useT } from '../../i18n/index.js';

/** Ship-AI messages, the current travel stage, and the Skip control for any running sequence. */
export default function StatusLine() {
  const actions = useActions();
  const t = useT();
  const message = useStore((s) => s.message);
  const travel = useStore((s) => s.travel);
  const event = useStore((s) => s.event);
  const canSkip = useStore((s) => s.canSkip);
  const phase = useStore((s) => s.phase);
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!message) return undefined;
    setShown(message);
    const t = setTimeout(() => setShown((m) => (m && m.id === message.id ? null : m)), 5200);
    return () => clearTimeout(t);
  }, [message]);

  const stage = travel ? `${t(travel.stage)} · ${t(travel.name)}` : event ? t(event) : phase === 'boarding' ? t('BOARDING') : null;
  return (
    <div className="status">
      {shown && <p className="status__msg" key={shown.id} role="status" aria-live="polite"><b>AI</b>{t(shown.text)}</p>}
      {(stage || canSkip) && (
        <div className="status__stage">
          {stage && <span className={travel ? 'is-live' : ''}>{stage}</span>}
          {canSkip && <button className="btn btn--ghost" onClick={actions.skip}>{t('SKIP')} <kbd>SPACE</kbd></button>}
        </div>
      )}
    </div>
  );
}

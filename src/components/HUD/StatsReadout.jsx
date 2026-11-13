import { useStore } from '../../store/store.js';
import { useT } from '../../i18n/index.js';

/** Live performance numbers, so frame rate can be measured on the visitor's own hardware. */
export default function StatsReadout() {
  const show = useStore((s) => s.showStats);
  const st = useStore((s) => s.stats);
  const t = useT();
  if (!show) return null;
  return (
    <div className="stats" aria-label={t('Performance read-out')}>
      <span><b>{st.fps || '—'}</b> FPS</span>
      <span>{t(st.tier)} · ×{Number(st.pixelRatio).toFixed(2)}{st.bloom ? ' · BLOOM' : ''}</span>
      <span>{st.calls} {t('draws')} · {st.tris ? Math.round(st.tris / 1000) : 0}k {t('tris')}</span>
    </div>
  );
}

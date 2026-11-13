import { useStore } from '../../store/store.js';
import { useT, trTarget, useLang } from '../../i18n/index.js';

export default function HoverLabel() {
  const hover = useStore((s) => s.hover);
  const t = useT();
  const lang = useLang();
  if (!hover) return null;
  return (
    <div className="hover-label" style={{ transform: `translate(${hover.x + 16}px, ${hover.y - 10}px)` }} aria-hidden="true">
      <i />{trTarget(hover, lang).name}<small>{t('CLICK TO SCAN')}</small>
    </div>
  );
}

import { useStore } from '../../store/store.js';

export default function HoverLabel() {
  const hover = useStore((s) => s.hover);
  if (!hover) return null;
  return (
    <div className="hover-label" style={{ transform: `translate(${hover.x + 16}px, ${hover.y - 10}px)` }} aria-hidden="true">
      <i />{hover.name}<small>CLICK TO SCAN</small>
    </div>
  );
}

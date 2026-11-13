import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { store } from '../store/store.js';

export const ActionsContext = createContext(null);
export const useActions = () => useContext(ActionsContext);

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

/** Creates the 3D engine for a canvas and tears it down on unmount. The engine chunk is loaded lazily. */
export function useEngine(canvasRef) {
  const [actions, setActions] = useState(null);
  const engineRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    if (!webglAvailable()) {
      store.set({ error: 'This experience needs WebGL 2, which this browser or device does not provide. Try a current desktop version of Chrome, Edge, Firefox or Safari with hardware acceleration enabled.' });
      return undefined;
    }
    (async () => {
      try {
        store.set({ loadProgress: 0.02, loadLabel: 'LOADING ENGINE' });
        const { Engine } = await import('../engine/Engine.js');
        if (cancelled) return;
        const engine = new Engine(canvasRef.current, store);
        engineRef.current = engine;
        if (import.meta.env.DEV || new URLSearchParams(location.search).has('debug')) window.__engine = engine;
        await engine.init();
        if (cancelled) { engine.dispose(); return; }
        setActions(engine.actions);
      } catch (err) {
        console.error(err);
        store.set({ error: `The experience could not start: ${err && err.message ? err.message : err}` });
      }
    })();
    return () => {
      cancelled = true;
      if (engineRef.current) engineRef.current.dispose();
      engineRef.current = null;
    };
  }, [canvasRef]);

  return actions;
}

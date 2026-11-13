import { useSyncExternalStore } from 'react';

/** Minimal observable store shared by the React UI and the 3D engine. */
function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      let changed = false;
      for (const k in next) if (next[k] !== state[k]) { changed = true; break; }
      if (!changed) return;
      state = { ...state, ...next };
      listeners.forEach((l) => l());
    },
    subscribe(l) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initialLang() {
  try { const saved = localStorage.getItem('dso.lang'); if (saved === 'en' || saved === 'vi') return saved; } catch (e) { /* storage blocked */ }
  return typeof navigator !== 'undefined' && /^vi\b/i.test(navigator.language || '') ? 'vi' : 'en';
}
const lang0 = initialLang();
if (typeof document !== 'undefined') document.documentElement.lang = lang0;

export const store = createStore({
  lang: lang0, // en | vi
  phase: 'loading', // loading | intro | boarding | explore
  loadProgress: 0,
  loadLabel: 'INITIALISING',
  error: null,

  sectorId: 'deep',
  sectorName: 'UNKNOWN',
  engineStatus: 'STANDBY',
  signal: 'NOMINAL',

  navOpen: false,
  navSelected: null, // destination id being previewed
  travel: null, // { toId, stage, progress }
  canSkip: false,
  event: null, // name of the cinematic event in progress

  target: null, // selected point of interest (plain data)
  targetRange: '',
  observing: false,
  hover: null, // { name, x, y }

  panel: null, // 'audio' | 'settings' | 'help' | 'view' | null
  message: null, // { id, text }

  muted: false,
  volMaster: 0.8,
  volMusic: 0.7,
  volSfx: 0.8,

  quality: 'auto', // auto | high | medium | low
  qualityNeedsReload: false,
  reducedMotion: !!prefersReducedMotion,
  showStats: false,
  stats: { fps: 0, ms: 0, tier: '', pixelRatio: 1, calls: 0 },
});

export function useStore(selector) {
  return useSyncExternalStore(store.subscribe, () => selector(store.get()));
}

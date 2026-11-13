// Interface language. English strings are the keys; other languages are lookup tables, so the 3D engine
// keeps emitting plain English codes and only the display layer translates.
import { store, useStore } from '../store/store.js';
import { CELESTIAL } from '../config/celestial.js';
import { VI, VI_PATTERNS, VI_NAMES, VI_CELESTIAL } from './vi.js';

export const LANGS = [['en', 'EN', 'English'], ['vi', 'VI', 'Tiếng Việt']];
const KEY = 'dso.lang';

export function setLang(lang) {
  try { localStorage.setItem(KEY, lang); } catch (e) { /* ignore */ }
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
  store.set({ lang });
}

/** Translate one English string. Unknown strings pass through unchanged. */
export function tr(text, lang = store.get().lang) {
  if (lang !== 'vi' || text == null) return text;
  const s = String(text);
  if (VI[s] !== undefined) return VI[s];
  for (const [re, fn] of VI_PATTERNS) {
    const m = s.match(re);
    if (m) return fn(VI_NAMES[m[1]] || VI[m[1]] || nameByEnglish(m[1]) || m[1]);
  }
  return text;
}

let byName = null;
function nameByEnglish(en) {
  if (!byName) { byName = {}; for (const id in CELESTIAL) if (VI_CELESTIAL[id]) byName[CELESTIAL[id].name] = VI_CELESTIAL[id].name; }
  return byName[en];
}

/** Localised copy of a target-card record ({ id, name, type, description, facts, more }). */
export function trTarget(target, lang = store.get().lang) {
  if (!target || lang !== 'vi') return target;
  const v = VI_CELESTIAL[target.id];
  if (!v) return target;
  return { ...target, ...v, more: v.more || (target.more ? target.more : '') };
}

/** Range read-out: units and decimal separators. Input is the English string from formatRange(). */
export function trRange(text, lang = store.get().lang) {
  if (lang !== 'vi' || !text) return text;
  return text
    .replace(/[.,]/g, (c) => (c === '.' ? ',' : '.'))
    .replace(' billion ', ' tỷ ')
    .replace(' million ', ' triệu ')
    .replace(/ ly$/, ' năm ánh sáng');
}

/** React hook: re-renders on language change and returns the translator. */
export function useT() {
  const lang = useStore((s) => s.lang);
  return (text) => tr(text, lang);
}
export const useLang = () => useStore((s) => s.lang);

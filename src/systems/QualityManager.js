import { TIERS, detectTier } from '../config/quality.js';

const KEY = 'dso.quality';

/**
 * Chooses the asset tier at start-up and then steers the render resolution from measured frame times:
 * sustained slow frames lower the pixel ratio (and finally switch bloom off); sustained headroom restores it.
 */
export class QualityManager {
  constructor(renderer, store) {
    this.store = store;
    let pref = 'auto';
    try { pref = localStorage.getItem(KEY) || 'auto'; } catch (e) { /* storage blocked */ }
    if (!['auto', 'high', 'medium', 'low'].includes(pref)) pref = 'auto';
    this.pref = pref;
    this.detected = detectTier(renderer);
    this.assetTierName = pref === 'auto' ? this.detected : pref; // fixed for this session
    this.tier = TIERS[this.assetTierName];
    this.device = Math.min(window.devicePixelRatio || 1, 3);
    this.maxRatio = Math.min(this.device, this.tier.pixelRatioMax);
    this.ratio = this.maxRatio;
    this.bloom = this.tier.bloom;
    this.acc = 0; this.frames = 0; this.slow = 0; this.fast = 0;
    this.onChange = null;
    store.set({ quality: pref });
  }

  /** User picked a mode in Settings. Render-level limits change now; asset detail on next launch. */
  setPreference(pref) {
    this.pref = pref;
    try { localStorage.setItem(KEY, pref); } catch (e) { /* ignore */ }
    const name = pref === 'auto' ? this.detected : pref;
    const t = TIERS[name];
    this.maxRatio = Math.min(this.device, t.pixelRatioMax);
    this.ratio = this.maxRatio;
    this.bloom = t.bloom;
    this.slow = this.fast = 0;
    this.store.set({ quality: pref });
    if (this.onChange) this.onChange();
  }

  get needsReload() {
    return (this.pref === 'auto' ? this.detected : this.pref) !== this.assetTierName;
  }

  /** Call once per frame with the raw frame time. Returns true if settings changed. */
  sample(dt, busy) {
    this.acc += dt; this.frames++;
    if (this.acc < 1.5) return false;
    const fps = this.frames / this.acc;
    this.fps = fps;
    this.acc = 0; this.frames = 0;
    if (busy || this.pref !== 'auto') { this.slow = this.fast = 0; return false; }
    if (fps < 42) { this.slow++; this.fast = 0; } else if (fps > 57) { this.fast++; this.slow = 0; } else { this.slow = this.fast = 0; }
    let changed = false;
    if (this.slow >= 2) {
      this.slow = 0;
      if (this.ratio > 0.76) { this.ratio = Math.max(0.75, this.ratio - 0.25); changed = true; }
      else if (this.bloom) { this.bloom = false; changed = true; }
    } else if (this.fast >= 6) {
      this.fast = 0;
      if (!this.bloom && this.tier.bloom) { this.bloom = true; changed = true; }
      else if (this.ratio < this.maxRatio) { this.ratio = Math.min(this.maxRatio, this.ratio + 0.25); changed = true; }
    }
    if (changed && this.onChange) this.onChange();
    return changed;
  }
}

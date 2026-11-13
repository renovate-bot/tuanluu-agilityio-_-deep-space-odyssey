import * as THREE from 'three';
import { tr } from '../../i18n/index.js';

const CYAN = '#7fe9ff';
const DIM = 'rgba(127,233,255,0.35)';
const AMBER = '#ffb766';

/**
 * Live instrument displays drawn on 2D canvases and used as emissive textures inside the cockpit.
 * Each screen redraws a couple of times per second, staggered, so uploads never pile up in one frame.
 */
export class CockpitScreens {
  constructor() {
    this.screens = ['nav', 'systems', 'spectrum', 'chart'].map((kind, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 320;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0, toneMapped: false, blending: THREE.AdditiveBlending, depthWrite: false });
      return { kind, canvas, ctx: canvas.getContext('2d'), texture, material, next: i * 0.13, on: 0 };
    });
    this.state = { lang: 'en', sector: 'UNKNOWN', engine: 'STANDBY', dest: '—', warp: 0, heading: 0, pitch: 0 };
    this.brightness = 0.85;
  }

  material(i) { return this.screens[i].material; }

  /** power: 0..1 per screen (boot flicker handled by the caller) */
  setPower(i, v) {
    this.screens[i].on = v;
    this.screens[i].material.opacity = v * this.brightness;
  }

  update(time) {
    for (const s of this.screens) {
      if (s.on <= 0.01 || time < s.next) continue;
      s.next = time + 0.45;
      this.draw(s, time);
      s.texture.needsUpdate = true;
    }
  }

  frame(g, title) {
    g.clearRect(0, 0, 512, 320);
    g.fillStyle = 'rgba(8,30,44,0.55)';
    g.fillRect(0, 0, 512, 320);
    g.strokeStyle = DIM; g.lineWidth = 2;
    g.strokeRect(6, 6, 500, 308);
    g.fillStyle = CYAN; g.font = '600 18px ui-monospace, Menlo, Consolas, monospace';
    g.fillText(title, 20, 32);
    g.fillStyle = DIM; g.fillRect(20, 42, 472, 1);
  }

  draw(s, t) {
    const g = s.ctx;
    const st = this.state;
    const L = (s) => tr(s, st.lang);
    g.textBaseline = 'alphabetic';
    if (s.kind === 'nav') {
      this.frame(g, L('NAVIGATION'));
      g.font = '15px ui-monospace, Menlo, Consolas, monospace';
      const rows = [[L('SECTOR'), L(st.sector)], [L('DEST'), L(st.dest)], [L('HDG'), `${st.heading.toFixed(1)}°`], [L('ELEV'), `${st.pitch.toFixed(1)}°`], [L('DRIVE'), L(st.engine)]];
      rows.forEach(([k, v], i) => { g.fillStyle = DIM; g.fillText(k, 20, 74 + i * 26); g.fillStyle = CYAN; g.fillText(String(v).slice(0, 20), 96, 74 + i * 26); });
      // sweep scope
      const cx = 400, cy = 180, r = 84;
      g.strokeStyle = DIM; g.lineWidth = 1;
      for (const k of [1, 0.66, 0.33]) { g.beginPath(); g.arc(cx, cy, r * k, 0, 6.283); g.stroke(); }
      g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.moveTo(cx, cy - r); g.lineTo(cx, cy + r); g.stroke();
      const a = t * 1.3;
      const grad = g.createConicGradient ? g.createConicGradient(a, cx, cy) : null;
      if (grad) { grad.addColorStop(0, 'rgba(127,233,255,0)'); grad.addColorStop(0.92, 'rgba(127,233,255,0)'); grad.addColorStop(1, 'rgba(127,233,255,0.5)'); g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, r, 0, 6.283); g.fill(); }
      g.fillStyle = AMBER;
      for (let i = 0; i < 5; i++) { const aa = i * 2.4 + 0.7, rr = r * (0.25 + 0.14 * i); g.fillRect(cx + Math.cos(aa) * rr - 2, cy + Math.sin(aa) * rr - 2, 4, 4); }
    } else if (s.kind === 'systems') {
      this.frame(g, L('SHIP SYSTEMS'));
      g.font = '14px ui-monospace, Menlo, Consolas, monospace';
      const bars = [['REACTOR', 0.72 + 0.25 * st.warp], ['LIFE SUPPORT', 0.96], ['HULL INTEGRITY', 1.0], ['COOLANT', 0.81 - 0.3 * st.warp], ['SHIELDING', 0.64 + 0.3 * st.warp]];
      bars.forEach(([k, v], i) => {
        const y = 70 + i * 44;
        const val = Math.max(0, Math.min(1, v + Math.sin(t * 0.7 + i) * 0.015));
        g.fillStyle = DIM; g.fillText(L(k), 20, y);
        g.strokeStyle = DIM; g.strokeRect(20, y + 8, 380, 12);
        g.fillStyle = val < 0.6 ? AMBER : CYAN; g.fillRect(22, y + 10, 376 * val, 8);
        g.fillStyle = CYAN; g.fillText(`${Math.round(val * 100)}%`, 416, y + 19);
      });
    } else if (s.kind === 'spectrum') {
      this.frame(g, L('SPECTRAL ANALYSIS'));
      g.strokeStyle = CYAN; g.lineWidth = 2; g.beginPath();
      for (let x = 0; x <= 472; x += 4) {
        const u = x / 472;
        const y = 200 - 90 * Math.exp(-Math.pow((u - 0.3) / 0.05, 2)) * (0.8 + 0.2 * Math.sin(t)) - 60 * Math.exp(-Math.pow((u - 0.62) / 0.03, 2)) - 30 * Math.exp(-Math.pow((u - 0.8) / 0.08, 2)) - 8 * Math.sin(u * 60 + t * 3) * (0.3 + st.warp);
        if (x === 0) g.moveTo(20 + x, y); else g.lineTo(20 + x, y);
      }
      g.stroke();
      g.strokeStyle = DIM; g.lineWidth = 1;
      for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(20 + i * 59, 60); g.lineTo(20 + i * 59, 230); g.stroke(); }
      g.fillStyle = DIM; g.font = '13px ui-monospace, Menlo, Consolas, monospace';
      g.fillText('H-α 656 nm', 130, 262); g.fillText('O III 501 nm', 280, 262);
      g.fillStyle = AMBER; g.fillText(L('PASSIVE SCAN'), 20, 296);
    } else {
      this.frame(g, L('STELLAR CARTOGRAPHY'));
      g.fillStyle = CYAN;
      for (let i = 0; i < 70; i++) {
        const x = 20 + ((i * 97.3) % 472), y = 56 + ((i * 53.7) % 240);
        const sz = 1 + ((i * 7) % 3);
        g.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(i + t * 0.6));
        g.fillRect(x, y, sz, sz);
      }
      g.globalAlpha = 1;
      g.strokeStyle = AMBER; g.lineWidth = 1.5;
      const px = 256 + Math.sin(t * 0.2) * 120, py = 176 + Math.cos(t * 0.17) * 70;
      g.strokeRect(px - 10, py - 10, 20, 20);
      g.beginPath(); g.moveTo(px - 18, py); g.lineTo(px - 10, py); g.moveTo(px + 10, py); g.lineTo(px + 18, py); g.stroke();
      g.strokeStyle = DIM; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(256, 300); g.lineTo(px, py); g.stroke(); g.setLineDash([]);
    }
  }

  dispose() {
    for (const s of this.screens) { s.texture.dispose(); s.material.dispose(); }
  }
}

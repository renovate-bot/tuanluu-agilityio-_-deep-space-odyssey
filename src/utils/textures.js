import * as THREE from 'three';
import { mulberry32 } from './rng.js';

/** Hull / wall plating: greyscale panels with seams, used as colour, roughness and bump detail. */
export function makePanelTexture({ seed = 1, size = 512, cells = 8, base = 150, variance = 40, seam = 60, rivets = true } = {}) {
  const rand = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = `rgb(${base},${base},${base})`;
  g.fillRect(0, 0, size, size);
  const step = size / cells;
  for (let y = 0; y < cells; y++) {
    let x = 0;
    while (x < cells) {
      const w = 1 + ((rand() * 3) | 0);
      const v = base + (rand() - 0.5) * variance;
      g.fillStyle = `rgb(${v | 0},${v | 0},${(v + 2) | 0})`;
      g.fillRect(x * step, y * step, w * step, step);
      g.strokeStyle = `rgb(${seam},${seam},${seam})`;
      g.lineWidth = 2;
      g.strokeRect(x * step + 1, y * step + 1, w * step - 2, step - 2);
      if (rivets) {
        g.fillStyle = `rgba(255,255,255,0.12)`;
        for (const [rx, ry] of [[6, 6], [w * step - 8, 6], [6, step - 8], [w * step - 8, step - 8]]) g.fillRect(x * step + rx, y * step + ry, 2, 2);
      }
      if (rand() < 0.18) {
        g.fillStyle = `rgba(0,0,0,0.25)`;
        g.fillRect(x * step + step * 0.2, y * step + step * 0.3, w * step * 0.5, step * 0.12);
      }
      x += w;
    }
  }
  // fine grime
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(${rand() < 0.5 ? 0 : 255},${rand() < 0.5 ? 0 : 255},255,${rand() * 0.035})`;
    g.fillRect(rand() * size, rand() * size, 1 + rand() * 3, 1 + rand() * 12);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Rows of tiny lit windows for emissive maps on the ship exterior. */
export function makeWindowTexture({ seed = 3, w = 512, h = 64, rows = 2, cols = 64 } = {}) {
  const rand = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, w, h);
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < cols; i++) {
      if (rand() < 0.45) continue;
      g.fillStyle = rand() < 0.8 ? '#ffe2b0' : '#9fe8ff';
      g.fillRect((i + 0.25) * (w / cols), h * (0.3 + (0.4 * r) / Math.max(1, rows - 1)) - 2, (w / cols) * 0.5, 4);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

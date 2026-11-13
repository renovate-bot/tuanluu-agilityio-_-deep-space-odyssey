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

let _detail = null;
/** Shared tiling noise (three independent channels, four octaves each) used for close-range surface detail. */
export function detailTexture() {
  if (_detail) return _detail;
  const N = 256;
  const data = new Uint8Array(N * N * 4);
  for (let ch = 0; ch < 3; ch++) {
    const rand = mulberry32(900 + ch * 17);
    const acc = new Float32Array(N * N);
    let amp = 0.5, total = 0;
    for (const cells of [8, 16, 32, 64]) {
      const lat = new Float32Array(cells * cells);
      for (let i = 0; i < lat.length; i++) lat[i] = rand();
      const k = cells / N;
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const fx = x * k, fy = y * k;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const x1 = (x0 + 1) % cells, y1 = (y0 + 1) % cells;
        const a = lat[y0 * cells + x0], b = lat[y0 * cells + x1], c = lat[y1 * cells + x0], d = lat[y1 * cells + x1];
        acc[y * N + x] += amp * (a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy);
      }
      total += amp; amp *= 0.5;
    }
    for (let i = 0; i < N * N; i++) data[i * 4 + ch] = Math.max(0, Math.min(255, ((acc[i] / total - 0.5) * 1.9 + 0.5) * 255));
  }
  for (let i = 0; i < N * N; i++) data[i * 4 + 3] = 255;
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 4;
  tex.needsUpdate = true;
  _detail = tex;
  return tex;
}
export function disposeDetailTexture() { if (_detail) { _detail.dispose(); _detail = null; } }

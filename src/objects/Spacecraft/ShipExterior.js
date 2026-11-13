import * as THREE from 'three';
import { makePanelTexture, makeWindowTexture } from '../../utils/textures.js';
import { GlowSprite } from '../Stars/GlowSprite.js';
import { disposeObject } from '../../utils/dispose.js';

/**
 * ODYSSEY-01 as seen from outside: an original design built entirely from primitives.
 * Bow points down -Z. Roughly 150 units long. Only shown during the arrival sequence.
 */
export class ShipExterior {
  constructor() {
    const g = (this.group = new THREE.Group());
    const panel = makePanelTexture({ seed: 4, cells: 10, base: 165, variance: 55 });
    panel.repeat.set(4, 2);
    const hull = new THREE.MeshStandardMaterial({ color: 0xc3c9d2, metalness: 0.55, roughness: 0.5, map: panel, bumpMap: panel, bumpScale: 0.6, envMapIntensity: 0.9 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4a515c, metalness: 0.6, roughness: 0.55, map: panel, bumpMap: panel, bumpScale: 0.5 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xc8793a, metalness: 0.6, roughness: 0.5 });
    const glass = new THREE.MeshStandardMaterial({ color: 0x05080d, metalness: 1.0, roughness: 0.08, emissive: 0x3aa8c8, emissiveIntensity: 0.35, envMapIntensity: 1.6 });
    const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, parent = g) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
      parent.add(m);
      return m;
    };
    const HALF = Math.PI / 2;

    // spine
    add(new THREE.CylinderGeometry(4, 4, 112, 24, 8), hull, 0, 0, 6, HALF);
    // truss rings along the spine
    for (let i = 0; i < 9; i++) add(new THREE.TorusGeometry(4.5, 0.45, 8, 24), dark, 0, 0, -44 + i * 12.5);

    // command module (lathe profile) with the observation deck glazing at the bow
    const profile = [[0.01, -78], [3.5, -77], [7.5, -72], [10.5, -64], [11.5, -54], [10.5, -46], [7, -41], [4.2, -39]].map(([r, z]) => new THREE.Vector2(r, z));
    add(new THREE.LatheGeometry(profile, 40), hull, 0, 0, 0, HALF);
    // observation deck glazing: a dark glass band wrapped around the bow, lit from within
    add(new THREE.CylinderGeometry(11.42, 10.72, 6.4, 48, 1, true), glass, 0, 0, -59.6, HALF);
    add(new THREE.TorusGeometry(11.6, 0.6, 8, 48), accent, 0, 0, -54);
    add(new THREE.BoxGeometry(3, 2.4, 9), dark, 0, 11.2, -55);

    // rotating habitat ring
    const ring = (this.ring = new THREE.Group());
    ring.position.z = -18;
    g.add(ring);
    const win = makeWindowTexture({});
    win.repeat.set(6, 1);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xb4bbc5, metalness: 0.55, roughness: 0.5, map: panel, emissive: 0xffffff, emissiveMap: win, emissiveIntensity: 1.6 });
    add(new THREE.TorusGeometry(27, 3.3, 14, 72), ringMat, 0, 0, 0, 0, 0, 0, ring);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      add(new THREE.CylinderGeometry(1.1, 1.1, 24, 10), dark, Math.cos(a) * 15, Math.sin(a) * 15, 0, 0, 0, a + HALF, ring);
    }

    // propellant tanks clustered around the spine
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      add(new THREE.CapsuleGeometry(3.4, 20, 6, 14), i % 2 ? hull : dark, Math.cos(a) * 8.2, Math.sin(a) * 8.2, 22, HALF);
    }

    // radiator wings
    const radMat = new THREE.MeshStandardMaterial({ color: 0x23272f, metalness: 0.4, roughness: 0.5, emissive: 0xff5a1e, emissiveIntensity: 0.015 });
    for (const s of [-1, 1]) {
      add(new THREE.BoxGeometry(46, 0.5, 15), radMat, s * 29, 0, 40);
      add(new THREE.BoxGeometry(46, 0.9, 0.9), dark, s * 29, 0, 32.2);
      add(new THREE.BoxGeometry(46, 0.9, 0.9), dark, s * 29, 0, 47.8);
      add(new THREE.BoxGeometry(34, 0.3, 9), new THREE.MeshStandardMaterial({ color: 0x10214a, metalness: 0.9, roughness: 0.25 }), 0, s * 21, 4, 0, 0, HALF);
    }

    // engine block and nozzles
    add(new THREE.CylinderGeometry(7, 10.5, 16, 24), dark, 0, 0, 60, HALF);
    this.engineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 1.4, 3.0) });
    this.engines = [];
    const nozzles = [[0, 0], [-6, 3.6], [6, 3.6], [0, -7]];
    for (const [x, y] of nozzles) {
      add(new THREE.CylinderGeometry(3.3, 2.0, 7, 20, 1, true), hull, x * 0.9, y * 0.9, 71, HALF).material.side = THREE.DoubleSide;
      add(new THREE.CircleGeometry(2.9, 20), this.engineMat, x * 0.9, y * 0.9, 73.5);
      const glow = new GlowSprite({ size: 34, color: 0x58b8ff, intensity: 1.4, falloff: 1.7 });
      glow.object.position.set(x * 0.9, y * 0.9, 75);
      g.add(glow.object);
      this.engines.push(glow);
    }

    // comms dish
    const dishPts = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; dishPts.push(new THREE.Vector2(t * 5.5, t * t * 1.9)); }
    const dish = add(new THREE.LatheGeometry(dishPts, 24), hull, 0, 9.5, -2, 0.5);
    dish.material.side = THREE.DoubleSide;
    add(new THREE.CylinderGeometry(0.3, 0.3, 6, 6), dark, 0, 6.5, -2);

    // navigation lights
    this.navLights = [];
    for (const [x, y, z, col] of [[52, 0, 40, 0x35ff6a], [-52, 0, 40, 0xff3030], [0, 13, -55, 0xffffff], [0, -5, 66, 0xffffff]]) {
      const s = new GlowSprite({ size: 7, color: col, intensity: 2, falloff: 1.6 });
      s.object.position.set(x, y, z);
      g.add(s.object);
      this.navLights.push(s);
    }
    this._owned = [panel, win];
  }

  /** @param thrust 0..1 engine glow */
  update(dt, time, thrust = 0.3) {
    this.ring.rotation.z += dt * 0.12;
    const blink = (time % 2.2) < 0.14 ? 2.4 : 0.25;
    this.navLights.forEach((n, i) => { n.uniforms.uIntensity.value = i < 2 ? 1.6 : blink; });
    const e = 0.35 + thrust * 1.6 + 0.04 * Math.sin(time * 31);
    this.engineMat.color.setRGB(0.5 * e, 1.4 * e, 3.0 * e);
    for (const g of this.engines) { g.uniforms.uIntensity.value = e * 1.1; g.uniforms.uSize.value = 26 + thrust * 46; }
  }

  dispose() {
    for (const s of [...this.engines, ...this.navLights]) s.dispose();
    for (const t of this._owned) t.dispose();
    disposeObject(this.group);
  }
}

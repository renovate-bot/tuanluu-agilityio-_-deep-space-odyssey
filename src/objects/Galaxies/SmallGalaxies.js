import * as THREE from 'three';
import { mulberry32, gauss } from '../../utils/rng.js';
import { StarCloud } from '../Stars/StarCloud.js';
import { GlowSprite } from '../Stars/GlowSprite.js';

class CloudGalaxy {
  constructor() { this.group = new THREE.Group(); this.parts = []; }
  setPixelRatio(pr) { this.cloud.setPixelRatio(pr); }
  update(dt) { this.group.rotation.y += dt * 0.0006; }
  dispose() {
    this.cloud.dispose();
    for (const p of this.parts) p.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

/** Elliptical galaxy: a smooth, old, golden swarm with a bright diffuse centre. */
export class EllipticalGalaxy extends CloudGalaxy {
  constructor({ radius = 30000, count = 30000, seed = 21, pixelRatio = 1 }) {
    super();
    this.radius = radius;
    const rand = mulberry32(seed);
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const s = Math.pow(rand(), 1.7) * radius * 0.42;
      positions[i * 3] = gauss(rand) * s; positions[i * 3 + 1] = gauss(rand) * s * 0.62; positions[i * 3 + 2] = gauss(rand) * s * 0.75;
      const b = 0.25 + Math.pow(rand(), 3) * 1.1;
      colors[i * 3] = 1.0 * b; colors[i * 3 + 1] = (0.78 + rand() * 0.12) * b; colors[i * 3 + 2] = (0.5 + rand() * 0.15) * b;
      sizes[i] = radius * (0.002 + Math.pow(rand(), 6) * 0.004);
    }
    this.cloud = new StarCloud({ positions, colors, sizes }, { pixelRatio, scale: 700, minSize: 1.2, maxSize: 8, opacity: 0.8 });
    this.group.add(this.cloud.object);
    const halo = new GlowSprite({ size: radius * 1.9, color: 0xffcf96, intensity: 1.4, falloff: 1.35 });
    this.group.add(halo.object);
    this.parts.push(halo);
    this.group.scale.set(1, 1, 1);
  }
}

/** Irregular galaxy: clumpy, blue, studded with pink star-forming knots; no symmetry. */
export class IrregularGalaxy extends CloudGalaxy {
  constructor({ radius = 22000, count = 26000, seed = 31, pixelRatio = 1 }) {
    super();
    this.radius = radius;
    const rand = mulberry32(seed);
    const clumps = [];
    for (let i = 0; i < 9; i++) {
      clumps.push({ x: gauss(rand) * radius * 0.34, y: gauss(rand) * radius * 0.14, z: gauss(rand) * radius * 0.26, r: radius * (0.08 + rand() * 0.2), pink: rand() < 0.4 });
    }
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const c = clumps[(rand() * clumps.length) | 0];
      positions[i * 3] = c.x + gauss(rand) * c.r; positions[i * 3 + 1] = c.y + gauss(rand) * c.r * 0.6; positions[i * 3 + 2] = c.z + gauss(rand) * c.r;
      const b = 0.3 + Math.pow(rand(), 3) * 1.6;
      const pink = c.pink && rand() < 0.3;
      colors[i * 3] = (pink ? 1.0 : 0.6) * b; colors[i * 3 + 1] = (pink ? 0.4 : 0.76) * b; colors[i * 3 + 2] = (pink ? 0.6 : 1.0) * b;
      sizes[i] = radius * (0.002 + Math.pow(rand(), 6) * 0.005);
    }
    this.cloud = new StarCloud({ positions, colors, sizes }, { pixelRatio, scale: 700, minSize: 1.2, maxSize: 8, opacity: 0.8 });
    this.group.add(this.cloud.object);
    for (const c of clumps.slice(0, 5)) {
      const g = new GlowSprite({ size: c.r * 5, color: c.pink ? 0xff7aa8 : 0x7aa8ff, intensity: 0.5, falloff: 1.3 });
      g.object.position.set(c.x, c.y, c.z);
      this.group.add(g.object);
      this.parts.push(g);
    }
  }
}

/** Globular cluster: tens of thousands of old stars packed towards a blazing centre. */
export class GlobularCluster extends CloudGalaxy {
  constructor({ radius = 3000, count = 9000, seed = 41, pixelRatio = 1 }) {
    super();
    this.radius = radius;
    const rand = mulberry32(seed);
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const s = Math.pow(rand(), 2.4) * radius * 0.6;
      positions[i * 3] = gauss(rand) * s; positions[i * 3 + 1] = gauss(rand) * s; positions[i * 3 + 2] = gauss(rand) * s;
      const b = 0.4 + Math.pow(rand(), 4) * 2.2;
      const hot = rand() < 0.12;
      colors[i * 3] = (hot ? 0.7 : 1.0) * b; colors[i * 3 + 1] = (hot ? 0.8 : 0.85) * b; colors[i * 3 + 2] = (hot ? 1.0 : 0.62) * b;
      sizes[i] = radius * (0.004 + Math.pow(rand(), 5) * 0.01);
    }
    this.cloud = new StarCloud({ positions, colors, sizes }, { pixelRatio, scale: 700, minSize: 1.2, maxSize: 10 });
    this.group.add(this.cloud.object);
    const halo = new GlowSprite({ size: radius * 2.2, color: 0xffe2b8, intensity: 0.7, falloff: 1.5 });
    this.group.add(halo.object);
    this.parts.push(halo);
  }
}

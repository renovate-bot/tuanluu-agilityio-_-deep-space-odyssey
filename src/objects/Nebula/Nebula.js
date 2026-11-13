import * as THREE from 'three';
import { mulberry32, gauss } from '../../utils/rng.js';
import { getNebulaAtlas } from './NebulaTextures.js';
import { StarCloud } from '../Stars/StarCloud.js';

const VERT = /* glsl */ `
attribute vec3 iPos; attribute vec4 iParams; attribute vec3 iColA; attribute vec3 iColB; attribute vec2 iAnim;
uniform float uTime, uOpacity;
varying vec2 vUv; varying vec3 vColA; varying vec3 vColB; varying float vAlpha; varying float vHot;
void main(){
  float tile = iParams.z;
  vec2 t = vec2(mod(tile, 2.0), floor(tile / 2.0));
  // keep half a texel away from tile borders
  vUv = (t + clamp(uv, 0.004, 0.996)) * 0.5;
  float a = iParams.y + uTime * iAnim.x;
  float c = cos(a), s = sin(a);
  vec2 corner = mat2(c, -s, s, c) * position.xy * iParams.x;
  vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
  float dist = length(mv.xyz);
  mv.xy += corner;
  gl_Position = projectionMatrix * mv;
  // sprites dissolve as the ship passes through them → no popping, a sense of flying through gas
  float fade = smoothstep(iParams.x * 0.12, iParams.x * 0.75, dist);
  vAlpha = iParams.w * fade * uOpacity;
  vColA = iColA; vColB = iColB; vHot = iAnim.y;
}`;

const FRAG_GLOW = /* glsl */ `
uniform sampler2D uAtlas;
varying vec2 vUv; varying vec3 vColA; varying vec3 vColB; varying float vAlpha; varying float vHot;
void main(){
  vec4 t = texture2D(uAtlas, vUv);
  float dens = t.r * t.a;
  vec3 col = mix(vColA, vColB, smoothstep(0.25, 0.75, t.g)) * dens;
  col += mix(vColB, vec3(1.0), 0.45) * t.b * t.a * vHot;
  gl_FragColor = vec4(col * vAlpha, 1.0);
}`;

const FRAG_DUST = /* glsl */ `
uniform sampler2D uAtlas;
varying vec2 vUv; varying vec3 vColA; varying float vAlpha;
void main(){
  vec4 t = texture2D(uAtlas, vUv);
  gl_FragColor = vec4(vColA * 0.02, t.r * t.a * vAlpha);
}`;

function buildLayer(sprites, atlas, fragment, blending) {
  const base = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = base.index;
  geo.setAttribute('position', base.getAttribute('position'));
  geo.setAttribute('uv', base.getAttribute('uv'));
  const n = sprites.length;
  const pos = new Float32Array(n * 3), par = new Float32Array(n * 4), ca = new Float32Array(n * 3), cb = new Float32Array(n * 3), an = new Float32Array(n * 2);
  sprites.forEach((s, i) => {
    pos.set(s.pos, i * 3);
    par.set([s.scale, s.rot, s.tile, s.opacity], i * 4);
    ca.set(s.colA, i * 3);
    cb.set(s.colB, i * 3);
    an.set([s.spin, s.hot], i * 2);
  });
  geo.setAttribute('iPos', new THREE.InstancedBufferAttribute(pos, 3));
  geo.setAttribute('iParams', new THREE.InstancedBufferAttribute(par, 4));
  geo.setAttribute('iColA', new THREE.InstancedBufferAttribute(ca, 3));
  geo.setAttribute('iColB', new THREE.InstancedBufferAttribute(cb, 3));
  geo.setAttribute('iAnim', new THREE.InstancedBufferAttribute(an, 2));
  geo.instanceCount = n;
  const material = new THREE.ShaderMaterial({
    uniforms: { uAtlas: { value: atlas }, uTime: { value: 0 }, uOpacity: { value: 1 } },
    vertexShader: VERT, fragmentShader: fragment,
    blending, transparent: true, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.frustumCulled = false;
  return mesh;
}

/**
 * A volumetric-looking nebula: dozens of differently sized, rotated and tinted cloud billboards arranged
 * in lobes, dark dust in front, and young stars inside. Two instanced draws + one point draw.
 *
 * palette: array of [r,g,b] (linear, can exceed 1 for glowing cores)
 */
export class Nebula {
  constructor(renderer, { radius, palette, seed = 1, count = 60, dust = 8, stars = 400, lobes = 6, flatten = 0.55, opacity = 0.5, pixelRatio = 1 }) {
    this.radius = radius;
    this.group = new THREE.Group();
    this.tint = new THREE.Color(...[0, 1, 2].map((k) => Math.min(1, palette.reduce((a, c) => a + c[k], 0) / palette.length)));
    const rand = mulberry32(seed);
    const atlas = getNebulaAtlas(renderer).texture;

    // lobes: a random walk gives the cloud an irregular, non-spherical silhouette
    const lobeList = [];
    let cx = 0, cy = 0, cz = 0;
    for (let i = 0; i < lobes; i++) {
      lobeList.push({ x: cx, y: cy, z: cz, r: radius * (0.28 + rand() * 0.3), tint: rand() });
      cx += gauss(rand) * radius * 0.42;
      cy += gauss(rand) * radius * 0.42 * flatten;
      cz += gauss(rand) * radius * 0.42;
    }
    const pick = (t) => {
      const x = t * (palette.length - 1);
      const i = Math.min(palette.length - 2, Math.floor(x));
      const f = x - i;
      return [0, 1, 2].map((k) => palette[i][k] * (1 - f) + palette[i + 1][k] * f);
    };

    const glow = [];
    const norm = opacity / Math.sqrt(count / 50);
    for (let i = 0; i < count; i++) {
      const l = lobeList[(rand() * lobeList.length) | 0];
      const core = rand() < 0.22;
      const spread = core ? 0.35 : 1.0;
      const t = Math.min(1, Math.max(0, l.tint + gauss(rand) * 0.22));
      glow.push({
        pos: [l.x + gauss(rand) * l.r * spread, l.y + gauss(rand) * l.r * spread * flatten, l.z + gauss(rand) * l.r * spread],
        scale: radius * (core ? 0.35 + rand() * 0.3 : 0.55 + rand() * 0.75),
        rot: rand() * 6.283,
        tile: (rand() * 4) | 0,
        opacity: norm * (core ? 1.5 : 0.55 + rand() * 0.6),
        colA: pick(t),
        colB: pick(Math.min(1, Math.max(0, t + (rand() - 0.5) * 0.7))),
        spin: (rand() - 0.5) * 0.006,
        hot: core ? 0.9 : 0.15 + rand() * 0.3,
      });
    }
    this.glow = buildLayer(glow, atlas, FRAG_GLOW, THREE.AdditiveBlending);
    this.glow.renderOrder = 3;
    this.group.add(this.glow);

    if (dust > 0) {
      const d = [];
      for (let i = 0; i < dust; i++) {
        const l = lobeList[(rand() * lobeList.length) | 0];
        d.push({
          pos: [l.x + gauss(rand) * l.r * 0.9, l.y + gauss(rand) * l.r * 0.5, l.z + gauss(rand) * l.r * 0.9],
          scale: radius * (0.3 + rand() * 0.5), rot: rand() * 6.283, tile: (rand() * 4) | 0,
          opacity: 0.5 + rand() * 0.35, colA: pick(rand()), colB: [0, 0, 0], spin: (rand() - 0.5) * 0.004, hot: 0,
        });
      }
      this.dust = buildLayer(d, atlas, FRAG_DUST, THREE.NormalBlending);
      this.dust.renderOrder = 4;
      this.group.add(this.dust);
    }

    if (stars > 0) {
      const positions = new Float32Array(stars * 3), colors = new Float32Array(stars * 3), sizes = new Float32Array(stars);
      for (let i = 0; i < stars; i++) {
        const l = lobeList[(rand() * lobeList.length) | 0];
        positions[i * 3] = l.x + gauss(rand) * l.r * 0.9;
        positions[i * 3 + 1] = l.y + gauss(rand) * l.r * 0.9 * flatten;
        positions[i * 3 + 2] = l.z + gauss(rand) * l.r * 0.9;
        const c = pick(rand());
        const b = 0.6 + Math.pow(rand(), 4) * 3.5;
        colors[i * 3] = (0.6 + 0.4 * c[0]) * b; colors[i * 3 + 1] = (0.6 + 0.4 * c[1]) * b; colors[i * 3 + 2] = (0.65 + 0.4 * c[2]) * b;
        sizes[i] = radius * (0.0018 + Math.pow(rand(), 5) * 0.006);
      }
      this.stars = new StarCloud({ positions, colors, sizes }, { pixelRatio, scale: 900, minSize: 1.4, maxSize: 16 });
      this.stars.object.renderOrder = 5;
      this.group.add(this.stars.object);
    }
  }

  update(time) {
    this.glow.material.uniforms.uTime.value = time;
    if (this.dust) this.dust.material.uniforms.uTime.value = time;
  }

  setOpacity(o) {
    this.glow.material.uniforms.uOpacity.value = o;
  }

  setPixelRatio(pr) { if (this.stars) this.stars.setPixelRatio(pr); }

  dispose() {
    this.glow.geometry.dispose(); this.glow.material.dispose();
    if (this.dust) { this.dust.geometry.dispose(); this.dust.material.dispose(); }
    if (this.stars) this.stars.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

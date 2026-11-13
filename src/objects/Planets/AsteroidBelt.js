import * as THREE from 'three';
import { mulberry32, gauss } from '../../utils/rng.js';

function rockGeometry(seed, detail) {
  const rand = mulberry32(seed);
  const geo = new THREE.IcosahedronGeometry(1, detail);
  const bumps = Array.from({ length: 9 }, () => {
    const d = new THREE.Vector3(gauss(rand), gauss(rand), gauss(rand)).normalize();
    return { d, a: (rand() - 0.35) * 0.55, p: 1.5 + rand() * 4 };
  });
  const pos = geo.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let r = 1;
    for (const b of bumps) r += b.a * Math.pow(Math.max(0, v.dot(b.d)), b.p);
    v.multiplyScalar(r);
    pos.setXYZ(i, v.x * 1.0, v.y * 0.78, v.z * 0.9);
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Asteroid field drawn with InstancedMesh (3 rock shapes → 3 draw calls for thousands of rocks).
 * Each rock tumbles around its own axis inside the vertex shader, so no per-frame matrix uploads.
 */
export class AsteroidBelt {
  constructor({ count = 2400, length = 46000, width = 7000, thickness = 900, seed = 5, bendY = 2500, bendZ = 16000, sizeScale = 1, shade = [0.22, 0.22], roughness = 0.95 }) {
    this.group = new THREE.Group();
    this.meshes = [];
    this.uTime = { value: 0 };
    const rand = mulberry32(seed);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const per = Math.floor(count / 3);
    for (let g = 0; g < 3; g++) {
      const geo = rockGeometry(100 + g, g === 0 ? 2 : 1);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness, metalness: 0.08, flatShading: g !== 0 });
      const spin = new Float32Array(per * 4);
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = this.uTime;
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>
            attribute vec4 aSpin; uniform float uTime;
            vec3 spinRot(vec3 v){ float a = uTime * aSpin.w; vec3 k = aSpin.xyz; return v * cos(a) + cross(k, v) * sin(a) + k * dot(k, v) * (1.0 - cos(a)); }`)
          .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
            objectNormal = spinRot(objectNormal);`)
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            transformed = spinRot(transformed);`);
      };
      const mesh = new THREE.InstancedMesh(geo, mat, per);
      for (let i = 0; i < per; i++) {
        const t = rand() - 0.5;
        // gentle arc so the belt curves away into the distance
        dummy.position.set(t * length + gauss(rand) * 300, gauss(rand) * thickness * 0.5 + t * t * bendY, gauss(rand) * width * 0.4 - t * t * bendZ);
        const big = rand();
        const s = (big > 0.985 ? 160 + rand() * 220 : big > 0.9 ? 45 + rand() * 70 : 6 + Math.pow(rand(), 2) * 30) * sizeScale;
        dummy.scale.setScalar(s);
        dummy.rotation.set(rand() * 6.28, rand() * 6.28, rand() * 6.28);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        const shd = shade[0] + rand() * shade[1];
        mesh.setColorAt(i, color.setRGB(shd * (1.0 + rand() * 0.15), shd * 0.95, shd * (0.85 + rand() * 0.1)));
        const ax = new THREE.Vector3(gauss(rand), gauss(rand), gauss(rand)).normalize();
        spin.set([ax.x, ax.y, ax.z, (rand() - 0.5) * 0.5 * (20 / (s / sizeScale + 10))], i * 4);
      }
      geo.setAttribute('aSpin', new THREE.InstancedBufferAttribute(spin, 4));
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      this.group.add(mesh);
      this.meshes.push(mesh);
    }
  }

  update(time) { this.uTime.value = time; }

  dispose() {
    for (const m of this.meshes) { m.geometry.dispose(); m.material.dispose(); m.dispose(); }
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

/** The whole belt seen from afar: a torus of faint points with thinned-out resonance gaps. */
export class BeltRing {
  constructor({ count = 6000, inner, outer, thickness = 3000, pixelRatio = 1, seed = 21 }) {
    const rand = mulberry32(seed);
    const pos = new Float32Array(count * 3), size = new Float32Array(count);
    const gaps = [0.3, 0.52, 0.71]; // stand-ins for the Kirkwood gaps
    let i = 0;
    while (i < count) {
      const u = rand();
      if (gaps.some((g) => Math.abs(u - g) < 0.022) && rand() < 0.85) continue;
      const edge = Math.sin(Math.PI * u);
      if (rand() > 0.25 + 0.75 * edge) continue;
      const r = inner + (outer - inner) * u, a = rand() * Math.PI * 2;
      pos.set([Math.cos(a) * r, gauss(rand) * thickness * (0.4 + 0.6 * edge), Math.sin(a) * r], i * 3);
      size[i] = 0.6 + Math.pow(rand(), 3) * 1.8;
      i++;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    this.uniforms = { uPixelRatio: { value: pixelRatio } };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `attribute float aSize; uniform float uPixelRatio; varying float vA;
        void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); float d = length(mv.xyz);
          vA = smoothstep(4000.0, 30000.0, d) * (0.35 + 0.65 * smoothstep(400000.0, 60000.0, d));
          gl_PointSize = max(aSize * uPixelRatio * (1.0 + 60000.0 / d), 1.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(vec3(0.62, 0.56, 0.5) * (1.0 - d) * vA * 0.55, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
  }
  setPixelRatio(pr) { this.uniforms.uPixelRatio.value = pr; }
  dispose() { this.points.geometry.dispose(); this.material.dispose(); }
}

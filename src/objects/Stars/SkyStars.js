import * as THREE from 'three';
import { mulberry32, gauss, onSphere } from '../../utils/rng.js';

const SKY_RADIUS = 3.0e6;

// Rough stellar colour classes (hot blue → cool red) and how often each is picked.
const PALETTE = [
  [0.62, 0.74, 1.0, 0.14],
  [0.8, 0.88, 1.0, 0.24],
  [1.0, 1.0, 1.0, 0.24],
  [1.0, 0.95, 0.8, 0.18],
  [1.0, 0.8, 0.56, 0.13],
  [1.0, 0.6, 0.42, 0.07],
];

function pickColor(r) {
  let acc = 0;
  for (const c of PALETTE) {
    acc += c[3];
    if (r <= acc) return c;
  }
  return PALETTE[2];
}

/**
 * Stars at "infinity": a point cloud on a huge sphere that follows the camera.
 * Includes a denser galactic band and a handful of tight clusters. Individual stars twinkle softly.
 */
export class SkyStars {
  constructor({ count = 22000, pixelRatio = 1 } = {}) {
    const rand = mulberry32(1337);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const params = new Float32Array(count * 3); // size, phase, twinkle amount

    // Galactic plane orientation for the dense band.
    const bandNormal = new THREE.Vector3(0.35, 0.9, 0.25).normalize();
    const bandQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), bandNormal);
    const v = new THREE.Vector3();

    const clusters = [];
    for (let i = 0; i < 9; i++) {
      const c = [0, 0, 0];
      onSphere(rand, c);
      clusters.push({ dir: new THREE.Vector3(c[0], c[1], c[2]), spread: 0.02 + rand() * 0.05 });
    }

    for (let i = 0; i < count; i++) {
      const r = rand();
      if (r < 0.34) {
        // band: gaussian latitude around the galactic plane
        const lon = rand() * Math.PI * 2;
        const lat = gauss(rand) * 0.16;
        v.set(Math.cos(lon) * Math.cos(lat), Math.sin(lat), Math.sin(lon) * Math.cos(lat)).applyQuaternion(bandQ);
      } else if (r < 0.44) {
        const c = clusters[(rand() * clusters.length) | 0];
        v.set(gauss(rand), gauss(rand), gauss(rand)).multiplyScalar(c.spread).add(c.dir).normalize();
      } else {
        const a = [0, 0, 0];
        onSphere(rand, a);
        v.set(a[0], a[1], a[2]);
      }
      positions[i * 3] = v.x * SKY_RADIUS;
      positions[i * 3 + 1] = v.y * SKY_RADIUS;
      positions[i * 3 + 2] = v.z * SKY_RADIUS;

      const mag = Math.pow(rand(), 7.0); // few bright, many faint
      const col = pickColor(rand());
      const intensity = 0.3 + mag * 2.6;
      colors[i * 3] = col[0] * intensity;
      colors[i * 3 + 1] = col[1] * intensity;
      colors[i * 3 + 2] = col[2] * intensity;
      params[i * 3] = 1.4 + mag * 5.2;
      params[i * 3 + 1] = rand() * 6.283;
      params[i * 3 + 2] = rand() < 0.3 ? 0.25 + rand() * 0.45 : 0.05;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aParams', new THREE.BufferAttribute(params, 3));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uZoom: { value: 1 },
        uDim: { value: 1 },
        uFwd: { value: new THREE.Vector3(0, 0, -1) },
        uAberr: { value: 0 },
      },
      vertexShader: /* glsl */ `
        attribute vec3 aColor; attribute vec3 aParams;
        uniform float uTime, uPixelRatio, uZoom, uDim, uAberr; uniform vec3 uFwd;
        varying vec3 vColor; varying float vBig;
        void main(){
          float tw = 1.0 + aParams.z * sin(uTime * (0.6 + aParams.y * 0.35) + aParams.y * 40.0);
          vColor = aColor * tw * uDim;
          float size = aParams.x * mix(1.0, uZoom, 0.5);
          vBig = smoothstep(4.5, 7.5, aParams.x);
          gl_PointSize = max(size * uPixelRatio, 1.6);
          // warp: starlight crowds towards the direction of travel (stylised relativistic aberration)
          vec3 d = normalize(normalize(position) + uFwd * uAberr);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(d * ${SKY_RADIUS.toFixed(1)}, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor; varying float vBig;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float d = length(c) * 2.0;
          float core = exp(-d * d * 9.0);
          float halo = exp(-d * 3.6) * 0.16;
          // faint diffraction cross on the few brightest stars only
          float spike = (exp(-abs(c.x) * 55.0) + exp(-abs(c.y) * 55.0)) * exp(-d * 3.0) * 0.5 * vBig;
          float a = (core + halo + spike) * smoothstep(1.0, 0.75, d);
          gl_FragColor = vec4(vColor * a, 1.0);
        }`,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    this.object = new THREE.Points(geo, this.material);
    this.object.frustumCulled = false;
    this.object.renderOrder = -20;
  }

  update(time, camera) {
    this.material.uniforms.uTime.value = time;
    this.object.position.copy(camera.position);
  }

  dispose() {
    this.object.geometry.dispose();
    this.material.dispose();
  }
}

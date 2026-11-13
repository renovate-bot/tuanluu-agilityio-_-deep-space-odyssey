import * as THREE from 'three';
import { mulberry32 } from '../../utils/rng.js';

/** 1-D ring profile (colour + density) loosely following Saturn's C / B / Cassini / A structure. */
export function createRingTexture(seed = 7) {
  const W = 2048;
  const data = new Uint8Array(W * 4);
  const rand = mulberry32(seed);
  // smooth random bands at several scales
  const layers = [8, 24, 70, 190, 520].map((n) => Array.from({ length: n + 2 }, () => rand()));
  const sample = (arr, u) => {
    const x = u * (arr.length - 2);
    const i = Math.floor(x), f = x - i;
    const s = f * f * (3 - 2 * f);
    return arr[i] * (1 - s) + arr[i + 1] * s;
  };
  const INNER = 1.24, OUTER = 2.27;
  for (let i = 0; i < W; i++) {
    const u = i / (W - 1);
    const r = INNER + (OUTER - INNER) * u;
    let d;
    if (r < 1.53) d = 0.1 + 0.22 * ((r - INNER) / (1.53 - INNER)); // C ring: faint
    else if (r < 1.95) d = 0.72 + 0.25 * Math.sin((r - 1.53) * 9); // B ring: dense
    else if (r < 2.03) d = 0.04; // Cassini division
    else d = 0.52; // A ring
    if (Math.abs(r - 2.214) < 0.006) d = 0.02; // Encke gap
    const fine = 0.5 * sample(layers[2], u) + 0.3 * sample(layers[3], u) + 0.2 * sample(layers[4], u);
    const coarse = 0.6 * sample(layers[0], u) + 0.4 * sample(layers[1], u);
    d *= 0.55 + 0.6 * fine;
    d *= 0.8 + 0.4 * coarse;
    const edge = Math.min(1, u / 0.02) * Math.min(1, (1 - u) / 0.012);
    d = Math.max(0, Math.min(1, d * edge));
    const warm = 0.75 + 0.25 * sample(layers[1], u);
    data[i * 4] = 255 * Math.min(1, 0.86 * warm + 0.08);
    data[i * 4 + 1] = 255 * Math.min(1, 0.78 * warm + 0.05);
    data[i * 4 + 2] = 255 * Math.min(1, 0.62 * warm);
    data[i * 4 + 3] = 255 * d;
  }
  const tex = new THREE.DataTexture(data, W, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/** Planetary rings: lit and back-lit shading, plus the planet's shadow across them. */
export class Rings {
  constructor(planet, { inner = 1.24, outer = 2.27, texture }) {
    this.planet = planet;
    this.texture = texture || createRingTexture();
    const R = planet.radius;
    const geo = new THREE.RingGeometry(R * inner, R * outer, 256, 1);
    this.uniforms = {
      uTex: { value: this.texture },
      uSunDir: planet.uniforms.uSunDir,
      uSunColor: planet.uniforms.uSunColor,
      uCenter: planet.uniforms.uCenter,
      uNormal: planet.uniforms.uRingNormal,
      uRange: { value: new THREE.Vector2(R * inner, R * outer) },
      uRadius: { value: R },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        varying vec3 vWorld; varying float vR;
        void main(){ vR = length(position.xy); vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uTex; uniform vec3 uSunDir, uSunColor, uCenter, uNormal; uniform vec2 uRange; uniform float uRadius;
        varying vec3 vWorld; varying float vR;
        void main(){
          float u = (vR - uRange.x) / (uRange.y - uRange.x);
          vec4 t = texture2D(uTex, vec2(u, 0.5));
          vec3 V = normalize(cameraPosition - vWorld);
          float sunSide = dot(uNormal, uSunDir), viewSide = dot(uNormal, V);
          float elev = 0.35 + 0.65 * sqrt(abs(sunSide));
          vec3 col;
          if (sunSide * viewSide > 0.0) {
            col = t.rgb * elev * (0.55 + 0.45 * t.a);
          } else {
            // back-lit: light filters through thin regions, dense bands go dark
            float trans = t.a * exp(-t.a * 3.2) * 3.4;
            col = t.rgb * trans * elev;
          }
          col *= 1.0 + 2.0 * pow(max(dot(-V, uSunDir), 0.0), 10.0);
          // shadow of the globe
          vec3 oc = vWorld - uCenter; float b = dot(oc, uSunDir); float disc = b * b - (dot(oc, oc) - uRadius * uRadius);
          float shadow = (b < 0.0) ? 1.0 - smoothstep(0.0, uRadius * uRadius * 0.03, disc) : 1.0;
          gl_FragColor = vec4(col * uSunColor * (0.03 + 0.97 * shadow), t.a * 0.96);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.renderOrder = 1;
    planet.group.add(this.mesh);

    planet.uniforms.uRingTex.value = this.texture;
    planet.uniforms.uRingRange.value.set(R * inner, R * outer);
    planet.uniforms.uRingShadow.value = 0.85;
    this._n = new THREE.Vector3();
  }

  update() {
    this._n.set(0, 1, 0).applyQuaternion(this.planet.group.quaternion);
    this.planet.uniforms.uRingNormal.value.copy(this._n);
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}

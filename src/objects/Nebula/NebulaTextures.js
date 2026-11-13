import { NOISE_GLSL } from '../../shaders/noise.glsl.js';
import { bakeTexture } from '../../utils/bake.js';
import * as THREE from 'three';

let cached = null;

/**
 * One atlas of 2×2 cloud "puffs", each a different domain-warped fbm.
 * r = main density, g = colour-mix field, b = bright filaments, a = irregular falloff mask.
 */
export function getNebulaAtlas(renderer, size = 2048) {
  if (cached) return cached;
  cached = bakeTexture(
    renderer,
    /* glsl */ `
    varying vec2 vUv;
    ${NOISE_GLSL}
    void main(){
      vec2 tile = floor(vUv * 2.0); vec2 uv = fract(vUv * 2.0);
      float seed = tile.x * 17.0 + tile.y * 41.0 + 3.0;
      vec2 p = (uv - 0.5) * 2.0;
      vec3 q = vec3(p * 1.6, seed);
      vec3 w = q + 0.22 * vec3(fbm(q * 0.8 + 5.0, 3), fbm(q * 0.8 + 9.0, 3), 0.0);
      float dens = fbm(w * 1.1, 6) * 0.5 + 0.5;
      dens = smoothstep(0.22, 0.9, dens);
      dens *= dens * (1.6 - 0.6 * dens);
      float mixf = fbm(w * 0.9 + 30.0, 5) * 0.5 + 0.5;
      float fil = pow(ridged(w * 1.2 + 11.0, 4), 3.2);
      float rim = length(p) + 0.28 * fbm(vec3(p * 2.2, seed + 4.0), 5);
      float mask = 1.0 - smoothstep(0.25, 0.95, rim);
      gl_FragColor = vec4(dens, mixf, fil, mask);
    }`,
    size, size, {}, { wrapS: THREE.ClampToEdgeWrapping, anisotropy: 1 },
  );
  return cached;
}

export function disposeNebulaAtlas() {
  if (cached) cached.dispose();
  cached = null;
}

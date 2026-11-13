import { NOISE_GLSL } from '../../shaders/noise.glsl.js';
import { bakeTexture, EQUIRECT_GLSL } from '../../utils/bake.js';
import { SURFACES } from './surfaces.js';

const frag = (body, fn) => /* glsl */ `
varying vec2 vUv;
${NOISE_GLSL}
${EQUIRECT_GLSL}
${body}
void main(){
  vec3 p = dirFromUv(vUv);
  vec4 s = ${fn}(p);
  ${fn === 'surface' ? 's.rgb = sqrt(clamp(s.rgb, 0.0, 1.0));' : ''}
  gl_FragColor = clamp(s, 0.0, 1.0);
}`;

/** Bake a body's procedural surface into two equirect textures. Returns { surface, extra } render targets. */
export function bakePlanet(renderer, key, size = 2048, anisotropy = 8) {
  const body = SURFACES[key];
  if (!body) throw new Error(`Unknown surface "${key}"`);
  const surface = bakeTexture(renderer, frag(body, 'surface'), size, size / 2, {}, { anisotropy });
  const extra = bakeTexture(renderer, frag(body, 'extra'), size, size / 2, {}, { anisotropy });
  return { surface, extra };
}

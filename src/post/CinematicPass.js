import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

/** Final grade: restrained chromatic fringe, vignette, film grain, fades and the warp arrival flash. */
export function createCinematicPass() {
  const pass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uTime: { value: 0 },
      uWarp: { value: 0 },
      uFade: { value: 1 },
      uFlash: { value: 0 },
      uVignette: { value: 0.55 },
      uGrain: { value: 0.035 },
      uTint: { value: new THREE.Color(1, 1, 1) },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime, uWarp, uFade, uFlash, uVignette, uGrain; uniform vec3 uTint;
      varying vec2 vUv;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 c = vUv - 0.5; float r = length(c);
        float ca = (0.0007 + 0.0035 * uWarp) * smoothstep(0.1, 0.75, r);
        vec3 col;
        col.r = texture2D(tDiffuse, vUv - c * ca * 2.0).r;
        col.g = texture2D(tDiffuse, vUv).g;
        col.b = texture2D(tDiffuse, vUv + c * ca * 2.0).b;
        col *= uTint;
        col *= 1.0 - uVignette * smoothstep(0.35, 0.95, r);
        col += (hash(vUv * 917.0 + fract(uTime) * 31.0) - 0.5) * uGrain * (0.4 + col.g);
        col += vec3(0.75, 0.88, 1.0) * uFlash;
        gl_FragColor = vec4(max(col, 0.0) * (1.0 - uFade), 1.0);
      }`,
  });
  return pass;
}

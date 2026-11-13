import * as THREE from 'three';
import { NOISE_GLSL } from '../../shaders/noise.glsl.js';
import { bakeTexture, EQUIRECT_GLSL } from '../../utils/bake.js';

/**
 * Very dim baked backdrop: a galactic haze band with dust lanes and faint colour variation,
 * so the void is never a flat black. Drawn on an inverted sphere that follows the camera.
 */
export class SkyDome {
  constructor(renderer, { size = 2048 } = {}) {
    this.target = bakeTexture(
      renderer,
      /* glsl */ `
      varying vec2 vUv;
      ${NOISE_GLSL}
      ${EQUIRECT_GLSL}
      void main(){
        vec3 d = dirFromUv(vUv);
        vec3 n = normalize(vec3(0.35, 0.9, 0.25));
        float lat = dot(d, n);
        float band = exp(-lat * lat / 0.035);
        float clouds = fbm(d * 3.0 + 4.0, 6) * 0.5 + 0.5;
        float lanes = smoothstep(0.35, 0.75, fbm(d * 6.5 + vec3(9.0, 2.0, 5.0), 6) * 0.5 + 0.5 + (1.0 - band) * 0.3);
        float glow = band * (0.35 + 0.9 * clouds) * (1.0 - 0.75 * lanes * band);
        // brighter bulge towards one direction of the band
        vec3 core = normalize(cross(n, vec3(0.0, 0.0, 1.0)));
        float bulge = pow(max(dot(d, core), 0.0), 6.0);
        vec3 col = mix(vec3(0.42, 0.52, 0.85), vec3(1.0, 0.82, 0.6), bulge) * glow * (0.5 + 1.3 * bulge);
        // large-scale faint colour wash
        float wash = fbm(d * 1.2 + 20.0, 4) * 0.5 + 0.5;
        col += mix(vec3(0.04, 0.02, 0.09), vec3(0.01, 0.05, 0.08), wash) * (0.25 + 0.5 * fbm(d * 2.2, 4));
        col = max(col, 0.0) * 0.16;
        gl_FragColor = vec4(sqrt(col), 1.0);
      }`,
      size,
      size / 2,
    );
    this.material = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: this.target.texture }, uDim: { value: 1 } },
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `uniform sampler2D uMap; uniform float uDim; varying vec2 vUv;
        void main(){ vec3 c = texture2D(uMap, vUv).rgb; gl_FragColor = vec4(c * c * uDim, 1.0); }`,
      side: THREE.BackSide,
      depthWrite: false,
    });
    this.object = new THREE.Mesh(new THREE.SphereGeometry(3.4e6, 48, 24), this.material);
    this.object.frustumCulled = false;
    this.object.renderOrder = -30;
  }

  update(camera) {
    this.object.position.copy(camera.position);
  }

  dispose() {
    this.object.geometry.dispose();
    this.material.dispose();
    this.target.dispose();
  }
}

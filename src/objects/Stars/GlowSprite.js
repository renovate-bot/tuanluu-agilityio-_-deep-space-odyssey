import * as THREE from 'three';

const QUAD = new THREE.PlaneGeometry(1, 1);

/**
 * Camera-facing glow used for suns, galactic cores and soft halos.
 * `core` adds a hard stellar disc, `streak` a faint horizontal lens streak.
 */
export class GlowSprite {
  constructor({ size, color = 0xffffff, intensity = 1, core = 0, coreSize = 0.05, streak = 0, falloff = 2.0, rays = 0 }) {
    this.uniforms = {
      uSize: { value: size },
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uCore: { value: core },
      uCoreSize: { value: coreSize },
      uStreak: { value: streak },
      uFalloff: { value: falloff },
      uRays: { value: rays },
      uTime: { value: 0 },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        uniform float uSize; varying vec2 vC;
        void main(){
          vC = position.xy * 2.0;
          vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mv.xy += position.xy * uSize;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uIntensity, uCore, uCoreSize, uStreak, uFalloff, uRays, uTime;
        varying vec2 vC;
        void main(){
          float d = length(vC);
          float edge = pow(max(1.0 - d, 0.0), 2.0);
          float glow = edge * (0.012 / (pow(d, uFalloff) + 0.012));
          float ang = atan(vC.y, vC.x);
          float rays = (0.5 + 0.5 * sin(ang * 7.0 + uTime * 0.05)) * (0.5 + 0.5 * sin(ang * 13.0 - uTime * 0.03 + 1.7));
          glow *= 1.0 + uRays * rays * smoothstep(0.02, 0.3, d);
          float core = uCore * smoothstep(uCoreSize, uCoreSize * 0.75, d);
          float streak = uStreak * exp(-abs(vC.y) * 70.0) * pow(max(1.0 - abs(vC.x), 0.0), 3.0);
          vec3 col = uColor * (glow + streak) * uIntensity + mix(uColor, vec3(1.0), 0.7) * core;
          gl_FragColor = vec4(col, 1.0);
        }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    this.object = new THREE.Mesh(QUAD, this.material);
    this.object.frustumCulled = false;
  }

  dispose() { this.material.dispose(); }
}

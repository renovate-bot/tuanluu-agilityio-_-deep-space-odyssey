import * as THREE from 'three';
import { mulberry32, gauss } from '../../utils/rng.js';
import { NOISE_GLSL } from '../../shaders/noise.glsl.js';
import { bakeTexture } from '../../utils/bake.js';
import { StarCloud } from '../Stars/StarCloud.js';
import { GlowSprite } from '../Stars/GlowSprite.js';

const ARMS = 2;
const TWIST = 2.6; // radians of winding per e-fold of radius

/**
 * Spiral galaxy = baked disc (diffuse arm light + dust lanes) + a large additive point cloud + core glow.
 * The same logarithmic spiral drives both the texture and the particle distribution so they line up.
 */
export class SpiralGalaxy {
  constructor(renderer, { radius = 60000, count = 150000, seed = 11, pixelRatio = 1, textureSize = 2048 }) {
    this.radius = radius;
    this.group = new THREE.Group();
    this.spin = new THREE.Group();
    this.group.add(this.spin);

    this.target = bakeTexture(
      renderer,
      /* glsl */ `
      varying vec2 vUv;
      ${NOISE_GLSL}
      float arm(float phase, float sharp){ return pow(0.5 + 0.5 * cos(phase), sharp); }
      void main(){
        vec2 p = (vUv - 0.5) * 2.0; float r = length(p); float th = atan(p.y, p.x);
        float wob = 0.5 * fbm(vec3(p * 3.0, 1.0), 5);
        float phase = ${ARMS.toFixed(1)} * (th - ${TWIST.toFixed(2)} * log(max(r, 0.02) / 0.06)) + wob;
        float a1 = arm(phase, 3.0);
        float a2 = arm(phase * 2.0 + 1.3, 4.0) * 0.35; // fainter spurs between the main arms
        float clump = fbm(vec3(p * 9.0, 4.0), 6) * 0.5 + 0.5;
        float fine = fbm(vec3(p * 26.0, 8.0), 5) * 0.5 + 0.5;
        float disc = exp(-r * 3.4) * smoothstep(1.0, 0.72, r);
        float bar = exp(-pow(length(p * vec2(1.0, 2.6) * mat2(0.8, -0.6, 0.6, 0.8)) / 0.16, 2.0));
        float bulge = exp(-r * r * 70.0);
        float arms = (a1 + a2) * (0.35 + 0.9 * clump) * smoothstep(0.05, 0.16, r);
        vec3 col = vec3(0.5, 0.62, 1.0) * arms * disc * 2.6;
        col += vec3(1.0, 0.86, 0.62) * (disc * 0.45 + bar * 0.4 + bulge * 1.0);
        // star-forming regions strung along the arms
        float hii = smoothstep(0.72, 0.9, fine * (0.4 + 0.6 * clump)) * a1 * disc * 5.0 * smoothstep(0.1, 0.25, r);
        col += vec3(1.0, 0.32, 0.5) * hii;
        // dust hugs the inner edge of each arm
        float dust = arm(phase + 0.75, 5.0) * smoothstep(0.3, 0.75, fbm(vec3(p * 13.0, 2.0), 6) * 0.5 + 0.5 + 0.2);
        dust *= smoothstep(0.04, 0.12, r) * smoothstep(0.95, 0.4, r);
        gl_FragColor = vec4(sqrt(clamp(col * 0.6, 0.0, 1.0)), clamp(dust, 0.0, 1.0));
      }`,
      textureSize, textureSize, {}, { wrapS: THREE.ClampToEdgeWrapping },
    );

    const plane = new THREE.PlaneGeometry(radius * 2, radius * 2);
    const vs = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
    this.hazeMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: this.target.texture }, uGain: { value: 1.0 } },
      vertexShader: vs,
      fragmentShader: /* glsl */ `uniform sampler2D uMap; uniform float uGain; varying vec2 vUv;
        void main(){ vec3 c = texture2D(uMap, vUv).rgb; gl_FragColor = vec4(c * c * uGain, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    this.dustMat = new THREE.ShaderMaterial({
      uniforms: { uMap: { value: this.target.texture } },
      vertexShader: vs,
      fragmentShader: /* glsl */ `uniform sampler2D uMap; varying vec2 vUv;
        void main(){ gl_FragColor = vec4(0.012, 0.006, 0.004, texture2D(uMap, vUv).a * 0.72); }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    });
    const haze = new THREE.Mesh(plane, this.hazeMat);
    haze.rotation.x = -Math.PI / 2; haze.renderOrder = 1;
    const dust = new THREE.Mesh(plane, this.dustMat);
    dust.rotation.x = -Math.PI / 2; dust.renderOrder = 3;
    this.spin.add(haze, dust);
    this.plane = plane;

    // particles
    const rand = mulberry32(seed);
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3), sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const kind = rand();
      let x, y, z, cr, cg, cb, b;
      if (kind < 0.16) {
        // bulge
        const rr = Math.abs(gauss(rand)) * 0.07 * radius;
        const u = rand() * 2 - 1, a = rand() * 6.283, s = Math.sqrt(1 - u * u);
        x = Math.cos(a) * s * rr; z = Math.sin(a) * s * rr; y = u * rr * 0.6;
        cr = 1.0; cg = 0.84; cb = 0.6; b = 0.5 + rand() * 0.9;
      } else {
        const r = Math.min(0.98, -Math.log(1 - rand() * 0.97) * 0.26 + 0.03);
        const inArm = kind < 0.8;
        const armIdx = (rand() * ARMS) | 0;
        let th = TWIST * Math.log(r / 0.06) + (armIdx * Math.PI * 2) / ARMS;
        th += inArm ? gauss(rand) * (0.16 + 0.12 * r) : rand() * 6.283;
        x = Math.cos(th) * r * radius; z = -Math.sin(th) * r * radius;
        y = gauss(rand) * radius * 0.012 * (1 + 2.5 * Math.exp(-r * 8));
        const young = inArm && rand() < 0.55;
        if (young) { cr = 0.62; cg = 0.76; cb = 1.0; b = 0.5 + Math.pow(rand(), 3) * 2.4; }
        else { cr = 1.0; cg = 0.88; cb = 0.72; b = 0.3 + rand() * 0.6; }
        if (inArm && rand() < 0.035) { cr = 1.0; cg = 0.35; cb = 0.55; b = 2.2; } // HII knots
        b *= 0.55 + 0.6 * Math.exp(-r * 2.2);
      }
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
      colors[i * 3] = cr * b; colors[i * 3 + 1] = cg * b; colors[i * 3 + 2] = cb * b;
      sizes[i] = radius * (0.0016 + Math.pow(rand(), 6) * 0.004);
    }
    this.cloud = new StarCloud({ positions, colors, sizes }, { pixelRatio, scale: 700, minSize: 1.25, maxSize: 9, opacity: 0.8 });
    this.cloud.object.renderOrder = 2;
    this.cloud.object.frustumCulled = false;
    this.spin.add(this.cloud.object);

    this.core = new GlowSprite({ size: radius * 0.6, color: 0xffdcaa, intensity: 0.7, falloff: 1.5 });
    this.core.object.renderOrder = 4;
    this.group.add(this.core.object);
  }

  update(dt) {
    this.spin.rotation.y += dt * 0.0012;
  }

  setPixelRatio(pr) { this.cloud.setPixelRatio(pr); }

  dispose() {
    this.plane.dispose(); this.hazeMat.dispose(); this.dustMat.dispose(); this.target.dispose();
    this.cloud.dispose(); this.core.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

import * as THREE from 'three';
import { NOISE_GLSL } from '../../shaders/noise.glsl.js';

const QUAD = new THREE.PlaneGeometry(1, 1);

/**
 * The Sun as a body rather than a sprite: a convecting photosphere with limb darkening and sunspots,
 * a streaming corona, and a wide soft glow that carries it when it is only a point in the sky.
 * Colours are HDR so the bloom pass picks the disc up without help.
 */
export class Sun {
  constructor({ radius, detail = 1 }) {
    this.radius = radius;
    this.group = new THREE.Group();
    this.uTime = { value: 0 };

    this.surface = new THREE.ShaderMaterial({
      uniforms: { uTime: this.uTime, uNear: { value: 0 } },
      defines: { OCT: detail > 0.5 ? 5 : 3 },
      vertexShader: /* glsl */ `varying vec3 vP; varying vec3 vN; varying vec3 vW;
        void main(){ vP = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: /* glsl */ `uniform float uTime, uNear; varying vec3 vP; varying vec3 vN; varying vec3 vW;
        ${NOISE_GLSL}
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          float mu = max(dot(normalize(vN), V), 0.0);
          float t = uTime * 0.02;
          // slow large cells with fast fine granulation on top; the fine layer only resolves up close
          vec3 q = vP * 3.0 + vec3(0.0, t, 0.0);
          float big = fbm(q + 0.6 * vec3(snoise(q * 0.7 + t), snoise(q * 0.7 + 4.0 - t), snoise(q * 0.7 + 9.0)), OCT);
          float gran = snoise(vP * 42.0 + vec3(t * 5.0, 0.0, -t * 3.0)) * 0.5 + snoise(vP * 110.0 - vec3(0.0, t * 9.0, 0.0)) * 0.3;
          float heat = 0.62 + 0.3 * big + 0.1 * gran * uNear;
          // sunspots: dark cores inside the active latitudes, each with a paler penumbra
          float act = smoothstep(0.62, 0.2, abs(abs(vP.y) - 0.28) * 3.0);
          float sp = snoise(vP * 5.5 + vec3(11.0, 0.0, t * 0.6));
          float spot = smoothstep(0.62, 0.8, sp) * act;
          heat *= 1.0 - 0.36 * spot - 0.14 * smoothstep(0.5, 0.62, sp) * act;
          // bright faculae near active regions
          heat += 0.25 * smoothstep(0.35, 0.6, sp) * (1.0 - smoothstep(0.6, 0.66, sp)) * act * (1.0 - mu);
          vec3 cool = vec3(1.0, 0.36, 0.06), mid = vec3(1.0, 0.68, 0.24), hot = vec3(1.0, 0.94, 0.78);
          vec3 col = mix(cool, mid, smoothstep(0.25, 0.62, heat));
          col = mix(col, hot, smoothstep(0.6, 1.0, heat));
          // limb darkening (redder and dimmer towards the edge)
          float limb = 0.32 + 0.68 * pow(mu, 0.55);
          col *= mix(vec3(1.0, 0.62, 0.34), vec3(1.0), pow(mu, 0.5)) * limb;
          gl_FragColor = vec4(col * mix(3.2, 1.05, uNear), 1.0);
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 96, 48), this.surface);
    this.group.add(this.mesh);

    // corona: camera-facing, streamers drift slowly and are brightest near the limb
    this.coronaU = { uTime: this.uTime, uSize: { value: radius * 7 }, uDisc: { value: 1 / 3.5 }, uGain: { value: 1 } };
    this.corona = new THREE.Mesh(QUAD, new THREE.ShaderMaterial({
      uniforms: this.coronaU,
      vertexShader: /* glsl */ `uniform float uSize; varying vec2 vC;
        void main(){ vC = position.xy * 2.0; vec4 mv = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0); mv.xy += position.xy * uSize; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform float uTime, uDisc, uGain; varying vec2 vC;
        ${NOISE_GLSL}
        void main(){
          float d = length(vC);
          float r = d / uDisc;                         // 1.0 at the limb
          float ang = atan(vC.y, vC.x);
          vec3 q = vec3(cos(ang) * 2.2, sin(ang) * 2.2, uTime * 0.012);
          float stream = fbm(q + vec3(0.0, 0.0, r * 0.25), 4) * 0.5 + 0.5;
          float fine = snoise(vec3(cos(ang) * 9.0, sin(ang) * 9.0, uTime * 0.03 + r * 0.6)) * 0.5 + 0.5;
          float fall = exp(-(r - 1.0) * (1.5 + 2.4 * (1.0 - stream))) * smoothstep(0.86, 1.02, r);
          float inner = exp(-(r - 1.0) * 9.0) * smoothstep(0.9, 1.0, r);
          float a = fall * (0.3 + 0.55 * stream + 0.25 * fine * stream) + inner * 1.2;
          a *= pow(max(1.0 - d, 0.0), 1.5);
          vec3 col = mix(vec3(1.0, 0.5, 0.18), vec3(1.0, 0.86, 0.62), clamp(inner * 2.0 + stream * 0.5, 0.0, 1.0));
          gl_FragColor = vec4(col * a * uGain, 1.0);
        }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    }));
    this.corona.frustumCulled = false;
    this.corona.renderOrder = 3;
    this.group.add(this.corona);
  }

  /** @param distance from the camera, in scene units */
  update(time, distance) {
    this.uTime.value = time;
    const r = distance / this.radius;
    this.surface.uniforms.uNear.value = 1 - THREE.MathUtils.smoothstep(r, 4, 14);
    // far away the corona would be sub-pixel noise; let the wide glow sprite take over
    this.coronaU.uGain.value = 0.25 + 0.45 * (1 - THREE.MathUtils.smoothstep(r, 12, 60));
    this.mesh.rotation.y = time * 0.004;
  }

  dispose() {
    this.mesh.geometry.dispose();
    this.surface.dispose();
    this.corona.material.dispose();
  }
}

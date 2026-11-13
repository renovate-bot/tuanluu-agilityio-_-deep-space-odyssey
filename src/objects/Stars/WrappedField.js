import * as THREE from 'three';
import { mulberry32 } from '../../utils/rng.js';

/**
 * Particles that live in a cube wrapped around the ship. Because the cube tiles, the field is endless:
 * travelling produces real parallax, and during warp each particle is drawn as a streak along the velocity.
 * Used twice: mid-field stars (huge box) and near space dust (small box, slow drift).
 */
export class WrappedField {
  constructor({ count, box, size, seed = 1, color = [1, 1, 1], colorVar = 0.3, streaks = false, drift = 0, opacity = 1, pixelRatio = 1 }) {
    this.box = box;
    this.drift = drift;
    const rand = mulberry32(seed);
    const stride = streaks ? 2 : 1;
    const pos = new Float32Array(count * stride * 3);
    const col = new Float32Array(count * stride * 3);
    const par = new Float32Array(count * stride * 2); // size, end flag
    for (let i = 0; i < count; i++) {
      const x = rand() * box, y = rand() * box, z = rand() * box;
      const warm = rand();
      const b = 0.35 + Math.pow(rand(), 3) * 1.6;
      const r = (color[0] + (warm - 0.5) * colorVar) * b;
      const g = color[1] * b;
      const bl = (color[2] - (warm - 0.5) * colorVar) * b;
      const s = size * (0.5 + rand());
      for (let k = 0; k < stride; k++) {
        const o = (i * stride + k) * 3;
        pos[o] = x; pos[o + 1] = y; pos[o + 2] = z;
        col[o] = r; col[o + 1] = g; col[o + 2] = bl;
        par[(i * stride + k) * 2] = s;
        par[(i * stride + k) * 2 + 1] = k;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aParams', new THREE.BufferAttribute(par, 2));

    const uniforms = {
      uOffset: { value: new THREE.Vector3() },
      uBox: { value: box },
      uPixelRatio: { value: pixelRatio },
      uScale: { value: 600 },
      uStreak: { value: new THREE.Vector3() },
      uOpacity: { value: opacity },
    };
    this.uniforms = uniforms;

    const vertex = /* glsl */ `
      attribute vec3 aColor; attribute vec2 aParams;
      uniform vec3 uOffset, uStreak; uniform float uBox, uPixelRatio, uScale, uOpacity;
      varying vec3 vColor;
      void main(){
        vec3 p = mod(position - uOffset, uBox) - 0.5 * uBox;
        float edge = 1.0 - smoothstep(0.32 * uBox, 0.5 * uBox, length(p));
        p += uStreak * aParams.y;
        vec4 mv = viewMatrix * vec4(p + cameraPosition, 1.0);
        gl_Position = projectionMatrix * mv;
        float s = aParams.x * uScale * uPixelRatio / max(-mv.z, 1.0);
        gl_PointSize = clamp(s, 1.2, 14.0);
        // tiny far particles fade instead of shimmering
        vColor = aColor * edge * uOpacity * clamp(s / 1.2, 0.15, 1.0) * (1.0 - 0.6 * aParams.y);
      }`;

    if (streaks) {
      this.material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: vertex,
        fragmentShader: /* glsl */ `varying vec3 vColor; void main(){ gl_FragColor = vec4(vColor, 1.0); }`,
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
      });
      this.object = new THREE.LineSegments(geo, this.material);
      // the same buffers drawn as points give the resting look
      this.pointMaterial = new THREE.ShaderMaterial({
        uniforms: { ...uniforms, uStreak: { value: new THREE.Vector3() } },
        vertexShader: vertex,
        fragmentShader: POINT_FRAG,
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
      });
      const pts = new THREE.Points(geo, this.pointMaterial);
      pts.frustumCulled = false;
      this.object.add(pts);
    } else {
      this.material = new THREE.ShaderMaterial({
        uniforms, vertexShader: vertex, fragmentShader: POINT_FRAG,
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
      });
      this.object = new THREE.Points(geo, this.material);
    }
    this.object.frustumCulled = false;
    this._t = 0;
  }

  /** @param shipPos world position of the ship (doubles) @param streak world-space streak vector */
  update(dt, shipPos, streak, opacity = 1) {
    this._t += dt * this.drift;
    const b = this.box;
    const u = this.uniforms;
    // wrap on the CPU in double precision; the shader only ever sees small numbers
    u.uOffset.value.set(
      (((shipPos.x + this._t) % b) + b) % b,
      (((shipPos.y + this._t * 0.37) % b) + b) % b,
      (((shipPos.z - this._t * 0.61) % b) + b) % b,
    );
    u.uOpacity.value = opacity;
    if (streak) u.uStreak.value.copy(streak);
  }

  setPixelRatio(pr) { this.uniforms.uPixelRatio.value = pr; }

  dispose() {
    this.object.geometry.dispose();
    this.material.dispose();
    if (this.pointMaterial) this.pointMaterial.dispose();
  }
}

const POINT_FRAG = /* glsl */ `
varying vec3 vColor;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-d * d * 6.0) * smoothstep(1.0, 0.7, d);
  gl_FragColor = vec4(vColor * a, 1.0);
}`;

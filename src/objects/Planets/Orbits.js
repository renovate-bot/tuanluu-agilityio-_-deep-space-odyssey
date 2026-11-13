import * as THREE from 'three';
import { orbitPosition } from '../../config/solar.js';

/**
 * Orbit paths and far-range planet markers.
 *  - Paths: one thin loop per planet. They fade out close to the camera so no line cuts across a nearby world.
 *  - Beacons: one point per planet with a minimum on-screen size, so every world is findable from anywhere
 *    in the system even when its disc is smaller than a pixel.
 */
export class Orbits {
  constructor(planets, pixelRatio) {
    this.group = new THREE.Group();
    this.planets = planets;
    this.lineU = { uOpacity: { value: 0.3 }, uNear: { value: 9000 }, uFar: { value: 60000 } };
    this.lineMat = new THREE.ShaderMaterial({
      uniforms: this.lineU,
      vertexShader: /* glsl */ `attribute vec3 color; varying vec3 vCol; varying float vD;
        void main(){ vCol = color; vec4 mv = modelViewMatrix * vec4(position, 1.0); vD = length(mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform float uOpacity, uNear, uFar; varying vec3 vCol; varying float vD;
        void main(){ float a = smoothstep(uNear, uFar, vD) * uOpacity; gl_FragColor = vec4(vCol * a, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    const SEG = 360;
    const v = new THREE.Vector3();
    for (const p of planets) {
      const pos = new Float32Array((SEG + 1) * 3), col = new Float32Array((SEG + 1) * 3);
      const c = new THREE.Color(p.color || 0x7fb8ff);
      for (let i = 0; i <= SEG; i++) {
        orbitPosition(p, (i / SEG) * Math.PI * 2, v);
        pos.set([v.x, v.y, v.z], i * 3);
        col.set([c.r, c.g, c.b], i * 3);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const line = new THREE.Line(geo, this.lineMat);
      line.frustumCulled = false;
      this.group.add(line);
    }

    const n = planets.length;
    this.bPos = new Float32Array(n * 3);
    const bCol = new Float32Array(n * 3), bSize = new Float32Array(n);
    planets.forEach((p, i) => { const c = new THREE.Color(p.color || 0xffffff); bCol.set([c.r, c.g, c.b], i * 3); bSize[i] = p.radius; });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.bPos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(bSize, 1));
    this.beaconU = { uPixelRatio: { value: pixelRatio }, uScale: { value: 900 } };
    this.beacons = new THREE.Points(geo, new THREE.ShaderMaterial({
      uniforms: this.beaconU,
      vertexShader: /* glsl */ `attribute vec3 color; attribute float aRadius; uniform float uPixelRatio, uScale; varying vec3 vCol; varying float vA;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float d = length(mv.xyz);
          float px = aRadius * uScale / d;                 // approximate disc size on screen
          vA = 1.0 - smoothstep(2.0, 7.0, px);              // hand over to the real globe once it resolves
          vCol = color;
          gl_PointSize = 4.5 * uPixelRatio;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `varying vec3 vCol; varying float vA;
        void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = pow(max(1.0 - d, 0.0), 2.0) * vA; gl_FragColor = vec4(vCol * a * 1.6, 1.0); }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    }));
    this.beacons.frustumCulled = false;
    this.group.add(this.beacons);
  }

  /** @param positions map id → Vector3 (live) */
  /** Edge-on (inside the ecliptic) the paths pile up into a bright band, so they are dimmed there. */
  setElevation(k) { this.lineU.uOpacity.value = 0.02 + 0.33 * k; }

  update(positions) {
    this.planets.forEach((p, i) => { const v = positions[p.id]; this.bPos[i * 3] = v.x; this.bPos[i * 3 + 1] = v.y; this.bPos[i * 3 + 2] = v.z; });
    this.beacons.geometry.attributes.position.needsUpdate = true;
  }

  setPixelRatio(pr) { this.beaconU.uPixelRatio.value = pr; }

  dispose() {
    this.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    this.lineMat.dispose();
    this.beacons.material.dispose();
  }
}

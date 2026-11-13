import * as THREE from 'three';

/**
 * Streaks of light rushing past while the warp drive is engaged. A long open cylinder around the ship's
 * line of travel, drawn in the universe scene so it stays outside the glass.
 */
export class WarpTunnel {
  constructor() {
    this.uniforms = { uTime: { value: 0 }, uWarp: { value: 0 }, uColor: { value: new THREE.Color(0.45, 0.72, 1.0) } };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime, uWarp; uniform vec3 uColor; varying vec2 vUv;
        float hash(float n){ return fract(sin(n * 127.1) * 43758.5453); }
        float layer(float cells, float speed, float len){
          float cell = floor(vUv.x * cells); float h = hash(cell + cells);
          float on = step(0.62, h);
          float across = 1.0 - abs(fract(vUv.x * cells) - 0.5) * 2.0;
          float t = fract(vUv.y * (1.5 + h * 2.0) + uTime * speed * (0.6 + h) + h * 7.0);
          float streak = smoothstep(0.0, 0.03, t) * smoothstep(len, 0.03, t);
          return on * streak * pow(across, 3.0) * (0.4 + 0.6 * hash(cell * 3.1));
        }
        void main(){
          float s = layer(140.0, 1.6, 0.5) + layer(260.0, 2.3, 0.35) * 0.7 + layer(70.0, 1.1, 0.7) * 0.5;
          // fade both ends: nothing pops in beside the ship, and streaks melt into the vanishing point
          float ends = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
          vec3 col = mix(uColor, vec3(1.0), s * 0.5) * s * ends * uWarp * uWarp * 2.2;
          gl_FragColor = vec4(col, 1.0);
        }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, side: THREE.BackSide,
    });
    const geo = new THREE.CylinderGeometry(900, 260, 26000, 96, 1, true);
    geo.rotateX(-Math.PI / 2); // axis along -Z, wide end near the ship
    geo.translate(0, 0, -11000);
    this.object = new THREE.Mesh(geo, this.material);
    this.object.frustumCulled = false;
    this.object.visible = false;
    this.object.renderOrder = 8;
    this._from = new THREE.Vector3(0, 0, -1);
  }

  /** @param dir unit travel direction in world space */
  update(time, warp, dir) {
    this.object.visible = warp > 0.01;
    this.uniforms.uWarp.value = warp;
    this.uniforms.uTime.value = time;
    if (this.object.visible) this.object.quaternion.setFromUnitVectors(this._from, dir);
  }

  dispose() { this.object.geometry.dispose(); this.material.dispose(); }
}

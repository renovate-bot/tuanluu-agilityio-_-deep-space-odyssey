import * as THREE from 'three';

/**
 * A static cloud of additive points with distance attenuation. One draw call regardless of count.
 * Used for galaxies, clusters and stars embedded in nebulae.
 */
export class StarCloud {
  /** @param data { positions: Float32Array, colors: Float32Array, sizes: Float32Array } */
  constructor(data, { pixelRatio = 1, scale = 600, minSize = 1.3, maxSize = 24, opacity = 1 } = {}) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(data.colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(data.sizes, 1));
    geo.computeBoundingSphere();
    this.uniforms = {
      uPixelRatio: { value: pixelRatio },
      uScale: { value: scale },
      uMin: { value: minSize },
      uMax: { value: maxSize },
      uOpacity: { value: opacity },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: /* glsl */ `
        attribute vec3 aColor; attribute float aSize;
        uniform float uPixelRatio, uScale, uMin, uMax, uOpacity;
        varying vec3 vColor;
        void main(){
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          float s = aSize * uScale * uPixelRatio / max(-mv.z, 1.0);
          gl_PointSize = clamp(s, uMin, uMax);
          // sub-pixel stars keep their energy instead of aliasing
          vColor = aColor * uOpacity * clamp(s / uMin, 0.0, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vColor;
        void main(){
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = exp(-d * d * 5.0) * smoothstep(1.0, 0.7, d);
          gl_FragColor = vec4(vColor * a, 1.0);
        }`,
      blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
    });
    this.object = new THREE.Points(geo, this.material);
  }

  setPixelRatio(pr) { this.uniforms.uPixelRatio.value = pr; }

  dispose() {
    this.object.geometry.dispose();
    this.material.dispose();
  }
}

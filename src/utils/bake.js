import * as THREE from 'three';

const VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** GLSL helper: equirect uv → unit direction matching THREE.SphereGeometry's uv layout. */
export const EQUIRECT_GLSL = /* glsl */ `
vec3 dirFromUv(vec2 uv){
  float phi = uv.x * 6.28318530718; float theta = (1.0 - uv.y) * 3.14159265359;
  return vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));
}
`;

let quad = null;
let cam = null;

/**
 * Run a fragment shader once into a texture. Used to turn expensive procedural noise into cheap lookups.
 * Returns the WebGLRenderTarget (caller owns and disposes it; `.texture` is the map).
 */
export function bakeTexture(renderer, fragmentShader, width, height, uniforms = {}, opts = {}) {
  if (!quad) {
    quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    quad.frustumCulled = false;
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  }
  const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader, uniforms, depthTest: false, depthWrite: false });
  const target = new THREE.WebGLRenderTarget(width, height, {
    format: THREE.RGBAFormat,
    type: THREE.UnsignedByteType,
    depthBuffer: false,
    generateMipmaps: opts.mipmaps !== false,
    minFilter: opts.mipmaps !== false ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: opts.wrapS || THREE.RepeatWrapping,
    wrapT: opts.wrapT || THREE.ClampToEdgeWrapping,
  });
  target.texture.anisotropy = opts.anisotropy || 4;
  quad.material = material;
  const prev = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.render(quad, cam);
  renderer.setRenderTarget(prev);
  material.dispose();
  return target;
}

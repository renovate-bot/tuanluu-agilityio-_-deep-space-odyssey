import * as THREE from 'three';
import { bakePlanet } from './PlanetBaker.js';

const SPHERE_HI = new THREE.SphereGeometry(1, 128, 64);
const SPHERE_LO = new THREE.SphereGeometry(1, 40, 20);

const VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec3 vWorld; varying vec3 vObj;
void main(){
  vUv = uv; vObj = position;
  mat3 m = mat3(modelMatrix);
  vN = normalize(m * normal);
  vec3 t = cross(vec3(0.0, 1.0, 0.0), normal);
  t = length(t) < 1e-4 ? vec3(1.0, 0.0, 0.0) : normalize(t);
  vT = normalize(m * t);
  vB = normalize(m * cross(normal, t));
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */ `
uniform sampler2D uSurface, uExtra, uRingTex;
uniform vec3 uSunDir, uSunColor, uSun2Dir, uSun2Color;
uniform vec3 uAtmoColor, uTwilight, uEmissiveColor, uCloudColor, uSpecColor;
uniform float uBump, uCloudShift, uCloudAmount, uEmissiveNight, uEmissiveDay, uAtmoStrength, uSpec, uTexel, uTime, uAmbient;
uniform vec3 uRingNormal, uCenter; uniform vec2 uRingRange; uniform float uRingShadow;
varying vec2 vUv; varying vec3 vN; varying vec3 vT; varying vec3 vB; varying vec3 vWorld; varying vec3 vObj;

void main(){
  vec4 s = texture2D(uSurface, vUv);
  vec3 albedo = s.rgb * s.rgb;
  vec4 ex = texture2D(uExtra, vUv);
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vWorld);

  // height → normal (finite differences in texture space, widened at the poles)
  float lat = max(sqrt(max(1.0 - vObj.y * vObj.y, 0.0)), 0.08);
  float hx = texture2D(uSurface, vUv + vec2(uTexel / lat, 0.0)).a - texture2D(uSurface, vUv - vec2(uTexel / lat, 0.0)).a;
  float hy = texture2D(uSurface, vUv + vec2(0.0, uTexel)).a - texture2D(uSurface, vUv - vec2(0.0, uTexel)).a;
  vec3 Nb = normalize(N - uBump * (hx * normalize(vT) + hy * normalize(vB)));

  float ndlGeo = dot(N, uSunDir);
  float ndl = dot(Nb, uSunDir);
  float day = smoothstep(-0.12, 0.22, ndlGeo);
  float diffuse = max(ndl, 0.0) * smoothstep(-0.05, 0.12, ndlGeo);

  // clouds drift independently of the surface and cast a soft offset shadow
  vec2 cuv = vUv + vec2(uCloudShift, 0.0);
  float cloud = texture2D(uExtra, cuv).b * uCloudAmount;
  float cloudShadow = texture2D(uExtra, cuv + vec2(0.004, 0.002) * sign(ndlGeo + 0.001)).b * uCloudAmount;

  vec3 lit = albedo * diffuse * (1.0 - 0.45 * cloudShadow);
  // ocean / ice glint
  vec3 H = normalize(uSunDir + V);
  float spec = pow(max(dot(Nb, H), 0.0), 140.0) * ex.r * uSpec * day * (1.0 - cloud);
  lit += uSpecColor * spec;
  lit += albedo * uSpecColor * pow(max(dot(N, H), 0.0), 14.0) * ex.r * uSpec * 0.07 * day;

  vec3 col = lit * uSunColor;
  // second light (companion star)
  col += albedo * max(dot(Nb, uSun2Dir), 0.0) * uSun2Color;

  // ring shadow falling on the globe
  if (uRingShadow > 0.0) {
    float denom = dot(uSunDir, uRingNormal);
    float t = -dot(vWorld - uCenter, uRingNormal) / (abs(denom) < 1e-4 ? 1e-4 : denom);
    if (t > 0.0) {
      float r = length(vWorld + uSunDir * t - uCenter);
      float u = (r - uRingRange.x) / (uRingRange.y - uRingRange.x);
      if (u > 0.0 && u < 1.0) col *= 1.0 - texture2D(uRingTex, vec2(u, 0.5)).a * uRingShadow;
    }
  }

  // clouds
  float cloudLight = max(dot(N, uSunDir), 0.0) * smoothstep(-0.05, 0.15, ndlGeo);
  col = mix(col, uCloudColor * uSunColor * (cloudLight + 0.02), cloud);

  // sunset tint along the terminator
  float term = exp(-pow((ndlGeo - 0.03) / 0.075, 2.0));
  col += uTwilight * term * (0.2 + 0.8 * cloud) * 0.16 * uAtmoStrength;

  // emissive: city lights / bioluminescence
  float emi = ex.g * mix(uEmissiveNight, uEmissiveDay, day) * (1.0 - cloud * 0.8);
  col += uEmissiveColor * emi;

  // in-atmosphere haze towards the limb
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.2);
  col += uAtmoColor * fres * (0.12 + 0.88 * day) * uAtmoStrength;
  col += albedo * uAmbient;

  gl_FragColor = vec4(col, 1.0);
}`;

const ATMO_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vWorld;
void main(){
  vN = normalize(mat3(modelMatrix) * normal);
  vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const ATMO_FRAG = /* glsl */ `
uniform vec3 uColor, uTwilight, uSunDir; uniform float uLimb, uStrength, uFalloff;
varying vec3 vN; varying vec3 vWorld;
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vWorld);
  float d = max(dot(N, V), 0.0);
  // uLimb = cosine at which the solid planet's edge sits on this shell
  float outer = pow(clamp(d / uLimb, 0.0, 1.0), uFalloff);
  float inner = pow(clamp(1.0 - (d - uLimb) / (1.0 - uLimb), 0.0, 1.0), 5.0);
  float a = d < uLimb ? outer : inner;
  float sun = dot(N, uSunDir);
  float lit = smoothstep(-0.35, 0.45, sun);
  vec3 col = mix(uTwilight, uColor, smoothstep(-0.1, 0.5, sun));
  // forward scattering: the limb flares when looking towards the star
  float fwd = pow(max(dot(-V, uSunDir), 0.0), 6.0);
  gl_FragColor = vec4(col * a * lit * uStrength * (1.0 + 1.6 * fwd), 1.0);
}`;

/**
 * A lit globe built from baked procedural textures, with optional clouds, emissive night side,
 * ring shadow and one or more atmosphere shells.
 */
export class Planet {
  constructor(renderer, cfg) {
    this.cfg = cfg;
    this.radius = cfg.radius;
    this.group = new THREE.Group(); // position + axial tilt
    this.group.name = cfg.name;
    this.spin = new THREE.Group();
    this.group.add(this.spin);
    if (cfg.tilt) this.group.rotation.z = cfg.tilt;
    if (cfg.spin0) this.spin.rotation.y = cfg.spin0;

    const size = cfg.textureSize || 2048;
    this.targets = bakePlanet(renderer, cfg.surface, size, renderer.capabilities.getMaxAnisotropy());

    this.uniforms = {
      uSurface: { value: this.targets.surface.texture },
      uExtra: { value: this.targets.extra.texture },
      uRingTex: { value: null },
      uSunDir: { value: new THREE.Vector3(1, 0, 0) },
      uSunColor: { value: new THREE.Color(cfg.sunColor ?? 0xffffff).multiplyScalar(cfg.sunIntensity ?? 1.2) },
      uSun2Dir: { value: new THREE.Vector3(0, 1, 0) },
      uSun2Color: { value: new THREE.Color(0x000000) },
      uAtmoColor: { value: new THREE.Color(cfg.atmoColor ?? 0x000000) },
      uTwilight: { value: new THREE.Color(cfg.twilight ?? 0x000000) },
      uEmissiveColor: { value: new THREE.Color(cfg.emissiveColor ?? 0x000000) },
      uCloudColor: { value: new THREE.Color(cfg.cloudColor ?? 0xffffff) },
      uSpecColor: { value: new THREE.Color(cfg.specColor ?? 0xfff2dd) },
      uBump: { value: cfg.bump ?? 6 },
      uCloudShift: { value: 0 },
      uCloudAmount: { value: cfg.clouds ?? 0 },
      uEmissiveNight: { value: cfg.emissiveNight ?? 0 },
      uEmissiveDay: { value: cfg.emissiveDay ?? 0 },
      uAtmoStrength: { value: cfg.atmoInner ?? 0.6 },
      uSpec: { value: cfg.spec ?? 0 },
      uTexel: { value: 1.2 / size },
      uTime: { value: 0 },
      uAmbient: { value: cfg.ambient ?? 0.004 },
      uRingNormal: { value: new THREE.Vector3(0, 1, 0) },
      uCenter: { value: new THREE.Vector3() },
      uRingRange: { value: new THREE.Vector2(1, 2) },
      uRingShadow: { value: 0 },
    };
    this.material = new THREE.ShaderMaterial({ uniforms: this.uniforms, vertexShader: VERT, fragmentShader: FRAG });

    // LOD: full-resolution sphere up close, light one when the body is only a few pixels wide
    this.lod = new THREE.LOD();
    const hi = new THREE.Mesh(SPHERE_HI, this.material);
    const lo = new THREE.Mesh(SPHERE_LO, this.material);
    hi.scale.setScalar(cfg.radius);
    lo.scale.setScalar(cfg.radius);
    this.lod.addLevel(hi, 0);
    this.lod.addLevel(lo, cfg.radius * 40);
    this.spin.add(this.lod);

    this.atmos = [];
    for (const a of cfg.atmospheres || []) {
      const scale = a.scale;
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(a.color) },
          uTwilight: { value: new THREE.Color(a.twilight ?? a.color) },
          uSunDir: this.uniforms.uSunDir,
          uLimb: { value: Math.sqrt(1 - 1 / (scale * scale)) },
          uStrength: { value: a.strength ?? 1 },
          uFalloff: { value: a.falloff ?? 3 },
        },
        vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG,
        blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      });
      const mesh = new THREE.Mesh(SPHERE_HI, mat);
      mesh.scale.setScalar(cfg.radius * scale);
      mesh.renderOrder = 2;
      this.group.add(mesh);
      this.atmos.push(mesh);
    }

    this._c = new THREE.Vector3();
    this._s = new THREE.Vector3();
  }

  setCompanionLight(dir, color) {
    this.uniforms.uSun2Dir.value.copy(dir);
    this.uniforms.uSun2Color.value.copy(color);
  }

  /** @param sunWorld star position in universe coordinates (same space as group.position) */
  update(dt, time, sunWorld, camera) {
    const cfg = this.cfg;
    this.spin.rotation.y += (cfg.rotationSpeed ?? 0.01) * dt;
    this.uniforms.uCloudShift.value = time * (cfg.cloudSpeed ?? 0.0015);
    this.uniforms.uTime.value = time;
    this.group.getWorldPosition(this._c);
    this.uniforms.uCenter.value.copy(this._c);
    // sunWorld and the planet share a parent offset, so the direction can be taken from local positions
    this._s.copy(sunWorld).sub(this.localPosition()).normalize();
    this.uniforms.uSunDir.value.copy(this._s);
    this.lod.update(camera);
  }

  localPosition() {
    // position inside universe.root (parents other than root are orbit pivots handled by callers)
    return this.group.userData.rootPosition || this.group.position;
  }

  dispose() {
    this.material.dispose();
    this.targets.surface.dispose();
    this.targets.extra.dispose();
    for (const a of this.atmos) a.material.dispose();
    if (this.group.parent) this.group.parent.remove(this.group);
  }
}

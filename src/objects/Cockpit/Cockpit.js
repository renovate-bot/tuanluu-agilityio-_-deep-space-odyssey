import * as THREE from 'three';
import { makePanelTexture } from '../../utils/textures.js';
import { CockpitScreens } from './CockpitScreens.js';
import { disposeObject } from '../../utils/dispose.js';

// Deck dimensions in metres. Bow is -Z. The observer stands at EYE.
// The observer stands close to the glass so the centre pane fills the field of view: the frame is felt at
// the edges rather than looked at.
export const EYE = new THREE.Vector3(0, 1.62, -0.7);
const W = 4.2; // half width
const ZF = -3.4; // front glass plane
const ZA = -1.8; // where the angled panes meet the side walls
const ZR = 4.0; // rear wall
const XC = 2.6; // half width of the centre pane
const SILL = 0.8, HEAD = 3.0, CEIL = 3.25;
const ROOF_Z = -0.9; // rear edge of the roof glazing

const X_AXIS = new THREE.Vector3(1, 0, 0);

/** Emissive map for the overhead panels: a grid of small amber / cyan / white legends on black. */
function makeAnnunciatorTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) {
    const r = rnd();
    if (r < 0.28) continue;
    g.fillStyle = r > 0.9 ? '#ff5a3a' : r > 0.62 ? '#ffb45a' : r > 0.4 ? '#7fe9ff' : '#3a4a58';
    g.globalAlpha = 0.35 + rnd() * 0.65;
    g.fillRect(8 + x * 24.5, 10 + y * 30, 17, r > 0.75 ? 8 : 14);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Observation deck of ODYSSEY-01. Windows are genuine openings between structural members, so everything
 * seen through them is the live universe scene rendered behind this one.
 */
export class Cockpit {
  constructor({ shadows = true } = {}) {
    const g = (this.group = new THREE.Group());
    this.screens = new CockpitScreens();
    this.power = 0;
    this.warp = 0;

    const wallTex = makePanelTexture({ seed: 9, cells: 6, base: 120, variance: 30 });
    const floorTex = makePanelTexture({ seed: 15, cells: 8, base: 110, variance: 26, rivets: false });
    floorTex.repeat.set(3, 3);
    const M = (this.mats = {
      wall: new THREE.MeshStandardMaterial({ color: 0x343b47, metalness: 0.55, roughness: 0.6, map: wallTex, bumpMap: wallTex, bumpScale: 0.4, envMapIntensity: 0.35 }),
      frame: new THREE.MeshStandardMaterial({ color: 0x1c2028, metalness: 0.9, roughness: 0.36, envMapIntensity: 0.6 }),
      floor: new THREE.MeshStandardMaterial({ color: 0x232830, metalness: 0.75, roughness: 0.42, map: floorTex, bumpMap: floorTex, bumpScale: 0.3, envMapIntensity: 0.5 }),
      console: new THREE.MeshStandardMaterial({ color: 0x262b34, metalness: 0.7, roughness: 0.45, envMapIntensity: 0.4 }),
      seat: new THREE.MeshStandardMaterial({ color: 0x08090b, metalness: 0.1, roughness: 0.9, envMapIntensity: 0.1 }),
      leather: new THREE.MeshStandardMaterial({ color: 0x6b452c, metalness: 0.0, roughness: 0.62, envMapIntensity: 0.25 }),
      trim: new THREE.MeshStandardMaterial({ color: 0x8a8f98, metalness: 1.0, roughness: 0.28, envMapIntensity: 0.9 }),
      shutter: new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.85, roughness: 0.4, map: wallTex, side: THREE.DoubleSide }),
      warm: new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
      cyan: new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
      amber: new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false }),
      lock: new THREE.MeshBasicMaterial({ color: 0x30ff80, toneMapped: false }),
      corridor: new THREE.MeshBasicMaterial({ color: 0xbfe8ff, toneMapped: false }),
    });

    const solids = [];
    const box = (w, h, d, mat, x, y, z, opts = {}) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      if (opts.ry) m.rotation.y = opts.ry;
      if (opts.rx) m.rotation.x = opts.rx;
      if (opts.rz) m.rotation.z = opts.rz;
      (opts.parent || g).add(m);
      if (!opts.noShadow) solids.push(m);
      return m;
    };
    /** box stretched between two points */
    const beam = (a, b, t, mat, t2 = t) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
      const len = A.distanceTo(B);
      const m = new THREE.Mesh(new THREE.BoxGeometry(len + t * 0.5, t, t2), mat);
      m.position.copy(A).add(B).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(X_AXIS, B.clone().sub(A).normalize());
      g.add(m);
      solids.push(m);
      return m;
    };

    // ── shell ────────────────────────────────────────────────────────────────
    const floor = box(W * 2 + 0.6, 0.2, ZR - ZF + 0.6, M.floor, 0, -0.1, (ZR + ZF) / 2, { noShadow: true });
    const ceiling = box(W * 2 + 0.6, 0.2, ZR - ROOF_Z, M.wall, 0, CEIL + 0.1, (ZR + ROOF_Z) / 2, { noShadow: true });
    for (const s of [-1, 1]) box(W - 2.4 + 0.3, 0.2, ROOF_Z - ZF + 0.3, M.wall, s * (2.4 + (W - 2.4 + 0.3) / 2), CEIL + 0.1, (ROOF_Z + ZF) / 2, { noShadow: true });

    // front bay footprint: centre segment + two angled segments
    const segs = [
      [[-XC, ZF], [XC, ZF]],
      [[XC, ZF], [W, ZA]],
      [[-W, ZA], [-XC, ZF]],
    ];
    for (const [[x1, z1], [x2, z2]] of segs) {
      const len = Math.hypot(x2 - x1, z2 - z1);
      const ry = -Math.atan2(z2 - z1, x2 - x1);
      box(len + 0.2, SILL, 0.3, M.wall, (x1 + x2) / 2, SILL / 2, (z1 + z2) / 2, { ry }); // wall under the sill
      box(len + 0.2, CEIL - HEAD + 0.2, 0.3, M.frame, (x1 + x2) / 2, (CEIL + HEAD) / 2 + 0.1, (z1 + z2) / 2, { ry }).visible = z1 !== z2; // header (centre pane continues into the roof glass)
      beam([x1, SILL, z1], [x2, SILL, z2], 0.16, M.frame, 0.26);
      beam([x1, HEAD, z1], [x2, HEAD, z2], 0.14, M.frame, 0.2);
    }
    // posts
    for (const s of [-1, 1]) {
      beam([s * XC, SILL, ZF], [s * XC, HEAD, ZF], 0.2, M.frame, 0.24);
      beam([s * W, 0, ZA], [s * W, CEIL, ZA], 0.26, M.frame, 0.3);
      // roof glazing frame
      beam([s * 2.4, HEAD, ZF], [s * 2.4, CEIL, ROOF_Z], 0.16, M.frame, 0.2);
      beam([s * 0.8, HEAD, ZF], [s * 0.8, CEIL, ROOF_Z], 0.07, M.frame, 0.1);
    }
    beam([-2.4, CEIL, ROOF_Z], [2.4, CEIL, ROOF_Z], 0.22, M.frame, 0.3);

    // side walls with one window each
    const SW = { z1: -1.2, z2: 1.6, y1: 0.95, y2: 2.6 };
    for (const s of [-1, 1]) {
      const x = s * (W + 0.1);
      box(0.3, CEIL, SW.z1 - ZA, M.wall, x, CEIL / 2, (SW.z1 + ZA) / 2);
      box(0.3, CEIL, ZR - SW.z2, M.wall, x, CEIL / 2, (ZR + SW.z2) / 2);
      box(0.3, SW.y1, SW.z2 - SW.z1, M.wall, x, SW.y1 / 2, (SW.z1 + SW.z2) / 2);
      box(0.3, CEIL - SW.y2, SW.z2 - SW.z1, M.wall, x, (CEIL + SW.y2) / 2, (SW.z1 + SW.z2) / 2);
      const xf = s * W;
      beam([xf, SW.y1, SW.z1], [xf, SW.y1, SW.z2], 0.12, M.frame, 0.2);
      beam([xf, SW.y2, SW.z1], [xf, SW.y2, SW.z2], 0.12, M.frame, 0.2);
      beam([xf, SW.y1, SW.z1], [xf, SW.y2, SW.z1], 0.12, M.frame, 0.2);
      beam([xf, SW.y1, SW.z2], [xf, SW.y2, SW.z2], 0.12, M.frame, 0.2);
      // conduits along the wall/ceiling corner
      for (const [r, dy, dx] of [[0.06, 0.12, 0.14], [0.035, 0.26, 0.1], [0.035, 0.34, 0.1]]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(r, r, ZR - ZA, 10), M.frame);
        p.rotation.x = Math.PI / 2; p.position.set(s * (W - dx), CEIL - dy, (ZR + ZA) / 2);
        g.add(p);
      }
      // floor light strip
      box(0.025, 0.012, ZR - ZA - 0.4, M.cyan, s * (W - 0.12), 0.03, (ZR + ZA) / 2, { noShadow: true });
      // equipment lockers at the rear
      box(0.7, 2.1, 1.4, M.console, s * (W - 0.4), 1.05, 2.9);
      box(0.04, 0.5, 0.02, M.amber, s * (W - 0.76), 1.6, 2.45, { noShadow: true });
      box(0.04, 0.5, 0.02, M.cyan, s * (W - 0.76), 1.6, 3.2, { noShadow: true });
    }

    // ceiling ribs with light bars
    for (const z of [0.3, 1.9, 3.4]) {
      box(W * 2, 0.16, 0.22, M.frame, 0, CEIL - 0.08, z);
      for (const s of [-1, 1]) box(1.5, 0.03, 0.08, M.warm, s * 1.9, CEIL - 0.175, z, { noShadow: true });
    }
    // drooping cable bundles
    for (const s of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(s * 3.3, CEIL - 0.05, ROOF_Z + 0.1), new THREE.Vector3(s * 3.45, CEIL - 0.28, 0.3), new THREE.Vector3(s * 3.3, CEIL - 0.12, 1.9), new THREE.Vector3(s * 3.5, CEIL - 0.3, 3.0), new THREE.Vector3(s * 3.4, CEIL - 0.05, ZR),
      ]);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.03, 6), M.seat));
    }

    // ── rear wall, door and corridor ─────────────────────────────────────────
    const DW = 0.95, DH = 2.35;
    box(W - DW, CEIL, 0.3, M.wall, -(W + DW) / 2, CEIL / 2, ZR + 0.15);
    box(W - DW, CEIL, 0.3, M.wall, (W + DW) / 2, CEIL / 2, ZR + 0.15);
    box(DW * 2, CEIL - DH, 0.3, M.wall, 0, (CEIL + DH) / 2, ZR + 0.15);
    for (const s of [-1, 1]) box(0.1, DH, 0.36, M.frame, s * (DW + 0.05), DH / 2, ZR + 0.12);
    box(DW * 2 + 0.3, 0.1, 0.36, M.frame, 0, DH + 0.05, ZR + 0.12);
    box(0.5, 0.05, 0.02, M.lock, 0, DH + 0.2, ZR - 0.02, { noShadow: true });
    this.doors = [-1, 1].map((s) => {
      const d = box(DW, DH, 0.1, M.shutter, s * DW * 0.5, DH / 2, ZR + 0.16, { noShadow: true });
      box(0.03, DH * 0.7, 0.02, M.cyan, -s * (DW * 0.5 - 0.08), 0, -0.06, { parent: d, noShadow: true });
      d.userData.side = s;
      return d;
    });
    // corridor behind the door
    const cor = (this.corridor = new THREE.Group());
    g.add(cor);
    box(2.4, 0.1, 5, M.floor, 0, -0.05, ZR + 2.8, { parent: cor, noShadow: true });
    box(2.4, 0.1, 5, M.wall, 0, 2.6, ZR + 2.8, { parent: cor, noShadow: true });
    for (const s of [-1, 1]) {
      box(0.1, 2.6, 5, M.wall, s * 1.2, 1.3, ZR + 2.8, { parent: cor, noShadow: true });
      box(0.03, 0.05, 4.6, M.corridor, s * 1.13, 2.45, ZR + 2.8, { parent: cor, noShadow: true });
      box(0.03, 0.05, 4.6, M.corridor, s * 1.13, 0.12, ZR + 2.8, { parent: cor, noShadow: true });
    }
    box(2.4, 2.6, 0.1, M.frame, 0, 1.3, ZR + 5.3, { parent: cor, noShadow: true });
    box(1.2, 0.06, 0.02, M.corridor, 0, 2.0, ZR + 5.24, { parent: cor, noShadow: true });

    // ── consoles ─────────────────────────────────────────────────────────────
    box(4.7, 0.78, 0.75, M.console, 0, 0.39, ZF + 0.55);
    const top = box(4.7, 0.06, 0.82, M.frame, 0, 0.9, ZF + 0.6, { rx: 0.32 });
    top.receiveShadow = true;
    // key rows and status lights on the slanted top
    for (let i = 0; i < 9; i++) {
      const x = -2.0 + i * 0.5;
      if (Math.abs(x) < 0.35) continue;
      box(0.22, 0.01, 0.022, i % 3 === 0 ? M.amber : M.cyan, x, 0.845, ZF + 0.92, { rx: 0.32, noShadow: true });
    }
    const screenGeo = new THREE.PlaneGeometry(1.0, 0.625);
    const mkScreen = (i, x, y, z, w = 1) => {
      const m = new THREE.Mesh(screenGeo, this.screens.material(i));
      m.position.set(x, y, z);
      m.scale.setScalar(w);
      m.lookAt(EYE.x * 0.3 + x * 0.7, EYE.y + 0.4, EYE.z);
      g.add(m);
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.06 * w, 0.68 * w, 0.03), M.frame);
      back.position.copy(m.position); back.quaternion.copy(m.quaternion); back.translateZ(-0.025);
      g.add(back);
      return m;
    };
    mkScreen(0, -1.25, 1.02, ZF + 0.58, 0.8);
    mkScreen(1, 1.25, 1.02, ZF + 0.58, 0.8);
    // side consoles follow the angled panes
    for (const s of [-1, 1]) {
      const cx = s * (XC + W) / 2, cz = (ZF + ZA) / 2;
      const ry = s > 0 ? -Math.PI / 4 : Math.PI / 4;
      box(2.0, 0.7, 0.55, M.console, cx - s * 0.34, 0.35, cz + 0.34, { ry });
      mkScreen(s > 0 ? 3 : 2, cx - s * 0.42, 1.0, cz + 0.42, 0.72);
    }

    // holographic projector in the middle of the main console
    const holo = (this.holo = new THREE.Group());
    holo.position.set(0, 1.0, ZF + 0.72);
    g.add(holo);
    box(0.36, 0.05, 0.36, M.frame, 0, 0.9, ZF + 0.72);
    this.holoMat = new THREE.LineBasicMaterial({ color: 0x7fe9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const globe = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.15, 2)), this.holoMat);
    globe.position.y = 0.26;
    const ringPts = [];
    for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2; ringPts.push(new THREE.Vector3(Math.cos(a) * 0.24, 0, Math.sin(a) * 0.24)); }
    const hRing = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(ringPts), this.holoMat);
    hRing.position.y = 0.26; hRing.rotation.x = 0.4;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0x7fe9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    cone.rotation.x = Math.PI; cone.position.y = 0.1;
    this.holoCone = cone.material;
    holo.add(globe, hRing, cone);
    this.holoGlobe = globe; this.holoRing = hRing;

    // crew seats: leather shells either side of the observer, low in the corners of the view
    for (const s of [-1, 1]) {
      const seat = new THREE.Group();
      seat.position.set(s * 1.62, 0, -2.28);
      seat.rotation.y = -s * 0.2;
      g.add(seat);
      const P = { parent: seat };
      box(0.16, 0.36, 0.16, M.frame, 0, 0.18, 0, P);
      box(0.6, 0.06, 0.6, M.frame, 0, 0.38, 0, P);
      box(0.56, 0.13, 0.56, M.leather, 0, 0.47, 0, P);
      box(0.56, 0.74, 0.12, M.leather, 0, 0.9, 0.3, { ...P, rx: -0.14 });
      box(0.6, 0.78, 0.04, M.frame, 0, 0.9, 0.37, { ...P, rx: -0.14 });
      box(0.3, 0.2, 0.11, M.leather, 0, 1.36, 0.37, { ...P, rx: -0.14 });
      for (let i = 0; i < 3; i++) box(0.5, 0.012, 0.125, M.frame, 0, 0.7 + i * 0.19, 0.3 - i * 0.027, { ...P, rx: -0.14, noShadow: true }); // quilting seams
      for (const a of [-1, 1]) { box(0.07, 0.05, 0.44, M.frame, a * 0.33, 0.66, 0.02, P); box(0.09, 0.03, 0.3, M.leather, a * 0.33, 0.7, 0.0, P); }
    }

    // ── window dressing: corner gussets, bright trim and an overhead instrument panel ──
    const CH = 0.5;
    for (const s of [-1, 1]) {
      beam([s * XC, SILL + CH, ZF], [s * (XC - CH), SILL, ZF], 0.16, M.frame, 0.22);
      beam([s * XC, HEAD - CH, ZF], [s * (XC - CH), HEAD, ZF], 0.16, M.frame, 0.22);
      // filled corners so the pane reads as a rounded opening
      for (const [y0, dir] of [[SILL, 1], [HEAD, -1]]) {
        const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-s * CH, 0), new THREE.Vector2(0, dir * CH)]);
        const m = new THREE.Mesh(new THREE.ShapeGeometry(tri), M.frame);
        m.material = M.frame; m.position.set(s * XC, y0, ZF + 0.02);
        const m2 = m.clone(); m2.rotation.y = Math.PI; m2.position.z = ZF + 0.021; m2.scale.x = -1;
        g.add(m, m2);
      }
      // side-pane gussets
      const ax = s * (XC + (W - XC) * 0.25), az = ZF + (ZA - ZF) * 0.25;
      beam([s * XC, HEAD - 0.4, ZF], [ax, HEAD, az], 0.12, M.frame, 0.2);
      beam([s * XC, SILL + 0.4, ZF], [ax, SILL, az], 0.12, M.frame, 0.2);
    }
    // polished inner lip along sill and header
    beam([-XC + 0.1, SILL + 0.09, ZF + 0.14], [XC - 0.1, SILL + 0.09, ZF + 0.14], 0.02, M.trim, 0.03);
    beam([-XC + 0.1, HEAD - 0.08, ZF + 0.12], [XC - 0.1, HEAD - 0.08, ZF + 0.12], 0.02, M.trim, 0.03);
    // overhead panel: rows of small annunciators above the observer
    const ohTex = makeAnnunciatorTexture();
    this._ohTex = ohTex;
    this.overheadMat = new THREE.MeshBasicMaterial({ map: ohTex, color: 0x000000, toneMapped: false });
    for (const s of [-1, 1]) {
      box(1.5, 0.12, 1.5, M.console, s * 3.25, CEIL - 0.2, -1.75, { rz: s * 0.5 });
      const lit = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), this.overheadMat);
      lit.position.set(s * 3.22, CEIL - 0.275, -1.75); lit.rotation.set(Math.PI / 2, s * 0.5, 0);
      g.add(lit);
    }
    box(2.6, 0.1, 0.9, M.console, 0, CEIL - 0.06, -0.3);
    const litC = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), this.overheadMat);
    litC.position.set(0, CEIL - 0.115, -0.3); litC.rotation.x = Math.PI / 2;
    g.add(litC);

    // ── glazing ──────────────────────────────────────────────────────────────
    this.glassUniforms = { uTint: { value: new THREE.Color(0.3, 0.5, 1.0) }, uPower: { value: 0 }, uReflect: { value: 1 } };
    this.glassMat = new THREE.ShaderMaterial({
      uniforms: this.glassUniforms,
      vertexShader: /* glsl */ `varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */ `uniform vec3 uTint; uniform float uPower, uReflect; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
        void main(){
          float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
          // soft diagonal sheen + the console's glow reflected low in the pane
          float sheen = smoothstep(0.75, 1.0, sin((vUv.x * 0.9 + vUv.y * 0.6) * 7.0) * 0.5 + 0.5) * 0.012;
          float lowGlow = pow(1.0 - vUv.y, 5.0) * 0.07 * uPower;
          float a = (0.004 + fres * 0.07 + sheen * 0.5 + lowGlow * 0.6) * uReflect;
          gl_FragColor = vec4(mix(uTint, vec3(0.5, 0.9, 1.0), lowGlow * 6.0) * a, a * 0.35);
        }`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.shutters = [];
    const pane = (w, h, pos, rot, noShutter) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), this.glassMat);
      m.position.set(...pos); m.rotation.set(...rot); m.renderOrder = 10;
      g.add(m);
      if (noShutter) return;
      // two shutter leaves meeting in the middle; geometry origin sits on the outer edge so scaling retracts them
      for (const dir of [1, -1]) {
        const geo = new THREE.PlaneGeometry(w + 0.1, h / 2 + 0.02);
        geo.translate(0, -dir * (h / 4 + 0.01), 0);
        const sh = new THREE.Mesh(geo, M.shutter);
        sh.position.set(...pos); sh.rotation.set(...rot);
        sh.translateY(dir * h / 2); sh.translateZ(-0.05);
        g.add(sh);
        this.shutters.push(sh);
      }
    };
    const paneH = HEAD - SILL;
    pane(XC * 2, paneH, [0, (HEAD + SILL) / 2, ZF], [0, 0, 0]);
    const aLen = Math.hypot(W - XC, ZA - ZF);
    pane(aLen, paneH, [(XC + W) / 2, (HEAD + SILL) / 2, (ZF + ZA) / 2], [0, -Math.PI / 4, 0]);
    pane(aLen, paneH, [-(XC + W) / 2, (HEAD + SILL) / 2, (ZF + ZA) / 2], [0, Math.PI / 4, 0]);
    const roofLen = Math.hypot(ROOF_Z - ZF, CEIL - HEAD);
    const roofTilt = Math.atan2(CEIL - HEAD, ROOF_Z - ZF);
    pane(4.8, roofLen, [0, (HEAD + CEIL) / 2, (ZF + ROOF_Z) / 2], [Math.PI / 2 - roofTilt, 0, 0]);
    for (const s of [-1, 1]) pane(SW.z2 - SW.z1, SW.y2 - SW.y1, [s * W, (SW.y1 + SW.y2) / 2, (SW.z1 + SW.z2) / 2], [0, -s * Math.PI / 2, 0]);

    // ── lights ───────────────────────────────────────────────────────────────
    this.ambient = new THREE.AmbientLight(0xb0a8a8, 0);
    this.consoleLight = new THREE.PointLight(0x58d8ff, 0, 9, 1.4);
    this.consoleLight.position.set(0, 1.25, ZF + 1.1);
    this.ceilLights = [0.3, 2.6].map((z) => {
      const l = new THREE.PointLight(0xffd9b0, 0, 10, 1.4);
      l.position.set(0, CEIL - 0.4, z);
      return l;
    });
    this.corridorLight = new THREE.PointLight(0xbfe8ff, 6, 9, 1.6);
    this.corridorLight.position.set(0, 1.8, ZR + 1.2);
    // light from the universe pouring in through the glass
    this.exterior = new THREE.DirectionalLight(0xffffff, 0);
    this.exterior.position.set(0, 2, -10);
    this.exterior.target.position.set(0, 1.2, 0);
    if (shadows) {
      this.exterior.castShadow = true;
      this.exterior.shadow.mapSize.set(1024, 1024);
      const c = this.exterior.shadow.camera;
      c.left = -6.5; c.right = 6.5; c.top = 6.5; c.bottom = -6.5; c.near = 1; c.far = 40;
      this.exterior.shadow.bias = -0.0015;
      this.exterior.shadow.normalBias = 0.03;
      for (const m of solids) { m.castShadow = true; m.receiveShadow = true; }
      floor.receiveShadow = true; ceiling.receiveShadow = true;
    }
    g.add(this.ambient, this.consoleLight, ...this.ceilLights, this.corridorLight, this.exterior, this.exterior.target);

    this._owned = [wallTex, floorTex];
    this._extColor = new THREE.Color(1, 1, 1);
    this._extIntensity = 0;
    this._shutter = 0;
    this.setShutters(0);
    this.setDoor(1);
    this.setPower(0);
  }

  /** 0 = dark ship, 1 = all systems running */
  setPower(p) {
    this.power = p;
    this.applyLights();
  }

  setWarp(w) {
    this.warp = w;
    this.applyLights();
  }

  applyLights() {
    const p = this.power, w = this.warp;
    const M = this.mats;
    // during warp the warm lights dim and the deck goes cold blue
    this.ambient.intensity = 0.8 * p;
    if (this.overheadMat) this.overheadMat.color.setScalar(0.85 * p * (1 - 0.5 * w));
    this.consoleLight.intensity = p * (5.0 + 5.0 * w);
    this.consoleLight.color.setRGB(0.35 + 0.1 * w, 0.85 - 0.25 * w, 1.0);
    for (const l of this.ceilLights) l.intensity = p * 7.5 * (1 - 0.75 * w);
    M.warm.color.setRGB(0.9 * p * (1 - 0.7 * w), 0.72 * p * (1 - 0.7 * w), 0.5 * p * (1 - 0.5 * w));
    M.cyan.color.setRGB(0.1 * p + 0.3 * w * p, 0.5 * p, 0.7 * p + 0.9 * w * p);
    M.amber.color.setRGB(0.8 * p, 0.36 * p, 0.08 * p);
    this.glassUniforms.uPower.value = p;
    this.holoMat.opacity = 0.32 * p;
    this.holoCone.opacity = 0.03 * p;
  }

  setShutters(open) {
    this._shutter = open;
    for (const s of this.shutters) { s.scale.y = Math.max(0.0001, 1 - open); s.visible = open < 0.999; }
  }

  /** 1 = open, 0 = closed and locked */
  setDoor(open) {
    for (const d of this.doors) d.position.x = d.userData.side * (0.475 + open * 0.93);
    this.mats.lock.color.setHex(open > 0.02 ? 0x30ff80 : 0xff4030);
    this.corridor.visible = open > 0.001;
    this.corridorLight.intensity = 6 * Math.min(1, open * 3);
  }

  /** Light entering from outside. `dir` points from the deck towards the source, in ship-local space. */
  setExterior(dir, color, intensity) {
    this.exterior.position.copy(dir).multiplyScalar(14).add(this.exterior.target.position);
    this.exterior.color.copy(color);
    this.exterior.intensity = intensity * this._shutter;
    this.glassUniforms.uTint.value.copy(color);
  }

  update(dt, time) {
    this.screens.update(time);
    this.holoGlobe.rotation.y += dt * 0.5;
    this.holoRing.rotation.z += dt * 0.3;
    if (this.power > 0) {
      const flick = 1 + 0.03 * Math.sin(time * 9.0) + this.warp * 0.25 * Math.sin(time * 23.0);
      this.consoleLight.intensity = this.power * (5.0 + 5.0 * this.warp) * flick;
    }
  }

  dispose() {
    this.screens.dispose();
    this.glassMat.dispose();
    for (const t of this._owned) t.dispose();
    if (this._ohTex) this._ohTex.dispose();
    disposeObject(this.group);
  }
}

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { createCinematicPass } from '../post/CinematicPass.js';
import { Animator } from '../utils/Animator.js';
import { damp } from '../utils/math.js';
import { Universe, SECTOR_IDS } from '../scenes/Universe.js';
import { Cockpit, EYE } from '../objects/Cockpit/Cockpit.js';
import { ShipExterior } from '../objects/Spacecraft/ShipExterior.js';
import { CameraController } from '../systems/CameraController.js';
import { QualityManager } from '../systems/QualityManager.js';
import { NavigationSystem } from '../systems/NavigationSystem.js';
import { EventSystem } from '../systems/EventSystem.js';
import { IntroSequence } from '../systems/IntroSequence.js';
import { PickingSystem } from '../systems/PickingSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { START, destinationById } from '../config/destinations.js';
import { WORLD } from '../config/world.js';
import { formatRange } from '../config/celestial.js';
import { v3 } from '../scenes/helpers.js';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/**
 * Owns the renderer, both scenes, the frame loop and every system. The React UI talks to it only through
 * `engine.actions` and the shared store.
 */
export class Engine {
  constructor(canvas, store) {
    this.canvas = canvas;
    this.store = store;
    this.anim = new Animator();
    this.timer = new THREE.Timer();
    this.time = 0;
    this.running = false;
    this.disposed = false;
    this.timeScale = 1; // debugging aid: fast-forward sequences from the console

    // ship state (universe coordinates, doubles)
    this.ship = { pos: new THREE.Vector3(), quat: new THREE.Quaternion(), velocity: new THREE.Vector3(), speed: 0 };
    this.mode = 'exterior'; // exterior (arrival) | interior (deck)
    this.ext = { pos: new THREE.Vector3(0, 60, 500), target: new THREE.Vector3(), roll: 0 };
    this.eye = EYE.clone();
    this.warp = 0; // visual warp amount 0..1
    this.shake = 0;
    this.thrust = 0.25;
    this.cabinPower = 0;
    // light that the outside world throws into the deck
    this.env = { lightPos: v3(WORLD[START.light.at]), color: new THREE.Color(...START.cabin), intensity: START.light.intensity };
    this.sectorLight = 1;

    this._prevPos = new THREE.Vector3();
    this._v = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._c = new THREE.Color();
    this._uiClock = 0;
    this._m = new THREE.Matrix4();
  }

  // ─────────────────────────────────────────────────────────────── init ──
  async init() {
    const { store, canvas } = this;
    const progress = async (p, label) => { store.set({ loadProgress: p, loadLabel: label }); await nextFrame(); await nextFrame(); };

    await progress(0.04, 'STARTING RENDERER');
    const renderer = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false }));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(0x000000, 1);
    this._lost = (e) => { e.preventDefault(); this.running = false; store.set({ error: 'The graphics context was lost. Reload the page to continue.' }); };
    canvas.addEventListener('webglcontextlost', this._lost);

    this.quality = new QualityManager(renderer, store);
    const tier = (this.tier = this.quality.tier);
    renderer.setPixelRatio(this.quality.ratio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    this.universeScene = new THREE.Scene();
    this.cockpitScene = new THREE.Scene();
    this.camU = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 5, 9e6);
    this.camC = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.05, 120);
    this.camU.rotation.order = 'YXZ';

    await progress(0.1, 'CHARTING STARFIELD');
    this.universe = new Universe(renderer, this.universeScene, tier, this.quality.ratio);

    await progress(0.25, 'BUILDING ODYSSEY-01');
    this.exterior = new ShipExterior();
    this.universeScene.add(this.exterior.group);
    this.buildEnvironment();

    await progress(0.4, 'FITTING OBSERVATION DECK');
    this.cockpit = new Cockpit({ shadows: this.quality.assetTierName !== 'low' });
    this.cockpitScene.add(this.cockpit.group);

    await progress(0.55, 'IGNITING NEBULA');
    await this.universe.ensure('nebula');

    await progress(0.85, 'CALIBRATING OPTICS');
    this.buildComposer();
    this.camera = new CameraController(canvas);
    this.audio = new AudioSystem(store);
    this.nav = new NavigationSystem(this);
    this.events = new EventSystem(this);
    this.intro = new IntroSequence(this);
    this.picking = new PickingSystem(this);
    this.quality.onChange = () => this.applyQuality();
    this.applyQuality();

    this._resize = () => this.resize();
    window.addEventListener('resize', this._resize);
    this._visibility = () => {
      if (document.hidden) this.audio.suspend(); else { this.timer.reset(); this.audio.resume(); }
    };
    document.addEventListener('visibilitychange', this._visibility);
    this.unsubscribe = store.subscribe(() => this.onStore());
    this.onStore();

    this.intro.prepare();
    // compile shaders and upload textures before the first visible frame
    this.frame(0.016);
    await progress(1, 'READY');
    store.set({ phase: 'intro' });
    this.start();
    this.anim.to(1.6, (t) => { this.post.uniforms.uFade.value = 1 - t; });
  }

  /** Small procedural environment so metal surfaces have something to reflect. */
  buildEnvironment() {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const scene = new THREE.Scene();
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `varying vec3 vD;
        void main(){
          vec3 d = normalize(vD);
          vec3 col = vec3(0.012, 0.015, 0.03);
          col += vec3(0.12, 0.2, 0.75) * pow(max(dot(d, normalize(vec3(-0.3, 0.1, -1.0))), 0.0), 3.0);
          col += vec3(0.5, 0.15, 0.6) * pow(max(dot(d, normalize(vec3(0.7, -0.2, -0.6))), 0.0), 5.0) * 0.6;
          col += vec3(3.0, 2.6, 2.1) * pow(max(dot(d, normalize(vec3(0.6, 0.5, 0.6))), 0.0), 60.0);
          col += vec3(0.05, 0.06, 0.08) * smoothstep(-0.2, 1.0, d.y);
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), mat);
    scene.add(mesh);
    this.envTarget = pmrem.fromScene(scene, 0.03);
    this.universeScene.environment = this.envTarget.texture;
    this.cockpitScene.environment = this.envTarget.texture;
    this.universeScene.environmentIntensity = 1.1;
    this.cockpitScene.environmentIntensity = 0.0;
    mesh.geometry.dispose(); mat.dispose(); pmrem.dispose();
  }

  buildComposer() {
    const r = this.renderer;
    const size = r.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: this.quality.assetTierName === 'high' ? 4 : 0 });
    this.composer = new EffectComposer(r, target);
    this.passU = new RenderPass(this.universeScene, this.camU);
    this.passC = new RenderPass(this.cockpitScene, this.camC);
    this.passC.clear = false;
    this.passC.clearDepth = true;
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.42, 0.55, 0.98);
    this.post = createCinematicPass();
    this.composer.addPass(this.passU);
    this.composer.addPass(this.passC);
    this.composer.addPass(this.bloom);
    this.composer.addPass(this.post);
    this.composer.addPass(new OutputPass());
  }

  applyQuality() {
    const q = this.quality;
    this.renderer.setPixelRatio(q.ratio);
    this.composer.setPixelRatio(q.ratio);
    this.bloom.enabled = q.bloom;
    this.universe.setPixelRatio(q.ratio);
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    for (const c of [this.camU, this.camC]) { c.aspect = w / h; c.updateProjectionMatrix(); }
  }

  onStore() {
    const s = this.store.get();
    this.audio.applySettings(s);
    this.reducedMotion = s.reducedMotion;
  }

  // ─────────────────────────────────────────────────────────────── loop ──
  start() {
    if (this.running) return;
    this.running = true;
    this.timer.reset();
    const loop = () => {
      if (!this.running) return;
      this._raf = requestAnimationFrame(loop);
      this.timer.update();
      const raw = this.timer.getDelta();
      this.frame(Math.min(raw, 0.05) * this.timeScale, raw);
    };
    this._raf = requestAnimationFrame(loop);
  }

  frame(dt, raw = dt) {
    this.time += dt;
    const time = this.time;
    const { ship, universe, cockpit, camU, camC, camera } = this;

    this.anim.update(dt);
    camera.update(dt);

    // ship velocity from displacement (drives parallax, streaks and the warp tunnel)
    this._v.copy(ship.pos).sub(this._prevPos);
    ship.velocity.copy(this._v).multiplyScalar(1 / Math.max(dt, 1e-4));
    ship.speed = ship.velocity.length();
    this._prevPos.copy(ship.pos);

    const warpVisual = this.reducedMotion ? 0 : this.warp;

    if (this.mode === 'interior') {
      camU.position.set(0, 0, 0);
      camU.quaternion.copy(ship.quat).multiply(camera.quat);
      camC.quaternion.copy(camera.quat);
      camC.position.copy(this.eye);
      const sh = this.reducedMotion ? 0 : this.shake + warpVisual * 0.012;
      if (sh > 0) {
        camC.position.x += Math.sin(time * 37.0) * sh * 0.5;
        camC.position.y += Math.sin(time * 43.0 + 1.3) * sh;
      }
      // breathing sway so the frame is never perfectly still
      camC.position.y += Math.sin(time * 0.5) * 0.004;
      // on tall (portrait) screens widen the vertical field so the windows still fill the view
      const aspect = camU.aspect;
      const base = aspect < 1.25 ? Math.min(96, (2 * Math.atan(Math.tan((camera.fov * Math.PI) / 360) * (1.25 / aspect)) * 180) / Math.PI) : camera.fov;
      const fov = base + warpVisual * 9;
      if (Math.abs(camU.fov - fov) > 0.01) { camU.fov = camC.fov = fov; camU.updateProjectionMatrix(); camC.updateProjectionMatrix(); }
    } else {
      camU.position.copy(this.ext.pos);
      this._m.lookAt(this.ext.pos, this.ext.target, THREE.Object3D.DEFAULT_UP);
      camU.quaternion.setFromRotationMatrix(this._m);
      this.exterior.group.quaternion.copy(ship.quat);
      this.exterior.update(dt, time, this.thrust);
    }
    camU.updateMatrixWorld();
    this.exterior.group.visible = this.mode === 'exterior';
    this.passC.enabled = this.mode === 'interior';

    universe.update(dt, time, camU, ship, warpVisual);
    universe.sky.material.uniforms.uZoom.value = camera.zoom;
    universe.setLightDirections(ship.pos, this.env.lightPos, universe.nebulae.length ? universe.nebulae[0].group.position : this.env.lightPos);
    if (this.mode === 'exterior' && this.extKeyDir) {
      // arrival shot: a warm key from the camera side, the nebula as a cool rim light
      universe.keyLight.position.copy(this.extKeyDir).multiplyScalar(100);
      universe.fillLight.intensity = 3.0;
      universe.keyLight.intensity = 6.0;
    } else { universe.fillLight.intensity = 0.5; universe.keyLight.intensity = 2.6; }

    // light entering the deck: direction in ship-local space
    this._v.copy(this.env.lightPos).sub(ship.pos).normalize().applyQuaternion(this._q.copy(ship.quat).invert());
    const neb = universe.nebulaInfluence(ship.pos, this._c);
    this._c.lerpColors(this.env.color, this._c, neb * 0.7);
    cockpit.setExterior(this._v, this._c, this.env.intensity * this.sectorLight * (1 - 0.5 * warpVisual));
    cockpit.setPower(this.cabinPower);
    this.cockpitScene.environmentIntensity = 0.5 * this.cabinPower;
    cockpit.setWarp(warpVisual);
    if (this.mode === 'interior') cockpit.update(dt, time);
    this.audio.update(dt, { warp: this.warp, nebula: neb, speed: ship.speed });

    this.picking.update(dt);
    this.post.uniforms.uTime.value = time;
    this.post.uniforms.uWarp.value = warpVisual;

    this.composer.render(dt);

    // adaptive resolution + UI read-outs (a few times per second, never per frame)
    const busy = this.store.get().phase !== 'explore' || !!this.store.get().travel;
    this.quality.sample(raw, busy);
    this._uiClock += dt;
    if (this._uiClock > 0.25) { this._uiClock = 0; this.pushUi(); }
  }

  pushUi() {
    const s = this.store.get();
    const patch = {};
    if (s.target) {
      const p = this.universe.poiById(s.target.id);
      if (p) patch.targetRange = formatRange(Math.max(0, p.position.distanceTo(this.ship.pos) - p.radius), p.range);
    }
    if (s.showStats) {
      const info = this.renderer.info.render;
      patch.stats = { fps: Math.round(this.quality.fps || 0), tier: this.quality.tier.label, pixelRatio: this.quality.ratio, calls: info.calls, tris: info.triangles, bloom: this.quality.bloom };
    }
    this.store.set(patch);
    const scr = this.cockpit.screens.state;
    scr.lang = s.lang; scr.sector = s.sectorName; scr.engine = s.engineStatus; scr.warp = this.warp;
    scr.heading = ((-this.camera.yaw * 180) / Math.PI + 360) % 360; scr.pitch = (this.camera.pitch * 180) / Math.PI;
    scr.dest = s.travel ? destinationById(s.travel.toId)?.name || '—' : s.navSelected ? destinationById(s.navSelected)?.name || '—' : '—';
  }

  // ───────────────────────────────────────────────────────────── helpers ──
  /** Orientation whose bow (-Z) points from `from` to `to`. */
  lookQuat(from, to, out = new THREE.Quaternion()) {
    this._m.lookAt(from, to, THREE.Object3D.DEFAULT_UP);
    return out.setFromRotationMatrix(this._m);
  }

  say(text, chime = true) {
    this.store.set({ message: { id: performance.now(), text } });
    if (chime) this.audio.play('ai');
  }

  setSector(dest) {
    this.currentDest = dest;
    this.store.set({ sectorId: dest.id, sectorName: dest.sector });
    this.audio.setMood(dest.mood);
  }

  /** After boarding: quietly build the remaining sectors one at a time so they appear in the sky. */
  async streamSectors() {
    for (const id of SECTOR_IDS) {
      if (this.disposed) return;
      if (this.universe.isLoaded(id)) continue;
      await new Promise((r) => setTimeout(r, 1800));
      // never compete with a jump for frame time
      while (this.store.get().travel && !this.disposed) await new Promise((r) => setTimeout(r, 1000));
      try { await this.universe.ensure(id); } catch (e) { console.warn('[sector]', id, e); }
    }
  }

  // ───────────────────────────────────────────────────────────── actions ──
  get actions() {
    if (this._actions) return this._actions;
    const e = this;
    const s = this.store;
    this._actions = {
      enter: () => e.intro.board(),
      skip: () => { e.intro.skip(); e.nav.skip(); e.events.skip(); },
      toggleNav: () => { e.audio.play('ui'); s.set({ navOpen: !s.get().navOpen, panel: null }); },
      selectDestination: (id) => { e.audio.play('select'); s.set({ navSelected: id }); },
      engage: (id) => e.nav.travel(destinationById(id || s.get().navSelected)),
      warp: () => {
        const st = s.get();
        if (st.travel) return;
        if (st.navSelected && st.navSelected !== st.sectorId) e.nav.travel(destinationById(st.navSelected));
        else { e.audio.play('ui'); s.set({ navOpen: true, panel: null }); e.say('Select a destination to engage the warp drive.', false); }
      },
      focus: () => e.picking.focus(),
      observe: () => e.picking.observe(),
      clearTarget: () => { e.audio.play('ui'); s.set({ target: null, observing: false }); },
      resetView: () => { e.audio.play('ui'); e.camera.reset(); },
      setView: (name) => {
        e.audio.play('ui');
        const presets = { front: [0, 0.02], left: [1.45, 0], right: [-1.45, 0], up: [0, 0.85], console: [0, -0.42] };
        const p = presets[name] || presets.front;
        e.camera.lookTo(p[0], p[1], 58);
      },
      togglePanel: (name) => { e.audio.play('ui'); s.set({ panel: s.get().panel === name ? null : name }); },
      setMuted: (m) => { s.set({ muted: m }); if (!m) e.audio.play('ui'); },
      setVolume: (key, v) => s.set({ [key]: v }),
      setQuality: (q) => { e.audio.play('ui'); e.quality.setPreference(q); s.set({ qualityNeedsReload: e.quality.needsReload }); },
      toggleMute: () => s.set({ muted: !s.get().muted }),
      escape: () => {
        const st = s.get();
        if (st.panel) s.set({ panel: null });
        else if (st.navOpen) s.set({ navOpen: false });
        else if (st.target) s.set({ target: null, observing: false });
      },
      setReducedMotion: (v) => { e.audio.play('ui'); s.set({ reducedMotion: v }); },
      setShowStats: (v) => s.set({ showStats: v }),
      uiHover: () => e.audio.play('hover'),
    };
    return this._actions;
  }

  dispose() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this._raf);
    this.anim.clear();
    if (this.unsubscribe) this.unsubscribe();
    window.removeEventListener('resize', this._resize);
    document.removeEventListener('visibilitychange', this._visibility);
    this.canvas.removeEventListener('webglcontextlost', this._lost);
    if (this.camera) this.camera.dispose();
    if (this.picking) this.picking.dispose();
    if (this.audio) this.audio.dispose();
    if (this.universe) this.universe.dispose();
    if (this.cockpit) this.cockpit.dispose();
    if (this.exterior) this.exterior.dispose();
    if (this.envTarget) this.envTarget.dispose();
    if (this.composer) { this.composer.dispose(); }
    if (this.renderer) this.renderer.dispose();
  }
}

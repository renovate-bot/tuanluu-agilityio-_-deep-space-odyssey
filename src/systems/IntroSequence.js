import * as THREE from 'three';
import { ease, lerp } from '../utils/math.js';
import { START } from '../config/destinations.js';
import { EYE } from '../objects/Cockpit/Cockpit.js';
import { v3 } from '../scenes/helpers.js';

/**
 * Arrival (slow push-in on the drifting ship) and boarding (fly in, hatch closes, systems boot,
 * engines start, shutters open on the universe). One continuous, skippable timeline.
 */
export class IntroSequence {
  constructor(engine) {
    this.e = engine;
    this.token = null;
    this.orbiting = false;
    this.t = 0;
    this._dir = new THREE.Vector3();
    this._side = new THREE.Vector3();
  }

  prepare() {
    const e = this.e;
    const pos = v3(START.pos), look = v3(START.look);
    e.ship.pos.copy(pos);
    e._prevPos.copy(pos);
    // toward the nebula
    this._dir.copy(look).sub(pos).normalize();
    this._side.crossVectors(this._dir, THREE.Object3D.DEFAULT_UP).normalize();
    // the ship drifts side-on to the camera, bow slightly towards the nebula, so its whole profile reads
    const bow = this._side.clone().multiplyScalar(-1).addScaledVector(this._dir, 0.35).add(new THREE.Vector3(0, 0.06, 0));
    e.lookQuat(new THREE.Vector3(), bow, e.ship.quat);
    e.mode = 'exterior';
    e.extKeyDir = this._dir.clone().multiplyScalar(-0.45).addScaledVector(this._side, -0.55).add(new THREE.Vector3(0, 0.7, 0)).normalize();
    e.thrust = 0.2;
    e.setSector(START);
    this.orbiting = true;
    this.orbitToken = e.anim.token();
    // endless slow push-in; cancelled when boarding begins
    const tick = () => {
      if (this.orbitToken.cancelled) return;
      e.anim.to(600, (t) => this.orbit(t * 600), ease.linear, this.orbitToken);
    };
    tick();
    this.orbit(0);
  }

  orbit(t) {
    const e = this.e;
    this.t = t;
    const d = 215 + 300 * Math.exp(-t / 22); // asymptotic approach
    const a = -0.3 + 0.42 * (1 - Math.exp(-t / 70));
    e.ext.pos.set(0, 0, 0)
      .addScaledVector(this._dir, -d * Math.cos(a))
      .addScaledVector(this._side, d * Math.sin(a))
      .addScaledVector(THREE.Object3D.DEFAULT_UP, d * (0.13 + 0.03 * Math.sin(t * 0.05)));
    // aim below the ship so it rides in the upper half of the frame, clear of the title
    e.ext.target.set(0, 0, 0).addScaledVector(this._side, -10).addScaledVector(THREE.Object3D.DEFAULT_UP, -d * 0.2);
  }

  skip() { if (this.token) this.token.skip(); }

  async board() {
    const e = this.e;
    const { anim, store, cockpit, camera, audio } = e;
    if (this.token || store.get().phase !== 'intro') return;
    const token = (this.token = anim.token());
    const sfx = (name) => { if (!token.skipped) audio.play(name); };
    this.orbitToken.cancel();
    audio.init(); // first user gesture: audio may start now
    audio.play('confirm');
    audio.startMusic();
    store.set({ phase: 'boarding', canSkip: true, engineStatus: 'STANDBY' });
    const fade = e.post.uniforms.uFade;

    // 1 ── fly to the bow
    const p0 = e.ext.pos.clone(), t0 = e.ext.target.clone();
    const p1 = new THREE.Vector3(26, 12, -128).applyQuaternion(e.ship.quat);
    const t1 = new THREE.Vector3(0, 2, -66).applyQuaternion(e.ship.quat);
    sfx('whoosh');
    await anim.to(4.2, (t) => {
      e.ext.pos.lerpVectors(p0, p1, t);
      e.ext.pos.y += Math.sin(Math.PI * t) * 30;
      e.ext.target.lerpVectors(t0, t1, Math.min(1, t * 1.4));
      fade.value = Math.max(0, (t - 0.84) / 0.16);
    }, ease.inOutCubic, token);

    // 2 ── inside, facing the hatch we just came through
    e.mode = 'interior';
    e.lookQuat(e.ship.pos, v3(START.look), e.ship.quat);
    camera.free = true;
    camera.set(Math.PI, 0);
    e.eye.set(EYE.x, EYE.y, 2.3);
    e.cabinPower = 0;
    cockpit.setShutters(0);
    cockpit.setDoor(1);
    await anim.to(0.9, (t) => { fade.value = 1 - t; }, ease.outQuad, token);

    // 3 ── hatch closes and locks
    sfx('door');
    await anim.to(1.9, (t) => cockpit.setDoor(1 - t), ease.inOutCubic, token);
    cockpit.setDoor(0);
    sfx('lock');
    await anim.wait(0.5, token);

    // 4 ── turn to the bow while main power comes up
    store.set({ engineStatus: 'POWER UP' });
    sfx('boot');
    const turn = anim.to(3.8, (t) => {
      camera.set(Math.PI * (1 - t), 0);
      e.eye.z = lerp(2.3, EYE.z, t);
    }, ease.inOutCubic, token);
    await anim.to(2.6, (t) => {
      // lights catch with a flicker
      const flicker = t < 0.6 ? (Math.sin(t * 90) > 0.2 ? 1 : 0.35) : 1;
      e.cabinPower = 0.55 * t * flicker;
    }, ease.outQuad, token);

    // 5 ── displays wake one after another
    for (let i = 0; i < 4; i++) {
      sfx('screen');
      await anim.to(0.32, (t) => cockpit.screens.setPower(i, t < 0.5 ? (Math.sin(t * 60) > 0 ? 0.8 : 0.1) : t), ease.linear, token);
      cockpit.screens.setPower(i, 1);
    }
    await turn;
    await anim.to(0.8, (t) => { e.cabinPower = lerp(0.55, 1, t); }, ease.outQuad, token);

    // 6 ── engines
    store.set({ engineStatus: 'ENGINE START' });
    audio.startEngine();
    await anim.to(1.6, (t) => { e.shake = 0.006 * Math.sin(Math.PI * t); e.thrust = lerp(0.2, 0.35, t); }, ease.linear, token);
    e.shake = 0;

    // 7 ── shutters open on the universe
    sfx('shutter');
    const target = START.light.intensity;
    e.env.intensity = target;
    await anim.to(4.6, (t) => cockpit.setShutters(t), ease.inOutCubic, token);
    cockpit.setShutters(1);

    // end state (also what a skip lands on)
    e.mode = 'interior';
    e.cabinPower = 1;
    e.eye.copy(EYE);
    for (let i = 0; i < 4; i++) cockpit.screens.setPower(i, 1);
    fade.value = 0;
    camera.free = false;
    camera.set(0, 0);
    camera.reset();
    camera.enabled = true;
    this.token = null;
    audio.startEngine();
    store.set({ phase: 'explore', canSkip: false, engineStatus: 'IDLE' });
    e.say('Welcome aboard ODYSSEY-01. All systems nominal.');
    e.streamSectors();
  }
}

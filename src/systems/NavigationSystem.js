import * as THREE from 'three';
import { ease, lerp, clamp } from '../utils/math.js';
import { WORLD } from '../config/world.js';
import { v3 } from '../scenes/helpers.js';

/**
 * Destination travel as a small state machine:
 *   ALIGN (turn the bow) → CHARGE (drive spools) → WARP (the jump) → ARRIVE (drop out, hand over to an event)
 * With Reduced Motion on, the jump is replaced by a gentle fade.
 */
export class NavigationSystem {
  constructor(engine) {
    this.e = engine;
    this.token = null;
    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
    this._q0 = new THREE.Quaternion();
    this._q1 = new THREE.Quaternion();
    this._c0 = new THREE.Color();
  }

  get busy() { return !!this.token; }

  skip() { if (this.token) { this.token.skip(); this.e.audio.stopWarp(); } }

  /** dest: { id, name, sector, sectors[], pos[3], look[3], approach?, mood, cabin, light, event? } */
  async travel(dest) {
    const e = this.e;
    const { store, anim, ship, audio } = e;
    if (!dest || this.token || store.get().phase !== 'explore') return;
    if (dest.id === store.get().sectorId && !dest.transient) { e.say(`Already holding position at ${dest.name}.`, false); return; }

    e.events.cancel();
    const token = (this.token = anim.token());
    const reduced = e.reducedMotion;
    const setStage = (stage, engineStatus) => store.set({ travel: { toId: dest.id, name: dest.name, stage }, engineStatus, canSkip: true });

    store.set({ navOpen: false, panel: null, target: null, observing: false, hover: null });
    e.camera.enabled = false;
    e.camera.reset();

    const from = this._a.copy(ship.pos).clone();
    const arrive = v3(dest.approach && !reduced ? dest.approach : dest.pos);
    const look = v3(dest.look);
    const distance = from.distanceTo(arrive);

    // ── ALIGN ──
    setStage('ALIGNING', 'ALIGNING');
    e.say(`Course plotted: ${dest.name}. Aligning.`);
    audio.play('align');
    const q0 = this._q0.copy(ship.quat);
    const q1 = e.lookQuat(from, arrive, this._q1);
    const loading = Promise.all(dest.sectors.map((s) => e.universe.ensure(s)));
    await anim.to(reduced ? 1.2 : 2.4, (t) => ship.quat.slerpQuaternions(q0, q1, t), ease.inOutCubic, token);

    // the charge phase doubles as the loading window for sectors that are not built yet
    let ready = false;
    let failed = null;
    loading.then(() => { ready = true; }, (err) => { failed = err; ready = true; });

    if (reduced) {
      setStage('TRANSIT', 'TRANSIT');
      await anim.to(0.9, (t) => { e.post.uniforms.uFade.value = t; }, ease.inOutQuad, token);
      while (!ready) await anim.wait(0.1);
      if (failed) return this.abort(failed, from);
      ship.pos.copy(arrive);
      e._prevPos.copy(arrive);
      e.lookQuat(arrive, look, ship.quat);
      this.applyArrival(dest, 1);
      await anim.to(1.2, (t) => { e.post.uniforms.uFade.value = 1 - t; }, ease.inOutQuad, token);
    } else {
      // ── CHARGE ──
      setStage('CHARGING', 'CHARGING');
      if (!token.skipped) audio.startWarp();
      await anim.to(2.8, (t) => { e.warp = 0.22 * t * t; e.shake = 0.004 * t; e.thrust = 0.25 + 0.5 * t; }, ease.linear, token);
      if (!ready) {
        setStage('PREPARING SECTOR', 'CHARGING');
        while (!ready) await anim.wait(0.1);
        if (!token.skipped) setStage('CHARGING', 'CHARGING');
      }
      if (failed) return this.abort(failed, from);

      // ── WARP ──
      setStage('WARP', 'WARP');
      e.say('Warp drive engaged.', false);
      if (!token.skipped) audio.play('warpJump');
      const duration = clamp(3.6 + Math.log10(Math.max(distance, 1000)) * 0.75, 5.5, 8.5);
      const qArrive = e.lookQuat(arrive, look, new THREE.Quaternion());
      const qTravel = this._q0.copy(ship.quat);
      const env0 = { intensity: e.env.intensity };
      await anim.to(duration, (t) => {
        // position: long acceleration, hard deceleration at the end
        const p = t < 0.86 ? 0.985 * ease.inCubic(t / 0.86) : 0.985 + 0.015 * ease.outCubic((t - 0.86) / 0.14);
        ship.pos.lerpVectors(from, arrive, p);
        e.warp = t < 0.12 ? lerp(0.22, 1, ease.outCubic(t / 0.12)) : t > 0.84 ? 1 - ease.inOutCubic((t - 0.84) / 0.16) : 1;
        e.shake = 0.004 + 0.006 * Math.sin(Math.PI * t);
        e.thrust = 1;
        // the bow swings onto the destination as the ship drops out
        if (t > 0.8) ship.quat.slerpQuaternions(qTravel, qArrive, ease.inOutCubic((t - 0.8) / 0.2));
        e.env.intensity = lerp(env0.intensity, 0.15, Math.min(1, t * 5));
        if (t > 0.8 && !this._swapped) { this._swapped = true; this.applyArrival(dest, 0); }
      }, ease.linear, token);
      this._swapped = false;
      ship.pos.copy(arrive);
      ship.quat.copy(qArrive);
      e.warp = 0;
      this.applyArrival(dest, 0);

      // ── ARRIVE ──
      setStage('ARRIVING', 'DECELERATING');
      audio.stopWarp();
      if (!token.skipped) audio.play('warpArrive');
      const target = { intensity: dest.light.intensity };
      await anim.to(1.6, (t) => {
        e.post.uniforms.uFlash.value = 0.55 * (1 - t) * (1 - t);
        e.shake = 0.008 * (1 - t);
        e.thrust = lerp(1, 0.3, t);
        e.env.intensity = lerp(0.15, target.intensity, t);
      }, ease.outCubic, token);
    }

    e.post.uniforms.uFlash.value = 0;
    e.post.uniforms.uFade.value = 0;
    e.shake = 0; e.warp = 0; e.thrust = 0.3;
    e.env.intensity = dest.light.intensity;
    e.camera.enabled = true;
    this.token = null;
    store.set({ travel: null, canSkip: false, engineStatus: 'IDLE', navSelected: null });
    if (token.cancelled) return;
    e.say(`Arrived: ${dest.name}.`);
    e.events.onArrival(dest, token.skipped);
  }

  /** Sector, lighting and music switch to the destination. */
  applyArrival(dest, immediate) {
    const e = this.e;
    e.env.lightPos.copy(v3(WORLD[dest.light.at]));
    e.env.color.setRGB(...dest.cabin);
    if (immediate) e.env.intensity = dest.light.intensity;
    if (e.currentDest !== dest) e.setSector(dest);
  }

  abort(err, from) {
    const e = this.e;
    console.error('[navigation] sector failed to load', err);
    e.ship.pos.copy(from);
    e.warp = 0; e.shake = 0; e.thrust = 0.3;
    e.post.uniforms.uFade.value = 0;
    e.audio.stopWarp();
    e.audio.play('alert');
    e.camera.enabled = true;
    this.token = null;
    e.store.set({ travel: null, canSkip: false, engineStatus: 'IDLE' });
    e.say('Jump aborted: destination data could not be generated.', false);
  }
}

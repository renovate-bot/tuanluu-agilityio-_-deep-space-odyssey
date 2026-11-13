import * as THREE from 'three';
import { ease, lerp, clamp } from '../utils/math.js';
import { WORLD } from '../config/world.js';
import { planetById } from '../config/solar.js';
import { v3 } from '../scenes/helpers.js';
import { frameOf, fromFrame } from './Vantage.js';

const ZERO = new THREE.Vector3();

/**
 * Destination travel as a small state machine:
 *   ALIGN (turn the bow) → CHARGE (drive spools) → WARP (the jump) → ARRIVE (drop out and settle into orbit)
 * Solar System bodies move, so everything is expressed as an offset from a live anchor position and
 * re-evaluated every frame. With Reduced Motion on, the jump is replaced by a gentle fade.
 */
export class NavigationSystem {
  constructor(engine) {
    this.e = engine;
    this.token = null;
    this._a = new THREE.Vector3();
    this._b = new THREE.Vector3();
    this._q0 = new THREE.Quaternion();
    this._q1 = new THREE.Quaternion();
  }

  get busy() { return !!this.token; }

  skip() { if (this.token) { this.token.skip(); this.e.audio.stopWarp(); } }

  /** Where a destination is right now. Offsets are relative to `anchor` (or absolute when there is none). */
  resolve(dest) {
    const u = this.e.universe;
    if (dest.kind === 'body') {
      const def = planetById(dest.body);
      const anchor = u.positions[dest.body];
      const frame = frameOf(def, anchor);
      const pos = fromFrame(frame, def.views.far, def.radius);
      const look = fromFrame(frame, def.views.lookFar, def.radius);
      // drop out of warp further out and off to one side, then fall inwards
      const approach = pos.clone().multiplyScalar(2.3).addScaledVector(frame.T, def.radius * 1.6).addScaledVector(frame.U, def.radius * 0.5);
      return { anchor, pos, look, approach, def };
    }
    if (dest.kind === 'poi') return { anchor: dest.anchor, pos: dest.offset.clone(), look: ZERO.clone(), approach: null, def: null };
    return { anchor: null, pos: v3(dest.pos), look: v3(dest.look), approach: dest.approach ? v3(dest.approach) : null, def: null };
  }

  /** dest: see config/destinations.js (or a transient { kind: 'poi', anchor, offset } from the target card). */
  async travel(dest) {
    const e = this.e;
    const { store, anim, ship, audio } = e;
    if (!dest || this.token || store.get().phase !== 'explore') return;
    if (dest.id === store.get().sectorId && !dest.transient) { e.say(`Already holding position at ${dest.name}.`, false); return; }

    e.events.cancel();
    e.picking.cancelMove();
    const token = (this.token = anim.token());
    const reduced = e.reducedMotion;
    const setStage = (stage, engineStatus) => store.set({ travel: { toId: dest.id, name: dest.name, stage }, engineStatus, canSkip: true });

    store.set({ navOpen: false, panel: null, target: null, observing: false, hover: null, viewMode: null });
    e.camera.enabled = false;
    e.camera.reset();

    const r = this.resolve(dest);
    const live = (off, out) => (r.anchor ? out.copy(r.anchor).add(off) : out.copy(off));
    const cruise = !!r.approach && !reduced;
    const arriveOff = cruise ? r.approach : r.pos;
    const arrive = this._a, look = this._b;

    // ── ALIGN ──
    setStage('ALIGNING', 'ALIGNING');
    e.say(`Course plotted: ${dest.name}. Aligning.`);
    audio.play('align');
    const q0 = this._q0.copy(ship.quat);
    const loading = Promise.all(dest.sectors.map((s) => e.universe.ensure(s)));
    await anim.to(reduced ? 1.2 : 2.4, (t) => ship.quat.slerpQuaternions(q0, e.lookQuat(ship.pos, live(arriveOff, arrive), this._q1), t), ease.inOutCubic, token);

    // the charge phase doubles as the loading window for sectors that are not built yet
    let ready = false;
    let failed = null;
    loading.then(() => { ready = true; }, (err) => { failed = err; ready = true; });

    if (reduced) {
      setStage('TRANSIT', 'TRANSIT');
      await anim.to(0.9, (t) => { e.post.uniforms.uFade.value = t; }, ease.inOutQuad, token);
      while (!ready) await anim.wait(0.1);
      if (failed) return this.abort(failed);
      e.setAnchor(r.anchor);
      ship.pos.copy(live(r.pos, arrive));
      e._prevPos.copy(ship.pos);
      e.lookQuat(ship.pos, live(r.look, look), ship.quat);
      this.applyArrival(dest, 1, ship.pos);
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
      if (failed) return this.abort(failed);

      // ── WARP ──
      setStage('WARP', 'WARP');
      e.say('Warp drive engaged.', false);
      if (!token.skipped) audio.play('warpJump');
      e.setAnchor(r.anchor);
      const from = ship.pos.clone();
      const distance = from.distanceTo(live(arriveOff, arrive));
      const duration = clamp(3.6 + Math.log10(Math.max(distance, 1000)) * 0.75, 5.5, 8.5);
      const qArrive = new THREE.Quaternion();
      const qTravel = this._q0.copy(ship.quat);
      const env0 = e.env.intensity;
      let swapped = false;
      await anim.to(duration, (t) => {
        // position: long acceleration, hard deceleration at the end
        const p = t < 0.86 ? 0.985 * ease.inCubic(t / 0.86) : 0.985 + 0.015 * ease.outCubic((t - 0.86) / 0.14);
        ship.pos.lerpVectors(from, live(arriveOff, arrive), p);
        e.warp = t < 0.12 ? lerp(0.22, 1, ease.outCubic(t / 0.12)) : t > 0.84 ? 1 - ease.inOutCubic((t - 0.84) / 0.16) : 1;
        e.shake = 0.004 + 0.006 * Math.sin(Math.PI * t);
        e.thrust = 1;
        // the bow swings onto the destination as the ship drops out
        if (t > 0.8) ship.quat.slerpQuaternions(qTravel, e.lookQuat(arrive, live(r.look, look), qArrive), ease.inOutCubic((t - 0.8) / 0.2));
        e.env.intensity = lerp(env0, 0.15, Math.min(1, t * 5));
        if (t > 0.8 && !swapped) { swapped = true; this.applyArrival(dest, 0, arrive); }
      }, ease.linear, token);
      ship.pos.copy(live(arriveOff, arrive));
      e.lookQuat(ship.pos, live(r.look, look), ship.quat);
      e.warp = 0;
      this.applyArrival(dest, 0, ship.pos);

      // ── ARRIVE ──
      setStage('ARRIVING', 'DECELERATING');
      audio.stopWarp();
      if (!token.skipped) audio.play('warpArrive');
      const targetLight = dest.light.intensity;
      await anim.to(1.6, (t) => {
        e.post.uniforms.uFlash.value = 0.55 * (1 - t) * (1 - t);
        e.shake = 0.008 * (1 - t);
        e.thrust = lerp(1, 0.4, t);
        e.env.intensity = lerp(0.15, targetLight, t);
      }, ease.outCubic, token);

      // bodies: fall from the drop-out point into the far-orbit vantage
      if (cruise && dest.kind === 'body') {
        const off = new THREE.Vector3();
        await anim.to(8, (t) => {
          off.lerpVectors(r.approach, r.pos, t);
          ship.pos.copy(live(off, arrive));
          ship.quat.slerp(e.lookQuat(ship.pos, live(r.look, look), this._q1), 0.1);
          e.thrust = lerp(0.4, 0.3, t);
        }, ease.outCubic, token);
        ship.pos.copy(live(r.pos, arrive));
        e.lookQuat(ship.pos, live(r.look, look), ship.quat);
      }
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
    if (dest.kind === 'body') {
      const p = e.universe.poiById(dest.poi);
      store.set({ viewMode: 'far', target: e.picking.snapshot(p), observing: false });
    } else if (dest.kind === 'static') e.events.onArrival(dest, token.skipped || !cruise);
  }

  /** Sector, lighting and music switch to the destination. */
  applyArrival(dest, immediate, arrivePos) {
    const e = this.e;
    e.env.lightPos.copy(v3(WORLD[dest.light.at]));
    e.env.color.setRGB(...dest.cabin);
    if (immediate) e.env.intensity = dest.light.intensity;
    if (e.currentDest !== dest) {
      e.setSector(dest);
      for (const id of dest.sectors) { const sec = e.universe.sectors.get(id); if (sec && sec.onArrive) sec.onArrive(arrivePos); }
    }
  }

  abort(err) {
    const e = this.e;
    console.error('[navigation] sector failed to load', err);
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

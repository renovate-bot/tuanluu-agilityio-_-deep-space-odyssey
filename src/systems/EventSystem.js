import * as THREE from 'three';
import { ease, lerp } from '../utils/math.js';
import { v3 } from '../scenes/helpers.js';

/**
 * Cinematic set-pieces that play after arrival. Each is a cancellable sequence; the visitor keeps full
 * control of the view while it runs and can skip it or simply leave for another destination.
 *
 *   flyby  – a slow arc that slides past a planet until it fills the glass
 *   nebula – a long drift into the gas, cabin washed in its colour
 *   galaxy – deck lights fall, the ship eases forward until the whole spiral is framed
 */
export class EventSystem {
  constructor(engine) {
    this.e = engine;
    this.token = null;
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
  }

  cancel() {
    if (!this.token) return;
    this.token.cancel();
    this.finish();
  }

  skip() { if (this.token) this.token.skip(); }

  finish() {
    const e = this.e;
    this.token = null;
    e.sectorLight = 1;
    e.thrust = 0.3;
    e.audio.setSwell(0);
    e.store.set({ event: null, canSkip: false, engineStatus: 'IDLE' });
  }

  onArrival(dest, skipped) {
    const e = this.e;
    if (!dest.event || !dest.approach || e.reducedMotion) return;
    const from = v3(dest.approach), to = v3(dest.pos), look = v3(dest.look);
    if (skipped) { // the visitor skipped the jump: go straight to the parked view
      e.ship.pos.copy(to); e._prevPos.copy(to); e.lookQuat(to, look, e.ship.quat);
      return;
    }
    if (dest.event === 'flyby') this.run('PLANETARY FLYBY', 24, from, to, look, { curve: 0.22, say: `Beginning close pass of ${dest.name.replace(/ (ORBIT|SYSTEM)$/, '')}.` });
    else if (dest.event === 'nebula') this.run('NEBULA PASSAGE', 44, from, to, look, { curve: 0.08, say: 'Entering the Azure Veil. Particle density rising; shields nominal.', alert: true });
    else if (dest.event === 'galaxy') this.run('GALAXY REVEAL', 34, from, to, look, { curve: 0.05, dim: true, swell: true, say: 'Dimming deck lights. Helix Crown ahead.' });
  }

  async run(name, duration, from, to, look, opts) {
    const e = this.e;
    const { anim, ship, store } = e;
    const token = (this.token = anim.token());
    store.set({ event: name, canSkip: true, engineStatus: 'CRUISE' });
    if (opts.say) e.say(opts.say);
    if (opts.alert) e.audio.play('alert');

    // bend the path sideways a little so the approach is an arc, not a dolly
    const mid = from.clone().lerp(to, 0.5);
    const side = new THREE.Vector3().subVectors(to, from).cross(THREE.Object3D.DEFAULT_UP).normalize().multiplyScalar(from.distanceTo(to) * opts.curve);
    mid.add(side);
    const cabin0 = e.cabinPower;

    await anim.to(duration, (t) => {
      const u = 1 - t;
      this._p.set(0, 0, 0).addScaledVector(from, u * u).addScaledVector(mid, 2 * u * t).addScaledVector(to, t * t);
      ship.pos.copy(this._p);
      e.lookQuat(ship.pos, look, this._q);
      ship.quat.slerp(this._q, 0.08);
      e.thrust = 0.35 + 0.25 * Math.sin(Math.PI * t);
      if (opts.dim) e.cabinPower = lerp(cabin0, 0.3, ease.inOutSine(Math.min(1, t * 4)));
      if (opts.swell) e.audio.setSwell(Math.sin(Math.PI * Math.min(1, t * 1.15)));
    }, ease.outCubic, token);

    if (token.cancelled) { e.cabinPower = Math.max(e.cabinPower, 1); return; }
    ship.pos.copy(to);
    e.lookQuat(to, look, ship.quat);
    if (opts.dim) {
      // hold the dark for a moment, then bring the deck back
      await anim.wait(3, token);
      await anim.to(3, (t) => { e.cabinPower = lerp(0.3, 1, t); }, ease.inOutSine, token);
      e.cabinPower = 1;
    }
    if (this.token === token) this.finish();
  }
}

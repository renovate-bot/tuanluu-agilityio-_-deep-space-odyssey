import * as THREE from 'three';
import { ease, lerp, clamp } from '../utils/math.js';
import { v3 } from '../scenes/helpers.js';
import { bodyFrame, frameOf, fromFrame } from './Vantage.js';

const MODE_NAME = { far: 'FAR ORBIT', close: 'CLOSE APPROACH' };

/**
 * Scripted ship movement after arrival. Each is a cancellable sequence; the visitor keeps control of the
 * view while it runs and can skip it or simply leave for another destination.
 *
 *   glide  – move between the far-orbit and close-approach vantage points of a body
 *   flyby  – a spline that sweeps low past a planet (for Saturn: along the ring plane)
 *   nebula – a long drift into the gas, cabin washed in its colour
 *   galaxy – deck lights fall, the ship eases forward until the whole spiral is framed
 */
export class EventSystem {
  constructor(engine) {
    this.e = engine;
    this.token = null;
    this._q = new THREE.Quaternion();
    this._p = new THREE.Vector3();
    this._o = new THREE.Vector3();
    this._l = new THREE.Vector3();
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
    if (this._lane) { this._lane(false); this._lane = null; }
    e.store.set({ event: null, canSkip: false, engineStatus: 'IDLE' });
  }

  /** Make sure the ship is in orbit of this body, jumping there first if it is somewhere else. */
  async reach(p) {
    const e = this.e;
    if (e.anchor === p.position && e.ship.pos.distanceTo(p.position) < p.body.radius * 14) return true;
    const dest = e.destinationFor(p.id);
    if (!dest) return false;
    await e.nav.travel({ ...dest, transient: true });
    return e.anchor === p.position;
  }

  /** Far orbit ⇄ close approach. */
  async glide(p, mode) {
    const e = this.e;
    const { anim, ship, store } = e;
    if (e.nav.busy || !p.body) return;
    if (!(await this.reach(p))) return;
    if (store.get().viewMode === mode && !this.token && mode === 'far') { e.say(`Already holding position at ${p.name}.`, false); return; }
    this.cancel();
    e.picking.cancelMove();
    const token = (this.token = anim.token());
    const def = p.body, anchor = p.position;
    const frame = frameOf(def, anchor);
    const off0 = ship.pos.clone().sub(anchor);
    const off1 = fromFrame(frame, def.views[mode], def.radius);
    const look = fromFrame(frame, mode === 'close' ? def.views.lookClose : def.views.lookFar, def.radius);
    const d0 = off0.length(), d1 = off1.length();
    const q0 = ship.quat.clone();
    e.audio.play('confirm');
    e.camera.reset();
    store.set({ event: MODE_NAME[mode], canSkip: true, engineStatus: 'MANOEUVRING', viewMode: mode });
    const dur = e.reducedMotion ? 2 : clamp(5 + Math.abs(d1 - d0) / def.radius * 2.2 + off0.angleTo(off1) * 3, 6, 13);
    await anim.to(dur, (t) => {
      // swing around the body rather than cutting a chord through it
      this._o.copy(off0).lerp(off1, t).setLength(lerp(d0, d1, t));
      ship.pos.copy(anchor).add(this._o);
      e.lookQuat(ship.pos, this._l.copy(anchor).add(look), this._q);
      ship.quat.slerpQuaternions(q0, this._q, Math.min(1, t * 1.3));
      e.thrust = 0.3 + 0.4 * Math.sin(Math.PI * t);
    }, ease.inOutCubic, token);
    if (this.token === token) this.finish();
  }

  /** Low pass along the body's flyby spline. */
  async flyby(p) {
    const e = this.e;
    const { anim, ship, store } = e;
    if (e.nav.busy || !p.body || !p.body.flyby) return;
    if (e.reducedMotion) return this.glide(p, 'close');
    if (!(await this.reach(p))) return;
    this.cancel();
    e.picking.cancelMove();
    const token = (this.token = anim.token());
    const def = p.body, anchor = p.position, R = def.radius;

    // Saturn's pass is laid out in the ring plane, with ice drifting past where the ship skims it
    let frame = bodyFrame(anchor), up = THREE.Object3D.DEFAULT_UP, lookPull = 0.5;
    const sector = e.universe.sectors.get(p.id);
    if (def.flybyFrame === 'ring' && sector) {
      const n = new THREE.Vector3(0, 1, 0).applyQuaternion(sector.planet.group.quaternion);
      frame = bodyFrame(anchor, n);
      up = frame.U; lookPull = 0.7;
      const local = frame.S.clone().applyQuaternion(sector.planet.group.quaternion.clone().invert());
      if (sector.setRingLane) { sector.setRingLane(Math.atan2(-local.z, local.x), true); this._lane = (v) => sector.setRingLane(0, v); }
    }
    const pts = [ship.pos.clone().sub(anchor), ...def.flyby.map((v) => fromFrame(frame, v, R))];
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const ahead = new THREE.Vector3();
    e.audio.play('confirm');
    e.camera.reset();
    store.set({ event: 'CINEMATIC FLYBY', canSkip: true, engineStatus: 'CRUISE', viewMode: 'flyby' });
    e.say(`Beginning close pass of ${p.name}.`);

    await anim.to(46, (t) => {
      curve.getPoint(t, this._o);
      ship.pos.copy(anchor).add(this._o);
      // look ahead along the path, pulled towards the body so its limb and horizon stay in frame
      curve.getPoint(Math.min(1, t + 0.1), ahead);
      this._l.copy(anchor).addScaledVector(ahead, lookPull);
      e.lookQuat(ship.pos, this._l, this._q, up);
      ship.quat.slerp(this._q, t < 0.02 ? 0.03 : 0.07);
      e.thrust = 0.35 + 0.3 * Math.sin(Math.PI * t);
      e.audio.setSwell(0.75 * Math.sin(Math.PI * t));
    }, ease.inOutSine, token);

    if (token.cancelled) return;
    if (token.skipped) { curve.getPoint(1, this._o); ship.pos.copy(anchor).add(this._o); e.lookQuat(ship.pos, this._l.copy(anchor).addScaledVector(this._o, lookPull), ship.quat, up); }
    if (this.token === token) this.finish();
  }

  /** Arrival cinematics of the fixed destinations. */
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

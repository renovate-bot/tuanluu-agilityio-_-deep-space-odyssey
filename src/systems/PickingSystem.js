import * as THREE from 'three';
import { ease, clamp } from '../utils/math.js';

/**
 * Selecting celestial bodies through the glass. Tests the pointer ray against each point of interest's
 * bounding sphere (no scene raycast needed), after making sure the deck itself is not in the way.
 */
export class PickingSystem {
  constructor(engine) {
    this.e = engine;
    this.ray = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.pointer = { x: 0, y: 0, moved: false, inside: false };
    this._v = new THREE.Vector3();
    this._o = new THREE.Vector3();
    this._hoverClock = 0;
    this.token = null;
    const dom = engine.canvas;
    this._move = (ev) => { this.pointer.x = ev.clientX; this.pointer.y = ev.clientY; this.pointer.moved = true; this.pointer.inside = true; this.pointer.touch = ev.pointerType === 'touch'; };
    this._leave = () => { this.pointer.inside = false; engine.store.set({ hover: null }); };
    this._click = (ev) => {
      if (engine.camera.dragDistance > 7) return;
      this.pointer.x = ev.clientX; this.pointer.y = ev.clientY;
      this.select(this.pick());
    };
    dom.addEventListener('pointermove', this._move);
    dom.addEventListener('pointerleave', this._leave);
    dom.addEventListener('click', this._click);
  }

  get active() {
    const s = this.e.store.get();
    return s.phase === 'explore' && !s.travel && this.e.mode === 'interior';
  }

  pick() {
    const e = this.e;
    if (!this.active) return null;
    this.ndc.set((this.pointer.x / window.innerWidth) * 2 - 1, -(this.pointer.y / window.innerHeight) * 2 + 1);

    // is a bulkhead, console or seat under the pointer?
    this.ray.setFromCamera(this.ndc, e.camC);
    this.ray.far = 30;
    const hits = this.ray.intersectObject(e.cockpit.group, true);
    for (const h of hits) {
      const m = h.object.material;
      if (m === e.cockpit.glassMat || !h.object.visible || h.object.isLine || h.object.isLineSegments) continue;
      if (m.transparent && m.opacity < 0.05) continue;
      return null;
    }

    this.ray.setFromCamera(this.ndc, e.camU);
    const dir = this.ray.ray.direction;
    let best = null, bestScore = Infinity;
    for (const p of e.universe.pois) {
      this._o.copy(p.position).sub(e.ship.pos); // floating origin: camera sits at 0
      const dist = this._o.length();
      const along = this._o.dot(dir);
      if (along <= 0) continue;
      const miss = Math.sqrt(Math.max(0, dist * dist - along * along));
      // generous minimum so distant specks are still clickable
      const r = Math.max(p.pickRadius, dist * 0.022 / e.camera.zoom);
      if (miss > r) continue;
      const inside = dist < p.pickRadius;
      // prefer the most specific object: smallest apparent size wins, being inside a volume loses
      const score = (inside ? 10 : 0) + r / dist;
      if (score < bestScore) { bestScore = score; best = p; }
    }
    return best;
  }

  select(p) {
    const e = this.e;
    if (!p) return;
    e.audio.play('select');
    e.store.set({
      target: { id: p.id, name: p.name, type: p.type, fictional: !!p.fictional, description: p.description, facts: p.facts || [], more: p.more || '' },
      observing: false, hover: null, navOpen: false, panel: null,
    });
    e.pushUi();
  }

  update(dt) {
    // hover feedback, throttled
    this._hoverClock += dt;
    if (this._hoverClock < 0.09 || !this.pointer.moved) return;
    this._hoverClock = 0;
    this.pointer.moved = false;
    const e = this.e;
    if (this.pointer.touch || e.camera.pointers.size > 0 || !this.pointer.inside) { if (e.store.get().hover) e.store.set({ hover: null }); return; }
    const p = this.pick();
    const cur = e.store.get().hover;
    if (!p) { if (cur) e.store.set({ hover: null }); e.canvas.style.cursor = ''; return; }
    e.canvas.style.cursor = 'pointer';
    if (!cur || cur.id !== p.id || Math.abs(cur.x - this.pointer.x) + Math.abs(cur.y - this.pointer.y) > 6) {
      if (!cur || cur.id !== p.id) e.audio.play('hover');
      e.store.set({ hover: { id: p.id, name: p.name, x: this.pointer.x, y: this.pointer.y } });
    }
  }

  current() {
    const t = this.e.store.get().target;
    return t ? this.e.universe.poiById(t.id) : null;
  }

  /** Turn the view (or, if it is out of sight, the whole ship) until the target is centred. */
  focus() {
    const e = this.e;
    const p = this.current();
    if (!p || e.nav.busy) return;
    e.audio.play('confirm');
    this._o.copy(p.position).sub(e.ship.pos);
    const dist = this._o.length();
    const local = this._v.copy(this._o).normalize().applyQuaternion(e.ship.quat.clone().invert());
    const yaw = Math.atan2(-local.x, -local.z);
    const pitch = Math.asin(clamp(local.y, -1, 1));
    // zoom so the body takes a comfortable share of the frame
    const ang = 2 * Math.atan(p.radius / Math.max(dist, p.radius * 1.01));
    const fov = clamp((ang * 180 / Math.PI) * 2.6, 22, 58);
    if (Math.abs(yaw) < 1.75 && pitch < 0.95 && pitch > -0.45) {
      e.camera.lookTo(yaw, pitch, fov);
    } else {
      e.events.cancel();
      if (this.token) this.token.cancel();
      const token = (this.token = e.anim.token());
      const q0 = e.ship.quat.clone();
      const q1 = e.lookQuat(e.ship.pos, p.position, new THREE.Quaternion());
      e.camera.lookTo(0, 0, fov);
      e.store.set({ engineStatus: 'MANOEUVRING' });
      e.anim.to(e.reducedMotion ? 1.2 : 3.2, (t) => e.ship.quat.slerpQuaternions(q0, q1, t), ease.inOutCubic, token).then(() => {
        if (this.token === token) { this.token = null; e.store.set({ engineStatus: 'IDLE' }); }
      });
    }
  }

  /** Move to a good vantage point for the target and open the extended read-out. */
  observe() {
    const e = this.e;
    const p = this.current();
    if (!p || e.nav.busy) return;
    const o = p.observe;
    const d = p.observeDist || p.radius;
    // keep the vantage on the same side of the body that the ship is already on
    const vantage = new THREE.Vector3(o[0], o[1], o[2]).multiplyScalar(d).add(p.position);
    const look = p.position.clone();
    const dist = vantage.distanceTo(e.ship.pos);
    e.store.set({ observing: true });
    if (dist > Math.max(40000, p.radius * 30)) {
      // too far for thrusters: make it a jump
      const cur = e.currentDest;
      e.nav.travel({
        id: `observe:${p.id}`, transient: true, name: p.name, sector: cur.sector, sectors: [], poi: p.id,
        pos: vantage.toArray(), look: look.toArray(), mood: cur.mood, cabin: cur.cabin, light: cur.light,
      }).then(() => { e.store.set({ observing: true, target: e.store.get().target || this.snapshot(p) }); });
      this._pending = p;
      return;
    }
    e.audio.play('confirm');
    e.events.cancel();
    if (this.token) this.token.cancel();
    const token = (this.token = e.anim.token());
    const from = e.ship.pos.clone();
    const q0 = e.ship.quat.clone();
    const q1 = e.lookQuat(vantage, look, new THREE.Quaternion());
    e.camera.lookTo(0, 0, 50);
    e.store.set({ engineStatus: 'MANOEUVRING' });
    e.say(`Moving to observation position: ${p.name}.`, false);
    const dur = e.reducedMotion ? 2 : clamp(3 + dist / (p.radius * 2.5), 4, 9);
    e.anim.to(dur, (t) => {
      e.ship.pos.lerpVectors(from, vantage, t);
      e.ship.quat.slerpQuaternions(q0, q1, Math.min(1, t * 1.25));
      e.thrust = 0.3 + 0.4 * Math.sin(Math.PI * t);
    }, ease.inOutCubic, token).then(() => {
      if (this.token === token) { this.token = null; e.thrust = 0.3; e.store.set({ engineStatus: 'IDLE' }); }
    });
  }

  snapshot(p) {
    return { id: p.id, name: p.name, type: p.type, fictional: !!p.fictional, description: p.description, facts: p.facts || [], more: p.more || '' };
  }

  dispose() {
    const dom = this.e.canvas;
    dom.removeEventListener('pointermove', this._move);
    dom.removeEventListener('pointerleave', this._leave);
    dom.removeEventListener('click', this._click);
  }
}

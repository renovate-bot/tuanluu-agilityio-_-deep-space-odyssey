import * as THREE from 'three';
import { clamp, damp } from '../utils/math.js';

const LIMITS = { yaw: 1.85, pitchUp: 1.0, pitchDown: 0.5, fovMin: 22, fovMax: 68, fovDefault: 58 };

/**
 * Observer's head: turns input (mouse, touch, keyboard, wheel, pinch) into a damped yaw / pitch / zoom.
 * Angles are clamped so the view never turns into the rear bulkhead or through the deck.
 */
export class CameraController {
  constructor(dom) {
    this.dom = dom;
    this.enabled = false;
    this.free = false; // true while a scripted sequence owns the view (limits are bypassed)
    this.yaw = 0; this.pitch = 0; this.fov = LIMITS.fovDefault;
    this.tYaw = 0; this.tPitch = 0; this.tFov = LIMITS.fovDefault;
    this.quat = new THREE.Quaternion();
    this._euler = new THREE.Euler(0, 0, 0, 'YXZ');
    this.keys = new Set();
    this.pointers = new Map();
    this.dragDistance = 0;
    this._pinch = 0;
    this.sensitivity = 1;
    this.onUserInput = null;

    this._down = (e) => {
      if (!this.enabled) return;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.dragDistance = 0;
      if (this.pointers.size === 2) this._pinch = this.pinchDist();
      try { dom.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
    };
    this._move = (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p || !this.enabled) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (this.pointers.size === 2) {
        const d = this.pinchDist();
        if (this._pinch > 0) this.zoomBy((this._pinch - d) * 0.12);
        this._pinch = d;
        return;
      }
      this.dragDistance += Math.abs(dx) + Math.abs(dy);
      // scale with zoom so a narrow field of view is not twitchy
      const k = 0.0032 * (this.fov / LIMITS.fovDefault) * this.sensitivity;
      this.look(dx * k, dy * k);
    };
    this._up = (e) => {
      this.pointers.delete(e.pointerId);
      this._pinch = 0;
    };
    this._wheel = (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.zoomBy(clamp(e.deltaY, -120, 120) * 0.035);
    };
    this._keydown = (e) => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      this.keys.add(e.code);
    };
    this._keyup = (e) => this.keys.delete(e.code);
    this._blur = () => { this.keys.clear(); this.pointers.clear(); };

    dom.addEventListener('pointerdown', this._down);
    dom.addEventListener('pointermove', this._move);
    dom.addEventListener('pointerup', this._up);
    dom.addEventListener('pointercancel', this._up);
    dom.addEventListener('wheel', this._wheel, { passive: false });
    window.addEventListener('keydown', this._keydown);
    window.addEventListener('keyup', this._keyup);
    window.addEventListener('blur', this._blur);
  }

  pinchDist() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  /** Drag right → the scene follows the hand, i.e. the view turns left (grab-the-world feel). */
  look(dx, dy) {
    this.tYaw = clamp(this.tYaw + dx, -LIMITS.yaw, LIMITS.yaw);
    this.tPitch = clamp(this.tPitch + dy, -LIMITS.pitchDown, LIMITS.pitchUp);
    if (this.onUserInput) this.onUserInput();
  }

  zoomBy(d) {
    this.tFov = clamp(this.tFov + d, LIMITS.fovMin, LIMITS.fovMax);
    if (this.onUserInput) this.onUserInput();
  }

  reset() { this.tYaw = 0; this.tPitch = 0; this.tFov = LIMITS.fovDefault; }

  /** Programmatic look (e.g. view presets). */
  lookTo(yaw, pitch, fov) {
    this.tYaw = clamp(yaw, -LIMITS.yaw, LIMITS.yaw);
    this.tPitch = clamp(pitch, -LIMITS.pitchDown, LIMITS.pitchUp);
    if (fov) this.tFov = clamp(fov, LIMITS.fovMin, LIMITS.fovMax);
  }

  /** Hard set, used by scripted sequences. */
  set(yaw, pitch) { this.yaw = this.tYaw = yaw; this.pitch = this.tPitch = pitch; }

  get zoom() { return LIMITS.fovDefault / this.fov; }

  update(dt) {
    if (this.enabled && this.keys.size) {
      const k = dt * 0.9 * (this.fov / LIMITS.fovDefault);
      let dx = 0, dy = 0;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dx += k;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dx -= k;
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dy += k;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dy -= k;
      if (dx || dy) this.look(dx, dy);
      if (this.keys.has('Equal') || this.keys.has('NumpadAdd')) this.zoomBy(-dt * 25);
      if (this.keys.has('Minus') || this.keys.has('NumpadSubtract')) this.zoomBy(dt * 25);
    }
    // slight lag behind the hand: reads as a head turning rather than a cursor
    this.yaw = damp(this.yaw, this.tYaw, 5.5, dt);
    this.pitch = damp(this.pitch, this.tPitch, 5.5, dt);
    this.fov = damp(this.fov, this.tFov, 5, dt);
    this._euler.set(this.pitch, this.yaw, 0);
    this.quat.setFromEuler(this._euler);
  }

  dispose() {
    const dom = this.dom;
    dom.removeEventListener('pointerdown', this._down);
    dom.removeEventListener('pointermove', this._move);
    dom.removeEventListener('pointerup', this._up);
    dom.removeEventListener('pointercancel', this._up);
    dom.removeEventListener('wheel', this._wheel);
    window.removeEventListener('keydown', this._keydown);
    window.removeEventListener('keyup', this._keyup);
    window.removeEventListener('blur', this._blur);
  }
}

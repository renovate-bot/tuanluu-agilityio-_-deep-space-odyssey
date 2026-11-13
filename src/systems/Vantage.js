import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);
const _s = new THREE.Vector3();

/**
 * Observation frame of a body: S points at the Sun, U is "up", T completes the set. Vantage points are
 * written in this frame (in body radii) so the lit side is always where the config expects it, wherever the
 * body currently is on its orbit. With `normal` (a ring plane) U is that normal, on the sunlit side.
 */
export function bodyFrame(position, normal = null) {
  const S = _s.copy(position).multiplyScalar(-1);
  if (S.lengthSq() < 1) S.set(1, 0, 0); else S.normalize();
  let U = UP.clone();
  if (normal) {
    U = normal.clone().normalize();
    if (U.dot(S) < 0) U.multiplyScalar(-1);
  }
  const Sp = S.clone().addScaledVector(U, -S.dot(U)).normalize();
  const T = new THREE.Vector3().crossVectors(Sp, U).normalize();
  return { S: Sp, U, T };
}

/** [s, u, t] in radii → offset vector in universe axes. */
export function fromFrame(frame, v, radius, out = new THREE.Vector3()) {
  return out.set(0, 0, 0).addScaledVector(frame.S, v[0] * radius).addScaledVector(frame.U, v[1] * radius).addScaledVector(frame.T, v[2] * radius);
}

const _e = new THREE.Euler();
/** Frame a body's vantage points are written in: the ring plane for Saturn, the ecliptic otherwise. */
export function frameOf(def, position) {
  if (def && def.ringTilt) return bodyFrame(position, new THREE.Vector3(0, 1, 0).applyEuler(_e.set(def.ringTilt[0], 0, def.ringTilt[1])));
  return bodyFrame(position);
}

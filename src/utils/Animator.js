import { ease } from './math.js';

/**
 * Tiny timeline helper driven by the engine clock.
 *
 *   const token = animator.token();
 *   await animator.to(2, (t) => ..., ease.inOutCubic, token);
 *   await animator.wait(1, token);
 *
 * token.skip()   → every running/future step of that token finishes instantly (end state is still applied)
 * token.cancel() → steps stop where they are and their promises resolve; the caller checks token.cancelled
 */
export class Animator {
  constructor() {
    this.items = [];
  }

  token() {
    const token = {
      skipped: false,
      cancelled: false,
      skip() { token.skipped = true; },
      cancel() { token.cancelled = true; },
    };
    return token;
  }

  to(duration, fn, easing = ease.linear, token = null) {
    return new Promise((resolve) => {
      if (token && token.cancelled) return resolve();
      if (duration <= 0 || (token && token.skipped)) {
        fn(1);
        return resolve();
      }
      this.items.push({ t: 0, duration, fn, easing, token, resolve });
    });
  }

  wait(duration, token = null) {
    return this.to(duration, () => {}, ease.linear, token);
  }

  update(dt) {
    const items = this.items;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (it.token && it.token.cancelled) {
        items.splice(i, 1);
        it.resolve();
        continue;
      }
      it.t += dt;
      const done = it.t >= it.duration || (it.token && it.token.skipped);
      it.fn(done ? 1 : it.easing(it.t / it.duration));
      if (done) {
        items.splice(i, 1);
        it.resolve();
      }
    }
  }

  clear() {
    for (const it of this.items) it.resolve();
    this.items.length = 0;
  }
}

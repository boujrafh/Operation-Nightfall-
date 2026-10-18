export const TAU = Math.PI * 2;

/** @param {number} v @param {number} lo @param {number} hi */
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/** @param {number} a @param {number} b @param {number} t */
export const lerp = (a, b, t) => a + (b - a) * t;

/** @param {number} ax @param {number} ay @param {number} bx @param {number} by */
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);

/** @param {number} ax @param {number} ay @param {number} bx @param {number} by */
export const angleTo = (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax);

/** Signed smallest difference b - a, in [-PI, PI]. */
export function angleDiff(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}

/** Rotates angle `cur` toward `target` by at most `maxStep` radians. */
export function rotateTowards(cur, target, maxStep) {
  const d = angleDiff(cur, target);
  if (Math.abs(d) <= maxStep) return target;
  return cur + Math.sign(d) * maxStep;
}

/** Maps an angle to one of the 4 sprite directions. */
export function angleToDir4(a) {
  const x = Math.cos(a);
  const y = Math.sin(a);
  if (Math.abs(x) >= Math.abs(y)) return x >= 0 ? 'E' : 'W';
  return y >= 0 ? 'S' : 'N';
}

/** @type {Record<string, number>} */
export const DIR_ANGLE = { E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 };

/** Deterministic pseudo random generator (mulberry32). */
export function createRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

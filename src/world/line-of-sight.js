import { TILE } from '../core/config.js';

/**
 * Casts a ray through the tile grid (Amanatides & Woo traversal) and
 * returns the distance to the first sight-blocking tile, capped at maxDist.
 * @param {{ blocksSight: (tx: number, ty: number) => boolean }} tm
 * @param {number} x0 @param {number} y0 @param {number} angle @param {number} maxDist
 */
export function castRay(tm, x0, y0, angle, maxDist) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let tx = Math.floor(x0 / TILE);
  let ty = Math.floor(y0 / TILE);
  const stepX = dx > 0 ? 1 : -1;
  const stepY = dy > 0 ? 1 : -1;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  let tMaxX = adx < 1e-9 ? Infinity : (dx > 0 ? (tx + 1) * TILE - x0 : x0 - tx * TILE) / adx;
  let tMaxY = ady < 1e-9 ? Infinity : (dy > 0 ? (ty + 1) * TILE - y0 : y0 - ty * TILE) / ady;
  const tDeltaX = adx < 1e-9 ? Infinity : TILE / adx;
  const tDeltaY = ady < 1e-9 ? Infinity : TILE / ady;
  for (let i = 0; i < 64; i++) {
    let t;
    if (tMaxX < tMaxY) {
      t = tMaxX;
      tMaxX += tDeltaX;
      tx += stepX;
    } else {
      t = tMaxY;
      tMaxY += tDeltaY;
      ty += stepY;
    }
    if (t >= maxDist) return maxDist;
    if (tm.blocksSight(tx, ty)) return t;
  }
  return maxDist;
}

/**
 * True when nothing blocks sight between the two points.
 * @param {{ blocksSight: (tx: number, ty: number) => boolean }} tm
 */
export function hasLineOfSight(tm, x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0);
  if (d < 1) return true;
  const a = Math.atan2(y1 - y0, x1 - x0);
  return castRay(tm, x0, y0, a, d) >= d - 0.5;
}

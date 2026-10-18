import { TILE } from '../core/config.js';

/**
 * True when a square box of half-size `r` centred on (x, y) overlaps a
 * non-walkable tile.
 * @param {number} x @param {number} y @param {number} r
 * @param {{ isWalkable: (tx: number, ty: number) => boolean }} tm
 */
export function boxBlocked(x, y, r, tm) {
  const x0 = Math.floor((x - r) / TILE);
  const x1 = Math.floor((x + r - 0.001) / TILE);
  const y0 = Math.floor((y - r) / TILE);
  const y1 = Math.floor((y + r - 0.001) / TILE);
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      if (!tm.isWalkable(tx, ty)) return true;
    }
  }
  return false;
}

/**
 * Moves an entity one axis at a time so it slides along walls. When the
 * move is blocked near a corner, it nudges the entity sideways (corner
 * assist) so it does not snag on tile edges.
 * @param {{ x: number, y: number }} ent
 * @param {number} dx @param {number} dy @param {number} r
 * @param {{ isWalkable: (tx: number, ty: number) => boolean }} tm
 * @returns {{ blockedX: boolean, blockedY: boolean }}
 */
export function moveAndCollide(ent, dx, dy, r, tm) {
  let blockedX = false;
  let blockedY = false;
  if (dx !== 0) {
    if (!boxBlocked(ent.x + dx, ent.y, r, tm)) ent.x += dx;
    else {
      blockedX = true;
      if (dy === 0) nudge(ent, dx, 0, r, tm);
    }
  }
  if (dy !== 0) {
    if (!boxBlocked(ent.x, ent.y + dy, r, tm)) ent.y += dy;
    else {
      blockedY = true;
      if (dx === 0) nudge(ent, 0, dy, r, tm);
    }
  }
  return { blockedX, blockedY };
}

/** Corner assist: slides up to 6px sideways toward a free lane. */
function nudge(ent, dx, dy, r, tm) {
  const step = Math.max(Math.abs(dx), Math.abs(dy));
  for (let off = 1; off <= 6; off++) {
    for (const s of [-1, 1]) {
      const ox = dx === 0 ? s * off : 0;
      const oy = dy === 0 ? s * off : 0;
      if (!boxBlocked(ent.x + ox + dx, ent.y + oy + dy, r, tm)) {
        const mx = dx === 0 ? s * Math.min(step, off) : 0;
        const my = dy === 0 ? s * Math.min(step, off) : 0;
        if (!boxBlocked(ent.x + mx, ent.y + my, r, tm)) {
          ent.x += mx;
          ent.y += my;
        }
        return;
      }
    }
  }
}

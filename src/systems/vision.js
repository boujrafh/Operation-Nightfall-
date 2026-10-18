import { GUARD } from '../core/config.js';
import { angleDiff, angleTo, dist } from '../core/math.js';
import { castRay, hasLineOfSight } from '../world/line-of-sight.js';

/**
 * Vision cone size for the current alert level.
 * @param {string} level 'INFILTRATION' | 'ALERT' | 'EVASION'
 * @param {boolean} [dark]
 */
export function visionParams(level, dark = false) {
  const alert = level !== 'INFILTRATION';
  let range = alert ? GUARD.ALERT_RANGE : GUARD.RANGE;
  if (dark) range *= GUARD.DARK_RANGE_MULT;
  return { fov: alert ? GUARD.ALERT_FOV : GUARD.FOV, range };
}

/**
 * Hidden: inside a bush, or in the cardboard box without moving.
 * @param {{ x: number, y: number, boxOn: boolean, moving: boolean }} player
 * @param {import('../world/tilemap.js').TileMap} tm
 */
export function isConcealed(player, tm) {
  if (tm.typeAtPx(player.x, player.y).hide === 'inside') return true;
  return player.boxOn && !player.moving;
}

/**
 * Full detection test: touch (in front), concealment, range, angle, walls.
 * @param {import('../world/tilemap.js').TileMap} tm
 * @param {number} ox @param {number} oy @param {number} dir
 * @param {number} fov @param {number} range
 * @param {{ x: number, y: number, boxOn: boolean, moving: boolean, dead: boolean }} player
 */
export function canSeePlayer(tm, ox, oy, dir, fov, range, player) {
  if (player.dead) return false;
  const d = dist(ox, oy, player.x, player.y);
  const off = Math.abs(angleDiff(dir, angleTo(ox, oy, player.x, player.y)));
  if (d < GUARD.TOUCH_DIST && off < Math.PI / 2) return true;
  if (isConcealed(player, tm)) return false;
  if (d > range || off > fov / 2) return false;
  return hasLineOfSight(tm, ox, oy, player.x, player.y);
}

/**
 * Polygon of the visible area, clipped by sight-blocking tiles.
 * @param {import('../world/tilemap.js').TileMap} tm
 * @param {{x:number,y:number}[]} [out] reused array
 */
export function buildCone(tm, ox, oy, dir, fov, range, rays = 18, out = []) {
  out.length = 0;
  out.push({ x: ox, y: oy });
  for (let i = 0; i <= rays; i++) {
    const a = dir - fov / 2 + (fov * i) / rays;
    const d = castRay(tm, ox, oy, a, range);
    out.push({ x: ox + Math.cos(a) * d, y: oy + Math.sin(a) * d });
  }
  return out;
}

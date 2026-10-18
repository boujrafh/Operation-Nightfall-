import { GUARD, PLAYER, TIMING } from '../core/config.js';
import { angleDiff, angleTo, dist } from '../core/math.js';
import { Pool } from '../core/pool.js';
import { G } from '../entities/guard.js';

const DEG = Math.PI / 180;

/**
 * A guard the player can take down: close, in front of the player,
 * and the player is behind the guard (outside its view).
 * @param {any} player @param {any[]} guards
 */
export function findTakedownTarget(player, guards) {
  let best = null;
  let bestD = Infinity;
  for (const g of guards) {
    if (g.down) continue;
    const d = dist(player.x, player.y, g.x, g.y);
    if (d > PLAYER.TAKEDOWN_RANGE || d >= bestD) continue;
    const facing = Math.abs(angleDiff(player.facingAngle, angleTo(player.x, player.y, g.x, g.y)));
    if (facing > 60 * DEG) continue;
    const behind = Math.abs(angleDiff(g.dir, angleTo(g.x, g.y, player.x, player.y)));
    if (behind < GUARD.BEHIND_ANGLE) continue;
    if (g.state === G.CHASE && g.seesPlayer) continue;
    best = g;
    bestD = d;
  }
  return best;
}

/** Nearest standing guard in front of the player, in punch range. */
export function findPunchTarget(player, guards) {
  let best = null;
  let bestD = Infinity;
  for (const g of guards) {
    if (g.down) continue;
    const d = dist(player.x, player.y, g.x, g.y);
    if (d > PLAYER.PUNCH_RANGE || d >= bestD) continue;
    const facing = Math.abs(angleDiff(player.facingAngle, angleTo(player.x, player.y, g.x, g.y)));
    if (facing > 70 * DEG) continue;
    best = g;
    bestD = d;
  }
  return best;
}

/** @param {any} g */
export function knockOut(g) {
  g.state = G.DOWN;
  g.koTimer = TIMING.KO;
  g.path = [];
  g.bubble = null;
  g.moving = false;
  g.seesPlayer = false;
  g.spotTimer = 0;
}

/** Guard bullets, pooled. */
export class BulletSystem {
  constructor(size = 24) {
    this.pool = new Pool(() => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, active: false }), size);
  }

  /** @param {number} x @param {number} y @param {number} angle */
  spawn(x, y, angle) {
    const b = this.pool.obtain();
    if (!b) return;
    b.x = x + Math.cos(angle) * 8;
    b.y = y + Math.sin(angle) * 8;
    b.vx = Math.cos(angle) * GUARD.BULLET_SPEED;
    b.vy = Math.sin(angle) * GUARD.BULLET_SPEED;
    b.life = 2;
  }

  /**
   * @param {number} dt
   * @param {import('../world/tilemap.js').TileMap} tm
   * @param {{ x: number, y: number, dead: boolean }} player
   * @param {() => void} onHitPlayer
   * @param {() => void} onHitWall
   */
  update(dt, tm, player, onHitPlayer, onHitWall) {
    this.pool.forEachActive((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (b.life <= 0) {
        b.active = false;
        return;
      }
      if (tm.blocksBullets(Math.floor(b.x / 16), Math.floor(b.y / 16))) {
        b.active = false;
        onHitWall();
        return;
      }
      if (
        !player.dead &&
        Math.abs(b.x - player.x) < PLAYER.RADIUS + 1 &&
        Math.abs(b.y - player.y) < PLAYER.RADIUS + 2
      ) {
        b.active = false;
        onHitPlayer();
      }
    });
  }

  clear() {
    this.pool.releaseAll();
  }
}

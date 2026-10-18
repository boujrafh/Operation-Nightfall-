import { GUARD, TILE, TIMING } from '../core/config.js';
import { angleDiff, angleTo, dist, rotateTowards } from '../core/math.js';
import { findPath, nearestWalkable } from '../world/pathfinding.js';
import { G } from '../entities/guard.js';
import { ALERT } from './alert-manager.js';

const tileOf = (v) => Math.floor(v / TILE);
const center = (t) => t * TILE + TILE / 2;

/**
 * @typedef {{
 *   dt: number,
 *   walk: (tx: number, ty: number) => boolean,
 *   player: { x: number, y: number, dead: boolean },
 *   alert: import('./alert-manager.js').AlertManager,
 *   canSee: (g: any) => boolean,
 *   noises: { x: number, y: number, radius: number }[],
 *   onSpotted: (g: any) => void,
 *   onMelee: (g: any) => void,
 *   onShoot: (g: any, angle: number) => void,
 *   onSuspicious: (g: any) => void,
 *   rng: () => number,
 * }} AiWorld
 */

/** @param {any} g @param {string} s */
export function setState(g, s) {
  g.state = s;
  g.stateTimer = 0;
  g.path = [];
  g.repath = 0;
  g.lookTimer = 0;
  g.spotTimer = 0;
}

/** @param {any} g @param {AiWorld} w */
function planTo(g, w, px, py) {
  const goal = nearestWalkable(w.walk, tileOf(px), tileOf(py));
  if (!goal) {
    g.path = [];
    return false;
  }
  const start = { x: tileOf(g.x), y: tileOf(g.y) };
  const p = findPath(w.walk, start, goal);
  g.path = p || [];
  if (
    p &&
    p.length === 0 &&
    (Math.abs(g.x - center(goal.x)) > 0.5 || Math.abs(g.y - center(goal.y)) > 0.5)
  ) {
    g.path = [goal];
  }
  return !!p;
}

/** Walks along the current path. Returns true when the path is finished. */
function followPath(g, w, speed, faceMove = true) {
  if (!g.path.length) {
    g.moving = false;
    return true;
  }
  const n = g.path[0];
  const tx = center(n.x);
  const ty = center(n.y);
  const dx = tx - g.x;
  const dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  const step = speed * w.dt;
  if (d <= step) {
    g.x = tx;
    g.y = ty;
    g.path.shift();
  } else {
    g.x += (dx / d) * step;
    g.y += (dy / d) * step;
  }
  if (faceMove && d > 0.01)
    g.dir = rotateTowards(g.dir, Math.atan2(dy, dx), GUARD.TURN_SPEED * w.dt);
  g.moving = true;
  g.animTime += w.dt;
  return g.path.length === 0;
}

function lookAround(g, w) {
  if (g.lookTimer === 0) g.lookBase = g.dir;
  g.lookTimer += w.dt;
  g.dir = g.lookBase + Math.sin(g.lookTimer * 2.6) * 1.1;
  g.moving = false;
}

/** @param {any} g @param {AiWorld} w */
export function becomeSuspicious(g, w, x, y) {
  setState(g, G.SUSPICIOUS);
  g.target = { x, y };
  g.showBubble('?');
  planTo(g, w, x, y);
  w.onSuspicious(g);
}

function advanceRoute(g) {
  const n = g.route.length;
  if (n < 2) return;
  if (g.loop === 'pingpong') {
    if (g.routeIdx + g.routeDir >= n || g.routeIdx + g.routeDir < 0) g.routeDir = -g.routeDir;
    g.routeIdx += g.routeDir;
  } else g.routeIdx = (g.routeIdx + 1) % n;
}

function patrol(g, w) {
  if (!g.route.length) {
    g.moving = false;
    return;
  }
  if (g.waitTimer > 0) {
    g.waitTimer -= w.dt;
    g.moving = false;
    if (g.lookAt !== undefined)
      g.dir = rotateTowards(g.dir, g.lookAt, GUARD.TURN_SPEED * 0.5 * w.dt);
    return;
  }
  g.lookAt = undefined;
  const wp = g.route[g.routeIdx];
  const tx = center(wp.x);
  const ty = center(wp.y);
  if (!g.path.length) {
    if (Math.abs(g.x - tx) < 0.5 && Math.abs(g.y - ty) < 0.5) {
      g.waitTimer = wp.wait || 0;
      g.lookAt = wp.look !== undefined ? lookAngle(wp.look) : undefined;
      advanceRoute(g);
      return;
    }
    planTo(g, w, tx, ty);
  }
  followPath(g, w, GUARD.SPEED * g.speedMult);
}

/** @param {string|number} look */
function lookAngle(look) {
  if (typeof look === 'number') return look;
  return { E: 0, S: Math.PI / 2, W: Math.PI, N: -Math.PI / 2 }[look];
}

function chase(g, w) {
  const p = w.player;
  const target = g.seesPlayer ? p : w.alert.lastKnown || p;
  g.repath -= w.dt;
  if (g.repath <= 0) {
    planTo(g, w, target.x, target.y);
    g.repath = GUARD.REPATH;
  }
  const d = dist(g.x, g.y, p.x, p.y);
  const toPlayer = angleTo(g.x, g.y, p.x, p.y);
  if (g.seesPlayer && d < GUARD.MELEE_RANGE) {
    g.moving = false;
    g.dir = rotateTowards(g.dir, toPlayer, GUARD.TURN_SPEED * w.dt);
    if (g.meleeCd <= 0) {
      g.meleeCd = GUARD.MELEE_COOLDOWN;
      w.onMelee(g);
    }
    return;
  }
  if (g.armed && g.seesPlayer && d <= GUARD.SHOOT_RANGE && d > GUARD.MELEE_RANGE * 1.5) {
    g.dir = rotateTowards(g.dir, toPlayer, GUARD.TURN_SPEED * w.dt);
    if (g.shootCd <= 0 && Math.abs(angleDiff(g.dir, toPlayer)) < 0.3) {
      g.shootCd = GUARD.SHOOT_COOLDOWN;
      w.onShoot(g, toPlayer);
    }
    if (g.shootCd > GUARD.SHOOT_COOLDOWN - 0.35) {
      g.moving = false;
      return;
    }
  }
  followPath(g, w, GUARD.CHASE_SPEED, !g.seesPlayer);
  if (g.seesPlayer) g.dir = rotateTowards(g.dir, toPlayer, GUARD.TURN_SPEED * w.dt);
}

function search(g, w) {
  if (!g.target) {
    g.target = w.alert.lastKnown ? { ...w.alert.lastKnown } : { x: g.x, y: g.y };
    g.searchLeft = 4;
    planTo(g, w, g.target.x, g.target.y);
  }
  if (g.path.length) {
    followPath(g, w, GUARD.SPEED * 1.25);
    return;
  }
  lookAround(g, w);
  if (g.lookTimer >= GUARD.LOOK_TIME && g.searchLeft > 0) {
    g.searchLeft--;
    g.lookTimer = 0;
    const base = w.alert.lastKnown || g.target;
    const r = GUARD.SEARCH_RADIUS;
    for (let tries = 0; tries < 8; tries++) {
      const tx = tileOf(base.x) + Math.round((w.rng() * 2 - 1) * r);
      const ty = tileOf(base.y) + Math.round((w.rng() * 2 - 1) * r);
      if (w.walk(tx, ty)) {
        planTo(g, w, center(tx), center(ty));
        break;
      }
    }
  }
}

function returnToRoute(g, w) {
  if (g.reinforcement) {
    if (!g.path.length) {
      if (g.home && dist(g.x, g.y, g.home.x, g.home.y) < 1) {
        g.gone = true;
        return;
      }
      if (g.home) planTo(g, w, g.home.x, g.home.y);
    }
    followPath(g, w, GUARD.SPEED);
    return;
  }
  if (!g.route.length) {
    setState(g, G.PATROL);
    return;
  }
  const wp = g.route[g.routeIdx];
  if (!g.path.length) {
    if (Math.abs(g.x - center(wp.x)) < 0.5 && Math.abs(g.y - center(wp.y)) < 0.5) {
      setState(g, G.PATROL);
      return;
    }
    planTo(g, w, center(wp.x), center(wp.y));
    if (!g.path.length) {
      setState(g, G.PATROL);
      return;
    }
  }
  followPath(g, w, GUARD.SPEED * g.speedMult);
}

function suspicious(g, w) {
  g.stateTimer += w.dt;
  if (g.path.length) {
    followPath(g, w, GUARD.SPEED);
    return;
  }
  lookAround(g, w);
  if (g.lookTimer >= TIMING.SUSPICIOUS) setState(g, G.RETURN);
}

/**
 * One AI step for a guard.
 * @param {any} g @param {AiWorld} w
 */
export function updateGuard(g, w) {
  if (g.bubbleTimer > 0) {
    g.bubbleTimer -= w.dt;
    if (g.bubbleTimer <= 0) g.bubble = null;
  }
  if (g.hitFlash > 0) g.hitFlash -= w.dt;
  if (g.meleeCd > 0) g.meleeCd -= w.dt;
  if (g.shootCd > 0) g.shootCd -= w.dt;

  if (g.state === G.DOWN) {
    g.seesPlayer = false;
    g.moving = false;
    g.koTimer -= w.dt;
    if (g.koTimer <= 0) {
      g.hp = GUARD.HP;
      becomeSuspicious(g, w, g.x, g.y);
    }
    return;
  }

  const level = w.alert.level;
  if (level === ALERT.ALERT && g.state !== G.CHASE) setState(g, G.CHASE);
  else if (level === ALERT.EVASION && g.state === G.CHASE) {
    setState(g, G.SEARCH);
    g.target = null;
  } else if (level === ALERT.INFILTRATION && (g.state === G.CHASE || g.state === G.SEARCH)) {
    setState(g, G.RETURN);
  }

  g.seesPlayer = w.canSee(g);

  if (g.state !== G.CHASE) {
    if (g.seesPlayer) {
      g.spotTimer += w.dt;
      const grace = level === ALERT.INFILTRATION ? TIMING.SPOT_GRACE : 0.05;
      if (g.spotTimer >= grace) {
        g.spotTimer = 0;
        w.onSpotted(g);
        return;
      }
    } else if (g.spotTimer > 0) {
      g.spotTimer = 0;
      if (level === ALERT.INFILTRATION) {
        becomeSuspicious(g, w, w.player.x, w.player.y);
        return;
      }
    }
    if (
      level === ALERT.INFILTRATION &&
      (g.state === G.PATROL || g.state === G.RETURN || g.state === G.SUSPICIOUS)
    ) {
      for (const n of w.noises) {
        if (dist(g.x, g.y, n.x, n.y) <= n.radius) {
          becomeSuspicious(g, w, n.x, n.y);
          return;
        }
      }
    }
  }

  switch (g.state) {
    case G.PATROL:
      patrol(g, w);
      break;
    case G.SUSPICIOUS:
      suspicious(g, w);
      break;
    case G.CHASE:
      chase(g, w);
      break;
    case G.SEARCH:
      search(g, w);
      break;
    case G.RETURN:
      returnToRoute(g, w);
      break;
    default:
      break;
  }
}

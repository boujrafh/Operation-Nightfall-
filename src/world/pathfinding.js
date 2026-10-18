import { COLS, ROWS } from '../core/config.js';

const DIRS = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** Octile distance. */
const heuristic = (ax, ay, bx, by) => {
  const dx = Math.abs(ax - bx);
  const dy = Math.abs(ay - by);
  return dx + dy + (Math.SQRT2 - 2) * Math.min(dx, dy);
};

/**
 * A* on the tile grid, 8 directions, no corner cutting.
 * @param {(tx: number, ty: number) => boolean} walkable
 * @param {{x:number,y:number}} start
 * @param {{x:number,y:number}} goal
 * @returns {{x:number,y:number}[] | null} tiles after `start`, ending at `goal`
 */
export function findPath(walkable, start, goal, cols = COLS, rows = ROWS) {
  if (!walkable(goal.x, goal.y)) return null;
  if (start.x === goal.x && start.y === goal.y) return [];
  const size = cols * rows;
  const g = new Float64Array(size).fill(Infinity);
  const f = new Float64Array(size).fill(Infinity);
  const came = new Int32Array(size).fill(-1);
  const closed = new Uint8Array(size);
  const open = [];
  const si = start.y * cols + start.x;
  g[si] = 0;
  f[si] = heuristic(start.x, start.y, goal.x, goal.y);
  open.push(si);
  const gi = goal.y * cols + goal.x;
  while (open.length) {
    let best = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[best]]) best = i;
    const cur = open[best];
    open[best] = open[open.length - 1];
    open.pop();
    if (cur === gi) {
      const path = [];
      let n = cur;
      while (n !== si) {
        path.push({ x: n % cols, y: Math.floor(n / cols) });
        n = came[n];
      }
      return path.reverse();
    }
    closed[cur] = 1;
    const cx = cur % cols;
    const cy = Math.floor(cur / cols);
    for (const [dx, dy, cost] of DIRS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      if (!walkable(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!walkable(cx + dx, cy) || !walkable(cx, cy + dy))) continue;
      const ni = ny * cols + nx;
      if (closed[ni]) continue;
      const ng = g[cur] + cost;
      if (ng < g[ni]) {
        if (g[ni] === Infinity) open.push(ni);
        g[ni] = ng;
        f[ni] = ng + heuristic(nx, ny, goal.x, goal.y);
        came[ni] = cur;
      }
    }
  }
  return null;
}

/**
 * Nearest walkable tile to (tx, ty), searching outward in rings.
 * @param {(tx: number, ty: number) => boolean} walkable
 */
export function nearestWalkable(walkable, tx, ty, maxRadius = 4) {
  if (walkable(tx, ty)) return { x: tx, y: ty };
  for (let r = 1; r <= maxRadius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (walkable(tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy };
      }
    }
  }
  return null;
}

/**
 * Flood fill from a tile; returns the set of reachable "x,y" keys.
 * @param {(tx: number, ty: number) => boolean} walkable
 */
export function reachable(walkable, start, cols = COLS, rows = ROWS) {
  const seen = new Set();
  if (!walkable(start.x, start.y)) return seen;
  const queue = [start];
  seen.add(`${start.x},${start.y}`);
  while (queue.length) {
    const { x, y } = queue.shift();
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx;
      const ny = y + dy;
      const k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen.has(k)) continue;
      if (!walkable(nx, ny)) continue;
      seen.add(k);
      queue.push({ x: nx, y: ny });
    }
  }
  return seen;
}

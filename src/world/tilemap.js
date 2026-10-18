import { COLS, ROWS, TILE } from '../core/config.js';

/**
 * Tile legend (Doc 06 §2.3).
 * walk: can be walked on · sight: blocks vision · hide: 'inside' | 'behind' | null
 * step: footstep sound class · bullet: stops bullets
 */
export const TILE_TYPES = Object.freeze({
  '.': { name: 'sand', walk: true, sight: false, hide: null, step: 'soft', bullet: false },
  ',': { name: 'grass', walk: true, sight: false, hide: null, step: 'soft', bullet: false },
  '=': { name: 'concrete', walk: true, sight: false, hide: null, step: 'normal', bullet: false },
  ':': { name: 'metal', walk: true, sight: false, hide: null, step: 'loud', bullet: false },
  '#': { name: 'wall', walk: false, sight: true, hide: null, step: null, bullet: true },
  F: { name: 'fence', walk: false, sight: false, hide: null, step: null, bullet: false },
  '~': { name: 'water', walk: false, sight: false, hide: null, step: null, bullet: false },
  B: { name: 'bush', walk: true, sight: false, hide: 'inside', step: 'rustle', bullet: false },
  C: { name: 'crate', walk: false, sight: true, hide: 'behind', step: null, bullet: true },
  D: { name: 'door', walk: false, sight: true, hide: null, step: null, bullet: true },
});

const DOOR_OPEN = Object.freeze({
  name: 'door-open',
  walk: true,
  sight: false,
  hide: null,
  step: 'normal',
  bullet: false,
});

export const LEGEND = Object.keys(TILE_TYPES);

/** Runtime tile grid for one room. */
export class TileMap {
  /**
   * @param {string[]} rows 11 strings of 16 characters
   * @param {{ edge: string, from: number, to: number }[]} [exits]
   */
  constructor(rows, exits = []) {
    if (rows.length !== ROWS || rows.some((r) => r.length !== COLS)) {
      throw new Error(`Room must be ${COLS}x${ROWS} tiles`);
    }
    this.rows = rows;
    this.exits = exits;
    this.exitsLocked = false;
    /** @type {Map<string, { open: boolean, level: number, id: string }>} */
    this.doors = new Map();
  }

  /** @param {{ id: string, x: number, y: number, level: number }} door @param {boolean} open */
  addDoor(door, open) {
    this.doors.set(`${door.x},${door.y}`, { id: door.id, level: door.level, open });
  }

  /** @param {number} tx @param {number} ty */
  doorAt(tx, ty) {
    return this.doors.get(`${tx},${ty}`) || null;
  }

  /** @param {number} tx @param {number} ty */
  inBounds(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS;
  }

  /** @param {number} tx @param {number} ty */
  char(tx, ty) {
    if (!this.inBounds(tx, ty)) return '#';
    return this.rows[ty][tx];
  }

  /** @param {number} tx @param {number} ty */
  type(tx, ty) {
    const ch = this.char(tx, ty);
    if (ch === 'D') {
      const d = this.doorAt(tx, ty);
      if (d && d.open) return DOOR_OPEN;
    }
    return TILE_TYPES[ch] || TILE_TYPES['#'];
  }

  /** True when an out-of-bounds tile lies in an (unlocked) exit opening. */
  isExitTile(tx, ty) {
    if (this.inBounds(tx, ty)) return false;
    for (const e of this.exits) {
      if (e.edge === 'W' && tx < 0 && ty >= e.from && ty <= e.to) return true;
      if (e.edge === 'E' && tx >= COLS && ty >= e.from && ty <= e.to) return true;
      if (e.edge === 'N' && ty < 0 && tx >= e.from && tx <= e.to) return true;
      if (e.edge === 'S' && ty >= ROWS && tx >= e.from && tx <= e.to) return true;
    }
    return false;
  }

  /** @param {number} tx @param {number} ty */
  isWalkable(tx, ty) {
    if (!this.inBounds(tx, ty)) return !this.exitsLocked && this.isExitTile(tx, ty);
    return this.type(tx, ty).walk;
  }

  /** Walkable for AI pathing (never leaves the room). */
  isWalkableInside(tx, ty) {
    return this.inBounds(tx, ty) && this.type(tx, ty).walk;
  }

  /** @param {number} tx @param {number} ty */
  blocksSight(tx, ty) {
    if (!this.inBounds(tx, ty)) return !this.isExitTile(tx, ty);
    return this.type(tx, ty).sight;
  }

  /** @param {number} tx @param {number} ty */
  blocksBullets(tx, ty) {
    if (!this.inBounds(tx, ty)) return true;
    return this.type(tx, ty).bullet;
  }

  /** Tile type under a pixel position. @param {number} px @param {number} py */
  typeAtPx(px, py) {
    return this.type(Math.floor(px / TILE), Math.floor(py / TILE));
  }
}

import { TILE } from '../core/config.js';
import { TileMap } from './tilemap.js';
import { nearestWalkable } from './pathfinding.js';
import { Guard } from '../entities/guard.js';
import { Pickup } from '../entities/pickup.js';
import { Door } from '../entities/door.js';
import { SecurityCamera } from '../entities/camera.js';
import { knockOut } from '../systems/combat.js';

const center = (t) => t * TILE + TILE / 2;

/**
 * Builds the runtime state of a room from its definition and the saved
 * progress, and remembers per-room state (knocked-out guards, dropped
 * items) while the session lasts.
 */
export class RoomManager {
  /**
   * @param {any} registry
   * @param {import('../state/progress-store.js').ProgressStore} progress
   */
  constructor(registry, progress) {
    this.registry = registry;
    this.progress = progress;
    /** @type {Map<string, { ko: Map<string, number>, drops: any[] }>} */
    this.memory = new Map();
  }

  /** @param {string} roomId */
  mem(roomId) {
    if (!this.memory.has(roomId)) this.memory.set(roomId, { ko: new Map(), drops: [] });
    return this.memory.get(roomId);
  }

  /**
   * @param {string} roomId
   * @param {number} time session clock (seconds)
   */
  build(roomId, time) {
    const def = this.registry.getRoom(roomId);
    const tm = new TileMap(def.tiles, def.exits);
    const doors = def.doors.map((d) => {
      const open = this.progress.has('door', d.id);
      tm.addDoor(d, open);
      return new Door(d, open);
    });
    const mem = this.mem(roomId);
    const guards = def.guards.map((gd) => {
      const wp = gd.route[0];
      const g = new Guard(gd, { x: center(wp.x), y: center(wp.y) });
      if (gd.carries && this.progress.has('pickup', `drop_${gd.id}`)) g.carries = null;
      if (mem.drops.some((d) => d.id === `drop_${gd.id}`)) g.carries = null;
      const until = mem.ko.get(gd.id);
      if (until !== undefined && until > time) {
        knockOut(g);
        g.koTimer = until - time;
      }
      return g;
    });
    const pickups = [...def.pickups, ...mem.drops]
      .filter((p) => !this.progress.has('pickup', p.id))
      .map((p) => new Pickup(p));
    const cameras = (def.cameras || []).map((c) => new SecurityCamera(c));
    return { id: roomId, def, tm, doors, guards, pickups, cameras, triggers: def.triggers };
  }

  /**
   * Stores knocked-out guards before leaving a room.
   * @param {{ id: string, guards: any[] }} room @param {number} time
   */
  remember(room, time) {
    const mem = this.mem(room.id);
    mem.ko.clear();
    for (const g of room.guards) {
      if (g.down && !g.reinforcement) mem.ko.set(g.id, time + g.koTimer);
    }
  }

  /**
   * Drops the item a guard carries, as a pickup with a stable id.
   * @param {any} room @param {any} g Guard
   * @returns {Pickup|null}
   */
  dropCarried(room, g) {
    if (!g.carries) return null;
    const id = `drop_${g.id}`;
    const itemId = g.carries;
    g.carries = null;
    if (this.progress.has('pickup', id)) return null;
    const spot = nearestWalkable(
      (x, y) => room.tm.isWalkableInside(x, y),
      Math.floor(g.x / TILE),
      Math.floor(g.y / TILE),
    ) || {
      x: Math.floor(g.x / TILE),
      y: Math.floor(g.y / TILE),
    };
    const def = { id, itemId, qty: 1, x: spot.x, y: spot.y };
    const mem = this.mem(room.id);
    if (!mem.drops.some((d) => d.id === id)) mem.drops.push(def);
    const p = new Pickup(def);
    room.pickups.push(p);
    return p;
  }

  /** Forgets session memory (new game / continue). */
  reset() {
    this.memory.clear();
  }
}

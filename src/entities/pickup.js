import { TILE } from '../core/config.js';

export class Pickup {
  /** @param {{ id: string, itemId: string, qty?: number, x: number, y: number }} def tile coords */
  constructor(def) {
    this.id = def.id;
    this.itemId = def.itemId;
    this.qty = def.qty || 1;
    this.x = def.x * TILE + TILE / 2;
    this.y = def.y * TILE + TILE / 2;
    this.t = 0;
    this.taken = false;
  }

  /** @param {number} dt */
  update(dt) {
    this.t += dt;
  }

  /** Small bob so items catch the eye. */
  get bob() {
    return Math.floor(this.t * 3) % 2;
  }
}

import { TILE } from '../core/config.js';

export class Door {
  /** @param {any} def DoorDef @param {boolean} open */
  constructor(def, open) {
    this.id = def.id;
    this.tx = def.x;
    this.ty = def.y;
    this.level = def.level || 0;
    this.open = open;
    this.targetRoom = def.targetRoom || null;
    this.targetEntry = def.targetEntry || null;
    this.anim = open ? 1 : 0;
  }

  get cx() {
    return this.tx * TILE + TILE / 2;
  }

  get cy() {
    return this.ty * TILE + TILE / 2;
  }

  /** @param {number} dt */
  update(dt) {
    const target = this.open ? 1 : 0;
    if (this.anim < target) this.anim = Math.min(target, this.anim + dt * 4);
    if (this.anim > target) this.anim = Math.max(target, this.anim - dt * 4);
  }
}

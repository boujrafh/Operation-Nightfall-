import { PLAYER } from '../core/config.js';
import { moveAndCollide } from '../world/collision.js';

/** Agent Wren. */
export class Player {
  /** @param {number} x @param {number} y @param {'N'|'E'|'S'|'W'} facing */
  constructor(x, y, facing = 'S') {
    this.x = x;
    this.y = y;
    this.facing = facing;
    this.dirX = facing === 'E' ? 1 : facing === 'W' ? -1 : 0;
    this.dirY = facing === 'S' ? 1 : facing === 'N' ? -1 : 0;
    this.moving = false;
    this.stillTime = 0;
    this.animTime = 0;
    this.stepTimer = 0;
    this.invuln = 0;
    /** @type {null | 'punch' | 'takedown' | 'dead'} */
    this.action = null;
    this.actionTimer = 0;
    this.boxOn = false;
    this.dead = false;
  }

  get facingAngle() {
    return Math.atan2(this.dirY, this.dirX);
  }

  get busy() {
    return this.action !== null;
  }

  /**
   * @param {number} dt
   * @param {{x:number,y:number}} axis
   * @param {import('../world/tilemap.js').TileMap} tm
   * @returns {boolean} true when a footstep should play this frame
   */
  update(dt, axis, tm) {
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    if (this.action) {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0 && this.action !== 'dead') this.action = null;
      this.moving = false;
      return false;
    }
    const wants = axis.x !== 0 || axis.y !== 0;
    let stepped = false;
    if (wants) {
      this.dirX = Math.sign(axis.x);
      this.dirY = Math.sign(axis.y);
      if (this.dirX !== 0) this.facing = this.dirX > 0 ? 'E' : 'W';
      else this.facing = this.dirY > 0 ? 'S' : 'N';
      const speed = this.boxOn ? PLAYER.BOX_SPEED : PLAYER.SPEED;
      const ox = this.x;
      const oy = this.y;
      moveAndCollide(this, axis.x * speed * dt, axis.y * speed * dt, PLAYER.RADIUS, tm);
      this.moving = Math.abs(this.x - ox) + Math.abs(this.y - oy) > 0.01;
    } else this.moving = false;

    if (this.moving) {
      this.stillTime = 0;
      this.animTime += dt;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = PLAYER.STEP_INTERVAL;
        stepped = true;
      }
    } else {
      this.stillTime += dt;
      this.animTime = 0;
      this.stepTimer = 0;
    }
    return stepped;
  }

  /** @param {'punch'|'takedown'|'dead'} action @param {number} time */
  startAction(action, time) {
    this.action = action;
    this.actionTimer = time;
  }

  /** Sprite frame name for rendering. */
  spriteName() {
    const dir = this.facing === 'W' ? 'E' : this.facing;
    const flip = this.facing === 'W' ? '_f' : '';
    if (this.dead) return 'wren_down';
    if (this.boxOn) return 'box';
    if (!this.moving) return `wren_${dir}_0${flip}`;
    const f = Math.floor(this.animTime * 8) % 2 === 0 ? 1 : 2;
    return `wren_${dir}_${f}${flip}`;
  }
}

import { TILE } from '../core/config.js';
import { DIR_ANGLE } from '../core/math.js';

const DEG = Math.PI / 180;

/** Wall-mounted surveillance camera that sweeps back and forth. */
export class SecurityCamera {
  /** @param {{ id: string, x: number, y: number, facing: 'N'|'E'|'S'|'W', sweep?: number, period?: number }} def */
  constructor(def) {
    this.id = def.id;
    this.x = def.x * TILE + TILE / 2;
    this.y = def.y * TILE + TILE / 2;
    this.base = DIR_ANGLE[def.facing];
    this.sweep = (def.sweep ?? 40) * DEG;
    this.period = def.period ?? 5;
    this.t = 0;
    this.dir = this.base;
    this.spotTimer = 0;
    this.seesPlayer = false;
  }

  /** @param {number} dt */
  update(dt) {
    this.t += dt;
    this.dir = this.base + Math.sin((this.t / this.period) * Math.PI * 2) * this.sweep;
  }

  /** One of 8 sprite angles. */
  spriteName() {
    const oct = ((Math.round(this.dir / (Math.PI / 4)) % 8) + 8) % 8;
    return `camera_${oct}`;
  }
}

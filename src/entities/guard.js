import { GUARD } from '../core/config.js';
import { angleToDir4, DIR_ANGLE } from '../core/math.js';

/** Guard behaviour states (Doc 03 §3). */
export const G = Object.freeze({
  PATROL: 'PATROL',
  SUSPICIOUS: 'SUSPICIOUS',
  CHASE: 'ALERT_CHASE',
  SEARCH: 'SEARCH',
  RETURN: 'RETURN',
  DOWN: 'DOWN',
});

export class Guard {
  /**
   * @param {any} def GuardDef
   * @param {{ x: number, y: number }} pos pixel centre
   */
  constructor(def, pos) {
    this.id = def.id;
    this.def = def;
    this.x = pos.x;
    this.y = pos.y;
    this.route = def.route || [];
    this.loop = def.loop || 'cycle';
    this.speedMult = def.speed || 1;
    this.armed = !!def.armed;
    this.carries = def.carries || null;
    this.reinforcement = !!def.reinforcement;
    this.routeIdx = this.route.length > 1 ? 1 : 0;
    this.routeDir = 1;
    this.waitTimer = this.route[0] ? this.route[0].wait || 0 : 0;
    this.dir = DIR_ANGLE[def.facing || 'S'];
    /** @type {string} */
    this.state = G.PATROL;
    /** @type {{x:number,y:number}[]} */
    this.path = [];
    this.repath = 0;
    this.spotTimer = 0;
    this.stateTimer = 0;
    this.lookTimer = 0;
    this.lookBase = 0;
    /** @type {{x:number,y:number}|null} */
    this.target = null;
    this.hp = GUARD.HP;
    this.koTimer = 0;
    this.meleeCd = 0;
    this.shootCd = 0;
    /** @type {null|'!'|'?'} */
    this.bubble = null;
    this.bubbleTimer = 0;
    this.moving = false;
    this.animTime = 0;
    this.seesPlayer = false;
    this.searchLeft = 0;
    this.hitFlash = 0;
    /** @type {number|undefined} direction to face while waiting at a waypoint */
    this.lookAt = undefined;
    /** @type {{x:number,y:number}|null} where a reinforcement entered the room */
    this.home = null;
    this.gone = false;
  }

  get down() {
    return this.state === G.DOWN;
  }

  /** @param {'!'|'?'} b @param {number} [t] */
  showBubble(b, t = 1.2) {
    this.bubble = b;
    this.bubbleTimer = t;
  }

  spriteName() {
    if (this.down) return 'guard_down';
    const d = angleToDir4(this.dir);
    const dir = d === 'W' ? 'E' : d;
    const flip = d === 'W' ? '_f' : '';
    if (!this.moving) return `guard_${dir}_0${flip}`;
    const f = Math.floor(this.animTime * 7) % 2 === 0 ? 1 : 2;
    return `guard_${dir}_${f}${flip}`;
  }
}

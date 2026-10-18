import { TIMING } from '../core/config.js';

export const ALERT = Object.freeze({
  INFILTRATION: 'INFILTRATION',
  ALERT: 'ALERT',
  EVASION: 'EVASION',
});

/**
 * Global stealth state: INFILTRATION -> ALERT -> EVASION -> INFILTRATION.
 * Emits ALERT_CHANGED { from, to } on the bus.
 */
export class AlertManager {
  /** @param {{ emit: (e: string, p?: any) => void }} bus */
  constructor(bus) {
    this.bus = bus;
    /** @type {string} */
    this.level = ALERT.INFILTRATION;
    this.lostTimer = 0;
    this.evasionTimer = 0;
    /** @type {{x:number,y:number}|null} */
    this.lastKnown = null;
    this.count = 0;
  }

  /** @param {string} to */
  set(to) {
    if (to === this.level) return;
    const from = this.level;
    this.level = to;
    this.bus.emit('ALERT_CHANGED', { from, to });
  }

  /** A guard or camera has clearly seen the player. */
  spotted(x, y) {
    this.lastKnown = { x, y };
    this.lostTimer = 0;
    if (this.level !== ALERT.ALERT) {
      this.count++;
      this.set(ALERT.ALERT);
    }
  }

  /**
   * @param {number} dt
   * @param {boolean} seenNow any guard currently sees the player
   * @param {{x:number,y:number}} playerPos
   */
  update(dt, seenNow, playerPos) {
    if (this.level === ALERT.ALERT) {
      if (seenNow) {
        this.lostTimer = 0;
        this.lastKnown = { x: playerPos.x, y: playerPos.y };
      } else {
        this.lostTimer += dt;
        if (this.lostTimer >= TIMING.ALERT_LOST) {
          this.evasionTimer = TIMING.EVASION;
          this.set(ALERT.EVASION);
        }
      }
    } else if (this.level === ALERT.EVASION) {
      if (seenNow) this.spotted(playerPos.x, playerPos.y);
      else {
        this.evasionTimer -= dt;
        if (this.evasionTimer <= 0) {
          this.evasionTimer = 0;
          this.set(ALERT.INFILTRATION);
        }
      }
    }
  }

  /** Whole seconds left in EVASION (for the HUD). */
  get evasionSeconds() {
    return Math.max(0, Math.ceil(this.evasionTimer));
  }

  /** Back to INFILTRATION without events (continue after death). */
  reset() {
    this.level = ALERT.INFILTRATION;
    this.lostTimer = 0;
    this.evasionTimer = 0;
    this.lastKnown = null;
  }
}

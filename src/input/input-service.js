/** Logical actions used by the game; devices map onto these. */
export const ACTIONS = /** @type {const} */ ([
  'up',
  'down',
  'left',
  'right',
  'action',
  'item',
  'weapon',
  'confirm',
  'pause',
  'tap',
]);

/**
 * Merges every input source into one per-frame state.
 * Sources write into `setSource(name, action, down)` and `setAxis(x, y)`.
 */
export class InputService {
  constructor() {
    /** @type {Map<string, Set<string>>} */
    this.sources = new Map();
    /** @type {Set<string>} */
    this.down = new Set();
    /** @type {Set<string>} */
    this.prev = new Set();
    /** @type {Set<string>} presses that happened since the last frame */
    this.latched = new Set();
    /** @type {Set<string>} presses delivered to this frame */
    this.fresh = new Set();
    this.analog = { x: 0, y: 0 };
    this.anyPressed = false;
    /** @type {string} 'keyboard' | 'touch' */
    this.lastDevice = 'keyboard';
  }

  /** @param {string} source @param {string} action @param {boolean} isDown */
  setSource(source, action, isDown) {
    if (!this.sources.has(source)) this.sources.set(source, new Set());
    const set = this.sources.get(source);
    if (isDown) {
      if (!set.has(action)) this.latched.add(action);
      set.add(action);
    } else set.delete(action);
  }

  /** Analog stick (touch), each axis in [-1, 1]. */
  setAxis(x, y) {
    this.analog.x = x;
    this.analog.y = y;
  }

  /**
   * The analog stick also counts as direction presses (8 directions), so
   * menus and dialogue choices work with the touch stick too.
   * @returns {string[]}
   */
  analogDirections() {
    const { x, y } = this.analog;
    if (Math.hypot(x, y) < 0.5) return [];
    const oct = Math.round(Math.atan2(y, x) / (Math.PI / 4));
    const a = oct * (Math.PI / 4);
    const dx = Math.round(Math.cos(a));
    const dy = Math.round(Math.sin(a));
    const out = [];
    if (dx < 0) out.push('left');
    if (dx > 0) out.push('right');
    if (dy < 0) out.push('up');
    if (dy > 0) out.push('down');
    return out;
  }

  /** Clears everything (used when the window loses focus). */
  releaseAll() {
    for (const set of this.sources.values()) set.clear();
    this.analog.x = 0;
    this.analog.y = 0;
  }

  /** Call once at the start of every fixed update. */
  beginFrame() {
    this.prev = this.down;
    this.fresh = new Set(this.latched);
    this.down = new Set(this.latched);
    for (const set of this.sources.values()) for (const a of set) this.down.add(a);
    for (const a of this.analogDirections()) this.down.add(a);
    this.anyPressed = false;
    for (const a of this.down) if (!this.prev.has(a) || this.fresh.has(a)) this.anyPressed = true;
    this.latched.clear();
  }

  /** @param {string} action */
  isDown(action) {
    return this.down.has(action);
  }

  /** @param {string} action */
  justPressed(action) {
    return this.fresh.has(action) || (this.down.has(action) && !this.prev.has(action));
  }

  /** Confirm-like press for menus and dialogue: Enter, Space, A or a tap. */
  justConfirmed() {
    return this.justPressed('confirm') || this.justPressed('action') || this.justPressed('tap');
  }

  /**
   * Movement vector snapped to 8 directions, length 1 (or 0).
   * @returns {{x:number, y:number}}
   */
  axis() {
    let x = 0;
    let y = 0;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('right')) x += 1;
    if (this.isDown('up')) y -= 1;
    if (this.isDown('down')) y += 1;
    if (x === 0 && y === 0 && (this.analog.x !== 0 || this.analog.y !== 0)) {
      const a = Math.atan2(this.analog.y, this.analog.x);
      const oct = Math.round(a / (Math.PI / 4));
      const sa = oct * (Math.PI / 4);
      x = Math.round(Math.cos(sa));
      y = Math.round(Math.sin(sa));
    }
    if (x !== 0 && y !== 0) {
      const inv = Math.SQRT1_2;
      return { x: x * inv, y: y * inv };
    }
    return { x, y };
  }

  /** Menu navigation: a single step per press. */
  menuDelta() {
    if (this.justPressed('up')) return -1;
    if (this.justPressed('down')) return 1;
    return 0;
  }

  menuSide() {
    if (this.justPressed('left')) return -1;
    if (this.justPressed('right')) return 1;
    return 0;
  }
}

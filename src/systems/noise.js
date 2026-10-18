/** Collects noises made this frame (footsteps on metal, punches, shots). */
export class NoiseSystem {
  constructor() {
    /** @type {{ x: number, y: number, radius: number }[]} */
    this.events = [];
  }

  /** @param {number} x @param {number} y @param {number} radius */
  emit(x, y, radius) {
    this.events.push({ x, y, radius });
  }

  /** Returns and clears this frame's noises. */
  drain() {
    const e = this.events;
    this.events = [];
    return e;
  }
}

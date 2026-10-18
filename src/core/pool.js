/**
 * Fixed object pool: objects are created once and recycled, so the main
 * loop never allocates while the game runs.
 */
export class Pool {
  /**
   * @param {() => object} factory
   * @param {number} size
   */
  constructor(factory, size) {
    /** @type {any[]} */
    this.items = [];
    for (let i = 0; i < size; i++) {
      const o = factory();
      o.active = false;
      this.items.push(o);
    }
  }

  /** @returns {any|null} an inactive object, now marked active */
  obtain() {
    for (const o of this.items) {
      if (!o.active) {
        o.active = true;
        return o;
      }
    }
    return null;
  }

  /** @param {(o: any) => void} fn */
  forEachActive(fn) {
    for (const o of this.items) if (o.active) fn(o);
  }

  releaseAll() {
    for (const o of this.items) o.active = false;
  }

  get activeCount() {
    let n = 0;
    for (const o of this.items) if (o.active) n++;
    return n;
  }
}

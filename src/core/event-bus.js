/** Small synchronous publish/subscribe bus used by every system. */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.handlers = new Map();
  }

  /**
   * @param {string} event
   * @param {Function} fn
   * @returns {() => void} unsubscribe function
   */
  on(event, fn) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event).add(fn);
    return () => this.off(event, fn);
  }

  /**
   * @param {string} event
   * @param {Function} fn
   */
  off(event, fn) {
    const set = this.handlers.get(event);
    if (set) set.delete(fn);
  }

  /**
   * @param {string} event
   * @param {any} [payload]
   */
  emit(event, payload) {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of [...set]) fn(payload);
  }

  clear() {
    this.handlers.clear();
  }
}

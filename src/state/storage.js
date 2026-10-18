/**
 * localStorage wrapper that never throws. When storage is unavailable
 * (private mode, quota, blocked) it falls back to memory for the session.
 */
export class SafeStorage {
  /** @param {Storage|null|undefined} [backing] */
  constructor(backing) {
    /** @type {Map<string, string>} */
    this.memory = new Map();
    this.backing = null;
    this.persistent = false;
    try {
      const b = backing === undefined ? globalThis.localStorage : backing;
      if (b) {
        const probe = '__nightfall_probe__';
        b.setItem(probe, '1');
        b.removeItem(probe);
        this.backing = b;
        this.persistent = true;
      }
    } catch {
      this.backing = null;
      this.persistent = false;
    }
  }

  /** @param {string} key @returns {string|null} */
  get(key) {
    if (this.backing) {
      try {
        return this.backing.getItem(key);
      } catch {
        this.fail();
      }
    }
    return this.memory.has(key) ? this.memory.get(key) : null;
  }

  /**
   * @param {string} key @param {string} value
   * @returns {boolean} true when written to persistent storage
   */
  set(key, value) {
    if (this.backing) {
      try {
        this.backing.setItem(key, value);
        return true;
      } catch {
        this.fail();
      }
    }
    this.memory.set(key, value);
    return false;
  }

  /** @param {string} key */
  remove(key) {
    if (this.backing) {
      try {
        this.backing.removeItem(key);
      } catch {
        this.fail();
      }
    }
    this.memory.delete(key);
  }

  /** Switches to memory-only mode, keeping what we can read. */
  fail() {
    this.backing = null;
    this.persistent = false;
  }
}

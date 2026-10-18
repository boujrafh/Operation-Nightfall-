/**
 * Queue of codec calls waiting to be shown. Calls are deduplicated so a
 * trigger firing twice in a row never plays the same call twice.
 */
export class CodecSystem {
  constructor() {
    /** @type {{ dialogueId: string, urgent?: boolean }[]} */
    this.queue = [];
  }

  /** @param {string} dialogueId @param {{ urgent?: boolean }} [opts] */
  request(dialogueId, opts = {}) {
    if (this.queue.some((q) => q.dialogueId === dialogueId)) return false;
    this.queue.push({ dialogueId, ...opts });
    return true;
  }

  get pending() {
    return this.queue.length > 0;
  }

  next() {
    return this.queue.shift() || null;
  }

  clear() {
    this.queue.length = 0;
  }
}

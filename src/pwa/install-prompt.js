/** Keeps the browser's install prompt so the title menu can offer INSTALL. */
export class InstallPrompt {
  constructor() {
    /** @type {any} */
    this.deferred = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferred = e;
    });
    window.addEventListener('appinstalled', () => {
      this.deferred = null;
    });
  }

  get available() {
    return !!this.deferred;
  }

  /** @returns {Promise<boolean>} true when the player accepted */
  async prompt() {
    if (!this.deferred) return false;
    const e = this.deferred;
    this.deferred = null;
    e.prompt();
    const choice = await e.userChoice;
    return choice && choice.outcome === 'accepted';
  }
}

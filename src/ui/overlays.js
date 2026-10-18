/**
 * DOM overlays drawn above the canvas: toast messages and the
 * "update available" banner.
 */
export class Overlays {
  /** @param {Document} doc */
  constructor(doc) {
    this.toastEl = doc.getElementById('toast');
    this.updateEl = doc.getElementById('update');
    this.updateBtn = doc.getElementById('update-btn');
    this.toastTimer = 0;
    this.saveWarned = false;
  }

  /** @param {string} text @param {number} [ms] */
  toast(text, ms = 4000) {
    this.toastEl.textContent = text;
    this.toastEl.classList.remove('hidden');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.add('hidden'), ms);
  }

  /** Shown once per session when saving falls back to memory. */
  saveUnavailable() {
    if (this.saveWarned) return;
    this.saveWarned = true;
    this.toast('SAVE UNAVAILABLE - PROGRESS KEPT FOR THIS SESSION ONLY', 5000);
  }

  /** @param {() => void} onReload */
  showUpdate(onReload) {
    this.updateEl.classList.remove('hidden');
    this.updateBtn.onclick = () => {
      this.updateEl.classList.add('hidden');
      onReload();
    };
  }
}

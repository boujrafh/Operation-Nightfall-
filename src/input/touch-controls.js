import { isTouchDevice } from './device-detect.js';

const DEAD_ZONE = 0.15;

/**
 * Virtual stick (floating) and buttons A / B / W / pause.
 * Mode 'auto': shown on touch devices, hidden again once a keyboard is used.
 * Mode 'on': always shown. Mode 'off': never shown.
 */
export class TouchControls {
  /**
   * @param {HTMLElement} root  #touch container
   * @param {import('./input-service.js').InputService} input
   */
  constructor(root, input) {
    this.root = root;
    this.input = input;
    this.zone = /** @type {HTMLElement} */ (root.querySelector('#stick-zone'));
    this.base = /** @type {HTMLElement} */ (root.querySelector('#stick-base'));
    this.knob = /** @type {HTMLElement} */ (root.querySelector('#stick-knob'));
    this.stickId = -1;
    this.origin = { x: 0, y: 0 };
    this.visible = false;
    /** @type {'auto'|'on'|'off'} */
    this.mode = 'auto';
    this.touchSeen = isTouchDevice();
    /** @type {(() => void) | null} called whenever the controls appear or disappear */
    this.onVisibilityChange = null;
    this.bind();
    this.refresh();
  }

  /** @param {'auto'|'on'|'off'} mode */
  setMode(mode) {
    this.mode = mode;
    this.refresh();
  }

  /** Applies the mode: decides whether the controls are on screen. */
  refresh() {
    const want = this.mode === 'on' || (this.mode === 'auto' && this.touchSeen);
    if (want) this.show();
    else this.hide();
  }

  /** A keyboard was used: in 'auto' mode the touch controls step aside. */
  keyboardUsed() {
    if (this.mode !== 'auto' || !this.visible) return;
    this.touchSeen = false;
    this.refresh();
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    if (this.onVisibilityChange) this.onVisibilityChange();
  }

  hide() {
    if (!this.visible) return;
    this.visible = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.releaseStick();
    for (const a of ['action', 'item', 'weapon', 'pause']) this.input.setSource('touch', a, false);
    if (this.onVisibilityChange) this.onVisibilityChange();
  }

  /** @param {'S'|'M'|'L'} size */
  setSize(size) {
    this.root.dataset.size = size;
  }

  vibrate() {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(10);
  }

  bind() {
    window.addEventListener(
      'touchstart',
      () => {
        this.input.lastDevice = 'touch';
        this.touchSeen = true;
        this.refresh();
      },
      { passive: true },
    );

    this.zone.addEventListener('pointerdown', (e) => {
      if (this.stickId !== -1) return;
      e.preventDefault();
      this.stickId = e.pointerId;
      this.zone.setPointerCapture(e.pointerId);
      const r = this.zone.getBoundingClientRect();
      this.origin = { x: e.clientX, y: e.clientY };
      this.base.style.left = `${e.clientX - r.left}px`;
      this.base.style.top = `${e.clientY - r.top}px`;
      this.base.classList.add('active');
      this.moveKnob(0, 0);
    });
    this.zone.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.stickId) return;
      e.preventDefault();
      const radius = this.base.offsetWidth / 2 || 60;
      let dx = (e.clientX - this.origin.x) / radius;
      let dy = (e.clientY - this.origin.y) / radius;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      this.moveKnob(dx * radius * 0.6, dy * radius * 0.6);
      if (len < DEAD_ZONE) this.input.setAxis(0, 0);
      else this.input.setAxis(dx, dy);
    });
    const end = (e) => {
      if (e.pointerId !== this.stickId) return;
      this.releaseStick();
    };
    this.zone.addEventListener('pointerup', end);
    this.zone.addEventListener('pointercancel', end);

    this.bindButton('#btn-a', 'action');
    this.bindButton('#btn-b', 'item');
    this.bindButton('#btn-w', 'weapon');
    this.bindButton('#btn-pause', 'pause');
  }

  releaseStick() {
    this.stickId = -1;
    this.input.setAxis(0, 0);
    this.base.classList.remove('active');
    this.moveKnob(0, 0);
  }

  moveKnob(x, y) {
    this.knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  /** @param {string} selector @param {string} action */
  bindButton(selector, action) {
    const el = /** @type {HTMLElement} */ (this.root.querySelector(selector));
    const press = (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.classList.add('pressed');
      this.input.setSource('touch', action, true);
      this.vibrate();
    };
    const release = (e) => {
      e.preventDefault();
      el.classList.remove('pressed');
      this.input.setSource('touch', action, false);
    };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }
}

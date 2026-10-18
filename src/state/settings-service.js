import { STORAGE_KEYS } from '../core/config.js';

export const DEFAULT_SETTINGS = Object.freeze({
  musicVol: 7,
  sfxVol: 8,
  muted: false,
  textSpeed: 'normal',
  reduceFlashing: false,
  touchSize: 'M',
  touchControls: 'auto',
});

const TEXT_SPEEDS = ['slow', 'normal', 'fast'];
const TOUCH_SIZES = ['S', 'M', 'L'];
const TOUCH_MODES = ['auto', 'on', 'off'];

/** @param {any} v @param {number} fallback */
const vol = (v, fallback) => (Number.isInteger(v) && v >= 0 && v <= 10 ? v : fallback);

/** @param {any} d @param {{ reduceFlashing?: boolean }} [defaults] */
export function sanitizeSettings(d, defaults = {}) {
  const base = { ...DEFAULT_SETTINGS, ...defaults };
  const s = d && typeof d === 'object' ? d : {};
  return {
    musicVol: vol(s.musicVol, base.musicVol),
    sfxVol: vol(s.sfxVol, base.sfxVol),
    muted: typeof s.muted === 'boolean' ? s.muted : base.muted,
    textSpeed: TEXT_SPEEDS.includes(s.textSpeed) ? s.textSpeed : base.textSpeed,
    reduceFlashing: typeof s.reduceFlashing === 'boolean' ? s.reduceFlashing : base.reduceFlashing,
    touchSize: TOUCH_SIZES.includes(s.touchSize) ? s.touchSize : base.touchSize,
    touchControls: TOUCH_MODES.includes(s.touchControls) ? s.touchControls : base.touchControls,
  };
}

/** Player settings, saved on every change. */
export class SettingsService {
  /**
   * @param {import('./storage.js').SafeStorage} storage
   * @param {{ reduceFlashing?: boolean }} [systemDefaults]
   */
  constructor(storage, systemDefaults = {}) {
    this.storage = storage;
    this.defaults = systemDefaults;
    let parsed;
    try {
      const raw = storage.get(STORAGE_KEYS.SETTINGS);
      parsed = raw ? JSON.parse(raw).data : null;
    } catch {
      parsed = null;
    }
    this.data = sanitizeSettings(parsed, systemDefaults);
    /** @type {Set<(s: any) => void>} */
    this.listeners = new Set();
  }

  get() {
    return { ...this.data };
  }

  /** Merges `partial` into the current settings and saves. */
  set(partial) {
    this.data = sanitizeSettings({ ...this.data, ...partial }, this.defaults);
    this.storage.set(STORAGE_KEYS.SETTINGS, JSON.stringify({ schemaVersion: 1, data: this.data }));
    for (const fn of this.listeners) fn(this.get());
    return this.get();
  }

  reset() {
    return this.set({ ...DEFAULT_SETTINGS, ...this.defaults });
  }

  /** @param {(s: any) => void} fn */
  onChange(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
}

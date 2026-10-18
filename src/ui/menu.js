import { C } from '../render/palette.js';

/**
 * Vertical menu with a blinking cursor.
 * Items: { id, label, disabled?, value? } — `value` is drawn on the right.
 */
export class Menu {
  /**
   * @param {{ id: string, label: string, disabled?: boolean, value?: string }[]} items
   */
  constructor(items) {
    this.items = items;
    this.index = Math.max(
      0,
      items.findIndex((i) => !i.disabled),
    );
  }

  get current() {
    return this.items[this.index];
  }

  /** @param {string} id */
  select(id) {
    const i = this.items.findIndex((it) => it.id === id);
    if (i >= 0) this.index = i;
  }

  /**
   * @param {import('../input/input-service.js').InputService} input
   * @param {import('../audio/audio-service.js').AudioService} audio
   * @returns {{ type: 'select', id: string } | { type: 'side', id: string, delta: number } | null}
   */
  update(input, audio) {
    const d = input.menuDelta();
    if (d) {
      const n = this.items.length;
      let i = this.index;
      for (let k = 0; k < n; k++) {
        i = (i + d + n) % n;
        if (!this.items[i].disabled) break;
      }
      if (i !== this.index) {
        this.index = i;
        audio.playSfx('sfx_menu_move');
      }
    }
    const side = input.menuSide();
    if (side && this.current && !this.current.disabled)
      return { type: 'side', id: this.current.id, delta: side };
    if (input.justConfirmed()) {
      if (this.current && !this.current.disabled) {
        audio.playSfx('sfx_menu_select');
        return { type: 'select', id: this.current.id };
      }
    }
    return null;
  }

  /**
   * @param {import('../render/renderer.js').Renderer} r
   * @param {number} x @param {number} y
   * @param {{ spacing?: number, width?: number }} [opts]
   */
  draw(r, x, y, opts = {}) {
    const spacing = opts.spacing || 14;
    const blink = Math.floor(r.time * 3) % 2 === 0;
    this.items.forEach((it, i) => {
      const yy = y + i * spacing;
      const sel = i === this.index;
      const col = it.disabled ? C.STEEL : sel ? C.YELLOW : C.WHITE;
      if (sel && blink) r.text('▶', x - 12, yy, C.YELLOW);
      r.text(it.label, x, yy, col);
      if (it.value !== undefined && opts.width)
        r.text(it.value, x + opts.width, yy, col, { align: 'right' });
    });
  }
}

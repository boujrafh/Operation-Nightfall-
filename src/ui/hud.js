import { HUD_Y, WIDTH } from '../core/config.js';
import { C } from '../render/palette.js';

const SEGMENTS = 12;

/**
 * Draws the bottom HUD strip (Doc 05 §4-5).
 * @param {import('../render/renderer.js').Renderer} r
 * @param {{ hp: number, maxHp: number, level: string, evasionSeconds: number,
 *   weapon: { icon: string, label: string }, item: { icon: string, label: string } | null,
 *   call: boolean, roomLabel: string, reduceFlashing: boolean }} s
 */
export function drawHud(r, s) {
  const y = HUD_Y;
  const blink = Math.floor(r.time * 4) % 2 === 0;
  r.rect(0, y, WIDTH, 36, C.VOID);
  r.rect(0, y, WIDTH, 1, C.STEEL);

  // life bar
  r.text('LIFE', 4, y + 4, C.WHITE);
  const ratio = s.hp / s.maxHp;
  /** @type {number} */
  let barColor = C.LIME;
  if (ratio <= 0.25) barColor = s.reduceFlashing || blink ? C.RED : C.NIGHT;
  else if (ratio <= 0.5) barColor = C.AMBER;
  const filled = Math.ceil((s.hp / s.maxHp) * SEGMENTS);
  for (let i = 0; i < SEGMENTS; i++) {
    r.rect(40 + i * 5, y + 4, 4, 7, i < filled ? barColor : C.STEEL);
  }

  // alert badge
  const bx = 108;
  const bw = 100;
  if (s.level === 'ALERT') {
    const on = s.reduceFlashing || blink;
    r.panel(bx, y + 2, bw, 12, on ? C.RED : C.VOID, C.RED);
    r.text('!! ALERT !!', bx + bw / 2, y + 4, on ? C.WHITE : C.RED, { align: 'center' });
  } else if (s.level === 'EVASION') {
    r.panel(bx, y + 2, bw, 12, C.VOID, C.AMBER);
    r.text(`EVASION ${String(s.evasionSeconds).padStart(2, '0')}`, bx + bw / 2, y + 4, C.AMBER, {
      align: 'center',
    });
  } else {
    r.panel(bx, y + 2, bw, 12, C.VOID, C.GREEN);
    r.text('INFILTRATION', bx + bw / 2, y + 4, C.GREEN, { align: 'center' });
  }

  // codec call
  if (s.call && (s.reduceFlashing || blink)) {
    r.sprite('icon_phone', 214, y + 4);
    r.text('CALL', 223, y + 4, C.CYAN);
  }

  // weapon and item slots
  drawSlot(r, 2, y + 17, 'WPN', s.weapon, false);
  drawSlot(r, 86, y + 17, 'ITEM', s.item, !!s.item);
  r.text(s.roomLabel, WIDTH - 4, y + 23, C.CONCRETE, { align: 'right' });
}

/** @param {import('../render/renderer.js').Renderer} r */
function drawSlot(r, x, y, title, slot, highlight) {
  r.panel(x, y, 80, 18, C.VOID, highlight ? C.YELLOW : C.STEEL);
  r.rect(x + 2, y - 3, title.length * 8 + 2, 6, C.VOID);
  r.text(title, x + 3, y - 4, C.CONCRETE);
  if (!slot) {
    r.sprite('icon_none', x + 2, y + 1);
    r.text('NONE', x + 20, y + 6, C.STEEL);
    return;
  }
  r.sprite(slot.icon, x + 2, y + 1);
  r.text(slot.label, x + 20, y + 6, highlight ? C.YELLOW : C.WHITE);
}

/**
 * Centered message above the HUD (pickups, hints).
 * @param {import('../render/renderer.js').Renderer} r @param {string} text
 */
export function drawBanner(r, text) {
  const w = text.length * 8 + 12;
  const x = Math.round((WIDTH - w) / 2);
  r.panel(x, HUD_Y - 18, w, 14, C.NIGHT, C.YELLOW);
  r.text(text, WIDTH / 2, HUD_Y - 15, C.YELLOW, { align: 'center' });
}

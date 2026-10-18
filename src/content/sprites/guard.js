import { bakeHumanoid } from './player.js';

/** Grey uniform, red beret (Doc 05 §6). */
export const GUARD_COLORS = { O: 0, B: 13, H: 1, S: 10, U: 14, D: 2 };

/** @param {import('../../render/sprite-sheet.js').SpriteSheet} sheet */
export function bakeGuard(sheet) {
  bakeHumanoid(sheet, 'guard', GUARD_COLORS);
}

import { paint } from '../../render/sprite-sheet.js';
import { C } from '../../render/palette.js';

/**
 * Bubbles, HUD icons, effects and camera sprites.
 * @param {import('../../render/sprite-sheet.js').SpriteSheet} sheet
 */
export function bakeUi(sheet) {
  sheet.add(
    'bubble_alert',
    paint(10, 13, (px, rect) => {
      rect(1, 0, 8, 10, C.VOID);
      rect(0, 1, 10, 8, C.VOID);
      rect(1, 1, 8, 8, C.RED);
      rect(4, 2, 2, 4, C.WHITE);
      rect(4, 7, 2, 1, C.WHITE);
      rect(3, 10, 3, 1, C.VOID);
      rect(4, 9, 2, 2, C.RED);
      px(4, 11, C.VOID);
      px(4, 12, C.VOID);
    }),
  );
  sheet.add(
    'bubble_suspect',
    paint(10, 13, (px, rect) => {
      rect(1, 0, 8, 10, C.VOID);
      rect(0, 1, 10, 8, C.VOID);
      rect(1, 1, 8, 8, C.NIGHT);
      rect(3, 2, 4, 1, C.YELLOW);
      rect(6, 3, 1, 2, C.YELLOW);
      rect(4, 5, 2, 1, C.YELLOW);
      rect(4, 7, 2, 1, C.YELLOW);
      rect(4, 9, 2, 2, C.NIGHT);
      px(4, 11, C.VOID);
    }),
  );
  sheet.add(
    'icon_phone',
    paint(8, 8, (px, rect) => {
      rect(0, 1, 8, 2, C.CYAN);
      rect(0, 3, 2, 2, C.CYAN);
      rect(6, 3, 2, 2, C.CYAN);
      rect(2, 5, 4, 3, C.CYAN);
      px(3, 6, C.VOID);
      px(4, 6, C.VOID);
    }),
  );
  sheet.add(
    'fx_punch',
    paint(9, 9, (px, rect) => {
      rect(4, 0, 1, 9, C.WHITE);
      rect(0, 4, 9, 1, C.WHITE);
      px(2, 2, C.YELLOW);
      px(6, 2, C.YELLOW);
      px(2, 6, C.YELLOW);
      px(6, 6, C.YELLOW);
      rect(3, 3, 3, 3, C.WHITE);
    }),
  );
  sheet.add(
    'fx_zzz',
    paint(8, 8, (px, rect) => {
      rect(0, 0, 4, 1, C.WHITE);
      px(2, 1, C.WHITE);
      px(1, 2, C.WHITE);
      rect(0, 3, 4, 1, C.WHITE);
      rect(5, 4, 3, 1, C.CONCRETE);
      px(6, 5, C.CONCRETE);
      rect(5, 6, 3, 1, C.CONCRETE);
    }),
  );
  sheet.add(
    'bullet',
    paint(3, 3, (px, rect) => {
      rect(0, 1, 3, 1, C.YELLOW);
      rect(1, 0, 1, 3, C.YELLOW);
      px(1, 1, C.WHITE);
    }),
  );
  for (let oct = 0; oct < 8; oct++) {
    const a = (oct * Math.PI) / 4;
    sheet.add(
      `camera_${oct}`,
      paint(12, 12, (px, rect) => {
        rect(3, 3, 6, 6, C.VOID);
        rect(4, 4, 4, 4, C.STEEL);
        const lx = Math.round(6 + Math.cos(a) * 4) - 1;
        const ly = Math.round(6 + Math.sin(a) * 4) - 1;
        rect(lx, ly, 2, 2, C.CONCRETE);
        px(5, 5, C.RED);
      }),
    );
  }
}

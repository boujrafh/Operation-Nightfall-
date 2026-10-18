import { bakeGrid, paint } from '../../render/sprite-sheet.js';
import { C } from '../../render/palette.js';

const FIST = [
  '................',
  '................',
  '................',
  '.....0000000....',
  '....0aaaaaaa0...',
  '...0a0a0a0aa0...',
  '...0aaaaaaaa0...',
  '...0a0a0a0aa0...',
  '...0aaaaaaaa0...',
  '....0aaaaaa0....',
  '.....033330.....',
  '.....033330.....',
  '.....000000.....',
  '................',
  '................',
  '................',
];

const BOX_ICON = [
  '................',
  '................',
  '................',
  '................',
  '..000000000000..',
  '..099999999990..',
  '..088888888880..',
  '..099999999990..',
  '..099988899990..',
  '..099999999990..',
  '..099999999990..',
  '..000000000000..',
  '................',
  '................',
  '................',
  '................',
];

const DOGTAG = [
  '................',
  '......e.e.e.....',
  '.....e.....e....',
  '....e.......e...',
  '....e.......e...',
  '.....0000000....',
  '....0eeeeeee0...',
  '....0e00000e0...',
  '....0eeeeeee0...',
  '....0e0000ee0...',
  '....0eeeeeee0...',
  '....0e000eee0...',
  '....0eeeeeee0...',
  '.....0000000....',
  '................',
  '................',
];

/**
 * @param {import('../../render/sprite-sheet.js').SpriteSheet} sheet
 * @param {import('../../render/font.js').BitmapFont} font
 */
export function bakeItems(sheet, font) {
  sheet.add('icon_fist', bakeGrid(FIST));
  sheet.add('icon_box', bakeGrid(BOX_ICON));
  sheet.add('icon_dogtag', bakeGrid(DOGTAG));
  for (const lvl of [1, 2, 3, 4]) {
    sheet.add(
      `icon_card_${lvl}`,
      paint(16, 16, (px, rect, ctx) => {
        rect(1, 3, 14, 10, C.VOID);
        rect(2, 4, 12, 8, C.YELLOW);
        rect(2, 6, 12, 2, C.VOID);
        rect(3, 9, 4, 2, C.AMBER);
        font.draw(ctx, String(lvl), 7, 4, C.VOID);
      }),
    );
  }
  sheet.add(
    'icon_none',
    paint(16, 16, (px, rect) => {
      rect(5, 7, 6, 2, C.STEEL);
    }),
  );
}

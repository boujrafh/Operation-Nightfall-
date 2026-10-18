import { paint } from '../../render/sprite-sheet.js';
import { createRng } from '../../core/math.js';
import { C } from '../../render/palette.js';

/**
 * Procedural 16x16 floor and wall tiles. Two variants per floor type
 * break up repetition; the variant is picked from the tile position.
 * @param {import('../../render/sprite-sheet.js').SpriteSheet} sheet
 */
export function bakeTiles(sheet) {
  for (let v = 0; v < 2; v++) {
    const rng = createRng(101 + v * 31);
    sheet.add(
      `tile_sand_${v}`,
      paint(16, 16, (px, rect) => {
        rect(0, 0, 16, 16, C.WOOD);
        for (let i = 0; i < 10; i++) px(Math.floor(rng() * 16), Math.floor(rng() * 16), i % 3 ? C.CARD : C.NIGHT);
      }),
    );
    const rng2 = createRng(202 + v * 17);
    sheet.add(
      `tile_grass_${v}`,
      paint(16, 16, (px, rect) => {
        rect(0, 0, 16, 16, C.JUNGLE);
        for (let i = 0; i < 9; i++) {
          const x = Math.floor(rng2() * 15);
          const y = 1 + Math.floor(rng2() * 14);
          px(x, y, C.GREEN);
          px(x + 1, y - 1, C.GREEN);
        }
      }),
    );
  }
  sheet.add(
    'tile_concrete',
    paint(16, 16, (px, rect) => {
      rect(0, 0, 16, 16, C.STEEL);
      rect(0, 15, 16, 1, C.NIGHT);
      rect(15, 0, 1, 16, C.NIGHT);
      px(4, 5, C.NIGHT);
      px(10, 11, C.NIGHT);
    }),
  );
  sheet.add(
    'tile_metal',
    paint(16, 16, (px, rect) => {
      rect(0, 0, 16, 16, C.NIGHT);
      for (let i = 0; i < 16; i += 4) {
        rect(i, 0, 1, 16, C.STEEL);
        rect(0, i, 16, 1, C.STEEL);
      }
      for (let i = 2; i < 16; i += 4) for (let j = 2; j < 16; j += 4) px(i, j, C.CONCRETE);
    }),
  );
  sheet.add(
    'tile_wall',
    paint(16, 16, (px, rect) => {
      rect(0, 0, 16, 16, C.STEEL);
      rect(0, 0, 16, 2, C.CONCRETE);
      for (let y = 5; y < 16; y += 5) rect(0, y, 16, 1, C.NIGHT);
      rect(7, 2, 1, 3, C.NIGHT);
      rect(3, 6, 1, 4, C.NIGHT);
      rect(11, 6, 1, 4, C.NIGHT);
      rect(7, 11, 1, 4, C.NIGHT);
    }),
  );
  sheet.add(
    'tile_fence',
    paint(16, 16, (px, rect) => {
      rect(0, 0, 16, 16, C.WOOD);
      for (let i = 0; i < 16; i++) {
        px(i, (i * 1) % 16, C.CONCRETE);
        px(i, 15 - i, C.CONCRETE);
        px(i, (i + 8) % 16, C.CONCRETE);
        px(i, (23 - i) % 16, C.CONCRETE);
      }
      rect(7, 0, 2, 16, C.STEEL);
    }),
  );
  for (let v = 0; v < 2; v++) {
    sheet.add(
      `tile_water_${v}`,
      paint(16, 16, (px, rect) => {
        rect(0, 0, 16, 16, C.STEEL);
        for (let y = 2 + v * 2; y < 16; y += 5) {
          for (let x = (y + v * 3) % 6; x < 16; x += 7) rect(x, y, 3, 1, C.BLUE);
        }
        px(4 + v * 5, 9, C.CYAN);
      }),
    );
  }
  sheet.add(
    'tile_bush',
    paint(16, 16, (px, rect) => {
      rect(0, 0, 16, 16, C.JUNGLE);
      rect(2, 2, 12, 12, C.GREEN);
      rect(1, 4, 14, 8, C.GREEN);
      rect(4, 1, 8, 14, C.GREEN);
      for (const [x, y] of [
        [4, 4],
        [9, 3],
        [6, 8],
        [11, 9],
        [3, 10],
        [8, 12],
      ])
        px(x, y, C.LIME);
      for (const [x, y] of [
        [6, 5],
        [10, 6],
        [5, 11],
        [12, 12],
      ])
        px(x, y, C.JUNGLE);
    }),
  );
  sheet.add(
    'tile_crate',
    paint(16, 16, (px, rect) => {
      rect(0, 0, 16, 16, C.VOID);
      rect(1, 1, 14, 14, C.CARD);
      rect(1, 1, 14, 1, C.SKIN);
      rect(1, 7, 14, 2, C.WOOD);
      rect(1, 1, 2, 14, C.WOOD);
      rect(13, 1, 2, 14, C.WOOD);
      rect(1, 13, 14, 2, C.WOOD);
      for (let i = 3; i < 13; i++) {
        px(i, i, C.WOOD);
      }
    }),
  );
  for (const lvl of [0, 1, 2, 3, 4]) {
    sheet.add(
      `tile_door_${lvl}`,
      paint(16, 16, (px, rect) => {
        rect(0, 0, 16, 16, C.STEEL);
        rect(1, 1, 14, 15, C.CONCRETE);
        rect(7, 1, 2, 15, C.STEEL);
        if (lvl > 0) {
          rect(4, 5, 8, 7, C.YELLOW);
          rect(5, 6, 6, 5, C.VOID);
          // level number drawn as pips (1-4)
          for (let i = 0; i < lvl; i++) px(6 + (i % 2) * 3, 7 + Math.floor(i / 2) * 2, C.YELLOW);
        }
      }),
    );
  }
  sheet.add(
    'tile_door_open',
    paint(16, 16, (px, rect) => {
      rect(0, 0, 16, 16, C.STEEL);
      rect(2, 0, 12, 16, C.VOID);
      rect(2, 15, 12, 1, C.NIGHT);
    }),
  );
}

/** Sprite name for a floor/wall character at a tile position. */
export function tileSpriteName(ch, tx, ty, waterFrame = 0) {
  const v = (tx * 7 + ty * 13) % 2;
  switch (ch) {
    case '.':
      return `tile_sand_${v}`;
    case ',':
      return `tile_grass_${v}`;
    case '=':
      return 'tile_concrete';
    case ':':
      return 'tile_metal';
    case '#':
      return 'tile_wall';
    case 'F':
      return 'tile_fence';
    case '~':
      return `tile_water_${(v + waterFrame) % 2}`;
    case 'B':
      return 'tile_bush';
    case 'C':
      return 'tile_crate';
    default:
      return 'tile_wall';
  }
}

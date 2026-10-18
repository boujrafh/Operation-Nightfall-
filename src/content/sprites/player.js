import { bakeGrid, flipH, rotate90 } from '../../render/sprite-sheet.js';

/**
 * Humanoid templates shared by Wren and the guards.
 * O outline · B headband/beret · H hair · S skin · U suit · D suit shade
 */
const HEAD_FRONT = [
  '................',
  '.....OOOOOO.....',
  '....OBBBBBBO....',
  '....OHHHHHHO....',
  '....OSSSSSSO....',
  '....OSOSSOSO....',
  '....OSSSSSSO....',
  '.....OSSSSO.....',
];
const BODY_FRONT = [
  '...OOUUUUUUOO...',
  '..OUUUUUUUUUUO..',
  '..OSUUUDDUUUSO..',
  '..OSUUUDDUUUSO..',
  '...OUUUUUUUUO...',
];
const HEAD_BACK = [
  '................',
  '.....OOOOOO.....',
  '....OBBBBBBO....',
  '....OHHHHHHO....',
  '....OHHHHHHO....',
  '....OHHHHHHO....',
  '....OBHHHHHO....',
  '.....OHHHHO.....',
];
const BODY_BACK = [
  '...OOUUUUUUOO...',
  '..OUUUUUUUUUUO..',
  '..OSUUUUUUUUSO..',
  '..OSUDDDDDDUSO..',
  '...OUUUUUUUUO...',
];
const LEGS_V = [
  ['....OUUOOUUO....', '....ODDOODDO....', '....OOO..OOO....'],
  ['....OUUOOUUO....', '....ODDO.OOO....', '....OOO.........'],
  ['....OUUOOUUO....', '....OOO.ODDO....', '.........OOO....'],
];
const SIDE_TOP = [
  '................',
  '......OOOOO.....',
  '.....OBBBBBO....',
  '...BBOHHHSSO....',
  '....OHHHSSSO....',
  '....OHHHSOSO....',
  '....OHHSSSSO....',
  '.....OSSSSO.....',
  '.....OUUUUUO....',
  '....OUUUUUUUO...',
  '....OUUUUDSO....',
  '....OUUUUUDO....',
  '.....OUUUUO.....',
];
const LEGS_SIDE = [
  ['.....OUUUUO.....', '.....OUOOUO.....', '.....OOOOOO.....'],
  ['....OUUO.UUO....', '...OUUO...OUO...', '...OOO....OOO...'],
  ['.....OUUUUO.....', '.....OUUUO......', '.....OOOO.......'],
];

/** @returns {Record<string, string[]>} frame name -> grid */
export function humanoidFrames() {
  /** @type {Record<string, string[]>} */
  const frames = {};
  for (let f = 0; f < 3; f++) {
    frames[`S_${f}`] = [...HEAD_FRONT, ...BODY_FRONT, ...LEGS_V[f]];
    frames[`N_${f}`] = [...HEAD_BACK, ...BODY_BACK, ...LEGS_V[f]];
    frames[`E_${f}`] = [...SIDE_TOP, ...LEGS_SIDE[f]];
  }
  return frames;
}

export const WREN_COLORS = { O: 0, B: 2, H: 8, S: 10, U: 3, D: 2 };

const BOX = [
  '................',
  '................',
  '................',
  '..000000000000..',
  '..099999999990..',
  '..088888888880..',
  '..099999999990..',
  '..099998899990..',
  '..099988889990..',
  '..099998899990..',
  '..099999999990..',
  '..099999999990..',
  '..088888888880..',
  '..099999999990..',
  '..000000000000..',
  '................',
];

/**
 * Bakes humanoid frames with a colour map under a name prefix.
 * @param {import('../../render/sprite-sheet.js').SpriteSheet} sheet
 * @param {string} prefix @param {Record<string, number>} colors
 */
export function bakeHumanoid(sheet, prefix, colors) {
  const frames = humanoidFrames();
  for (const [name, grid] of Object.entries(frames)) {
    const c = bakeGrid(grid, colors);
    sheet.add(`${prefix}_${name}`, c);
    if (name.startsWith('E_')) sheet.add(`${prefix}_${name}_f`, flipH(c));
  }
  sheet.add(`${prefix}_down`, rotate90(bakeGrid(frames.E_0, colors)));
}

/** @param {import('../../render/sprite-sheet.js').SpriteSheet} sheet */
export function bakePlayer(sheet) {
  bakeHumanoid(sheet, 'wren', WREN_COLORS);
  sheet.add('box', bakeGrid(BOX));
}

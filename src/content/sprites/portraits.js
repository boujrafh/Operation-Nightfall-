import { paint } from '../../render/sprite-sheet.js';
import { C } from '../../render/palette.js';

export const PORTRAIT_W = 48;
export const PORTRAIT_H = 56;

/**
 * Procedural 48x56 codec portraits, two mouth frames each.
 * Every character is described by a few parameters.
 */
const LOOKS = {
  wren: { hair: C.WOOD, clothes: C.BLUE, trim: C.STEEL, band: C.STEEL, style: 'short', extra: 'bandana' },
  hale: { hair: C.CONCRETE, clothes: C.JUNGLE, trim: C.YELLOW, band: null, style: 'crew', extra: 'headset' },
  bix: { hair: C.AMBER, clothes: C.CARD, trim: C.WOOD, band: null, style: 'messy', extra: 'glasses' },
  sato: { hair: C.VOID, clothes: C.WHITE, trim: C.RED, band: null, style: 'bun', extra: 'cross' },
  lark: { hair: C.VOID, clothes: C.VOID, trim: C.STEEL, band: null, style: 'hood', extra: 'silhouette' },
};

function headHalfWidth(row) {
  const cy = 27;
  const ry = 14;
  const rx = 11;
  const t = (row - cy) / ry;
  if (Math.abs(t) > 1) return 0;
  return Math.round(rx * Math.sqrt(1 - t * t));
}

/**
 * @param {keyof typeof LOOKS} id @param {boolean} mouthOpen
 */
function drawPortrait(id, mouthOpen) {
  const L = LOOKS[id];
  const sil = L.extra === 'silhouette';
  const skin = sil ? C.VOID : C.SKIN;
  const shade = sil ? C.VOID : C.CARD;
  return paint(PORTRAIT_W, PORTRAIT_H, (px, rect) => {
    rect(0, 0, PORTRAIT_W, PORTRAIT_H, C.NIGHT);
    for (let y = 1; y < PORTRAIT_H; y += 4) rect(0, y, PORTRAIT_W, 1, C.VOID);
    // shoulders
    rect(4, 46, 40, 10, L.clothes);
    rect(8, 43, 32, 4, L.clothes);
    rect(4, 46, 40, 1, sil ? C.STEEL : C.VOID);
    rect(21, 43, 6, 6, L.trim);
    // neck
    rect(19, 38, 10, 7, shade);
    rect(20, 38, 8, 6, skin);
    // head
    for (let y = 13; y <= 41; y++) {
      const hw = headHalfWidth(y);
      if (!hw) continue;
      rect(24 - hw, y, hw * 2, 1, skin);
      if (!sil) rect(24 + hw - 2, y, 2, 1, shade);
    }
    // hair
    const hair = L.hair;
    if (L.style === 'short') {
      for (let y = 12; y <= 20; y++) {
        const hw = headHalfWidth(Math.max(y, 14)) + 1;
        rect(24 - hw, y, hw * 2, 1, hair);
      }
      rect(12, 20, 3, 8, hair);
      rect(33, 20, 3, 6, hair);
    } else if (L.style === 'crew') {
      for (let y = 12; y <= 17; y++) {
        const hw = headHalfWidth(Math.max(y, 14));
        rect(24 - hw, y, hw * 2, 1, hair);
      }
      rect(13, 17, 2, 8, hair);
      rect(33, 17, 2, 8, hair);
    } else if (L.style === 'messy') {
      for (let y = 10; y <= 19; y++) {
        const hw = headHalfWidth(Math.max(y, 14)) + 2;
        rect(24 - hw, y, hw * 2, 1, hair);
      }
      for (const x of [12, 17, 22, 27, 32]) rect(x, 8, 3, 3, hair);
    } else if (L.style === 'bun') {
      rect(19, 6, 10, 7, hair);
      for (let y = 12; y <= 19; y++) {
        const hw = headHalfWidth(Math.max(y, 14)) + 1;
        rect(24 - hw, y, hw * 2, 1, hair);
      }
      rect(12, 19, 3, 14, hair);
      rect(33, 19, 3, 14, hair);
    } else if (L.style === 'hood') {
      for (let y = 9; y <= 44; y++) {
        const hw = Math.min(16, headHalfWidth(Math.min(Math.max(y, 14), 40)) + 4);
        rect(24 - hw, y, hw * 2, 1, C.VOID);
      }
      rect(8, 9, 32, 1, C.STEEL);
      rect(7, 10, 1, 34, C.STEEL);
      rect(40, 10, 1, 34, C.STEEL);
    }
    if (!sil) {
      // brows and eyes
      rect(16, 23, 6, 1, hair === C.VOID ? C.STEEL : C.VOID);
      rect(27, 23, 6, 1, hair === C.VOID ? C.STEEL : C.VOID);
      rect(17, 25, 3, 2, C.VOID);
      rect(28, 25, 3, 2, C.VOID);
      px(18, 25, C.WHITE);
      px(29, 25, C.WHITE);
      // nose
      rect(24, 27, 1, 4, shade);
      px(23, 31, shade);
      // mouth
      if (mouthOpen) {
        rect(21, 34, 6, 3, C.VOID);
        rect(22, 36, 4, 1, C.RED);
      } else rect(21, 35, 6, 1, C.WOOD);
    } else {
      // only glowing eyes in the dark
      rect(18, 26, 3, 1, C.CYAN);
      rect(27, 26, 3, 1, C.CYAN);
    }
    // extras
    if (L.extra === 'bandana') {
      rect(12, 17, 24, 3, L.band);
      rect(35, 18, 4, 2, L.band);
      rect(38, 20, 3, 4, L.band);
    } else if (L.extra === 'headset') {
      rect(10, 22, 3, 9, C.STEEL);
      rect(11, 14, 2, 8, C.STEEL);
      rect(12, 30, 9, 1, C.STEEL);
      rect(20, 29, 3, 3, C.VOID);
      rect(14, 48, 4, 2, C.YELLOW);
      rect(30, 48, 4, 2, C.YELLOW);
    } else if (L.extra === 'glasses') {
      rect(15, 24, 8, 5, C.VOID);
      rect(26, 24, 8, 5, C.VOID);
      rect(16, 25, 6, 3, C.CYAN);
      rect(27, 25, 6, 3, C.CYAN);
      rect(23, 25, 3, 1, C.VOID);
      px(17, 25, C.WHITE);
      px(28, 25, C.WHITE);
    } else if (L.extra === 'cross') {
      rect(32, 48, 6, 2, C.RED);
      rect(34, 46, 2, 6, C.RED);
    }
  });
}

/** @param {import('../../render/sprite-sheet.js').SpriteSheet} sheet */
export function bakePortraits(sheet) {
  for (const id of /** @type {(keyof typeof LOOKS)[]} */ (Object.keys(LOOKS))) {
    sheet.add(`portrait_${id}_0`, drawPortrait(id, false));
    sheet.add(`portrait_${id}_1`, drawPortrait(id, true));
  }
}

export const PORTRAIT_IDS = Object.keys(LOOKS);

import { PALETTE } from './palette.js';
import { makeCanvas } from './sprite-sheet.js';

/** Ordered 2x2 masks for 25%, 50% and 75% coverage. */
const MASKS = {
  25: [[0, 0]],
  50: [
    [0, 0],
    [1, 1],
  ],
  75: [
    [0, 0],
    [1, 1],
    [1, 0],
  ],
  100: [
    [0, 0],
    [1, 1],
    [1, 0],
    [0, 1],
  ],
};

const cache = new Map();

/**
 * Returns a repeating 2x2 dither pattern of `colorIdx` with the given density.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} colorIdx
 * @param {25|50|75|100} density
 */
export function ditherPattern(ctx, colorIdx, density) {
  const key = `${colorIdx}:${density}`;
  let p = cache.get(key);
  if (p) return p;
  const c = makeCanvas(2, 2);
  const cctx = c.getContext('2d');
  cctx.fillStyle = PALETTE[colorIdx];
  for (const [x, y] of MASKS[density]) cctx.fillRect(x, y, 1, 1);
  p = ctx.createPattern(c, 'repeat');
  cache.set(key, p);
  return p;
}

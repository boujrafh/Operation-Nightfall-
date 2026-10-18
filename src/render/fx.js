import { WIDTH, HEIGHT } from '../core/config.js';
import { C } from './palette.js';
import { ditherPattern } from './dither.js';

const FADE_DENSITY = [0, 25, 50, 75, 100];

/** Screen effects: dithered fades, flashes and shake. */
export class Fx {
  constructor() {
    this.fadeLevel = 0;
    this.flashFrames = 0;
    /** @type {number} */
    this.flashColor = C.WHITE;
    this.shakeFrames = 0;
    this.shakeAmp = 0;
    this.reduceFlashing = false;
  }

  /** @param {number} level 0 (clear) to 4 (black) */
  setFade(level) {
    this.fadeLevel = Math.max(0, Math.min(4, Math.round(level)));
  }

  /** @param {number} frames @param {number} [colorIdx] */
  flash(frames, colorIdx = C.WHITE) {
    if (this.reduceFlashing) return;
    this.flashFrames = frames;
    this.flashColor = colorIdx;
  }

  /** @param {number} frames @param {number} amp */
  shake(frames, amp) {
    if (this.reduceFlashing) return;
    this.shakeFrames = frames;
    this.shakeAmp = amp;
  }

  /** Current shake offset; advances one frame per call. */
  nextShakeOffset() {
    if (this.shakeFrames <= 0) return { x: 0, y: 0 };
    this.shakeFrames--;
    const a = this.shakeAmp;
    return {
      x: Math.round((Math.random() * 2 - 1) * a),
      y: Math.round((Math.random() * 2 - 1) * a),
    };
  }

  /** @param {CanvasRenderingContext2D} ctx */
  drawOverlay(ctx) {
    if (this.flashFrames > 0) {
      this.flashFrames--;
      ctx.fillStyle = ditherPattern(ctx, this.flashColor, 50);
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    if (this.fadeLevel > 0) {
      ctx.fillStyle = ditherPattern(ctx, C.VOID, /** @type {any} */ (FADE_DENSITY[this.fadeLevel]));
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }
}

import { WIDTH, HEIGHT } from '../core/config.js';

/**
 * Picks the display scale. A whole-number scale keeps pixels perfectly
 * square; it is used whenever it fills at least 85% of the space the
 * fractional scale would, otherwise the fractional scale is used so small
 * phone screens are not wasted.
 * @param {number} availW @param {number} availH
 */
export function computeScale(availW, availH, w = WIDTH, h = HEIGHT) {
  const fit = Math.min(availW / w, availH / h);
  if (fit <= 0) return 1;
  const whole = Math.floor(fit);
  if (whole >= 1 && whole / fit >= 0.85) return whole;
  return fit;
}

/**
 * Sizes the canvas (CSS pixels) inside its container, keeping the ratio.
 * The container centres it on a black background (letterboxing).
 * @param {HTMLCanvasElement} canvas @param {HTMLElement} container
 */
export function fitCanvas(canvas, container) {
  const scale = computeScale(container.clientWidth, container.clientHeight);
  canvas.style.width = `${Math.floor(WIDTH * scale)}px`;
  canvas.style.height = `${Math.floor(HEIGHT * scale)}px`;
  return scale;
}

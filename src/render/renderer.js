import { WIDTH, HEIGHT } from '../core/config.js';
import { PALETTE } from './palette.js';
import { BitmapFont } from './font.js';
import { SpriteSheet } from './sprite-sheet.js';
import { ditherPattern } from './dither.js';
import { Fx } from './fx.js';

/** Thin drawing helper over the 256x212 canvas. */
export class Renderer {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ctx.imageSmoothingEnabled = false;
    this.font = new BitmapFont();
    this.sprites = new SpriteSheet();
    this.fx = new Fx();
    this.time = 0;
  }

  /** @param {number} [colorIdx] */
  clear(colorIdx = 0) {
    this.ctx.fillStyle = PALETTE[colorIdx];
    this.ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  rect(x, y, w, h, colorIdx) {
    this.ctx.fillStyle = PALETTE[colorIdx];
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /** 1px outlined rectangle. */
  frame(x, y, w, h, colorIdx) {
    this.rect(x, y, w, 1, colorIdx);
    this.rect(x, y + h - 1, w, 1, colorIdx);
    this.rect(x, y, 1, h, colorIdx);
    this.rect(x + w - 1, y, 1, h, colorIdx);
  }

  /** Dithered fill (8-bit transparency). @param {25|50|75|100} density */
  dither(x, y, w, h, colorIdx, density) {
    this.ctx.fillStyle = ditherPattern(this.ctx, colorIdx, density);
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /** Box with background, outline and inner line (menus, HUD). */
  panel(x, y, w, h, bg, border) {
    this.rect(x, y, w, h, bg);
    this.frame(x, y, w, h, border);
  }

  /** @param {string} name @param {number} x @param {number} y */
  sprite(name, x, y) {
    this.ctx.drawImage(this.sprites.get(name), Math.round(x), Math.round(y));
  }

  /**
   * @param {string} text @param {number} x @param {number} y @param {number} colorIdx
   * @param {{ scale?: number, shadow?: number, align?: 'left'|'center'|'right' }} [opts]
   */
  text(text, x, y, colorIdx, opts) {
    this.font.draw(this.ctx, text, x, y, colorIdx, opts);
  }

  /** Filled polygon with a dither pattern. @param {{x:number,y:number}[]} pts */
  ditherPolygon(pts, colorIdx, density) {
    if (pts.length < 3) return;
    const ctx = this.ctx;
    ctx.fillStyle = ditherPattern(ctx, colorIdx, density);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
  }
}

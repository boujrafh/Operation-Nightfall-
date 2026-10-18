import { PALETTE } from './palette.js';

/** @param {number} w @param {number} h @returns {HTMLCanvasElement} */
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Bakes a text grid into a canvas. Each character is a palette index in hex
 * (0-f); '.' and ' ' are transparent. `map` substitutes symbolic letters.
 * @param {string[]} rows
 * @param {Record<string, number>} [map]
 */
export function bakeGrid(rows, map) {
  const h = rows.length;
  const w = rows[0].length;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ' || ch === undefined) continue;
      const idx = map && ch in map ? map[ch] : parseInt(ch, 16);
      if (Number.isNaN(idx) || idx < 0) continue;
      ctx.fillStyle = PALETTE[idx];
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

/** @param {HTMLCanvasElement} src */
export function flipH(src) {
  const c = makeCanvas(src.width, src.height);
  const ctx = c.getContext('2d');
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
}

/** Rotates a canvas 90 degrees clockwise. @param {HTMLCanvasElement} src */
export function rotate90(src) {
  const c = makeCanvas(src.height, src.width);
  const ctx = c.getContext('2d');
  ctx.translate(src.height, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(src, 0, 0);
  return c;
}

/**
 * Paints into a fresh canvas with a callback; used by procedural sprites.
 * @param {number} w @param {number} h
 * @param {(px: (x:number,y:number,i:number)=>void, rect: (x:number,y:number,w:number,h:number,i:number)=>void, ctx: CanvasRenderingContext2D) => void} fn
 */
export function paint(w, h, fn) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const rect = (x, y, rw, rh, i) => {
    ctx.fillStyle = PALETTE[i];
    ctx.fillRect(x, y, rw, rh);
  };
  const px = (x, y, i) => rect(x, y, 1, 1, i);
  fn(px, rect, ctx);
  return c;
}

export class SpriteSheet {
  constructor() {
    /** @type {Map<string, HTMLCanvasElement>} */
    this.map = new Map();
  }
  /** @param {string} name @param {HTMLCanvasElement} canvas */
  add(name, canvas) {
    this.map.set(name, canvas);
  }
  /** @param {string} name */
  get(name) {
    const s = this.map.get(name);
    if (!s) throw new Error(`Unknown sprite: ${name}`);
    return s;
  }
  /** @param {string} name */
  has(name) {
    return this.map.has(name);
  }
}

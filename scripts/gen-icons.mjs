import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIconGrid } from '../src/content/sprites/icon.js';
import { PALETTE } from '../src/render/palette.js';
import { encodePng } from './png.mjs';

const BG = 1;

/** @param {number} i */
const rgb = (i) => {
  const h = PALETTE[i];
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
};

/**
 * Renders the 32x32 grid into a size x size image, scaled by whole
 * pixels (nearest neighbour) and centred on the night background.
 * @param {number} size @param {number} safeRatio share of the canvas the art may use
 */
export function renderIcon(size, safeRatio = 1) {
  const grid = buildIconGrid();
  const n = grid.length;
  const scale = Math.max(1, Math.floor((size * safeRatio) / n));
  const off = Math.floor((size - n * scale) / 2);
  const out = new Uint8Array(size * size * 4);
  const bg = rgb(BG);
  for (let i = 0; i < size * size; i++) {
    out[i * 4] = bg[0];
    out[i * 4 + 1] = bg[1];
    out[i * 4 + 2] = bg[2];
    out[i * 4 + 3] = 255;
  }
  for (let gy = 0; gy < n; gy++) {
    for (let gx = 0; gx < n; gx++) {
      const [r, g, b] = rgb(grid[gy][gx]);
      for (let y = 0; y < scale; y++) {
        for (let x = 0; x < scale; x++) {
          const px = off + gx * scale + x;
          const py = off + gy * scale + y;
          if (px < 0 || py < 0 || px >= size || py >= size) continue;
          const o = (py * size + px) * 4;
          out[o] = r;
          out[o + 1] = g;
          out[o + 2] = b;
        }
      }
    }
  }
  return encodePng(size, size, out);
}

export const ICONS = [
  { file: 'apple-touch-icon-180.png', size: 180, safe: 1 },
  { file: 'icon-192.png', size: 192, safe: 1 },
  { file: 'icon-512.png', size: 512, safe: 1 },
  { file: 'icon-512-maskable.png', size: 512, safe: 0.75 },
];

/** Writes every icon into `outDir` (overwrites, so it is safe to repeat). */
export function generateIcons(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const written = [];
  for (const icon of ICONS) {
    const file = path.join(outDir, icon.file);
    fs.writeFileSync(file, renderIcon(icon.size, icon.safe));
    written.push(file);
  }
  return written;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const out =
    process.argv[2] ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'icons');
  for (const f of generateIcons(out)) console.log(`icon: ${path.relative(process.cwd(), f)}`);
}

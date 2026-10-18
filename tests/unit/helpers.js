import { TileMap } from '../../src/world/tilemap.js';

/** 16x11 room of open floor with walls around, plus optional overrides. */
export function makeMap(overrides = {}) {
  const rows = [];
  for (let y = 0; y < 11; y++) {
    let row = '';
    for (let x = 0; x < 16; x++) {
      const edge = y === 0 || y === 10 || x === 0 || x === 15;
      row += overrides[`${x},${y}`] || (edge ? '#' : '.');
    }
    rows.push(row);
  }
  return new TileMap(rows);
}

/** In-memory Storage-like object. */
export function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

export const center = (t) => t * 16 + 8;

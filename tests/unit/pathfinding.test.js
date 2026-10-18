import { describe, it, expect } from 'vitest';
import { findPath, nearestWalkable, reachable } from '../../src/world/pathfinding.js';
import { makeMap } from './helpers.js';

const walkOf = (tm) => (x, y) => tm.isWalkableInside(x, y);

describe('pathfinding', () => {
  it('finds a straight path', () => {
    const p = findPath(walkOf(makeMap()), { x: 2, y: 5 }, { x: 6, y: 5 });
    expect(p.at(-1)).toEqual({ x: 6, y: 5 });
    expect(p.length).toBe(4);
  });

  it('goes around a wall', () => {
    const o = {};
    for (let y = 1; y <= 8; y++) o[`7,${y}`] = '#';
    const p = findPath(walkOf(makeMap(o)), { x: 3, y: 3 }, { x: 11, y: 3 });
    expect(p).not.toBeNull();
    expect(p.some((n) => n.y === 9)).toBe(true);
  });

  it('never cuts corners diagonally', () => {
    const tm = makeMap({ '5,4': '#', '4,5': '#' });
    const p = findPath(walkOf(tm), { x: 4, y: 4 }, { x: 5, y: 5 });
    expect(p.length).toBeGreaterThan(1);
  });

  it('returns null for an unreachable or blocked goal', () => {
    const tm = makeMap({ '7,5': '#' });
    expect(findPath(walkOf(tm), { x: 2, y: 5 }, { x: 7, y: 5 })).toBeNull();
  });

  it('finds the nearest walkable tile', () => {
    const tm = makeMap({ '7,5': '#' });
    const n = nearestWalkable(walkOf(tm), 7, 5);
    expect(Math.abs(n.x - 7) + Math.abs(n.y - 5)).toBeLessThanOrEqual(2);
  });

  it('flood fill covers the open room', () => {
    expect(reachable(walkOf(makeMap()), { x: 1, y: 1 }).size).toBe(14 * 9);
  });
});

import { describe, it, expect } from 'vitest';
import { castRay, hasLineOfSight } from '../../src/world/line-of-sight.js';
import { makeMap, center } from './helpers.js';

describe('line of sight', () => {
  it('sees across open floor', () => {
    const tm = makeMap();
    expect(hasLineOfSight(tm, center(2), center(5), center(10), center(5))).toBe(true);
  });

  it('is blocked by walls and crates', () => {
    expect(
      hasLineOfSight(makeMap({ '6,5': '#' }), center(2), center(5), center(10), center(5)),
    ).toBe(false);
    expect(
      hasLineOfSight(makeMap({ '6,5': 'C' }), center(2), center(5), center(10), center(5)),
    ).toBe(false);
  });

  it('is not blocked by bushes, fences or water', () => {
    for (const ch of ['B', 'F', '~']) {
      expect(
        hasLineOfSight(makeMap({ '6,5': ch }), center(2), center(5), center(10), center(5)),
      ).toBe(true);
    }
  });

  it('castRay stops at the first blocking tile', () => {
    const tm = makeMap({ '6,5': '#' });
    const d = castRay(tm, center(2), center(5), 0, 200);
    expect(d).toBeCloseTo(6 * 16 - center(2), 5);
  });

  it('castRay is capped at maxDist', () => {
    expect(castRay(makeMap(), center(2), center(5), 0, 20)).toBe(20);
  });
});

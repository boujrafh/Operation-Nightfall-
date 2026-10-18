import { describe, it, expect } from 'vitest';
import { canonicalJson, canonicalClone } from '../../src/state/canonical-json.js';

describe('canonical JSON', () => {
  it('sorts keys at every level', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
  });

  it('gives the same string for the same data in any key order', () => {
    expect(canonicalJson({ x: [1, { z: 1, y: 2 }], w: true })).toBe(
      canonicalJson({ w: true, x: [1, { y: 2, z: 1 }] }),
    );
  });

  it('drops undefined values and clones deeply', () => {
    const src = { a: undefined, b: { c: [1, 2] } };
    const copy = canonicalClone(src);
    expect(copy).toEqual({ b: { c: [1, 2] } });
    copy.b.c.push(3);
    expect(src.b.c).toEqual([1, 2]);
  });
});

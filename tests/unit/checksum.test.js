import { describe, it, expect } from 'vitest';
import { fnv1a } from '../../src/state/checksum.js';

describe('fnv1a', () => {
  it('matches known FNV-1a 32-bit values', () => {
    expect(fnv1a('')).toBe('811c9dc5');
    expect(fnv1a('a')).toBe('e40c292c');
    expect(fnv1a('foobar')).toBe('bf9cf968');
  });

  it('changes when the input changes', () => {
    expect(fnv1a('{"hp":12}')).not.toBe(fnv1a('{"hp":11}'));
  });
});

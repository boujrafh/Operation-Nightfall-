import { describe, it, expect } from 'vitest';
import { CONTENT, createRegistry } from '../../src/content/registry.js';
import { validateContent } from '../../src/content/validate.js';
import { parsePattern } from '../../src/audio/sequencer.js';
import { buildIconGrid } from '../../src/content/sprites/icon.js';

describe('content', () => {
  it('passes validation', () => {
    expect(validateContent(CONTENT)).toEqual([]);
  });

  it('detects broken content', () => {
    const broken = structuredClone(CONTENT);
    broken.rooms[0].tiles[3] = 'short';
    broken.rooms[1].exits[0].targetRoom = 'nowhere';
    broken.rooms[2].guards[0].route[0] = { x: 0, y: 0, wait: 0 };
    const errors = validateContent(broken);
    expect(errors.some((e) => e.includes('row 3'))).toBe(true);
    expect(errors.some((e) => e.includes('unknown room nowhere'))).toBe(true);
    expect(errors.some((e) => e.includes('blocked'))).toBe(true);
  });

  it('detects a key card that cannot be reached (soft-lock)', () => {
    const broken = structuredClone(CONTENT);
    broken.rooms[2].guards.forEach((g) => delete g.carries);
    expect(validateContent(broken).some((e) => e.includes('no card'))).toBe(true);
  });

  it('registry rejects unknown ids', () => {
    const reg = createRegistry();
    expect(() => reg.getRoom('9-9')).toThrow();
    expect(reg.getItem('card_1').cardLevel).toBe(1);
  });

  it('every music pattern parses', () => {
    for (const t of CONTENT.tracks)
      for (const ch of t.channels) expect(parsePattern(ch.pattern).steps).toBeGreaterThan(0);
  });

  it('the app icon is a 32x32 palette grid', () => {
    const g = buildIconGrid();
    expect(g.length).toBe(32);
    expect(g.every((row) => row.length === 32 && row.every((c) => c >= 0 && c < 16))).toBe(true);
  });
});

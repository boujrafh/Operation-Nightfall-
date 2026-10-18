import { describe, it, expect } from 'vitest';
import { migrate, CURRENT_SCHEMA } from '../../src/state/migrations.js';

describe('migrations', () => {
  it('returns a current save unchanged (idempotent)', () => {
    const env = { schemaVersion: CURRENT_SCHEMA, data: { a: 1 } };
    expect(migrate(env)).toBe(env);
    expect(migrate(migrate(env))).toBe(env);
  });

  it('applies steps in order and only once', () => {
    const registry = {
      1: (d) => ({ ...d, b: (d.b || 0) + 1 }),
      2: (d) => ({ ...d, c: 'x' }),
    };
    const once = migrate({ schemaVersion: 1, data: {} }, registry, 3);
    expect(once).toEqual({ schemaVersion: 3, data: { b: 1, c: 'x' } });
    const twice = migrate(once, registry, 3);
    expect(twice).toEqual(once);
  });

  it('refuses saves from a newer version', () => {
    expect(() => migrate({ schemaVersion: 99, data: {} })).toThrow();
  });

  it('fails when a step is missing', () => {
    expect(() => migrate({ schemaVersion: 1, data: {} }, {}, 2)).toThrow();
  });
});

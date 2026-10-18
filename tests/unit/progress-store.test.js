import { describe, it, expect } from 'vitest';
import { ProgressStore, newProgress } from '../../src/state/progress-store.js';

const chapter = { id: 0, startRoom: '0-1', startEntry: 'start' };
const box = { id: 'item_box', kind: 'item' };
const ration = { id: 'ration', kind: 'consumable', maxStack: 5 };

describe('ProgressStore (idempotency)', () => {
  it('marking twice equals marking once', () => {
    const p = new ProgressStore(newProgress(chapter));
    expect(p.markTrigger('t1')).toBe(true);
    expect(p.markTrigger('t1')).toBe(false);
    expect(p.data.flags.triggersFired).toEqual(['t1']);
  });

  it('a pickup is collected exactly once', () => {
    const p = new ProgressStore(newProgress(chapter));
    expect(p.collect('pk_1', ration, 2)).toBe(true);
    expect(p.collect('pk_1', ration, 2)).toBe(false);
    expect(p.data.inventory.consumables.ration).toBe(2);
  });

  it('owned items are never duplicated', () => {
    const p = new ProgressStore(newProgress(chapter));
    p.addItem(box);
    p.addItem(box);
    expect(p.data.inventory.items).toEqual(['item_box']);
  });

  it('stacks are capped', () => {
    const p = new ProgressStore(newProgress(chapter));
    p.addItem(ration, 4);
    p.addItem(ration, 4);
    expect(p.data.inventory.consumables.ration).toBe(5);
  });

  it('snapshot and restore round-trip without sharing references', () => {
    const p = new ProgressStore(newProgress(chapter));
    p.markPickup('a');
    const snap = p.snapshot();
    p.markPickup('b');
    p.restore(snap);
    expect(p.data.flags.pickupsTaken).toEqual(['a']);
    snap.flags.pickupsTaken.push('zzz');
    expect(p.data.flags.pickupsTaken).toEqual(['a']);
  });
});

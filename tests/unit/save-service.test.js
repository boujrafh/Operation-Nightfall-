import { describe, it, expect } from 'vitest';
import { SaveService } from '../../src/state/save-service.js';
import { SafeStorage } from '../../src/state/storage.js';
import { newProgress } from '../../src/state/progress-store.js';
import { createRegistry } from '../../src/content/registry.js';
import { memoryStorage } from './helpers.js';

const registry = createRegistry();
const fixedNow = () => '2026-10-18T12:00:00.000Z';
const fresh = () => newProgress(registry.getChapter(0));
const make = (backing = memoryStorage()) => ({
  backing,
  svc: new SaveService(new SafeStorage(backing), registry, { now: fixedNow }),
});

describe('SaveService', () => {
  it('saves and loads the same progress', () => {
    const { svc } = make();
    const data = fresh();
    data.inventory.items.push('item_box');
    expect(svc.save(data)).toMatchObject({ ok: true, persisted: true });
    const { save } = svc.load();
    expect(save.inventory.items).toEqual(['item_box']);
    expect(save.roomId).toBe('0-1');
  });

  it('saving the same state twice stores the exact same value (I-1)', () => {
    const { svc, backing } = make();
    svc.save(fresh());
    const first = backing.getItem('nightfall.save.v1');
    svc.save(fresh());
    expect(backing.getItem('nightfall.save.v1')).toBe(first);
    expect(backing.getItem('nightfall.save.v1.tmp')).toBeNull();
  });

  it('quarantines a corrupted save once (I-6)', () => {
    const { svc, backing } = make();
    backing.setItem('nightfall.save.v1', '{not json');
    expect(svc.load()).toMatchObject({ ok: true, save: null, quarantined: true });
    expect(backing.getItem('nightfall.save.v1.corrupt')).toBe('{not json');
    expect(backing.getItem('nightfall.save.v1')).toBeNull();
    backing.setItem('nightfall.save.v1', '{not json');
    svc.load();
    expect(backing.getItem('nightfall.save.v1.corrupt')).toBe('{not json');
  });

  it('rejects a save whose checksum does not match', () => {
    const { svc, backing } = make();
    svc.save(fresh());
    const env = JSON.parse(backing.getItem('nightfall.save.v1'));
    env.data.player.hp = 1;
    backing.setItem('nightfall.save.v1', JSON.stringify(env));
    expect(svc.load().save).toBeNull();
  });

  it('recovers from an interrupted write using the temporary copy', () => {
    const { svc, backing } = make();
    svc.save(fresh());
    backing.setItem('nightfall.save.v1.tmp', backing.getItem('nightfall.save.v1'));
    backing.removeItem('nightfall.save.v1');
    const res = svc.load();
    expect(res.save).not.toBeNull();
    expect(res.recovered).toBe(true);
  });

  it('falls back to memory when storage throws (never crashes)', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    const svc = new SaveService(new SafeStorage(broken), registry, { now: fixedNow });
    expect(svc.isPersistent()).toBe(false);
    expect(svc.save(fresh())).toMatchObject({ ok: true, persisted: false });
    expect(svc.load().save.roomId).toBe('0-1');
  });

  it('falls back to memory when the quota is exceeded mid-session', () => {
    const backing = memoryStorage();
    const { svc } = make(backing);
    backing.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const res = svc.save(fresh());
    expect(res.persisted).toBe(false);
    expect(svc.load().save).not.toBeNull();
  });

  it('repairs invalid values and drops unknown content ids (I-5)', () => {
    const { svc, backing } = make();
    const data = fresh();
    data.roomId = 'nowhere';
    data.player.hp = 999;
    data.inventory.items = ['item_box', 'item_box', 'ghost_item'];
    data.inventory.weapons = [];
    data.inventory.selectedItem = 'ghost_item';
    data.flags.pickupsTaken = ['a', 'a', 7];
    svc.save(data);
    const { save } = svc.load();
    expect(save.roomId).toBe('0-1');
    expect(save.player.hp).toBe(save.player.maxHp);
    expect(save.inventory.items).toEqual(['item_box']);
    expect(save.inventory.weapons).toEqual(['fists']);
    expect(save.inventory.selectedItem).toBeNull();
    expect(save.flags.pickupsTaken).toEqual(['a']);
    expect(backing.getItem('nightfall.save.v1')).toBeTruthy();
  });

  it('deleteSave removes the save', () => {
    const { svc } = make();
    svc.save(fresh());
    svc.deleteSave();
    expect(svc.hasSave()).toBe(false);
  });
});

describe('settings', () => {
  it('accepts the touch pad modes and repairs bad values', async () => {
    const { sanitizeSettings } = await import('../../src/state/settings-service.js');
    expect(sanitizeSettings({ touchControls: 'on' }).touchControls).toBe('on');
    expect(sanitizeSettings({ touchControls: 'off' }).touchControls).toBe('off');
    expect(sanitizeSettings({ touchControls: 'sideways' }).touchControls).toBe('auto');
    expect(sanitizeSettings(null).touchControls).toBe('auto');
  });
});

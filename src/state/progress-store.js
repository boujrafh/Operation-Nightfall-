import { PLAYER } from '../core/config.js';
import { canonicalClone } from './canonical-json.js';

const FLAG_KEYS = /** @type {const} */ ({
  pickup: 'pickupsTaken',
  trigger: 'triggersFired',
  door: 'doorsOpened',
  boss: 'bossesDefeated',
  story: 'story',
});

/**
 * Fresh progress for a chapter.
 * @param {{ id: number, startRoom: string, startEntry: string }} chapter
 */
export function newProgress(chapter) {
  return {
    chapter: chapter.id,
    roomId: chapter.startRoom,
    entryId: chapter.startEntry,
    player: { hp: PLAYER.MAX_HP, maxHp: PLAYER.MAX_HP },
    inventory: {
      items: [],
      weapons: ['fists'],
      ammo: {},
      consumables: {},
      selectedItem: null,
      selectedWeapon: 'fists',
    },
    flags: { triggersFired: [], pickupsTaken: [], doorsOpened: [], bossesDefeated: [], story: [] },
    stats: { alerts: 0, takedowns: 0, kills: 0, continues: 0, playTimeMs: 0 },
  };
}

/**
 * Wraps saved progress. Every `mark*` is idempotent (rule I-2) and returns
 * true only the first time.
 */
export class ProgressStore {
  /** @param {any} data */
  constructor(data) {
    this.data = data;
  }

  /** @param {keyof typeof FLAG_KEYS} kind @param {string} id */
  has(kind, id) {
    return this.data.flags[FLAG_KEYS[kind]].includes(id);
  }

  /** @param {keyof typeof FLAG_KEYS} kind @param {string} id */
  mark(kind, id) {
    const list = this.data.flags[FLAG_KEYS[kind]];
    if (list.includes(id)) return false;
    list.push(id);
    return true;
  }

  /** @param {string} id */
  markPickup(id) {
    return this.mark('pickup', id);
  }
  /** @param {string} id */
  markTrigger(id) {
    return this.mark('trigger', id);
  }
  /** @param {string} id */
  markDoor(id) {
    return this.mark('door', id);
  }
  /** @param {string} id */
  markBoss(id) {
    return this.mark('boss', id);
  }
  /** @param {string} id */
  markStory(id) {
    return this.mark('story', id);
  }

  /**
   * Adds an item to the inventory. Owned items are not duplicated.
   * @param {any} def ItemDef @param {number} [qty]
   */
  addItem(def, qty = 1) {
    const inv = this.data.inventory;
    switch (def.kind) {
      case 'weapon':
        if (!inv.weapons.includes(def.id)) inv.weapons.push(def.id);
        break;
      case 'item':
      case 'card':
        if (!inv.items.includes(def.id)) inv.items.push(def.id);
        break;
      case 'consumable': {
        const cur = inv.consumables[def.id] || 0;
        inv.consumables[def.id] = Math.min(def.maxStack || 99, cur + qty);
        break;
      }
      case 'ammo': {
        const cur = inv.ammo[def.ammoFor] || 0;
        inv.ammo[def.ammoFor] = Math.min(def.maxStack || 99, cur + qty);
        break;
      }
      case 'story':
        this.markStory(def.id);
        break;
      default:
        throw new Error(`Unknown item kind: ${def.kind}`);
    }
  }

  /**
   * Collects a pickup exactly once (rule I-3): the reward is tied to the
   * pickup id, so reloads or double taps can never duplicate it.
   * @param {string} pickupId @param {any} def @param {number} [qty]
   */
  collect(pickupId, def, qty = 1) {
    if (!this.markPickup(pickupId)) return false;
    this.addItem(def, qty);
    return true;
  }

  /** @param {number} ms */
  addPlayTime(ms) {
    this.data.stats.playTimeMs += ms;
  }

  /** @param {'alerts'|'takedowns'|'kills'|'continues'} key */
  bump(key) {
    this.data.stats[key] += 1;
  }

  /** Deep, canonical copy (sets deduplicated). */
  snapshot() {
    const copy = canonicalClone(this.data);
    for (const k of Object.values(FLAG_KEYS)) copy.flags[k] = [...new Set(copy.flags[k])];
    copy.inventory.items = [...new Set(copy.inventory.items)];
    copy.inventory.weapons = [...new Set(copy.inventory.weapons)];
    return copy;
  }

  /** @param {any} snap */
  restore(snap) {
    this.data = canonicalClone(snap);
  }
}

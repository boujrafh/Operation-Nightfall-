import { STORAGE_KEYS, GAME_VERSION, PLAYER } from '../core/config.js';
import { canonicalJson } from './canonical-json.js';
import { fnv1a } from './checksum.js';
import { CURRENT_SCHEMA, migrate, MIGRATIONS } from './migrations.js';

const isStr = (v) => typeof v === 'string';
const uniqStrings = (v) => (Array.isArray(v) ? [...new Set(v.filter(isStr))] : []);
const nonNegInt = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

/**
 * Validates and repairs loaded data against the content (Doc 06 §3.2).
 * Missing values get defaults; existing valid values are kept (rule I-5).
 * @param {any} d
 * @param {{ hasRoom: (id: string) => boolean, getRoom: (id: string) => any,
 *   hasItem: (id: string) => boolean, getChapter: (n: number) => any }} content
 */
export function sanitize(d, content) {
  const chapter =
    content.getChapter(Number.isInteger(d.chapter) ? d.chapter : 0) || content.getChapter(0);
  const out = {};
  out.chapter = chapter.id;
  if (isStr(d.roomId) && content.hasRoom(d.roomId)) {
    out.roomId = d.roomId;
    const room = content.getRoom(d.roomId);
    out.entryId = room.entries.some((e) => e.id === d.entryId) ? d.entryId : room.entries[0].id;
  } else {
    out.roomId = chapter.startRoom;
    out.entryId = chapter.startEntry;
  }
  const p = d.player || {};
  const maxHp = Number.isInteger(p.maxHp) && p.maxHp > 0 ? p.maxHp : PLAYER.MAX_HP;
  const hp = Number.isFinite(p.hp) ? Math.floor(p.hp) : maxHp;
  out.player = { maxHp, hp: Math.min(maxHp, Math.max(1, hp)) };

  const inv = d.inventory || {};
  const items = uniqStrings(inv.items).filter((id) => content.hasItem(id));
  const weapons = uniqStrings(inv.weapons).filter((id) => content.hasItem(id));
  if (!weapons.includes('fists')) weapons.unshift('fists');
  const counts = (o) => {
    const r = {};
    if (o && typeof o === 'object') {
      for (const [k, v] of Object.entries(o)) if (content.hasItem(k)) r[k] = nonNegInt(v);
    }
    return r;
  };
  out.inventory = {
    items,
    weapons,
    ammo: counts(inv.ammo),
    consumables: counts(inv.consumables),
    selectedItem: items.includes(inv.selectedItem) ? inv.selectedItem : null,
    selectedWeapon: weapons.includes(inv.selectedWeapon) ? inv.selectedWeapon : 'fists',
  };

  const f = d.flags || {};
  out.flags = {
    triggersFired: uniqStrings(f.triggersFired),
    pickupsTaken: uniqStrings(f.pickupsTaken),
    doorsOpened: uniqStrings(f.doorsOpened),
    bossesDefeated: uniqStrings(f.bossesDefeated),
    story: uniqStrings(f.story),
  };
  const s = d.stats || {};
  out.stats = {
    alerts: nonNegInt(s.alerts),
    takedowns: nonNegInt(s.takedowns),
    kills: nonNegInt(s.kills),
    continues: nonNegInt(s.continues),
    playTimeMs: nonNegInt(s.playTimeMs),
  };
  return out;
}

/**
 * Save and load with checksum, safe two-step write, quarantine of corrupted
 * saves and an in-memory fallback. Never throws (Doc 06 §4).
 */
export class SaveService {
  /**
   * @param {import('./storage.js').SafeStorage} storage
   * @param {any} content registry
   * @param {{ key?: string, now?: () => string, migrations?: Record<number, (data: any) => any>, version?: number }} [opts]
   */
  constructor(storage, content, opts = {}) {
    this.storage = storage;
    this.content = content;
    this.key = opts.key || STORAGE_KEYS.SAVE;
    this.now = opts.now || (() => new Date().toISOString());
    this.migrations = opts.migrations || MIGRATIONS;
    this.version = opts.version || CURRENT_SCHEMA;
  }

  isPersistent() {
    return this.storage.persistent;
  }

  /** @param {any} data */
  envelope(data) {
    const canon = JSON.parse(canonicalJson(data));
    return {
      schemaVersion: this.version,
      gameVersion: GAME_VERSION,
      savedAt: this.now(),
      checksum: fnv1a(canonicalJson(canon)),
      data: canon,
    };
  }

  /**
   * Full snapshot that replaces the previous save (rule I-1).
   * @param {any} progressData
   * @returns {{ ok: boolean, persisted: boolean, error?: string }}
   */
  save(progressData) {
    try {
      const env = this.envelope(progressData);
      const json = JSON.stringify(env);
      const tmpKey = `${this.key}.tmp`;
      if (!this.storage.set(tmpKey, json)) {
        this.storage.set(this.key, json);
        this.storage.remove(tmpKey);
        return { ok: true, persisted: false };
      }
      const back = this.storage.get(tmpKey);
      if (!back || JSON.parse(back).checksum !== env.checksum) {
        throw new Error('Verification of the temporary save failed');
      }
      const persisted = this.storage.set(this.key, json);
      this.storage.remove(tmpKey);
      return { ok: true, persisted };
    } catch (err) {
      this.storage.fail();
      try {
        this.storage.set(this.key, JSON.stringify(this.envelope(progressData)));
      } catch {
        // memory store cannot fail on plain strings; nothing else to do
      }
      return { ok: true, persisted: false, error: String(err && err.message ? err.message : err) };
    }
  }

  /**
   * @returns {{ ok: boolean, save: any|null, recovered?: boolean, quarantined?: boolean }}
   */
  load() {
    let raw = this.storage.get(this.key);
    let recovered = false;
    if (!raw) {
      raw = this.storage.get(`${this.key}.tmp`);
      recovered = !!raw;
    }
    if (!raw) return { ok: true, save: null };
    let env;
    try {
      env = JSON.parse(raw);
    } catch {
      this.quarantine(raw);
      return { ok: true, save: null, quarantined: true };
    }
    if (!env || typeof env !== 'object' || !env.data || !Number.isInteger(env.schemaVersion)) {
      this.quarantine(raw);
      return { ok: true, save: null, quarantined: true };
    }
    if (fnv1a(canonicalJson(env.data)) !== env.checksum) {
      this.quarantine(raw);
      return { ok: true, save: null, quarantined: true };
    }
    try {
      env = migrate(env, this.migrations, this.version);
    } catch {
      this.quarantine(raw);
      return { ok: true, save: null, quarantined: true };
    }
    return { ok: true, save: sanitize(env.data, this.content), recovered };
  }

  hasSave() {
    return this.load().save !== null;
  }

  deleteSave() {
    this.storage.remove(this.key);
    this.storage.remove(`${this.key}.tmp`);
  }

  /** Keeps a copy of a bad save; does nothing if the same copy exists (I-6). */
  quarantine(raw) {
    const k = `${this.key}.corrupt`;
    if (this.storage.get(k) !== raw) this.storage.set(k, raw);
    this.storage.remove(this.key);
    this.storage.remove(`${this.key}.tmp`);
  }
}

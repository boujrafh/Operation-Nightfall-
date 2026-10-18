/** Current save format version. */
export const CURRENT_SCHEMA = 1;

/**
 * One pure function per version step: MIGRATIONS[n] turns v(n) data into
 * v(n+1). v1 is the first format, so the registry is empty for now.
 * @type {Record<number, (data: any) => any>}
 */
export const MIGRATIONS = {};

/**
 * Applies migrations in order. A save already at the current version is
 * returned unchanged (idempotent, rule I-4).
 * @param {{ schemaVersion: number, data: any }} env
 * @param {Record<number, (data: any) => any>} [registry]
 * @param {number} [target]
 */
export function migrate(env, registry = MIGRATIONS, target = CURRENT_SCHEMA) {
  let e = env;
  if (e.schemaVersion > target) {
    throw new Error(`Save is from a newer version (v${e.schemaVersion})`);
  }
  while (e.schemaVersion < target) {
    const step = registry[e.schemaVersion];
    if (!step) throw new Error(`No migration from v${e.schemaVersion}`);
    e = { ...e, data: step(e.data), schemaVersion: e.schemaVersion + 1 };
  }
  return e;
}

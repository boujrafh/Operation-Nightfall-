/**
 * JSON with object keys sorted at every level, so the same data always
 * produces the same string (used for checksums and idempotent saves).
 * @param {any} value
 */
export function canonicalJson(value) {
  return JSON.stringify(sortValue(value));
}

/** @param {any} v */
function sortValue(v) {
  if (Array.isArray(v)) return v.map(sortValue);
  if (v && typeof v === 'object') {
    /** @type {Record<string, any>} */
    const out = {};
    for (const k of Object.keys(v).sort()) {
      if (v[k] !== undefined) out[k] = sortValue(v[k]);
    }
    return out;
  }
  return v;
}

/** Deep clone through canonical JSON. @template T @param {T} v @returns {T} */
export function canonicalClone(v) {
  return JSON.parse(canonicalJson(v));
}

import { TILE } from '../core/config.js';

/**
 * Fires every trigger the player stands in. `once` triggers fire a single
 * time ever (Doc 06 rule I-2); `once: false` triggers fire while inside.
 * @param {any[]} triggers TriggerDef[]
 * @param {{ x: number, y: number }} player
 * @param {{ has: (kind: string, id: string) => boolean, markTrigger: (id: string) => boolean }} progress
 * @param {(t: any) => boolean} [canFire] extra gate (e.g. no codec during ALERT)
 * @returns {any[]} triggers fired this frame
 */
export function checkTriggers(triggers, player, progress, canFire = () => true) {
  const tx = Math.floor(player.x / TILE);
  const ty = Math.floor(player.y / TILE);
  const fired = [];
  for (const t of triggers) {
    if (progress.has('trigger', t.id)) continue;
    const a = t.area;
    if (tx < a.x || ty < a.y || tx >= a.x + a.w || ty >= a.y + a.h) continue;
    if (t.requires && !t.requires.every((r) => progress.has('trigger', r))) continue;
    if (!canFire(t)) continue;
    if (t.once === false) fired.push(t);
    else if (progress.markTrigger(t.id)) fired.push(t);
  }
  return fired;
}

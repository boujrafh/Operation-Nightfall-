/**
 * Inventory helpers. `inv` is the saved inventory object:
 * { items, weapons, ammo, consumables, selectedItem, selectedWeapon }.
 */

/** Cycles NONE -> item 1 -> item 2 -> ... -> NONE. */
export function cycleItem(inv) {
  const list = [null, ...inv.items];
  const i = list.indexOf(inv.selectedItem);
  inv.selectedItem = list[(i + 1) % list.length];
  return inv.selectedItem;
}

/** Cycles through owned weapons (fists are always owned). */
export function cycleWeapon(inv) {
  const list = inv.weapons.length ? inv.weapons : ['fists'];
  const i = list.indexOf(inv.selectedWeapon);
  inv.selectedWeapon = list[(i + 1) % list.length];
  return inv.selectedWeapon;
}

/**
 * Level of the key card currently equipped (0 when none).
 * @param {(id: string) => any} getItem
 */
export function equippedCardLevel(inv, getItem) {
  if (!inv.selectedItem) return 0;
  const def = getItem(inv.selectedItem);
  return def && def.kind === 'card' ? def.cardLevel : 0;
}

/** Highest key card owned (equipped or not). */
export function bestCardLevel(inv, getItem) {
  let best = 0;
  for (const id of inv.items) {
    const def = getItem(id);
    if (def && def.kind === 'card' && def.cardLevel > best) best = def.cardLevel;
  }
  return best;
}

/** Lowest owned card that opens a door of `level` (for hints). */
export function cardForLevel(inv, getItem, level) {
  let pick = null;
  for (const id of inv.items) {
    const def = getItem(id);
    if (def && def.kind === 'card' && def.cardLevel >= level) {
      if (!pick || def.cardLevel < pick.cardLevel) pick = def;
    }
  }
  return pick;
}

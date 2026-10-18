/** Item definitions (Doc 06 §2.1). `short` is the HUD name (max 7 chars). */
export const ITEMS = [
  { id: 'fists', kind: 'weapon', name: 'FIST', short: 'FIST', icon: 'icon_fist' },
  {
    id: 'item_box',
    kind: 'item',
    name: 'CARDBOARD BOX',
    short: 'BOX',
    icon: 'icon_box',
    effect: { hideWhenStill: true },
    codecOnFirstPickup: 'dlg_bix_box',
  },
  {
    id: 'card_1',
    kind: 'card',
    name: 'CARD 1',
    short: 'CARD 1',
    icon: 'icon_card_1',
    cardLevel: 1,
    codecOnFirstPickup: 'dlg_bix_card',
  },
  {
    id: 'item_dogtag',
    kind: 'story',
    name: 'DOG TAG',
    short: 'TAG',
    icon: 'icon_dogtag',
    codecOnFirstPickup: 'dlg_kestrel_tag',
  },
];

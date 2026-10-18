/** NIGHTFALL-16: the fixed MSX2-inspired palette (Doc 05 §2). */
export const PALETTE = [
  '#000000', // 0 Void
  '#1B1B2F', // 1 Night
  '#33335C', // 2 Steel
  '#5468D9', // 3 Signal Blue
  '#6FD3FF', // 4 Cyan
  '#1E5631', // 5 Jungle
  '#3DB54A', // 6 Green
  '#B4E35B', // 7 Lime
  '#6B4428', // 8 Wood
  '#C9914F', // 9 Cardboard
  '#F4DDB0', // 10 Skin
  '#FFD43B', // 11 Yellow
  '#FF8A1F', // 12 Amber
  '#E02B2B', // 13 Red
  '#8E8E9A', // 14 Concrete
  '#FFFFFF', // 15 White
];

export const C = Object.freeze({
  VOID: 0,
  NIGHT: 1,
  STEEL: 2,
  BLUE: 3,
  CYAN: 4,
  JUNGLE: 5,
  GREEN: 6,
  LIME: 7,
  WOOD: 8,
  CARD: 9,
  SKIN: 10,
  YELLOW: 11,
  AMBER: 12,
  RED: 13,
  CONCRETE: 14,
  WHITE: 15,
});

/** @param {number} i */
export const color = (i) => PALETTE[i];

/** @param {number} i @returns {[number, number, number]} */
export function rgb(i) {
  const h = PALETTE[i];
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

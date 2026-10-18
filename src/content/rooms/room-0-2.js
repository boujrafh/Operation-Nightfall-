/** Room 0-2 FENCE LINE: crates, the cardboard box, timing. */
export default {
  id: '0-2',
  chapter: 0,
  name: 'FENCE LINE',
  music: 'trk_infiltration',
  tiles: [
    '################',
    '#..C......F....#',
    '#..C..==..F.CC.#',
    '#.....==..F.CC.#',
    '......==..F.....',
    '......==........',
    '......==..F.....',
    '#..CC.==..F..C.#',
    '#..CC.==..F..C.#',
    '#.........F....#',
    '################',
  ],
  entries: [
    { id: 'west', x: 1, y: 5, facing: 'E' },
    { id: 'east', x: 14, y: 5, facing: 'W' },
  ],
  exits: [
    { id: 'ex_0-2_w', edge: 'W', from: 4, to: 6, targetRoom: '0-1', targetEntry: 'east' },
    { id: 'ex_0-2_e', edge: 'E', from: 4, to: 6, targetRoom: '0-3', targetEntry: 'west' },
  ],
  doors: [],
  cameras: [],
  guards: [
    {
      id: 'g_0-2_a',
      speed: 1,
      loop: 'pingpong',
      armed: false,
      facing: 'S',
      route: [
        { x: 8, y: 1, wait: 1.2, look: 'W' },
        { x: 8, y: 9, wait: 1.2, look: 'W' },
      ],
    },
    {
      id: 'g_0-2_b',
      speed: 0.9,
      loop: 'cycle',
      armed: true,
      facing: 'E',
      route: [
        { x: 11, y: 1, wait: 0.8 },
        { x: 14, y: 1, wait: 0.8 },
        { x: 14, y: 9, wait: 0.8 },
        { x: 11, y: 9, wait: 0.8 },
      ],
    },
  ],
  pickups: [
    { id: 'pk_0-2_box', itemId: 'item_box', qty: 1, x: 1, y: 9 },
    { id: 'pk_0-2_tag', itemId: 'item_dogtag', qty: 1, x: 12, y: 5 },
  ],
  triggers: [],
};

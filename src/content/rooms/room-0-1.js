/** Room 0-1 BEACH: movement, vision cones, hiding in bushes. */
export default {
  id: '0-1',
  chapter: 0,
  name: 'BEACH',
  music: 'trk_infiltration',
  tiles: [
    '################',
    '~~...BB....,,,,#',
    '~~...BB....,,BB#',
    '~~.........,,BB#',
    '~~..............',
    '~~..........B...',
    '~~.....BB.......',
    '~~.....BB...C..#',
    '~~..........C..#',
    '~~...,,,,,.....#',
    '################',
  ],
  entries: [
    { id: 'start', x: 3, y: 4, facing: 'E' },
    { id: 'east', x: 14, y: 5, facing: 'W' },
  ],
  exits: [{ id: 'ex_0-1_e', edge: 'E', from: 4, to: 6, targetRoom: '0-2', targetEntry: 'west' }],
  doors: [],
  cameras: [],
  guards: [
    {
      id: 'g_0-1_a',
      speed: 1,
      loop: 'pingpong',
      armed: false,
      facing: 'S',
      route: [
        { x: 9, y: 2, wait: 1.5, look: 'W' },
        { x: 9, y: 8, wait: 1.5, look: 'W' },
      ],
    },
    {
      id: 'g_0-1_b',
      speed: 0.8,
      loop: 'pingpong',
      armed: false,
      facing: 'N',
      route: [
        { x: 14, y: 8, wait: 2, look: 'W' },
        { x: 14, y: 2, wait: 2, look: 'W' },
      ],
    },
  ],
  pickups: [],
  triggers: [
    {
      id: 'tr_0-1_brief',
      type: 'codec',
      area: { x: 2, y: 1, w: 3, h: 9 },
      dialogueId: 'dlg_hale_bushes',
      once: true,
    },
    {
      id: 'tr_0-1_cones',
      type: 'codec',
      area: { x: 5, y: 1, w: 2, h: 9 },
      dialogueId: 'dlg_bix_cones',
      once: true,
      requires: ['tr_0-1_brief'],
    },
  ],
};

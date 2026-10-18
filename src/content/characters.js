/** Codec characters met in Chapter 0. `voice` is the typing blip pitch. */
export const CHARACTERS = [
  { id: 'wren', name: 'WREN', freq: '140.00', portrait: 'wren', voice: 520, callable: false },
  { id: 'hale', name: 'HALE', freq: '140.85', portrait: 'hale', voice: 330, callable: true },
  { id: 'bix', name: 'BIX', freq: '141.12', portrait: 'bix', voice: 740, callable: true },
  { id: 'sato', name: 'DR. SATO', freq: '140.96', portrait: 'sato', voice: 620, callable: true },
  {
    id: 'lark',
    name: 'LARK',
    freq: '???.??',
    portrait: 'lark',
    voice: 400,
    callable: true,
    requires: 'tr_0-3_lark',
  },
];

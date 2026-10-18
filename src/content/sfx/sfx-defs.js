/**
 * Sound effects. Each part is a tone (`wave`, `freq`, optional `slideTo`,
 * or a `seq` of frequencies) or a filtered `noise` burst. `delay` offsets
 * a part; `duck` briefly lowers the music.
 */
export const SFX = [
  {
    id: 'sfx_alert',
    duck: true,
    parts: [
      { wave: 'square50', seq: [880, 1320], dur: 0.035, vol: 0.2 },
      { wave: 'square50', freq: 1760, dur: 0.2, vol: 0.22, delay: 0.07, decay: true },
      { wave: 'square25', freq: 2640, dur: 0.15, vol: 0.08, delay: 0.07, decay: true },
    ],
  },
  {
    id: 'sfx_suspect',
    parts: [{ wave: 'square25', seq: [660, 990], dur: 0.09, gap: 0.02, vol: 0.12 }],
  },
  {
    id: 'sfx_step_soft',
    parts: [{ type: 'noise', dur: 0.04, vol: 0.05, filter: 'lowpass', freq: 900 }],
  },
  {
    id: 'sfx_step_normal',
    parts: [{ type: 'noise', dur: 0.035, vol: 0.07, filter: 'bandpass', freq: 2200 }],
  },
  {
    id: 'sfx_step_loud',
    parts: [
      { type: 'noise', dur: 0.05, vol: 0.14, filter: 'bandpass', freq: 4200 },
      { wave: 'square12', freq: 3000, dur: 0.02, vol: 0.03 },
    ],
  },
  {
    id: 'sfx_step_rustle',
    parts: [{ type: 'noise', dur: 0.08, vol: 0.06, filter: 'highpass', freq: 3000 }],
  },
  {
    id: 'sfx_punch',
    parts: [
      { type: 'noise', dur: 0.06, vol: 0.25, filter: 'lowpass', freq: 1200 },
      { wave: 'square50', freq: 220, slideTo: 80, dur: 0.06, vol: 0.12 },
    ],
  },
  {
    id: 'sfx_takedown',
    duck: true,
    parts: [
      { type: 'noise', dur: 0.2, vol: 0.35, filter: 'lowpass', freq: 600 },
      { wave: 'square50', freq: 160, slideTo: 50, dur: 0.18, vol: 0.2 },
    ],
  },
  {
    id: 'sfx_hit',
    parts: [
      { wave: 'square50', freq: 400, slideTo: 120, dur: 0.15, vol: 0.18 },
      { type: 'noise', dur: 0.08, vol: 0.15, filter: 'lowpass', freq: 2000 },
    ],
  },
  {
    id: 'sfx_shot',
    parts: [{ type: 'noise', dur: 0.15, vol: 0.25, filter: 'lowpass', freq: 3000, freqEnd: 300 }],
  },
  {
    id: 'sfx_bullet_wall',
    parts: [{ type: 'noise', dur: 0.03, vol: 0.05, filter: 'highpass', freq: 3000 }],
  },
  {
    id: 'sfx_door',
    parts: [
      { wave: 'square25', freq: 200, slideTo: 400, dur: 0.18, vol: 0.1 },
      { type: 'noise', dur: 0.18, vol: 0.04, filter: 'highpass', freq: 2500 },
    ],
  },
  {
    id: 'sfx_denied',
    parts: [{ wave: 'square50', seq: [110, 110], dur: 0.1, gap: 0.05, vol: 0.14 }],
  },
  {
    id: 'sfx_pickup',
    parts: [{ wave: 'square25', seq: [1047, 1319, 1568, 2093], dur: 0.05, vol: 0.11 }],
  },
  {
    id: 'sfx_codec_ring',
    parts: [{ wave: 'square50', seq: [1200, 900, 1200, 900], dur: 0.06, gap: 0.03, vol: 0.1 }],
  },
  {
    id: 'sfx_klaxon',
    parts: [
      { wave: 'square50', freq: 600, slideTo: 900, dur: 0.35, vol: 0.06 },
      { wave: 'square50', freq: 900, slideTo: 600, dur: 0.35, vol: 0.06, delay: 0.35 },
    ],
  },
  {
    id: 'sfx_evasion_end',
    parts: [{ wave: 'square12', freq: 880, slideTo: 440, dur: 0.5, vol: 0.08 }],
  },
  {
    id: 'sfx_heartbeat',
    parts: [
      { wave: 'square50', freq: 70, dur: 0.06, vol: 0.2 },
      { wave: 'square50', freq: 70, dur: 0.06, vol: 0.15, delay: 0.15 },
    ],
  },
  {
    id: 'sfx_blip',
    parts: [{ wave: 'square25', freq: 600, useParam: true, dur: 0.02, vol: 0.04 }],
  },
  { id: 'sfx_menu_move', parts: [{ wave: 'square25', freq: 1000, dur: 0.03, vol: 0.06 }] },
  { id: 'sfx_menu_select', parts: [{ wave: 'square25', seq: [800, 1200], dur: 0.04, vol: 0.08 }] },
  { id: 'sfx_menu_back', parts: [{ wave: 'square25', seq: [600, 400], dur: 0.04, vol: 0.07 }] },
  { id: 'sfx_box', parts: [{ type: 'noise', dur: 0.1, vol: 0.1, filter: 'bandpass', freq: 600 }] },
  { id: 'sfx_death', parts: [{ wave: 'square50', freq: 440, slideTo: 55, dur: 1, vol: 0.18 }] },
  {
    id: 'sfx_start',
    duck: true,
    parts: [{ wave: 'square25', seq: [523, 659, 784, 1047], dur: 0.06, vol: 0.12 }],
  },
];

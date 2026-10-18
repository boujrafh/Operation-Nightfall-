/**
 * Plays a sound-effect definition (see content/sfx/sfx-defs.js).
 * @param {import('./psg.js').Voices} voices
 * @param {AudioNode} dest
 * @param {any} def
 * @param {number} t0
 * @param {{ freq?: number }} [opts]
 */
export function playSfxDef(voices, dest, def, t0, opts = {}) {
  for (const part of def.parts) {
    const start = t0 + (part.delay || 0);
    if (part.type === 'noise') {
      voices.noiseBurst(dest, {
        start,
        dur: part.dur,
        vol: part.vol,
        filter: part.filter,
        freq: part.freq,
        freqEnd: part.freqEnd,
      });
    } else if (part.seq) {
      let t = start;
      for (const f of part.seq) {
        voices.tone(dest, {
          wave: part.wave,
          freq: f,
          start: t,
          dur: part.dur,
          vol: part.vol,
          decay: !!part.decay,
        });
        t += part.dur + (part.gap || 0);
      }
    } else {
      voices.tone(dest, {
        wave: part.wave,
        freq: part.useParam && opts.freq ? opts.freq : part.freq,
        slideTo: part.slideTo,
        start,
        dur: part.dur,
        vol: part.vol,
        decay: !!part.decay,
      });
    }
  }
}

/**
 * MSX-style sound voices built on Web Audio: pulse waves (12.5/25/50%),
 * an SCC-like wavetable and a noise channel.
 */

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/**
 * 'A4' -> 440, 'C#5' -> 554.37. Returns 0 for invalid names.
 * @param {string} name
 */
export function noteToFreq(name) {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!m) return 0;
  let n = NOTE_INDEX[m[1]];
  if (m[2] === '#') n += 1;
  if (m[2] === 'b') n -= 1;
  const midi = (Number(m[3]) + 1) * 12 + n;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Fourier series of a pulse wave with the given duty cycle. */
export function pulseCoefficients(duty, harmonics = 48) {
  const real = new Float32Array(harmonics);
  const imag = new Float32Array(harmonics);
  for (let k = 1; k < harmonics; k++) {
    real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
  }
  return { real, imag };
}

/** DFT of a single-cycle table (values in [-1, 1]). @param {number[]} table */
export function tableCoefficients(table) {
  const n = table.length;
  const h = Math.floor(n / 2);
  const real = new Float32Array(h);
  const imag = new Float32Array(h);
  for (let k = 1; k < h; k++) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * k * i) / n;
      re += table[i] * Math.cos(a);
      im += table[i] * Math.sin(a);
    }
    real[k] = (2 * re) / n;
    imag[k] = (2 * im) / n;
  }
  return { real, imag };
}

/** 32-step SCC-style tables. */
const SCC_TABLES = {
  scc_soft: Array.from(
    { length: 32 },
    (_, i) => Math.sin((i / 32) * Math.PI * 2) * 0.8 + Math.sin((i / 32) * Math.PI * 6) * 0.2,
  ),
  scc_lead: Array.from({ length: 32 }, (_, i) => (i < 8 ? 1 : i < 16 ? 0.4 : i < 24 ? -0.6 : -1)),
};

export class Voices {
  /** @param {AudioContext} ctx */
  constructor(ctx) {
    this.ctx = ctx;
    /** @type {Record<string, PeriodicWave>} */
    this.waves = {};
    for (const [name, duty] of [
      ['square12', 0.125],
      ['square25', 0.25],
      ['square50', 0.5],
    ]) {
      const { real, imag } = pulseCoefficients(/** @type {number} */ (duty));
      this.waves[name] = ctx.createPeriodicWave(real, imag);
    }
    for (const [name, table] of Object.entries(SCC_TABLES)) {
      const { real, imag } = tableCoefficients(table);
      this.waves[name] = ctx.createPeriodicWave(real, imag);
    }
    const len = ctx.sampleRate;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    let seed = 1;
    for (let i = 0; i < len; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (seed / 0x7fffffff) * 2 - 1;
    }
  }

  /**
   * Schedules one tone.
   * @param {AudioNode} dest
   * @param {{ wave: string, freq: number, start: number, dur: number, vol: number,
   *   slideTo?: number, decay?: boolean }} o
   */
  tone(dest, o) {
    const { ctx } = this;
    const osc = ctx.createOscillator();
    const wave = this.waves[o.wave] || this.waves.square50;
    osc.setPeriodicWave(wave);
    osc.frequency.setValueAtTime(o.freq, o.start);
    if (o.slideTo)
      osc.frequency.exponentialRampToValueAtTime(Math.max(o.slideTo, 20), o.start + o.dur);
    const g = ctx.createGain();
    const end = o.start + o.dur;
    g.gain.setValueAtTime(0, o.start);
    g.gain.linearRampToValueAtTime(o.vol, o.start + 0.004);
    if (o.decay) g.gain.exponentialRampToValueAtTime(Math.max(o.vol * 0.05, 0.0001), end);
    else {
      g.gain.setValueAtTime(o.vol, Math.max(o.start + 0.004, end - 0.02));
      g.gain.linearRampToValueAtTime(0, end);
    }
    osc.connect(g).connect(dest);
    osc.start(o.start);
    osc.stop(end + 0.02);
    osc.onended = () => g.disconnect();
  }

  /**
   * Schedules a burst of filtered noise.
   * @param {AudioNode} dest
   * @param {{ start: number, dur: number, vol: number, filter?: BiquadFilterType,
   *   freq?: number, freqEnd?: number }} o
   */
  noiseBurst(dest, o) {
    const { ctx } = this;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'lowpass';
    f.frequency.setValueAtTime(o.freq || 4000, o.start);
    if (o.freqEnd)
      f.frequency.exponentialRampToValueAtTime(Math.max(o.freqEnd, 30), o.start + o.dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(o.vol, o.start);
    g.gain.exponentialRampToValueAtTime(Math.max(o.vol * 0.01, 0.0001), o.start + o.dur);
    src.connect(f).connect(g).connect(dest);
    const offset = Math.random() * 0.5;
    src.start(o.start, offset, o.dur + 0.02);
    src.onended = () => g.disconnect();
  }
}

/** Drum kit for noise channels. */
export const DRUMS = {
  k: (v, dest, t, vol) => {
    v.tone(dest, {
      wave: 'square50',
      freq: 150,
      slideTo: 40,
      start: t,
      dur: 0.12,
      vol: vol * 0.9,
      decay: true,
    });
    v.noiseBurst(dest, { start: t, dur: 0.06, vol: vol * 0.5, filter: 'lowpass', freq: 300 });
  },
  s: (v, dest, t, vol) => {
    v.noiseBurst(dest, { start: t, dur: 0.12, vol, filter: 'bandpass', freq: 1800 });
    v.tone(dest, {
      wave: 'square50',
      freq: 190,
      slideTo: 120,
      start: t,
      dur: 0.05,
      vol: vol * 0.4,
      decay: true,
    });
  },
  h: (v, dest, t, vol) => {
    v.noiseBurst(dest, { start: t, dur: 0.03, vol: vol * 0.6, filter: 'highpass', freq: 7000 });
  },
  H: (v, dest, t, vol) => {
    v.noiseBurst(dest, { start: t, dur: 0.12, vol: vol * 0.6, filter: 'highpass', freq: 6000 });
  },
};

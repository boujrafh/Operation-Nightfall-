import { noteToFreq, DRUMS } from './psg.js';

/**
 * Expands `( ... )*N` groups, innermost first.
 * @param {string} src
 */
export function expandRepeats(src) {
  let s = src;
  const re = /\(([^()]*)\)\*(\d+)/;
  let m;
  while ((m = re.exec(s))) {
    const body = ` ${m[1].trim()} `;
    s = s.slice(0, m.index) + body.repeat(Number(m[2])) + s.slice(m.index + m[0].length);
  }
  return s;
}

/**
 * Parses a channel pattern: tokens `NOTE[:len]`, `r[:len]` (rest) or drum
 * letters `k s h H`. Length is in 16th-note steps (default 1). `|` is ignored.
 * @param {string} src
 * @returns {{ events: { kind: 'note'|'drum'|'rest', value: string, freq: number, len: number }[], steps: number }}
 */
export function parsePattern(src) {
  const tokens = expandRepeats(src)
    .split(/\s+/)
    .filter((t) => t && t !== '|');
  /** @type {{ kind: 'note'|'drum'|'rest', value: string, freq: number, len: number }[]} */
  const events = [];
  let steps = 0;
  for (const tok of tokens) {
    const [head, lenStr] = tok.split(':');
    const len = lenStr ? Number(lenStr) : 1;
    if (!Number.isFinite(len) || len <= 0) throw new Error(`Bad length in token "${tok}"`);
    if (head === 'r') events.push({ kind: 'rest', value: 'r', freq: 0, len });
    else if (head in DRUMS) events.push({ kind: 'drum', value: head, freq: 0, len });
    else {
      const freq = noteToFreq(head);
      if (!freq) throw new Error(`Bad note "${head}"`);
      events.push({ kind: 'note', value: head, freq, len });
    }
    steps += len;
  }
  return { events, steps };
}

/**
 * Plays one track. Each channel loops on its own length, so short
 * ostinatos can run under long melodies.
 */
export class Sequencer {
  /**
   * @param {import('./psg.js').Voices} voices
   * @param {any} track TrackDef
   * @param {AudioNode} dest
   * @param {() => void} [onEnd]
   */
  constructor(voices, track, dest, onEnd) {
    this.voices = voices;
    this.track = track;
    this.dest = dest;
    this.onEnd = onEnd;
    this.stepDur = 60 / track.bpm / 4;
    this.channels = track.channels.map((ch) => ({
      ...ch,
      parsed: parsePattern(ch.pattern),
      idx: 0,
      next: 0,
      done: false,
    }));
    this.running = false;
    this.ended = false;
  }

  /** @param {number} when AudioContext time */
  start(when) {
    this.running = true;
    for (const ch of this.channels) {
      ch.idx = 0;
      ch.next = when;
      ch.done = ch.parsed.events.length === 0;
    }
  }

  stop() {
    this.running = false;
  }

  /** Schedules everything up to `until` (AudioContext time). */
  schedule(until) {
    if (!this.running) return;
    let allDone = true;
    for (const ch of this.channels) {
      while (!ch.done && ch.next < until) {
        const ev = ch.parsed.events[ch.idx];
        const dur = ev.len * this.stepDur;
        if (ev.kind === 'note') {
          this.voices.tone(this.dest, {
            wave: ch.wave,
            freq: ev.freq,
            start: ch.next,
            dur: dur * (ch.gate || 0.9),
            vol: ch.vol,
            decay: !!ch.decay,
          });
        } else if (ev.kind === 'drum') {
          DRUMS[ev.value](this.voices, this.dest, ch.next, ch.vol);
        }
        ch.next += dur;
        ch.idx++;
        if (ch.idx >= ch.parsed.events.length) {
          if (this.track.loop) ch.idx = 0;
          else ch.done = true;
        }
      }
      if (!ch.done) allDone = false;
    }
    if (allDone && !this.ended) {
      this.ended = true;
      this.running = false;
      if (this.onEnd) this.onEnd();
    }
  }
}

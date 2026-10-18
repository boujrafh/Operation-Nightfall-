import { Voices } from './psg.js';
import { Sequencer } from './sequencer.js';
import { playSfxDef } from './sfx.js';

const LOOKAHEAD = 0.12;
const TICK_MS = 25;
const ALARM_PERIOD = 2.4;

/** @param {number} level 0..10 */
const volumeToGain = (level) => Math.pow(Math.max(0, Math.min(10, level)) / 10, 2);

/**
 * Owns the AudioContext, mixer, music crossfades and sound effects.
 * Every call is a safe no-op until `unlock()` runs inside a user gesture.
 */
export class AudioService {
  /**
   * @param {{ getTrack: (id: string) => any, getSfx: (id: string) => any }} content
   */
  constructor(content) {
    this.content = content;
    /** @type {AudioContext|null} */
    this.ctx = null;
    this.voices = null;
    this.timer = 0;
    /** @type {{ id: string, seq: Sequencer, gain: GainNode }|null} */
    this.current = null;
    /** @type {{ seq: Sequencer, gain: GainNode, until: number }[]} */
    this.fading = [];
    this.volumes = { music: 7, sfx: 8, muted: false };
    this.alarmOn = false;
    this.nextAlarm = 0;
    this.muffled = false;
    this.pendingMusic = null;
  }

  get unlocked() {
    return !!this.ctx;
  }

  /** Must be called from a user gesture (key press, tap). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    this.ctx = ctx;
    this.voices = new Voices(ctx);
    this.master = ctx.createGain();
    this.master.connect(ctx.destination);
    // music: tracks -> musicBus (volume) -> lowpass (muffle) -> duck -> master
    this.musicBus = ctx.createGain();
    this.musicFilter = ctx.createBiquadFilter();
    this.musicFilter.type = 'lowpass';
    this.musicFilter.frequency.value = 20000;
    this.duck = ctx.createGain();
    this.musicBus.connect(this.musicFilter);
    this.musicFilter.connect(this.duck);
    this.duck.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.connect(this.master);
    this.applyVolumes();
    if (ctx.state === 'suspended') ctx.resume();
    this.timer = window.setInterval(() => this.tick(), TICK_MS);
    if (this.pendingMusic) {
      const { id, fadeMs } = this.pendingMusic;
      this.pendingMusic = null;
      this.playMusic(id, { fadeMs });
    }
  }

  /** @param {{ musicVol?: number, sfxVol?: number, muted?: boolean }} s */
  setVolumes(s) {
    if (s.musicVol !== undefined) this.volumes.music = s.musicVol;
    if (s.sfxVol !== undefined) this.volumes.sfx = s.sfxVol;
    if (s.muted !== undefined) this.volumes.muted = s.muted;
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.volumes.muted ? 0 : 1, t, 0.02);
    this.musicBus.gain.setTargetAtTime(volumeToGain(this.volumes.music), t, 0.02);
    this.sfxBus.gain.setTargetAtTime(volumeToGain(this.volumes.sfx), t, 0.02);
  }

  /** Muffles the music (codec, pause). @param {boolean} on */
  setMuffled(on) {
    this.muffled = on;
    if (!this.ctx) return;
    this.musicFilter.frequency.setTargetAtTime(on ? 700 : 20000, this.ctx.currentTime, 0.05);
  }

  /**
   * Crossfades to a track. Playing the current track again does nothing.
   * @param {string} id @param {{ fadeMs?: number, onEnd?: () => void }} [opts]
   */
  playMusic(id, opts = {}) {
    const fadeMs = opts.fadeMs ?? 300;
    if (!this.ctx) {
      this.pendingMusic = { id, fadeMs };
      return;
    }
    if (this.current && this.current.id === id && this.current.seq.running) return;
    const track = this.content.getTrack(id);
    const t = this.ctx.currentTime;
    this.fadeOutCurrent(fadeMs);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(1, t + Math.max(fadeMs, 10) / 1000);
    gain.connect(this.musicBus);
    const seq = new Sequencer(this.voices, track, gain, opts.onEnd);
    seq.start(t + 0.05);
    this.current = { id, seq, gain };
    seq.schedule(t + LOOKAHEAD);
  }

  /** @param {number} [fadeMs] */
  stopMusic(fadeMs = 300) {
    this.pendingMusic = null;
    if (!this.ctx) return;
    this.fadeOutCurrent(fadeMs);
  }

  fadeOutCurrent(fadeMs) {
    if (!this.current) return;
    const t = this.ctx.currentTime;
    const { seq, gain } = this.current;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + Math.max(fadeMs, 10) / 1000);
    this.fading.push({ seq, gain, until: t + Math.max(fadeMs, 10) / 1000 + 0.3 });
    this.current = null;
  }

  get currentMusic() {
    return this.current ? this.current.id : null;
  }

  /** @param {string} id @param {{ freq?: number }} [opts] */
  playSfx(id, opts) {
    if (!this.ctx) return;
    const def = this.content.getSfx(id);
    const t = this.ctx.currentTime + 0.005;
    playSfxDef(this.voices, this.sfxBus, def, t, opts);
    if (def.duck) {
      const g = this.duck.gain;
      g.cancelScheduledValues(t);
      g.setValueAtTime(0.35, t);
      g.linearRampToValueAtTime(1, t + 0.45);
    }
  }

  /** Looping klaxon during ALERT. @param {boolean} on */
  setAlarm(on) {
    if (on && !this.alarmOn && this.ctx) this.nextAlarm = this.ctx.currentTime + 0.4;
    this.alarmOn = on;
  }

  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const until = now + LOOKAHEAD;
    if (this.current) this.current.seq.schedule(until);
    this.fading = this.fading.filter((f) => {
      if (now > f.until) {
        f.seq.stop();
        f.gain.disconnect();
        return false;
      }
      f.seq.schedule(until);
      return true;
    });
    if (this.alarmOn && now >= this.nextAlarm) {
      this.playSfx('sfx_klaxon');
      this.nextAlarm = now + ALARM_PERIOD;
    }
  }
}

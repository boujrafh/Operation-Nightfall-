import { Scene } from '../core/scene-manager.js';
import { C } from '../render/palette.js';
import { WIDTH, HEIGHT } from '../core/config.js';

/**
 * Letter rank from the chapter stats.
 * @param {{ alerts: number, continues: number, takedowns: number, playTimeMs: number }} s
 */
export function computeRank(s) {
  const minutes = s.playTimeMs / 60000;
  let score = 100;
  score -= s.alerts * 12;
  score -= s.continues * 20;
  score -= Math.max(0, minutes - 5) * 3;
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 55) return 'C';
  if (score >= 35) return 'D';
  return 'E';
}

/** @param {number} ms */
export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Chapter results, then "to be continued". */
export class ChapterEndScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'chapterend';
  }

  enter(params) {
    this.stats = params.stats;
    this.rank = computeRank(this.stats);
    this.t = 0;
    this.page = 0;
  }

  update(dt) {
    this.t += dt;
    if (this.t < 1 || !this.game.input.justConfirmed()) return;
    this.game.audio.playSfx('sfx_menu_select');
    if (this.page === 0) {
      this.page = 1;
      this.t = 0;
      this.game.audio.playMusic('trk_title', { fadeMs: 600 });
    } else this.game.scenes.replaceAll(this.game.create('title'));
  }

  render(r) {
    r.clear(C.VOID);
    if (this.page === 1) {
      r.text('WREN SLIPS INTO BUILDING A...', WIDTH / 2, 80, C.WHITE, { align: 'center' });
      r.text('TO BE CONTINUED', WIDTH / 2, 104, C.YELLOW, { align: 'center', scale: 2 });
      r.text('CHAPTER 1: OUTER WALL', WIDTH / 2, 130, C.CONCRETE, { align: 'center' });
      return;
    }
    r.panel(24, 20, WIDTH - 48, HEIGHT - 40, C.NIGHT, C.YELLOW);
    r.text('CHAPTER 0 COMPLETE', WIDTH / 2, 32, C.YELLOW, { align: 'center' });
    const rows = [
      ['TIME', formatTime(this.stats.playTimeMs)],
      ['ALERTS', String(this.stats.alerts)],
      ['TAKEDOWNS', String(this.stats.takedowns)],
      ['CONTINUES', String(this.stats.continues)],
    ];
    rows.forEach(([k, v], i) => {
      if (this.t < 0.3 + i * 0.25) return;
      r.text(k, 48, 60 + i * 16, C.WHITE);
      r.text(v, WIDTH - 48, 60 + i * 16, C.CYAN, { align: 'right' });
    });
    if (this.t > 1.4) {
      r.text('RANK', 48, 140, C.WHITE);
      r.text(this.rank, WIDTH - 48, 134, this.rank === 'A' ? C.YELLOW : C.WHITE, {
        align: 'right',
        scale: 3,
      });
    }
    if (this.t > 1 && Math.floor(r.time * 2) % 2 === 0)
      r.text('▶ CONTINUE', WIDTH / 2, HEIGHT - 34, C.STEEL, { align: 'center' });
  }
}

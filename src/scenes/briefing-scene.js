import { Scene } from '../core/scene-manager.js';
import { C } from '../render/palette.js';
import { WIDTH, HEIGHT } from '../core/config.js';

/** Mission card, then the briefing call, then the game. */
export class BriefingScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'briefing';
  }

  enter(params) {
    this.chapter = params.chapter;
    this.t = 0;
    this.called = false;
    this.game.audio.playMusic('trk_codec', { fadeMs: 400 });
  }

  resume() {
    this.game.scenes.replaceAll(this.game.create('play'));
  }

  update(dt) {
    this.t += dt;
    if (this.called) return;
    if (this.t > 2.5 || (this.t > 0.4 && this.game.input.justConfirmed())) {
      this.called = true;
      this.game.audio.playSfx('sfx_codec_ring');
      this.game.scenes.push(this.game.create('codec'), {
        dialogueId: this.chapter.briefingDialogue,
        skippable: true,
      });
    }
  }

  render(r) {
    r.clear(C.VOID);
    const reveal = Math.min(1, this.t / 0.6);
    r.frame(28, 60, WIDTH - 56, 80, reveal >= 1 ? C.RED : C.STEEL);
    r.text('OPERATION NIGHTFALL', WIDTH / 2, 76, C.WHITE, { align: 'center' });
    r.text(`CHAPTER ${this.chapter.id}`, WIDTH / 2, 96, C.CONCRETE, { align: 'center' });
    r.text(this.chapter.title, WIDTH / 2, 110, C.YELLOW, { align: 'center', scale: 2 });
    if (Math.floor(r.time * 2) % 2 === 0)
      r.text('INCOMING CALL', WIDTH / 2, HEIGHT - 30, C.CYAN, { align: 'center' });
  }
}

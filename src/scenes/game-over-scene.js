import { Scene } from '../core/scene-manager.js';
import { C } from '../render/palette.js';
import { WIDTH, HEIGHT } from '../core/config.js';
import { Menu } from '../ui/menu.js';

/** GAME OVER: continue from the room entry, or back to the title. */
export class GameOverScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'gameover';
  }

  enter() {
    this.t = 0;
    this.menu = new Menu([
      { id: 'continue', label: 'CONTINUE' },
      { id: 'title', label: 'TITLE' },
    ]);
    this.game.audio.playMusic('trk_gameover', { fadeMs: 10 });
  }

  update(dt) {
    this.t += dt;
    if (this.t < 1.2) return;
    const res = this.menu.update(this.game.input, this.game.audio);
    if (!res || res.type !== 'select') return;
    if (res.id === 'continue') this.game.scenes.pop({ continue: true });
    else this.game.scenes.replaceAll(this.game.create('title'));
  }

  render(r) {
    const fill = Math.min(1, this.t / 0.8);
    r.clear(C.VOID);
    r.rect(0, 0, WIDTH, Math.round(HEIGHT * fill), C.RED);
    r.dither(0, 0, WIDTH, Math.round(HEIGHT * fill), C.VOID, 50);
    if (this.t > 0.6)
      r.text('GAME OVER', WIDTH / 2, 70, C.WHITE, { align: 'center', scale: 3, shadow: C.VOID });
    if (this.t >= 1.2) {
      r.panel(80, 120, 96, 40, C.VOID, C.RED);
      this.menu.draw(r, 104, 128, { spacing: 14 });
    }
  }
}

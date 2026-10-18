import { Scene } from '../core/scene-manager.js';
import { C } from '../render/palette.js';
import { WIDTH, HEIGHT } from '../core/config.js';

/** "PRESS START": the first key or tap also unlocks audio. */
export class PressStartScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'pressstart';
  }

  update() {
    const input = this.game.input;
    if (input.anyPressed) {
      this.game.audio.unlock();
      this.game.audio.playSfx('sfx_start');
      this.game.scenes.replaceAll(this.game.create('title'));
    }
  }

  render(r) {
    r.clear(C.VOID);
    if (Math.floor(r.time * 2) % 2 === 0)
      r.text('PRESS START', WIDTH / 2, HEIGHT / 2 - 4, C.WHITE, { align: 'center' });
    r.text('KEY, BUTTON OR TAP', WIDTH / 2, HEIGHT / 2 + 12, C.STEEL, { align: 'center' });
    r.text('© 2026', WIDTH / 2, HEIGHT - 16, C.CONCRETE, { align: 'center' });
  }
}

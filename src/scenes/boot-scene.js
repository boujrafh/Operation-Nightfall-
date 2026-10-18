import { Scene } from '../core/scene-manager.js';
import { C } from '../render/palette.js';

/** First scene: draws a frame while the game finishes starting up. */
export class BootScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'boot';
    this.frames = 0;
  }

  update() {
    this.frames++;
    if (this.frames > 2) this.game.scenes.replaceAll(this.game.create('pressstart'));
  }

  render(r) {
    r.clear(C.VOID);
  }
}

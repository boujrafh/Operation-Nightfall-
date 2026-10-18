import { Scene } from '../core/scene-manager.js';
import { C } from '../render/palette.js';
import { WIDTH, HEIGHT } from '../core/config.js';
import { Menu } from '../ui/menu.js';
import { newProgress, ProgressStore } from '../state/progress-store.js';

/** Title screen with searchlight, moon and the main menu. */
export class TitleScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'title';
    this.confirm = null;
  }

  enter() {
    this.loaded = this.game.save.load();
    this.buildMenu();
    this.game.audio.playMusic('trk_title', { fadeMs: 500 });
    this.game.renderer.fx.setFade(0);
  }

  resume() {
    this.loaded = this.game.save.load();
    this.buildMenu();
  }

  buildMenu() {
    const items = [
      { id: 'new', label: 'NEW GAME' },
      { id: 'continue', label: 'CONTINUE', disabled: !this.loaded.save },
      { id: 'options', label: 'OPTIONS' },
    ];
    if (this.game.install.available) items.push({ id: 'install', label: 'INSTALL' });
    this.menu = new Menu(items);
    if (this.loaded.save) this.menu.select('continue');
  }

  startNew() {
    const chapter = this.game.registry.getChapter(0);
    this.game.progress = new ProgressStore(newProgress(chapter));
    this.game.scenes.replaceAll(this.game.create('briefing'), { chapter });
  }

  update() {
    const { input, audio } = this.game;
    if (this.confirm) {
      const res = this.confirm.update(input, audio);
      if (res && res.type === 'select') {
        if (res.id === 'yes') this.startNew();
        else this.confirm = null;
      } else if (input.justPressed('pause')) this.confirm = null;
      return;
    }
    const res = this.menu.update(input, audio);
    if (!res || res.type !== 'select') return;
    if (res.id === 'new') {
      if (this.loaded.save)
        this.confirm = new Menu([
          { id: 'no', label: 'NO' },
          { id: 'yes', label: 'YES' },
        ]);
      else this.startNew();
    } else if (res.id === 'continue' && this.loaded.save) {
      this.game.progress = new ProgressStore(this.loaded.save);
      this.game.scenes.replaceAll(this.game.create('play'));
    } else if (res.id === 'options') {
      this.game.scenes.push(this.game.create('options'));
    } else if (res.id === 'install') {
      this.game.install.prompt().then(() => this.buildMenu());
    }
  }

  render(r) {
    r.clear(C.VOID);
    const t = r.time;
    // stars and moon
    for (let i = 0; i < 40; i++) {
      const x = (i * 97) % WIDTH;
      const y = (i * 53) % 90;
      if ((i + Math.floor(t * 2)) % 7 !== 0) r.rect(x, y, 1, 1, i % 3 ? C.STEEL : C.WHITE);
    }
    drawDisc(r, 214, 26, 10, C.YELLOW);
    drawDisc(r, 219, 22, 9, C.VOID);
    // searchlight beam
    const a = -Math.PI / 2 + Math.sin(t * 0.7) * 0.8;
    const ox = 60;
    const oy = 150;
    const len = 190;
    r.ditherPolygon(
      [
        { x: ox, y: oy },
        { x: ox + Math.cos(a - 0.12) * len, y: oy + Math.sin(a - 0.12) * len },
        { x: ox + Math.cos(a + 0.12) * len, y: oy + Math.sin(a + 0.12) * len },
      ],
      C.YELLOW,
      25,
    );
    // base silhouette
    r.rect(0, 150, WIDTH, HEIGHT - 150, C.NIGHT);
    r.rect(20, 120, 60, 30, C.NIGHT);
    r.rect(56, 100, 8, 50, C.NIGHT);
    r.rect(150, 110, 80, 40, C.NIGHT);
    r.rect(180, 96, 14, 14, C.NIGHT);
    for (let i = 0; i < 6; i++)
      if ((i + Math.floor(t)) % 3) r.rect(160 + i * 11, 120, 4, 3, C.AMBER);
    r.rect(58, 98, 4, 3, C.RED);
    // logo
    r.text('OPERATION', WIDTH / 2, 30, C.WHITE, { align: 'center', scale: 2, shadow: C.VOID });
    r.text('NIGHTFALL', WIDTH / 2, 52, C.YELLOW, { align: 'center', scale: 3, shadow: C.VOID });
    r.rect(40, 79, WIDTH - 80, 2, C.RED);
    if (this.confirm) {
      r.panel(60, 150, 136, 50, C.NIGHT, C.RED);
      r.text('OVERWRITE SAVE?', WIDTH / 2, 156, C.WHITE, { align: 'center' });
      this.confirm.draw(r, 110, 172, { spacing: 12 });
    } else {
      r.panel(76, 140, 104, 12 + this.menu.items.length * 13, C.VOID, C.STEEL);
      this.menu.draw(r, 96, 146, { spacing: 13 });
    }
    r.text('V0.1.0', WIDTH - 4, HEIGHT - 10, C.STEEL, { align: 'right' });
  }
}

/** Filled circle made of 1px rows (keeps the pixel look). */
function drawDisc(r, cx, cy, radius, colorIdx) {
  for (let y = -radius; y <= radius; y++) {
    const hw = Math.round(Math.sqrt(radius * radius - y * y));
    r.rect(cx - hw, cy + y, hw * 2, 1, colorIdx);
  }
}

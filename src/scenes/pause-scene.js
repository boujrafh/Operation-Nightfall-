import { Scene } from '../core/scene-manager.js';
import { C } from '../render/palette.js';
import { WIDTH, PLAY_H } from '../core/config.js';
import { Menu } from '../ui/menu.js';

/** Pause menu over the game, with codec calls (Sato saves). */
export class PauseScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'pause';
    this.overlay = true;
  }

  enter(params = {}) {
    this.play = params.play || null;
    this.mode = 'main';
    this.main = new Menu([
      { id: 'resume', label: 'RESUME' },
      { id: 'codec', label: 'CODEC' },
      { id: 'options', label: 'OPTIONS' },
      { id: 'quit', label: 'QUIT TO TITLE' },
    ]);
    this.game.audio.setMuffled(true);
  }

  exit() {
    this.game.audio.setMuffled(false);
  }

  resume() {
    this.game.audio.setMuffled(true);
  }

  contactsMenu() {
    const progress = this.game.progress;
    const items = this.game.registry
      .listCharacters()
      .filter((c) => c.callable && (!c.requires || progress.has('trigger', c.requires)))
      .map((c) => ({ id: c.id, label: c.name, value: c.freq }));
    items.push({ id: 'back', label: 'BACK', value: '' });
    return new Menu(items);
  }

  /** @param {string} who */
  call(who) {
    const calls = this.game.registry.codecCalls[who];
    const roomId = this.game.progress.data.roomId;
    const dialogueId = calls.byRoom[roomId] || calls.default;
    this.game.audio.playSfx('sfx_codec_ring');
    this.game.scenes.push(this.game.create('codec'), {
      dialogueId,
      onDone: (result) => {
        if (result && result.choice === 'YES' && who === 'sato') this.saveWithSato();
        else if (result && result.choice === 'NO') {
          this.game.scenes.push(this.game.create('codec'), { dialogueId: 'dlg_sato_later' });
        }
      },
    });
  }

  saveWithSato() {
    const res = this.game.save.save(this.game.progress.snapshot());
    if (!res.persisted) this.game.overlays.saveUnavailable();
    this.game.scenes.push(this.game.create('codec'), {
      dialogueId: res.persisted ? 'dlg_sato_saved' : 'dlg_sato_memory',
    });
  }

  update() {
    const { input, audio, scenes } = this.game;
    if (this.mode === 'main') {
      if (input.justPressed('pause')) {
        audio.playSfx('sfx_menu_back');
        scenes.pop();
        return;
      }
      const res = this.main.update(input, audio);
      if (!res || res.type !== 'select') return;
      if (res.id === 'resume') scenes.pop();
      else if (res.id === 'codec') {
        this.mode = 'codec';
        this.contacts = this.contactsMenu();
      } else if (res.id === 'options') scenes.push(this.game.create('options'));
      else if (res.id === 'quit') {
        this.mode = 'quit';
        this.confirm = new Menu([
          { id: 'no', label: 'NO' },
          { id: 'yes', label: 'YES' },
        ]);
      }
      return;
    }
    if (input.justPressed('pause')) {
      audio.playSfx('sfx_menu_back');
      this.mode = 'main';
      return;
    }
    if (this.mode === 'codec') {
      const res = this.contacts.update(input, audio);
      if (!res || res.type !== 'select') return;
      if (res.id === 'back') this.mode = 'main';
      else this.call(res.id);
      return;
    }
    if (this.mode === 'quit') {
      const res = this.confirm.update(input, audio);
      if (!res || res.type !== 'select') return;
      if (res.id === 'yes') scenes.replaceAll(this.game.create('title'));
      else this.mode = 'main';
    }
  }

  render(r) {
    r.dither(0, 0, WIDTH, PLAY_H, C.VOID, 50);
    const x = 64;
    const w = WIDTH - 128;
    if (this.mode === 'main') {
      r.panel(x, 40, w, 84, C.NIGHT, C.BLUE);
      r.text('PAUSE', WIDTH / 2, 48, C.WHITE, { align: 'center' });
      this.main.draw(r, x + 22, 66, { spacing: 13 });
    } else if (this.mode === 'codec') {
      const h = 34 + this.contacts.items.length * 13;
      r.panel(x - 24, 30, w + 48, h, C.NIGHT, C.CYAN);
      r.text('CODEC', WIDTH / 2, 38, C.CYAN, { align: 'center' });
      this.contacts.draw(r, x - 4, 56, { spacing: 13, width: w + 16 });
    } else {
      r.panel(44, 44, WIDTH - 88, 84, C.NIGHT, C.RED);
      r.text('QUIT TO TITLE?', WIDTH / 2, 52, C.WHITE, { align: 'center' });
      r.text('UNSAVED PROGRESS', WIDTH / 2, 66, C.CONCRETE, { align: 'center' });
      r.text('WILL BE LOST.', WIDTH / 2, 76, C.CONCRETE, { align: 'center' });
      this.confirm.draw(r, x + 40, 94, { spacing: 12 });
    }
  }
}

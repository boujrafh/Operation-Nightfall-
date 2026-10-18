import { Scene } from '../core/scene-manager.js';
import { C } from '../render/palette.js';
import { WIDTH, HEIGHT } from '../core/config.js';
import { Menu } from '../ui/menu.js';

const SPEEDS = ['slow', 'normal', 'fast'];
const SIZES = ['S', 'M', 'L'];
const TOUCH_MODES = ['auto', 'on', 'off'];

/** Options: volumes, text speed, flashing, touch size, delete save. */
export class OptionsScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'options';
  }

  enter() {
    this.deleteStage = 0;
    this.menu = new Menu(this.items());
  }

  items() {
    const s = this.game.settings.get();
    const del = ['DELETE SAVE', 'SURE?', 'REALLY? (LAST)'][this.deleteStage];
    return [
      { id: 'music', label: 'MUSIC', value: s.muted ? 'MUTED' : `${s.musicVol}` },
      { id: 'sfx', label: 'SOUND FX', value: `${s.sfxVol}` },
      { id: 'mute', label: 'MUTE ALL', value: s.muted ? 'ON' : 'OFF' },
      { id: 'text', label: 'TEXT SPEED', value: s.textSpeed.toUpperCase() },
      { id: 'flash', label: 'REDUCE FLASH', value: s.reduceFlashing ? 'ON' : 'OFF' },
      { id: 'pad', label: 'TOUCH PAD', value: s.touchControls.toUpperCase() },
      { id: 'touch', label: 'TOUCH SIZE', value: s.touchSize },
      { id: 'delete', label: del, value: '' },
      { id: 'back', label: 'BACK', value: '' },
    ];
  }

  refresh() {
    const idx = this.menu.index;
    this.menu = new Menu(this.items());
    this.menu.index = idx;
  }

  /** @param {string} id @param {number} delta */
  change(id, delta) {
    const settings = this.game.settings;
    const s = settings.get();
    const cycle = (list, cur) => list[(list.indexOf(cur) + delta + list.length) % list.length];
    if (id === 'music') settings.set({ musicVol: Math.max(0, Math.min(10, s.musicVol + delta)) });
    else if (id === 'sfx') {
      settings.set({ sfxVol: Math.max(0, Math.min(10, s.sfxVol + delta)) });
      this.game.audio.playSfx('sfx_pickup');
    } else if (id === 'mute') settings.set({ muted: !s.muted });
    else if (id === 'text') settings.set({ textSpeed: cycle(SPEEDS, s.textSpeed) });
    else if (id === 'flash') settings.set({ reduceFlashing: !s.reduceFlashing });
    else if (id === 'touch') settings.set({ touchSize: cycle(SIZES, s.touchSize) });
    else if (id === 'pad') settings.set({ touchControls: cycle(TOUCH_MODES, s.touchControls) });
    this.refresh();
  }

  update() {
    const { input, audio, scenes } = this.game;
    if (input.justPressed('pause')) {
      audio.playSfx('sfx_menu_back');
      scenes.pop();
      return;
    }
    const res = this.menu.update(input, audio);
    if (!res) return;
    if (res.type === 'side') {
      this.change(res.id, res.delta);
      return;
    }
    if (res.id === 'back') {
      scenes.pop();
      return;
    }
    if (res.id === 'delete') {
      if (this.deleteStage < 2) this.deleteStage++;
      else {
        this.game.save.deleteSave();
        this.deleteStage = 0;
        this.game.overlays.toast('SAVE DELETED', 2500);
      }
      this.refresh();
      return;
    }
    this.change(res.id, 1);
  }

  render(r) {
    r.clear(C.VOID);
    r.panel(16, 14, WIDTH - 32, HEIGHT - 28, C.NIGHT, C.BLUE);
    r.text('OPTIONS', WIDTH / 2, 24, C.WHITE, { align: 'center', scale: 2 });
    this.menu.draw(r, 40, 48, { spacing: 14, width: WIDTH - 88 });
    r.text('▶ LEFT/RIGHT TO CHANGE', WIDTH / 2, HEIGHT - 30, C.STEEL, { align: 'center' });
  }
}

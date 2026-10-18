import { Scene } from '../core/scene-manager.js';
import { wrapText } from '../render/font.js';
import { drawCodec, CODEC_COLS, CODEC_ROWS } from '../ui/codec-window.js';
import { Menu } from '../ui/menu.js';

const SPEEDS = { slow: 25, normal: 40, fast: 80 };

/**
 * Codec conversation. Params: { dialogueId, skippable?, onDone?(result) }.
 * Dialogues with a `choice` end on a YES/NO menu.
 */
export class CodecScene extends Scene {
  constructor(game) {
    super(game);
    this.name = 'codec';
  }

  enter(params) {
    const reg = this.game.registry;
    this.params = params;
    this.dialogue = reg.getDialogue(params.dialogueId);
    this.caller = reg.getCharacter(this.dialogue.caller);
    /** @type {{ speaker: any, lines: string[], chars: number }[]} */
    this.pages = [];
    for (const line of this.dialogue.lines) {
      const wrapped = wrapText(line.text, CODEC_COLS);
      for (let i = 0; i < wrapped.length; i += CODEC_ROWS) {
        const lines = wrapped.slice(i, i + CODEC_ROWS);
        this.pages.push({
          speaker: reg.getCharacter(line.speaker),
          lines,
          chars: lines.join('').length,
        });
      }
    }
    this.page = 0;
    this.visible = 0;
    this.open = 0;
    this.blipCount = 0;
    this.choice = null;
    this.game.audio.setMuffled(true);
    this.game.debug.codec = this.dialogue.id;
  }

  exit() {
    this.game.audio.setMuffled(false);
    this.game.debug.codec = '';
  }

  close(result) {
    const onDone = this.params.onDone;
    this.game.scenes.pop(result);
    if (onDone) onDone(result);
  }

  update(dt) {
    const { input, audio, settings } = this.game;
    if (this.open < 1) {
      this.open = Math.min(1, this.open + dt * 10);
      return;
    }
    if (this.choice) {
      const res = this.choice.update(input, audio);
      if (res && res.type === 'select') this.close({ choice: res.id });
      return;
    }
    if (this.params.skippable && input.justPressed('pause')) {
      audio.playSfx('sfx_menu_back');
      this.close({});
      return;
    }
    const page = this.pages[this.page];
    if (this.visible < page.chars) {
      const cps = SPEEDS[settings.get().textSpeed] || SPEEDS.normal;
      const before = Math.floor(this.visible);
      this.visible = Math.min(page.chars, this.visible + cps * dt);
      const after = Math.floor(this.visible);
      for (let c = before; c < after; c++) {
        this.blipCount++;
        if (this.blipCount % 2 === 0) audio.playSfx('sfx_blip', { freq: page.speaker.voice });
      }
      if (input.justConfirmed()) this.visible = page.chars;
      return;
    }
    if (input.justConfirmed()) {
      if (this.page < this.pages.length - 1) {
        this.page++;
        this.visible = 0;
        audio.playSfx('sfx_menu_move');
      } else if (this.dialogue.choice) {
        this.choice = new Menu(this.dialogue.choice.options.map((o) => ({ id: o, label: o })));
      } else {
        this.close({});
      }
    }
  }

  render(r) {
    const page = this.pages[this.page];
    const typing = this.visible < page.chars;
    drawCodec(r, {
      open: this.open,
      caller: this.caller,
      speaker: page.speaker,
      lines: page.lines,
      visible: Math.floor(this.visible),
      mouth: typing && Math.floor(r.time * 10) % 2 === 0,
      showNext: !typing && !this.choice,
      choice: this.choice
        ? { options: this.choice.items.map((i) => i.label), index: this.choice.index }
        : null,
      staticNoise: true,
    });
  }
}

import { WIDTH, HEIGHT } from '../core/config.js';
import { C } from '../render/palette.js';
import { PORTRAIT_W, PORTRAIT_H } from '../content/sprites/portraits.js';

export const CODEC_COLS = 30;
export const CODEC_ROWS = 4;

/**
 * Codec screen (Doc 05 §9).
 * @param {import('../render/renderer.js').Renderer} r
 * @param {{ open: number, caller: any, speaker: any, lines: string[], visible: number,
 *   mouth: boolean, showNext: boolean, choice: { options: string[], index: number } | null,
 *   staticNoise: boolean }} s
 */
export function drawCodec(r, s) {
  r.clear(C.VOID);
  // opening scan-line effect
  const reveal = Math.max(0, Math.min(1, s.open));
  const top = 8;
  const pH = PORTRAIT_H;
  r.panel(4, top - 2, WIDTH - 8, pH + 20, C.VOID, C.BLUE);

  const leftId = s.caller.portrait;
  const leftTalking = s.speaker.id === s.caller.id;
  drawPortraitFrame(
    r,
    12,
    top + 4,
    leftId,
    leftTalking && s.mouth,
    s.staticNoise && leftId === 'lark',
  );
  drawPortraitFrame(r, WIDTH - 12 - PORTRAIT_W, top + 4, 'wren', !leftTalking && s.mouth, false);

  // frequency and signal bars
  r.text('FREQ', WIDTH / 2, top + 6, C.CONCRETE, { align: 'center' });
  r.text(s.caller.freq, WIDTH / 2, top + 20, C.CYAN, { align: 'center', scale: 1 });
  const bars = 12;
  for (let i = 0; i < bars; i++) {
    const h = 2 + i;
    const lit = (Math.sin(r.time * 6 + i * 0.7) + 1) / 2 > 0.25 || !s.mouth;
    r.rect(WIDTH / 2 - 36 + i * 6, top + 48 - h, 4, h, lit ? C.CYAN : C.STEEL);
  }
  r.text(s.caller.name, 12 + PORTRAIT_W / 2, top + pH + 6, leftTalking ? C.WHITE : C.CONCRETE, {
    align: 'center',
  });
  r.text('WREN', WIDTH - 12 - PORTRAIT_W / 2, top + pH + 6, leftTalking ? C.CONCRETE : C.WHITE, {
    align: 'center',
  });

  // text box
  const boxY = top + pH + 20;
  const boxH = HEIGHT - boxY - 6;
  r.panel(4, boxY, WIDTH - 8, boxH, C.NIGHT, C.BLUE);
  r.text(`${s.speaker.name}:`, 10, boxY + 5, C.YELLOW);
  let remaining = s.visible;
  s.lines.forEach((line, i) => {
    const shown = line.slice(0, Math.max(0, remaining));
    remaining -= line.length;
    r.text(shown, 10, boxY + 17 + i * 10, C.CYAN);
  });
  if (s.choice) {
    s.choice.options.forEach((opt, i) => {
      const x = 150 + i * 48;
      const sel = i === s.choice.index;
      if (sel) r.text('▶', x - 10, boxY + boxH - 13, C.YELLOW);
      r.text(opt, x, boxY + boxH - 13, sel ? C.YELLOW : C.CONCRETE);
    });
  } else if (s.showNext && Math.floor(r.time * 3) % 2 === 0) {
    r.text('▼', WIDTH - 18, boxY + boxH - 11, C.WHITE);
  }

  if (reveal < 1) {
    const bands = Math.floor((1 - reveal) * 12);
    for (let i = 0; i < 12; i++) {
      if (i < bands) r.rect(0, (i * HEIGHT) / 12, WIDTH, Math.ceil(HEIGHT / 12), C.VOID);
    }
  }
}

/** @param {import('../render/renderer.js').Renderer} r */
function drawPortraitFrame(r, x, y, id, mouth, noise) {
  r.rect(x - 2, y - 2, PORTRAIT_W + 4, PORTRAIT_H + 4, C.BLUE);
  r.sprite(`portrait_${id}_${mouth ? 1 : 0}`, x, y);
  if (noise) {
    for (let i = 0; i < 40; i++) {
      const nx = x + Math.floor(Math.random() * PORTRAIT_W);
      const ny = y + Math.floor(Math.random() * PORTRAIT_H);
      r.rect(nx, ny, 2, 1, Math.random() < 0.5 ? C.STEEL : C.CONCRETE);
    }
  }
}

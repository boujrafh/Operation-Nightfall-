/**
 * Physical key positions (event.code), so WASD on QWERTY and ZQSD on AZERTY
 * both work without configuration.
 * @type {Record<string, string>}
 */
export const KEY_MAP = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  Space: 'action',
  Digit1: 'item',
  Numpad1: 'item',
  Digit2: 'weapon',
  Numpad2: 'weapon',
  Enter: 'confirm',
  NumpadEnter: 'confirm',
  Escape: 'pause',
  KeyP: 'pause',
};

/**
 * @param {import('./input-service.js').InputService} input
 * @param {{ onKeyboardUsed?: () => void, onAnyKey?: () => void }} [hooks]
 */
export function attachKeyboard(input, hooks = {}) {
  /** @param {KeyboardEvent} e */
  const down = (e) => {
    if (hooks.onAnyKey) hooks.onAnyKey();
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    input.lastDevice = 'keyboard';
    if (hooks.onKeyboardUsed) hooks.onKeyboardUsed();
    input.setSource('keyboard', action, true);
  };
  /** @param {KeyboardEvent} e */
  const up = (e) => {
    const action = KEY_MAP[e.code];
    if (!action) return;
    e.preventDefault();
    input.setSource('keyboard', action, false);
  };
  const blur = () => input.releaseAll();
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    window.removeEventListener('blur', blur);
  };
}

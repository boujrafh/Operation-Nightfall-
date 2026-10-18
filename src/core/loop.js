import { STEP } from './config.js';

/**
 * Fixed-timestep loop: logic runs at exactly 60 Hz, rendering follows
 * requestAnimationFrame. After a long frame it catches up at most `maxSteps`.
 * @param {{ update: (dt: number) => void, render: (alpha: number) => void, maxSteps?: number }} opts
 */
export function createLoop({ update, render, maxSteps = 5 }) {
  let acc = 0;
  let last = 0;
  let running = false;
  let handle = 0;

  /** @param {number} t */
  function frame(t) {
    if (!running) return;
    const elapsed = Math.min((t - last) / 1000, STEP * maxSteps);
    last = t;
    acc += elapsed;
    let steps = 0;
    while (acc >= STEP && steps < maxSteps) {
      update(STEP);
      acc -= STEP;
      steps++;
    }
    if (steps === maxSteps) acc = 0;
    render(acc / STEP);
    handle = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      handle = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(handle);
    },
    get running() {
      return running;
    },
  };
}

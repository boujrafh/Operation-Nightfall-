/**
 * Base class for every scene. Overlay scenes are drawn on top of the
 * scene below them; only the top scene receives updates.
 */
export class Scene {
  /** @param {any} game */
  constructor(game) {
    this.game = game;
    this.overlay = false;
    this.name = 'scene';
  }
  /** @param {any} [_params] */
  enter(_params) {}
  exit() {}
  pause() {}
  /** @param {any} [_result] */
  resume(_result) {}
  /** @param {number} _dt */
  update(_dt) {}
  /** @param {any} _renderer */
  render(_renderer) {}
}

export class SceneManager {
  constructor() {
    /** @type {Scene[]} */
    this.stack = [];
  }

  get top() {
    return this.stack[this.stack.length - 1] || null;
  }

  /** @param {Scene} scene @param {any} [params] */
  push(scene, params) {
    const top = this.top;
    if (top) top.pause();
    this.stack.push(scene);
    scene.enter(params);
  }

  /** @param {any} [result] */
  pop(result) {
    const scene = this.stack.pop();
    if (scene) scene.exit();
    const top = this.top;
    if (top) top.resume(result);
    return scene;
  }

  /** Clears the whole stack, then pushes `scene`. */
  replaceAll(scene, params) {
    while (this.stack.length) this.stack.pop().exit();
    this.push(scene, params);
  }

  /** Replaces only the top scene. */
  replaceTop(scene, params) {
    const old = this.stack.pop();
    if (old) old.exit();
    this.stack.push(scene);
    scene.enter(params);
  }

  /** @param {string} name */
  has(name) {
    return this.stack.some((s) => s.name === name);
  }

  /** @param {number} dt */
  update(dt) {
    const top = this.top;
    if (top) top.update(dt);
  }

  /** @param {any} renderer */
  render(renderer) {
    let base = this.stack.length - 1;
    while (base > 0 && this.stack[base].overlay) base--;
    for (let i = Math.max(base, 0); i < this.stack.length; i++) this.stack[i].render(renderer);
  }
}

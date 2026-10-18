import { createLoop } from './core/loop.js';
import { SceneManager } from './core/scene-manager.js';
import { Renderer } from './render/renderer.js';
import { fitCanvas } from './render/scaler.js';
import { InputService } from './input/input-service.js';
import { attachKeyboard } from './input/keyboard.js';
import { TouchControls } from './input/touch-controls.js';
import { isPortrait, prefersReducedMotion } from './input/device-detect.js';
import { AudioService } from './audio/audio-service.js';
import { createRegistry } from './content/registry.js';
import { bakePlayer } from './content/sprites/player.js';
import { bakeGuard } from './content/sprites/guard.js';
import { bakeTiles } from './content/sprites/tiles.js';
import { bakeItems } from './content/sprites/items.js';
import { bakeUi } from './content/sprites/ui.js';
import { bakePortraits } from './content/sprites/portraits.js';
import { SafeStorage } from './state/storage.js';
import { SettingsService } from './state/settings-service.js';
import { SaveService } from './state/save-service.js';
import { createGame } from './state/game-state.js';
import { Overlays } from './ui/overlays.js';
import { InstallPrompt } from './pwa/install-prompt.js';
import { registerServiceWorker } from './pwa/sw-register.js';
import { BootScene } from './scenes/boot-scene.js';
import { PressStartScene } from './scenes/press-start-scene.js';
import { TitleScene } from './scenes/title-scene.js';
import { BriefingScene } from './scenes/briefing-scene.js';
import { PlayScene } from './scenes/play-scene.js';
import { CodecScene } from './scenes/codec-scene.js';
import { PauseScene } from './scenes/pause-scene.js';
import { OptionsScene } from './scenes/options-scene.js';
import { GameOverScene } from './scenes/game-over-scene.js';
import { ChapterEndScene } from './scenes/chapter-end-scene.js';

const SCENES = {
  boot: BootScene,
  pressstart: PressStartScene,
  title: TitleScene,
  briefing: BriefingScene,
  play: PlayScene,
  codec: CodecScene,
  pause: PauseScene,
  options: OptionsScene,
  gameover: GameOverScene,
  chapterend: ChapterEndScene,
};

function start() {
  const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('screen'));
  const app = /** @type {HTMLElement} */ (document.getElementById('app'));

  const registry = createRegistry();
  const storage = new SafeStorage();
  const settings = new SettingsService(storage, { reduceFlashing: prefersReducedMotion() });
  const save = new SaveService(storage, registry);
  const input = new InputService();
  const audio = new AudioService(registry);
  const renderer = new Renderer(canvas);
  const overlays = new Overlays(document);
  const touch = new TouchControls(
    /** @type {HTMLElement} */ (document.getElementById('touch')),
    input,
  );
  const install = new InstallPrompt();
  const scenes = new SceneManager();

  bakePlayer(renderer.sprites);
  bakeGuard(renderer.sprites);
  bakeTiles(renderer.sprites);
  bakeItems(renderer.sprites, renderer.font);
  bakeUi(renderer.sprites);
  bakePortraits(renderer.sprites);

  const game = createGame({
    registry,
    storage,
    settings,
    save,
    input,
    audio,
    renderer,
    overlays,
    touch,
    install,
    scenes,
  });
  /** @param {string} name */
  game.create = (name) => new SCENES[name](game);

  const applySettings = (s) => {
    audio.setVolumes(s);
    renderer.fx.reduceFlashing = s.reduceFlashing;
    touch.setSize(s.touchSize);
    touch.setMode(s.touchControls);
  };
  applySettings(settings.get());
  settings.onChange(applySettings);

  // Audio can only start inside a user gesture.
  const unlockAudio = () => audio.unlock();
  attachKeyboard(input, { onKeyboardUsed: () => touch.keyboardUsed(), onAnyKey: unlockAudio });
  window.addEventListener('pointerdown', (e) => {
    unlockAudio();
    const target = /** @type {HTMLElement} */ (e.target);
    if (target && target.closest && target.closest('#touch .tbtn, #stick-zone, #update')) return;
    input.setSource('tap', 'tap', true);
    input.setSource('tap', 'tap', false);
  });

  const pauseIfPlaying = () => {
    if (scenes.top && scenes.top.name === 'play') scenes.push(game.create('pause'), {});
  };
  // Portrait phone: game on top, controls below (Game Boy style).
  // Landscape: controls in the black side bars.
  const layout = () => {
    document.body.classList.toggle('portrait', touch.visible && isPortrait());
    fitCanvas(canvas, app);
  };
  touch.onVisibilityChange = layout;
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);
  layout();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseIfPlaying();
      input.releaseAll();
      audio.suspend();
    } else audio.resume();
  });
  window.addEventListener('blur', pauseIfPlaying);

  registerServiceWorker((apply) => overlays.showUpdate(apply));

  scenes.replaceAll(game.create('boot'));
  const loop = createLoop({
    update: (dt) => {
      input.beginFrame();
      renderer.time += dt;
      scenes.update(dt);
      game.debug.scene = scenes.top ? scenes.top.name : '';
    },
    render: () => {
      scenes.render(renderer);
      renderer.fx.drawOverlay(renderer.ctx);
    },
  });
  loop.start();

  // Read-only hook for automated tests.
  Object.defineProperty(window, '__nightfall', {
    value: Object.freeze({
      scene: () => game.debug.scene,
      codec: () => game.debug.codec || '',
      player: () => {
        const top = scenes.stack.find((s) => s.name === 'play');
        const p = top && /** @type {any} */ (top).player;
        return p ? { x: p.x, y: p.y } : null;
      },
      alert: () => {
        const top = scenes.stack.find((s) => s.name === 'play');
        return top ? /** @type {any} */ (top).alert.level : null;
      },
    }),
  });
}

start();

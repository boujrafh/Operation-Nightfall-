import { describe, it, expect } from 'vitest';
import { PlayScene } from '../../src/scenes/play-scene.js';
import { createRegistry } from '../../src/content/registry.js';
import { EventBus } from '../../src/core/event-bus.js';
import { InputService } from '../../src/input/input-service.js';
import { Fx } from '../../src/render/fx.js';
import { ProgressStore, newProgress } from '../../src/state/progress-store.js';
import { G } from '../../src/entities/guard.js';
import { center } from './helpers.js';

/** A game object with every service stubbed except the real game logic. */
function fakeGame(roomId, entryId) {
  const registry = createRegistry();
  const data = newProgress(registry.getChapter(0));
  data.roomId = roomId;
  data.entryId = entryId;
  const calls = { replaceAll: [], push: [], saves: 0 };
  const audio = new Proxy({}, { get: () => () => {} });
  return {
    calls,
    bus: new EventBus(),
    registry,
    progress: new ProgressStore(data),
    input: new InputService(),
    audio,
    renderer: { fx: new Fx() },
    settings: { get: () => ({ reduceFlashing: false }) },
    overlays: { saveUnavailable() {} },
    save: {
      save: () => {
        calls.saves++;
        return { ok: true, persisted: true };
      },
    },
    scenes: {
      push: (s, p) => calls.push.push([s.name, p]),
      replaceAll: (s, p) => calls.replaceAll.push([s.name, p]),
    },
    create: (name) => ({ name }),
  };
}

const tick = (scene, seconds) => {
  for (let t = 0; t < seconds; t += 1 / 60) {
    scene.game.input.beginFrame();
    scene.update(1 / 60);
  }
};

describe('Chapter 0 play flow', () => {
  it('takedown -> card drop -> door -> chapter end', () => {
    const game = fakeGame('0-3', 'west');
    const scene = new PlayScene(game);
    scene.enter();
    expect(game.calls.saves).toBe(1); // auto-save on room entry

    // 1. take the card carrier down from behind
    const g = scene.room.guards.find((x) => x.id === 'g_0-3_card');
    g.dir = 0; // facing east
    const p = scene.player;
    p.x = g.x - 12;
    p.y = g.y;
    p.dirX = 1;
    p.dirY = 0;
    scene.doAction();
    expect(g.state).toBe(G.DOWN);
    expect(game.progress.data.stats.takedowns).toBe(1);

    // 2. the card drops and can be collected exactly once
    const drop = scene.room.pickups.find((k) => k.id === 'drop_g_0-3_card');
    expect(drop).toBeTruthy();
    p.x = drop.x;
    p.y = drop.y;
    scene.collectPickups();
    scene.collectPickups();
    expect(game.progress.data.inventory.items).toEqual(['card_1']);

    // 3. the locked door refuses without the card equipped, then opens
    p.x = center(8);
    p.y = 16 + 5; // pressed against the door (top edge of row 1)
    p.dirX = 0;
    p.dirY = -1;
    const door = scene.doorInFront();
    expect(door.level).toBe(1);
    scene.attemptDoor(door);
    expect(door.open).toBe(false);
    expect(scene.banner.text).toBe('EQUIP CARD 1');
    game.progress.data.inventory.selectedItem = 'card_1';
    scene.attemptDoor(door);
    expect(door.open).toBe(true);
    expect(game.progress.has('door', 'door_0-3_lv1')).toBe(true);

    // 4. walking through the door ends the chapter
    for (const other of scene.room.guards) other.state = G.DOWN;
    p.y = center(0);
    tick(scene, 3);
    expect(game.progress.has('story', 'ch0_complete')).toBe(true);
    expect(game.calls.replaceAll.map((c) => c[0])).toContain('chapterend');
  });

  it('a guard who sees the player raises the ALERT', () => {
    const game = fakeGame('0-1', 'start');
    const scene = new PlayScene(game);
    scene.enter();
    const g = scene.room.guards[0];
    const p = scene.player;
    p.x = g.x + 30;
    p.y = g.y;
    g.dir = 0;
    g.waitTimer = 99;
    g.state = G.PATROL;
    tick(scene, 0.5);
    expect(scene.alert.level).toBe('ALERT');
    expect(game.progress.data.stats.alerts).toBe(1);
  });

  it('death -> CONTINUE restores the room entry state', () => {
    const game = fakeGame('0-2', 'west');
    const scene = new PlayScene(game);
    scene.enter();
    game.progress.data.inventory.items.push('item_box');
    for (let i = 0; i < 10; i++) {
      scene.player.invuln = 0;
      scene.damagePlayer(2);
    }
    expect(scene.player.dead).toBe(true);
    tick(scene, 2);
    expect(game.calls.push.map((c) => c[0])).toContain('gameover');
    scene.resume({ continue: true });
    expect(game.progress.data.player.hp).toBe(game.progress.data.player.maxHp);
    expect(game.progress.data.inventory.items).toEqual([]);
    expect(game.progress.data.stats.continues).toBe(1);
    expect(scene.alert.level).toBe('INFILTRATION');
    expect(scene.player.dead).toBe(false);
  });

  it('a hidden player in a bush is not seen', () => {
    const game = fakeGame('0-1', 'start');
    const scene = new PlayScene(game);
    scene.enter();
    const p = scene.player;
    p.x = center(7);
    p.y = center(6); // bush tile
    const g = scene.room.guards[0];
    g.x = center(5);
    g.y = center(6);
    g.dir = 0;
    g.waitTimer = 99;
    tick(scene, 1);
    expect(scene.alert.level).toBe('INFILTRATION');
  });
});

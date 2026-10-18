import { describe, it, expect } from 'vitest';
import { Guard, G } from '../../src/entities/guard.js';
import { updateGuard } from '../../src/systems/guard-ai.js';
import { AlertManager, ALERT } from '../../src/systems/alert-manager.js';
import { EventBus } from '../../src/core/event-bus.js';
import { canSeePlayer, visionParams } from '../../src/systems/vision.js';
import { makeMap, center } from './helpers.js';

function world(tm, player, alert, extra = {}) {
  const log = { spotted: 0, suspicious: 0 };
  const w = {
    dt: 1 / 60,
    walk: (x, y) => tm.isWalkableInside(x, y),
    player,
    alert,
    canSee: (g) => {
      const v = visionParams(alert.level);
      return canSeePlayer(tm, g.x, g.y, g.dir, v.fov, v.range, player);
    },
    noises: [],
    onSpotted: () => {
      log.spotted++;
      alert.spotted(player.x, player.y);
    },
    onMelee: () => {},
    onShoot: () => {},
    onSuspicious: () => log.suspicious++,
    rng: () => 0.5,
    ...extra,
  };
  return { w, log };
}

const def = (route, extra = {}) => ({
  id: 'g',
  loop: 'pingpong',
  speed: 1,
  facing: 'E',
  route,
  ...extra,
});
const step = (g, w, seconds) => {
  for (let t = 0; t < seconds; t += w.dt) updateGuard(g, w);
};

describe('guard AI', () => {
  it('patrols between waypoints', () => {
    const tm = makeMap();
    const g = new Guard(
      def([
        { x: 2, y: 2, wait: 0 },
        { x: 8, y: 2, wait: 0 },
      ]),
      { x: center(2), y: center(2) },
    );
    const player = { x: center(13), y: center(9), boxOn: false, moving: false, dead: false };
    const { w } = world(tm, player, new AlertManager(new EventBus()));
    step(g, w, 3);
    expect(g.x).toBeGreaterThan(center(4));
    expect(g.state).toBe(G.PATROL);
  });

  it('spots a visible player only after the grace period', () => {
    const tm = makeMap();
    const g = new Guard(def([{ x: 2, y: 5, wait: 99 }]), { x: center(2), y: center(5) });
    g.dir = 0;
    const player = { x: center(5), y: center(5), boxOn: false, moving: false, dead: false };
    const alert = new AlertManager(new EventBus());
    const { w, log } = world(tm, player, alert);
    step(g, w, 0.15);
    expect(log.spotted).toBe(0);
    step(g, w, 0.2);
    expect(log.spotted).toBe(1);
    expect(alert.level).toBe(ALERT.ALERT);
  });

  it('becomes suspicious when it hears a noise', () => {
    const tm = makeMap();
    const g = new Guard(def([{ x: 2, y: 5, wait: 99 }]), { x: center(2), y: center(5) });
    g.dir = Math.PI;
    const player = { x: center(13), y: center(9), boxOn: false, moving: false, dead: false };
    const { w, log } = world(tm, player, new AlertManager(new EventBus()));
    w.noises = [{ x: center(4), y: center(5), radius: 48 }];
    updateGuard(g, w);
    expect(g.state).toBe(G.SUSPICIOUS);
    expect(g.bubble).toBe('?');
    expect(log.suspicious).toBe(1);
  });

  it('chases during ALERT and searches during EVASION', () => {
    const tm = makeMap();
    const g = new Guard(def([{ x: 2, y: 2, wait: 0 }]), { x: center(2), y: center(2) });
    const player = { x: center(12), y: center(8), boxOn: false, moving: false, dead: false };
    const alert = new AlertManager(new EventBus());
    alert.spotted(player.x, player.y);
    const { w } = world(tm, player, alert);
    updateGuard(g, w);
    expect(g.state).toBe(G.CHASE);
    alert.set(ALERT.EVASION);
    updateGuard(g, w);
    expect(g.state).toBe(G.SEARCH);
    alert.set(ALERT.INFILTRATION);
    updateGuard(g, w);
    expect(g.state).toBe(G.RETURN);
  });

  it('wakes up after being knocked out', () => {
    const tm = makeMap();
    const g = new Guard(def([{ x: 2, y: 2, wait: 0 }]), { x: center(2), y: center(2) });
    g.state = G.DOWN;
    g.koTimer = 0.5;
    const player = { x: center(13), y: center(9), boxOn: false, moving: false, dead: false };
    const { w } = world(tm, player, new AlertManager(new EventBus()));
    step(g, w, 0.6);
    expect(g.state).not.toBe(G.DOWN);
  });
});

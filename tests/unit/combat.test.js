import { describe, it, expect } from 'vitest';
import { findTakedownTarget, findPunchTarget, knockOut } from '../../src/systems/combat.js';
import { Guard, G } from '../../src/entities/guard.js';

const guard = (x, y, dir) => {
  const g = new Guard({ id: 'g', route: [], facing: 'E' }, { x, y });
  g.dir = dir;
  return g;
};
const player = (x, y, dirX, dirY) => ({
  x,
  y,
  dirX,
  dirY,
  get facingAngle() {
    return Math.atan2(dirY, dirX);
  },
});

describe('combat', () => {
  it('allows a takedown from behind', () => {
    const g = guard(100, 50, 0); // facing east
    expect(findTakedownTarget(player(88, 50, 1, 0), [g])).toBe(g);
  });

  it('refuses a takedown from the front', () => {
    const g = guard(100, 50, Math.PI); // facing west, toward the player
    expect(findTakedownTarget(player(88, 50, 1, 0), [g])).toBeNull();
  });

  it('refuses a takedown when too far or facing away', () => {
    const g = guard(100, 50, 0);
    expect(findTakedownTarget(player(70, 50, 1, 0), [g])).toBeNull();
    expect(findTakedownTarget(player(88, 50, -1, 0), [g])).toBeNull();
  });

  it('punches the guard in front', () => {
    const g = guard(100, 50, Math.PI);
    expect(findPunchTarget(player(88, 50, 1, 0), [g])).toBe(g);
  });

  it('knocked-out guards cannot be targeted', () => {
    const g = guard(100, 50, 0);
    knockOut(g);
    expect(g.state).toBe(G.DOWN);
    expect(findTakedownTarget(player(88, 50, 1, 0), [g])).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { canSeePlayer, isConcealed, visionParams, buildCone } from '../../src/systems/vision.js';
import { makeMap, center } from './helpers.js';

const player = (tx, ty, extra = {}) => ({
  x: center(tx),
  y: center(ty),
  boxOn: false,
  moving: false,
  dead: false,
  ...extra,
});
const v = visionParams('INFILTRATION');

describe('vision', () => {
  it('sees a player in front, in range', () => {
    expect(canSeePlayer(makeMap(), center(3), center(5), 0, v.fov, v.range, player(6, 5))).toBe(
      true,
    );
  });

  it('does not see behind or out of range', () => {
    const tm = makeMap();
    expect(canSeePlayer(tm, center(8), center(5), 0, v.fov, v.range, player(4, 5))).toBe(false);
    expect(canSeePlayer(tm, center(2), center(5), 0, v.fov, v.range, player(13, 5))).toBe(false);
  });

  it('hides a player inside a bush', () => {
    const tm = makeMap({ '6,5': 'B' });
    expect(isConcealed(player(6, 5), tm)).toBe(true);
    expect(canSeePlayer(tm, center(3), center(5), 0, v.fov, v.range, player(6, 5))).toBe(false);
  });

  it('hides a still player in the box, but not a moving one', () => {
    const tm = makeMap();
    expect(
      canSeePlayer(tm, center(3), center(5), 0, v.fov, v.range, player(6, 5, { boxOn: true })),
    ).toBe(false);
    expect(
      canSeePlayer(
        tm,
        center(3),
        center(5),
        0,
        v.fov,
        v.range,
        player(6, 5, { boxOn: true, moving: true }),
      ),
    ).toBe(true);
  });

  it('always notices a hidden player it touches from the front', () => {
    const tm = makeMap({ '6,5': 'B' });
    const p = player(6, 5);
    expect(canSeePlayer(tm, p.x - 10, p.y, 0, v.fov, v.range, p)).toBe(true);
  });

  it('ALERT widens and lengthens the cone', () => {
    const a = visionParams('ALERT');
    expect(a.fov).toBeGreaterThan(v.fov);
    expect(a.range).toBeGreaterThan(v.range);
  });

  it('builds a cone polygon clipped by walls', () => {
    const pts = buildCone(makeMap({ '5,5': '#' }), center(3), center(5), 0, v.fov, v.range, 10);
    expect(pts.length).toBe(12);
    const middle = pts[6];
    expect(middle.x).toBeLessThanOrEqual(5 * 16 + 0.001);
  });
});

import { describe, it, expect } from 'vitest';
import { AlertManager, ALERT } from '../../src/systems/alert-manager.js';
import { EventBus } from '../../src/core/event-bus.js';

const setup = () => {
  const bus = new EventBus();
  const events = [];
  bus.on('ALERT_CHANGED', (e) => events.push(e));
  return { am: new AlertManager(bus), events };
};
const run = (am, seconds, seen) => {
  for (let t = 0; t < seconds; t += 0.1) am.update(0.1, seen, { x: 1, y: 2 });
};

describe('AlertManager', () => {
  it('starts in INFILTRATION', () => {
    expect(setup().am.level).toBe(ALERT.INFILTRATION);
  });

  it('goes INFILTRATION -> ALERT -> EVASION -> INFILTRATION', () => {
    const { am, events } = setup();
    am.spotted(10, 10);
    expect(am.level).toBe(ALERT.ALERT);
    run(am, 4.8, false);
    expect(am.level).toBe(ALERT.ALERT);
    run(am, 0.4, false);
    expect(am.level).toBe(ALERT.EVASION);
    expect(am.evasionSeconds).toBe(10);
    run(am, 10.2, false);
    expect(am.level).toBe(ALERT.INFILTRATION);
    expect(events.map((e) => e.to)).toEqual(['ALERT', 'EVASION', 'INFILTRATION']);
  });

  it('being seen keeps ALERT going', () => {
    const { am } = setup();
    am.spotted(0, 0);
    run(am, 20, true);
    expect(am.level).toBe(ALERT.ALERT);
    expect(am.lastKnown).toEqual({ x: 1, y: 2 });
  });

  it('being seen during EVASION goes back to ALERT', () => {
    const { am } = setup();
    am.spotted(0, 0);
    run(am, 5.2, false);
    expect(am.level).toBe(ALERT.EVASION);
    am.update(0.1, true, { x: 3, y: 3 });
    expect(am.level).toBe(ALERT.ALERT);
    expect(am.count).toBe(2);
  });

  it('spotting again during ALERT does not re-emit', () => {
    const { am, events } = setup();
    am.spotted(0, 0);
    am.spotted(1, 1);
    expect(events.length).toBe(1);
  });
});

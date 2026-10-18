import { describe, it, expect } from 'vitest';
import { InputService } from '../../src/input/input-service.js';
import { KEY_MAP } from '../../src/input/keyboard.js';

describe('InputService', () => {
  it('reports a press for exactly one frame', () => {
    const input = new InputService();
    input.setSource('keyboard', 'action', true);
    input.beginFrame();
    expect(input.justPressed('action')).toBe(true);
    input.beginFrame();
    expect(input.justPressed('action')).toBe(false);
    expect(input.isDown('action')).toBe(true);
  });

  it('keeps a tap that is pressed and released within one frame', () => {
    const input = new InputService();
    input.setSource('tap', 'tap', true);
    input.setSource('tap', 'tap', false);
    input.beginFrame();
    expect(input.justConfirmed()).toBe(true);
  });

  it('counts two quick presses in consecutive frames as two presses', () => {
    const input = new InputService();
    input.setSource('keyboard', 'pause', true);
    input.setSource('keyboard', 'pause', false);
    input.beginFrame();
    expect(input.justPressed('pause')).toBe(true);
    input.setSource('keyboard', 'pause', true);
    input.setSource('keyboard', 'pause', false);
    input.beginFrame();
    expect(input.justPressed('pause')).toBe(true);
  });

  it('normalises diagonal movement', () => {
    const input = new InputService();
    input.setSource('keyboard', 'up', true);
    input.setSource('keyboard', 'right', true);
    input.beginFrame();
    const a = input.axis();
    expect(Math.hypot(a.x, a.y)).toBeCloseTo(1, 5);
    expect(a.x).toBeGreaterThan(0);
    expect(a.y).toBeLessThan(0);
  });

  it('snaps the analog stick to 8 directions', () => {
    const input = new InputService();
    input.setAxis(0.9, 0.2);
    input.beginFrame();
    expect(input.axis()).toEqual({ x: 1, y: 0 });
  });

  it('turns a pushed stick into direction presses (menus work by touch)', () => {
    const input = new InputService();
    input.setAxis(0, 0.9);
    input.beginFrame();
    expect(input.justPressed('down')).toBe(true);
    expect(input.menuDelta()).toBe(1);
    input.beginFrame();
    expect(input.justPressed('down')).toBe(false);
    input.setAxis(0, 0);
    input.beginFrame();
    input.setAxis(0.3, 0);
    input.beginFrame();
    expect(input.isDown('right')).toBe(false);
    expect(input.axis()).toEqual({ x: 1, y: 0 });
  });

  it('maps WASD and ZQSD to the same physical keys', () => {
    expect(KEY_MAP.KeyW).toBe('up');
    expect(KEY_MAP.KeyA).toBe('left');
    expect(KEY_MAP.KeyS).toBe('down');
    expect(KEY_MAP.KeyD).toBe('right');
    expect(KEY_MAP.Digit1).toBe('item');
    expect(KEY_MAP.Space).toBe('action');
  });
});

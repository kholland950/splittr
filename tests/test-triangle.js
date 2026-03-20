import { describe, it, expect } from './test-runner.js';
import { Triangle, spawnTriangle } from '../src/triangle.js';

describe('Triangle', () => {
  it('creates with correct properties', () => {
    const tri = new Triangle(100, -50, 200);
    expect(tri.x).toBe(100);
    expect(tri.y).toBe(-50);
    expect(tri.fallSpeed).toBe(200);
  });

  it('update moves triangle down by fallSpeed * dt', () => {
    const tri = new Triangle(100, 0, 200);
    tri.update(0.5);
    expect(tri.y).toBe(100);
  });

  it('isOffScreen returns true when below canvas', () => {
    const tri = new Triangle(100, 700, 200);
    expect(tri.isOffScreen(600)).toBeTruthy();
  });

  it('isOffScreen returns false when on screen', () => {
    const tri = new Triangle(100, 200, 200);
    expect(tri.isOffScreen(600)).toBeFalsy();
  });

  it('getTipPosition returns bottom-center point', () => {
    const tri = new Triangle(100, 0, 200);
    const tip = tri.getTipPosition();
    expect(tip.tipX).toBe(100);
    expect(tip.tipY).toBe(0);
  });

  it('getBounds returns correct AABB', () => {
    const tri = new Triangle(100, 50, 200);
    const b = tri.getBounds();
    expect(b.left).toBe(70);  // 100 - 60/2
    expect(b.right).toBe(130); // 100 + 60/2
    expect(b.top).toBe(0);    // 50 - 50
    expect(b.bottom).toBe(50); // y is the tip (bottom)
  });
});

describe('spawnTriangle', () => {
  it('returns spawn position at top of screen in a valid column', () => {
    const spawn = spawnTriangle(800, []);
    expect(spawn.y < 0).toBeTruthy();
    expect(spawn.x >= 0).toBeTruthy();
    expect(spawn.x <= 800).toBeTruthy();
  });

  it('returns a valid column index', () => {
    const spawn = spawnTriangle(800, []);
    expect(typeof spawn.col === 'number').toBeTruthy();
    expect(spawn.col >= 0).toBeTruthy();
  });
});

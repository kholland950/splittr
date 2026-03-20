import { describe, it, expect } from './test-runner.js';
import { DifficultyManager } from '../src/difficulty.js';

describe('DifficultyManager', () => {
  it('returns tier 1 values at time 0', () => {
    const dm = new DifficultyManager();
    const tier = dm.getTier(0);
    expect(tier.spawnInterval).toBe(1500);
    expect(tier.fallSpeed).toBe(200);
    expect(tier.maxTriangles).toBe(3);
  });

  it('returns tier 2 values at time 15', () => {
    const dm = new DifficultyManager();
    const tier = dm.getTier(15);
    expect(tier.spawnInterval).toBe(1000);
    expect(tier.fallSpeed).toBe(300);
    expect(tier.maxTriangles).toBe(5);
  });

  it('returns final tier at time 90', () => {
    const dm = new DifficultyManager();
    const tier = dm.getTier(90);
    expect(tier.spawnInterval).toBe(300);
    expect(tier.fallSpeed).toBe(600);
    expect(tier.maxTriangles).toBe(20);
  });

  it('shouldSpawn respects spawn interval', () => {
    const dm = new DifficultyManager();
    // At time 0, spawn interval is 1500ms. First call should allow spawn.
    expect(dm.shouldSpawn(0, 0)).toBeTruthy();
    // Just 100ms later, should not spawn yet.
    expect(dm.shouldSpawn(0.1, 0)).toBeFalsy();
    // At 1.5s, should spawn again.
    expect(dm.shouldSpawn(1.5, 0)).toBeTruthy();
  });

  it('shouldSpawn respects max triangle count', () => {
    const dm = new DifficultyManager();
    dm.shouldSpawn(0, 0); // resets timer
    // At time 0, max is 3. With 3 triangles, should not spawn.
    expect(dm.shouldSpawn(1.6, 3)).toBeFalsy();
    // With 2 triangles, should spawn (if interval elapsed).
    expect(dm.shouldSpawn(1.6, 2)).toBeTruthy();
  });
});

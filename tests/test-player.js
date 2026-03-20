import { describe, it, expect } from './test-runner.js';
import { PlayerBox } from '../src/player.js';

describe('PlayerBox', () => {
  it('creates with correct default properties', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(400, 500, 160, 120, 0, pair);
    expect(box.x).toBe(400);
    expect(box.y).toBe(500);
    expect(box.width).toBe(160);
    expect(box.height).toBe(120);
    expect(box.splitDepth).toBe(0);
    expect(box.velocity).toBe(0);
  });

  it('update applies acceleration from input', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(400, 500, 160, 120, 0, pair);
    const fakeInput = { isDown: (k) => k === 'd' };
    box.update(1 / 60, fakeInput, 800);
    // Should have moved left (negative direction)
    expect(box.x < 400).toBeTruthy();
  });

  it('stays within canvas bounds', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(0, 500, 160, 120, 0, pair);
    box.velocity = -1000;
    box.update(1 / 60, { isDown: () => false }, 800);
    expect(box.x >= 0).toBeTruthy();
  });

  it('split returns two children at depth+1', () => {
    const parentPair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const childPair = { left: 'j', right: 'k', leftLabel: 'J', rightLabel: 'K' };
    const box = new PlayerBox(400, 500, 160, 120, 0, parentPair);
    const children = box.split(childPair, 1000);
    expect(children.length).toBe(2);
    expect(children[0].splitDepth).toBe(1);
    expect(children[1].splitDepth).toBe(1);
    // Left child inherits parent keys
    expect(children[0].keyPair.left).toBe('d');
    // Right child gets new keys
    expect(children[1].keyPair.left).toBe('j');
    // Children have half width
    expect(children[0].width).toBe(80);
    expect(children[1].width).toBe(80);
  });

  it('split children fly apart with initial velocity', () => {
    const parentPair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const childPair = { left: 'j', right: 'k', leftLabel: 'J', rightLabel: 'K' };
    const box = new PlayerBox(400, 500, 160, 120, 0, parentPair);
    const children = box.split(childPair, 1000);
    // Left child has negative velocity, right child has positive
    expect(children[0].velocity < 0).toBeTruthy();
    expect(children[1].velocity > 0).toBeTruthy();
  });

  it('split children have immunity set', () => {
    const parentPair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const childPair = { left: 'j', right: 'k', leftLabel: 'J', rightLabel: 'K' };
    const box = new PlayerBox(400, 500, 160, 120, 0, parentPair);
    const children = box.split(childPair, 5000);
    // Both children should be immune at time 5000
    expect(children[0].isImmune(5000)).toBeTruthy();
    expect(children[1].isImmune(5000)).toBeTruthy();
    // Both children should NOT be immune well after the immunity window
    expect(children[0].isImmune(6000)).toBeFalsy();
    expect(children[1].isImmune(6000)).toBeFalsy();
  });

  it('getBounds returns correct rectangle', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(100, 200, 60, 40, 0, pair);
    const b = box.getBounds();
    expect(b.left).toBe(100);
    expect(b.right).toBe(160);
    expect(b.top).toBe(200);
    expect(b.bottom).toBe(240);
  });

  it('isImmune returns true when within immunity window', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(100, 200, 60, 40, 0, pair);
    box.immuneUntil = 1000;
    expect(box.isImmune(500)).toBeTruthy();
    expect(box.isImmune(1500)).toBeFalsy();
  });
});

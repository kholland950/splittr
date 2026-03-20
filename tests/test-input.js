import { describe, it, expect } from './test-runner.js';
import { InputManager } from '../src/input.js';

describe('InputManager', () => {
  it('tracks key down state', () => {
    const input = new InputManager();
    input.handleKeyDown({ key: 'a' });
    expect(input.isDown('a')).toBeTruthy();
  });

  it('tracks key up state', () => {
    const input = new InputManager();
    input.handleKeyDown({ key: 'a' });
    input.handleKeyUp({ key: 'a' });
    expect(input.isDown('a')).toBeFalsy();
  });

  it('returns false for keys never pressed', () => {
    const input = new InputManager();
    expect(input.isDown('z')).toBeFalsy();
  });

  it('allocates key pairs from the pool', () => {
    const input = new InputManager();
    const pair1 = input.allocateKeyPair();
    const pair2 = input.allocateKeyPair();
    expect(pair1.left).toBe('d');
    expect(pair1.right).toBe('f');
    expect(pair2.left).toBe('j');
    expect(pair2.right).toBe('k');
  });

  it('resets allocation index', () => {
    const input = new InputManager();
    input.allocateKeyPair();
    input.allocateKeyPair();
    input.resetAllocations();
    const pair = input.allocateKeyPair();
    expect(pair.left).toBe('d');
  });

  it('anyKeyPressed returns true after key press', () => {
    const input = new InputManager();
    input.handleKeyDown({ key: 'x' });
    expect(input.anyKeyPressed()).toBeTruthy();
  });

  it('clear resets all key states', () => {
    const input = new InputManager();
    input.handleKeyDown({ key: 'a' });
    input.clear();
    expect(input.isDown('a')).toBeFalsy();
  });
});

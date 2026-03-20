import { describe, it, expect } from './test-runner.js';
import { MAX_SPLIT_DEPTH, KEY_PAIRS } from '../src/constants.js';

describe('constants', () => {
  it('MAX_SPLIT_DEPTH is 4', () => {
    expect(MAX_SPLIT_DEPTH).toBe(4);
  });

  it('KEY_PAIRS has at least 16 entries (enough for max boxes)', () => {
    expect(KEY_PAIRS.length >= 16).toBeTruthy();
  });

  it('KEY_PAIRS has 24 entries', () => {
    expect(KEY_PAIRS.length).toBe(24);
  });
});

import { describe, it, expect } from './test-runner.js';
import { aabbOverlap, tipHitsBox, edgeContact, boxOverlap } from '../src/collision.js';

describe('collision: aabbOverlap', () => {
  it('detects overlapping rectangles', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 25, right: 75, top: 25, bottom: 75 };
    expect(aabbOverlap(a, b)).toBeTruthy();
  });

  it('returns false for non-overlapping rectangles', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 100, right: 150, top: 0, bottom: 50 };
    expect(aabbOverlap(a, b)).toBeFalsy();
  });

  it('returns false for edge-touching (no overlap)', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 50, right: 100, top: 0, bottom: 50 };
    expect(aabbOverlap(a, b)).toBeFalsy();
  });
});

describe('collision: tipHitsBox', () => {
  it('returns true when triangle tip is inside box', () => {
    const tri = { tipX: 30, tipY: 80 };
    const box = { left: 10, right: 50, top: 60, bottom: 100 };
    expect(tipHitsBox(tri, box)).toBeTruthy();
  });

  it('returns false when triangle tip is outside box', () => {
    const tri = { tipX: 5, tipY: 80 };
    const box = { left: 10, right: 50, top: 60, bottom: 100 };
    expect(tipHitsBox(tri, box)).toBeFalsy();
  });
});

describe('collision: edgeContact', () => {
  it('returns "left" when triangle center is left of box center', () => {
    const triCenterX = 20;
    const boxCenterX = 40;
    expect(edgeContact(triCenterX, boxCenterX)).toBe('left');
  });

  it('returns "right" when triangle center is right of box center', () => {
    expect(edgeContact(60, 40)).toBe('right');
  });
});

describe('collision: boxOverlap', () => {
  it('returns overlap info for overlapping boxes', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 40, right: 90, top: 0, bottom: 50 };
    const result = boxOverlap(a, b);
    expect(result).toBeNotNull();
    expect(result.overlap).toBe(10);
    expect(result.aIsLeft).toBeTruthy();
  });

  it('returns null for non-overlapping boxes', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 100, right: 150, top: 0, bottom: 50 };
    expect(boxOverlap(a, b)).toBeNull();
  });
});

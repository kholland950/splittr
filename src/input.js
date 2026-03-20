// src/input.js — Keyboard + Gamepad input manager
import { KEY_PAIRS, KEY_PAIRS_START, KEY_PAIRS_LEFT, KEY_PAIRS_RIGHT } from './constants.js';

export class InputManager {
  constructor() {
    this._keys = {};
    this._nextPairIndex = 0;
    this._nextLeftIndex = 0;
    this._nextRightIndex = 0;
    this._returnedLeftPairs = [];
    this._returnedRightPairs = [];
    this._returnedPairs = []; // legacy fallback
    this._gamepads = {};
    this._gamepadAxes = {};
  }

  handleKeyDown(event) {
    this._keys[event.key] = true;
  }

  handleKeyUp(event) {
    this._keys[event.key] = false;
  }

  isDown(key) {
    return !!this._keys[key];
  }

  anyKeyPressed() {
    return Object.values(this._keys).some(Boolean) || this._anyGamepadButton();
  }

  clear() {
    this._keys = {};
  }

  // Position-aware allocation: 'left' gets left-hand keys, 'right' gets right-hand keys
  allocateKeyPair(side) {
    if (side === 'left') {
      if (this._returnedLeftPairs.length > 0) return this._returnedLeftPairs.pop();
      if (this._nextLeftIndex < KEY_PAIRS_LEFT.length) {
        return KEY_PAIRS_LEFT[this._nextLeftIndex++];
      }
    } else if (side === 'right') {
      if (this._returnedRightPairs.length > 0) return this._returnedRightPairs.pop();
      if (this._nextRightIndex < KEY_PAIRS_RIGHT.length) {
        return KEY_PAIRS_RIGHT[this._nextRightIndex++];
      }
    }
    // Fallback: no side specified or pool exhausted — use start pairs then any available
    if (this._returnedPairs.length > 0) return this._returnedPairs.pop();
    if (this._nextPairIndex < KEY_PAIRS_START.length) {
      return KEY_PAIRS_START[this._nextPairIndex++];
    }
    // Last resort: pull from whichever side has keys left
    if (this._nextLeftIndex < KEY_PAIRS_LEFT.length) return KEY_PAIRS_LEFT[this._nextLeftIndex++];
    if (this._nextRightIndex < KEY_PAIRS_RIGHT.length) return KEY_PAIRS_RIGHT[this._nextRightIndex++];
    return KEY_PAIRS[0]; // absolute fallback
  }

  returnKeyPair(pair) {
    if (!pair) return;
    // Return to the correct pool
    if (KEY_PAIRS_LEFT.includes(pair)) {
      this._returnedLeftPairs.push(pair);
    } else if (KEY_PAIRS_RIGHT.includes(pair)) {
      this._returnedRightPairs.push(pair);
    } else {
      this._returnedPairs.push(pair);
    }
  }

  resetAllocations() {
    this._nextPairIndex = 0;
    this._nextLeftIndex = 0;
    this._nextRightIndex = 0;
    this._returnedPairs = [];
    this._returnedLeftPairs = [];
    this._returnedRightPairs = [];
  }

  // Gamepad support — returns horizontal axis for a given box index (0-based)
  getGamepadAxis(boxIndex) {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;
      // Use left stick X axis; for multiple boxes, use different sticks/gamepads
      if (boxIndex === 0) {
        const axis = gp.axes[0] || 0;
        return Math.abs(axis) > 0.15 ? axis : 0; // deadzone
      }
      if (boxIndex === 1 && gp.axes.length >= 4) {
        const axis = gp.axes[2] || 0;
        return Math.abs(axis) > 0.15 ? axis : 0;
      }
    }
    return 0;
  }

  _anyGamepadButton() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of gamepads) {
      if (!gp) continue;
      for (const btn of gp.buttons) {
        if (btn.pressed) return true;
      }
      // Also detect stick movement as "press"
      for (const axis of gp.axes) {
        if (Math.abs(axis) > 0.5) return true;
      }
    }
    return false;
  }

  attach() {
    this._onKeyDown = (e) => this.handleKeyDown(e);
    this._onKeyUp = (e) => this.handleKeyUp(e);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  detach() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
  }
}

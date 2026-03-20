// src/input.js — Keyboard input manager
import { KEY_PAIRS } from './constants.js';

export class InputManager {
  constructor() {
    this._keys = {};
    this._nextPairIndex = 0;
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
    return Object.values(this._keys).some(Boolean);
  }

  clear() {
    this._keys = {};
  }

  allocateKeyPair() {
    const pair = KEY_PAIRS[this._nextPairIndex];
    this._nextPairIndex++;
    return pair;
  }

  resetAllocations() {
    this._nextPairIndex = 0;
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

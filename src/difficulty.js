// src/difficulty.js — Difficulty curve manager
import { DIFFICULTY_TIERS } from './constants.js';

export class DifficultyManager {
  constructor() {
    this._lastSpawnTime = -Infinity;
  }

  getTier(elapsedSeconds) {
    for (const tier of DIFFICULTY_TIERS) {
      if (elapsedSeconds < tier.maxTime) {
        return tier;
      }
    }
    return DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];
  }

  shouldSpawn(elapsedSeconds, currentTriangleCount) {
    const tier = this.getTier(elapsedSeconds);
    if (currentTriangleCount >= tier.maxTriangles) return false;
    const intervalSec = tier.spawnInterval / 1000;
    if (elapsedSeconds - this._lastSpawnTime >= intervalSec) {
      this._lastSpawnTime = elapsedSeconds;
      return true;
    }
    return false;
  }

  reset() {
    this._lastSpawnTime = -Infinity;
  }
}

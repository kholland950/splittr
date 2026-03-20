// src/difficulty.js — Difficulty curve manager with continuous ramping
import { DIFFICULTY_TIERS } from './constants.js';

export class DifficultyManager {
  constructor() {
    this._lastSpawnTime = -Infinity;
  }

  getTier(elapsedSeconds) {
    let baseTier = DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];
    for (const tier of DIFFICULTY_TIERS) {
      if (elapsedSeconds < tier.maxTime) {
        baseTier = tier;
        break;
      }
    }

    // Continuous speed ramp — everything gets 2% faster per second after 10s
    const rampTime = Math.max(0, elapsedSeconds - 10);
    const speedMultiplier = 1 + rampTime * 0.02;
    // Spawn interval gets shorter (faster spawns)
    const spawnMultiplier = 1 / (1 + rampTime * 0.015);

    return {
      maxTime: baseTier.maxTime,
      spawnInterval: baseTier.spawnInterval * spawnMultiplier,
      fallSpeed: baseTier.fallSpeed * speedMultiplier,
      maxTriangles: baseTier.maxTriangles + Math.floor(rampTime / 5),
    };
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

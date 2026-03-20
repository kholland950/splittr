// src/game.js — Game loop, state machine, initialization
import { announce, announceScore } from './accessibility.js';
import { InputManager } from './input.js';
import { DifficultyManager } from './difficulty.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { PlayerBox, setPersonalitySystem } from './player.js';
import { PersonalitySystem } from './personality.js';
import { Triangle, spawnTriangle } from './triangle.js';
import { ParticleSystem } from './particles.js';
import { AchievementTracker } from './achievements.js';
import { Leaderboard } from './leaderboard.js';
import { aabbOverlap, tipHitsBox, edgeContact, boxOverlap } from './collision.js';
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, MAX_SPLIT_DEPTH,
  TRIANGLE_COLUMN_COOLDOWN_MS, BOX_COLLISION_DAMPING,
  HEART_SHIELD_DURATION_MS, SPLIT_IMMUNITY_MS,
} from './constants.js';
import { cycleSkin } from './skins.js';
import { SoulOrbSystem } from './soul-orb.js';

const State = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  DEAD: 'DEAD',
  ENTERING_NAME: 'ENTERING_NAME',
  LEADERBOARD: 'LEADERBOARD',
};

class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.difficulty = new DifficultyManager();
    this.ui = new UI();
    this.particles = new ParticleSystem();
    this.achievements = new AchievementTracker();
    this.leaderboard = new Leaderboard();
    this.personality = new PersonalitySystem();
    setPersonalitySystem(this.personality);
    this.soulOrbs = new SoulOrbSystem();

    this.state = State.READY;
    this.boxes = [];
    this.triangles = [];
    this.elapsedTime = 0;
    this.finalScore = 0;
    this.recentColumns = [];
    this.recentColumnTimestamps = [];

    this._pendingMerges = []; // { boxA, boxB, targetX, targetY, mergedWidth }

    this._deathRank = 0;
    this._confirmedRank = 0;

    this._lastFrameTime = 0;
    this._stateJustChanged = false;
    this._fpsFrames = 0;
    this._fpsLastCheck = 0;
    this._fpsDisplay = 0;

    // Track specific key events for name entry and leaderboard navigation
    this._pendingKeys = [];
    this._onKeyDownCapture = (e) => {
      if (this.state === State.ENTERING_NAME) {
        e.preventDefault();
        this._pendingKeys.push(e.key);
      }
      if ((e.key === 'Tab') && (this.state === State.READY || this.state === State.LEADERBOARD)) {
        e.preventDefault();
        this._pendingKeys.push(e.key);
      }
      if (e.key === 'Escape' && this.state === State.LEADERBOARD) {
        e.preventDefault();
        this._pendingKeys.push(e.key);
      }
    };
    document.addEventListener('keydown', this._onKeyDownCapture);

    this.input.attach();
    window.addEventListener('resize', () => this.renderer.resize());

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _loop(timestamp) {
    const dt = Math.min((timestamp - this._lastFrameTime) / 1000, 0.05);
    this._lastFrameTime = timestamp;
    const now = performance.now();

    this.renderer.beginFrame(now, dt);

    switch (this.state) {
      case State.READY:
        this.ui.renderReadyScreen(
          this.renderer.ctx, this.renderer.width, this.renderer.height, now
        );
        if (this.achievements.isGalleryOpen()) {
          this.achievements.renderGallery(
            this.renderer.ctx, this.renderer.width, this.renderer.height, now
          );
          if (this.input.isDown('a') && !this._stateJustChanged) {
            this.achievements.closeGallery();
            this.input.clear();
            this._stateJustChanged = true;
          }
        } else if (this._consumeKey('Tab')) {
          this.ui.resetLeaderboardScreen();
          this.ui.setNewEntryRank(0);
          this.state = State.LEADERBOARD;
          this._stateJustChanged = true;
          this.input.clear();
        } else if (this.input.isDown('a') && !this._stateJustChanged) {
          this.achievements.toggleGallery();
          this.input.clear();
          this._stateJustChanged = true;
        } else if (this.input.isDown('s') && !this._stateJustChanged) {
          cycleSkin();
          this.input.clear();
          this._stateJustChanged = true;
        } else if (this.input.anyKeyPressed() && !this._stateJustChanged) {
          this._startGame();
        }
        this._stateJustChanged = false;
        break;

      case State.PLAYING:
        this._updatePlaying(dt, now);
        this._renderPlaying(now, dt);
        break;

      case State.DEAD:
        this.particles.update(dt);
        this._renderPlaying(now, dt);
        this.ui.renderDeathScreen(
          this.renderer.ctx, this.renderer.width, this.renderer.height,
          this.finalScore, now, this._deathRank
        );
        if (this.input.anyKeyPressed() && !this._stateJustChanged) {
          this.input.clear();
          this.state = State.READY;
          this._stateJustChanged = true;
          this.ui.resetReadyScreen();
          announce('Splittr. Press any key to start.');
        }
        this._stateJustChanged = false;
        break;

      case State.ENTERING_NAME:
        this.particles.update(dt);
        this._renderPlaying(now, dt);
        for (const key of this._pendingKeys) {
          this.ui.handleNameInput(key, now);
        }
        this._pendingKeys = [];
        this.ui.renderNameEntry(
          this.renderer.ctx, this.renderer.width, this.renderer.height,
          this.finalScore, this._deathRank, now
        );
        if (this.ui.isNameConfirmed()) {
          const name = this.ui.getEnteredName();
          this._confirmedRank = this.leaderboard.add(name, this.finalScore);
          this.ui.resetLeaderboardScreen();
          this.ui.setNewEntryRank(this._confirmedRank);
          this.state = State.LEADERBOARD;
          this._stateJustChanged = true;
          this.input.clear();
        }
        break;

      case State.LEADERBOARD:
        this.ui.renderLeaderboardScreen(
          this.renderer.ctx, this.renderer.width, this.renderer.height,
          this.leaderboard.getEntries(), now
        );
        if (this._consumeKey('Escape') || this._consumeKey('Tab')) {
          this.input.clear();
          this.state = State.READY;
          this._stateJustChanged = true;
          this.ui.resetReadyScreen();
        } else if (this.input.anyKeyPressed() && !this._stateJustChanged) {
          this.input.clear();
          this.state = State.READY;
          this._stateJustChanged = true;
          this.ui.resetReadyScreen();
        }
        this._stateJustChanged = false;
        break;
    }

    // Achievement popup (renders in all states)
    this.achievements.renderPopup(this.renderer.ctx, this.renderer.width, now);

    // FPS counter
    this._fpsFrames++;
    if (now - this._fpsLastCheck >= 500) {
      this._fpsDisplay = Math.round(this._fpsFrames / ((now - this._fpsLastCheck) / 1000));
      this._fpsFrames = 0;
      this._fpsLastCheck = now;
    }
    const ctx = this.renderer.ctx;
    ctx.font = '12px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(this._fpsDisplay + ' FPS', this.renderer.width - 10, 10);

    this.renderer.endFrame();
    requestAnimationFrame(this._loop);
  }

  _consumeKey(key) {
    const idx = this._pendingKeys.indexOf(key);
    if (idx !== -1) {
      this._pendingKeys.splice(idx, 1);
      return true;
    }
    return false;
  }

  _startGame() {
    this.input.clear();
    this.input.resetAllocations();
    this.difficulty.reset();
    this.achievements.resetGame();
    this.boxes = [];
    this.triangles = [];
    this.particles.clear();
    this._pendingMerges = [];
    this.elapsedTime = 0;
    this.recentColumns = [];
    this.recentColumnTimestamps = [];
    this.ui.resetDeathScreen();
    this._deathRank = 0;
    this._confirmedRank = 0;
    this._pendingKeys = [];
    this.soulOrbs.reset();

    const startX = this.renderer.width / 2 - PLAYER_WIDTH / 2;
    const startY = this.renderer.height - PLAYER_HEIGHT - 20;
    const keyPair = this.input.allocateKeyPair();
    this.boxes.push(new PlayerBox(startX, startY, PLAYER_WIDTH, PLAYER_HEIGHT, 0, keyPair));

    this.state = State.PLAYING;
    this._stateJustChanged = true;
    this._lastScoreAnnounce = 0;
    this._lastCelebration = 0;
    this.personality.onGameStart(this.boxes);
    announce('Game started. Use ' + keyPair.leftLabel + ' and ' + keyPair.rightLabel + ' to move.');
  }

  _updatePlaying(dt, now) {
    this.elapsedTime += dt;

    // Periodic score announcement for screen readers (every 10 seconds)
    const scoreInt = Math.floor(this.elapsedTime);
    if (scoreInt > 0 && scoreInt % 10 === 0 && scoreInt !== this._lastScoreAnnounce) {
      this._lastScoreAnnounce = scoreInt;
      announceScore(scoreInt + ' seconds. ' + this.boxes.length + ' boxes.');
    }

    // Update boxes
    for (const box of this.boxes) {
      box.update(dt, this.input, this.renderer.width);
    }

    // Box-to-box collisions (skip merging boxes)
    for (let i = 0; i < this.boxes.length; i++) {
      for (let j = i + 1; j < this.boxes.length; j++) {
        if (this.boxes[i].merging || this.boxes[j].merging) continue;
        const a = this.boxes[i].getBounds();
        const b = this.boxes[j].getBounds();
        const overlap = boxOverlap(a, b);
        if (overlap) {
          const pushEach = overlap.overlap / 2 + 1;
          if (overlap.aIsLeft) {
            this.boxes[i].x -= pushEach;
            this.boxes[j].x += pushEach;
          } else {
            this.boxes[i].x += pushEach;
            this.boxes[j].x -= pushEach;
          }
          const tempVel = this.boxes[i].velocity;
          this.boxes[i].velocity = this.boxes[j].velocity * BOX_COLLISION_DAMPING;
          this.boxes[j].velocity = tempVel * BOX_COLLISION_DAMPING;
        }
      }
    }

    // Spawn triangles
    this._cleanRecentColumns(now);
    if (this.difficulty.shouldSpawn(this.elapsedTime, this.triangles.length)) {
      const tier = this.difficulty.getTier(this.elapsedTime);
      const spawn = spawnTriangle(this.renderer.width, this.recentColumns);
      this.triangles.push(new Triangle(spawn.x, spawn.y, tier.fallSpeed, spawn.variant));
      this.recentColumns.push(spawn.col);
      this.recentColumnTimestamps.push(now);
    }

    // Update triangles and check collisions
    const trianglesToRemove = new Set();
    const boxesToRemove = [];
    const boxesToAdd = [];

    for (let t = 0; t < this.triangles.length; t++) {
      const tri = this.triangles[t];
      tri.update(dt);

      // Trail particles for triangles
      if (tri.y > 0) {
        if (tri.variant === 'heart') {
          this.particles.emitHeartTrail(tri.x, tri.y - tri.effectiveHeight * 0.5);
        } else {
          this.particles.emitTriangleTrail(tri.x, tri.y - 45);
        }
      }

      if (tri.isOffScreen(this.renderer.height)) {
        trianglesToRemove.add(t);
        this.achievements.onTriangleDodged();
        // Check if any box had a close call with this triangle
        for (const box of this.boxes) {
          const dist = Math.abs((box.x + box.width / 2) - tri.x);
          if (dist < box.width * 1.2) {
            this.personality.onDodge(box);
            break;
          }
        }
        continue;
      }

      const triBounds = tri.getBounds();
      const tip = tri.getTipPosition();

      for (let b = 0; b < this.boxes.length; b++) {
        if (boxesToRemove.includes(b)) continue;
        const box = this.boxes[b];
        if (box.isImmune(now)) continue;

        const boxBounds = box.getBounds();
        if (!aabbOverlap(triBounds, boxBounds)) continue;

        if (tipHitsBox(tip, boxBounds)) {
          if (tri.variant === 'heart') {
            // Heart triangle — merge or shield
            this.personality.onHeartPickup(box);
            this._handleHeartCollision(box, b, now);
            trianglesToRemove.add(t);
            break;
          }
          if (box.splitDepth >= MAX_SPLIT_DEPTH) {
            // Destroy — big red particle burst
            this.particles.emitDestroy(box.x, box.y, box.width, box.height);
            this.personality.onDestroy(box);
            this.personality.onSiblingDestroyed(this.boxes, box);
            boxesToRemove.push(b);
            this.renderer.triggerShake(now, 1.5);
            this.achievements.onBoxHit();
            this.soulOrbs.onPlayerHit();
          } else {
            // Split — both children get spatially-matched keys, parent keys returned
            this.particles.emitSplit(box.x, box.y, box.width, box.height);
            this.input.returnKeyPair(box.keyPair);
            const leftPair = this.input.allocateKeyPair('left');
            const rightPair = this.input.allocateKeyPair('right');
            if (!leftPair || !rightPair) {
              // No keys available — destroy the box instead
              if (leftPair) this.input.returnKeyPair(leftPair);
              if (rightPair) this.input.returnKeyPair(rightPair);
              this.particles.emitDestroy(box.x, box.y, box.width, box.height);
              this.personality.onDestroy(box);
              this.personality.onSiblingDestroyed(this.boxes, box);
              boxesToRemove.push(b);
              this.renderer.triggerShake(now, 1.5);
              this.achievements.onBoxHit();
              this.soulOrbs.onPlayerHit();
              trianglesToRemove.add(t);
              break;
            }
            // Override parent keyPair so left child inherits leftPair
            box.keyPair = leftPair;
            const children = box.split(rightPair, now);
            this.personality.onSplit(box, children);
            boxesToRemove.push(b);
            boxesToAdd.push(...children);
            this.renderer.triggerShake(now, 1);
            this.achievements.onBoxHit();
            this.achievements.onSplit();
            this.soulOrbs.onPlayerHit();
          }
          trianglesToRemove.add(t);
          break;
        } else {
          const triCenterX = tri.x;
          const boxCenterX = (boxBounds.left + boxBounds.right) / 2;
          const side = edgeContact(triCenterX, boxCenterX);
          const pushForce = 600;
          box.velocity += (side === 'left' ? 1 : -1) * pushForce * dt;
        }
      }
    }

    // Apply removals/additions
    boxesToRemove.sort((a, b) => b - a);
    for (const i of boxesToRemove) {
      this.boxes.splice(i, 1);
    }
    this.boxes.push(...boxesToAdd);

    const triIndices = [...trianglesToRemove].sort((a, b) => b - a);
    for (const i of triIndices) {
      this.triangles.splice(i, 1);
    }

    // Process pending merges — check if sliding boxes have met
    for (let m = this._pendingMerges.length - 1; m >= 0; m--) {
      const merge = this._pendingMerges[m];
      const aIdx = this.boxes.indexOf(merge.boxA);
      const bIdx = this.boxes.indexOf(merge.boxB);
      if (aIdx === -1 || bIdx === -1) {
        // One of the boxes was destroyed, cancel merge
        if (aIdx !== -1) merge.boxA.merging = false;
        if (bIdx !== -1) merge.boxB.merging = false;
        this._pendingMerges.splice(m, 1);
        continue;
      }

      const aCx = merge.boxA.x + merge.boxA.width / 2;
      const bCx = merge.boxB.x + merge.boxB.width / 2;
      if (Math.abs(aCx - bCx) < merge.mergedWidth * 0.6) {
        // Close enough — complete the merge
        const mergedX = (merge.boxA.x + merge.boxB.x) / 2;
        const mergedBox = new PlayerBox(
          mergedX, merge.boxA.y,
          merge.mergedWidth, merge.boxA.height,
          merge.boxA.splitDepth - 1, merge.boxA.keyPair
        );
        mergedBox.velocity = (merge.boxA.velocity + merge.boxB.velocity) / 2;
        mergedBox.immuneUntil = now + SPLIT_IMMUNITY_MS;

        // Return the consumed key pair
        this.input.returnKeyPair(merge.boxB.keyPair);

        // Cyan particle burst (healing)
        this.particles.emitMerge(mergedX, merge.boxA.y, merge.mergedWidth, merge.boxA.height);

        // Remove both boxes, add merged one
        const indices = [aIdx, bIdx].sort((a, b) => b - a);
        for (const i of indices) this.boxes.splice(i, 1);
        this.boxes.push(mergedBox);

        this._pendingMerges.splice(m, 1);
      }
    }

    // Soul Orb system update
    if (!this.soulOrbs.isMerging) {
      const orbResult = this.soulOrbs.update(
        dt, now, this.elapsedTime, this.boxes,
        this.renderer.width, this.renderer.height,
        this.difficulty, this.particles, this.renderer
      );
      if (orbResult === 'merge') {
        const mergeData = this.soulOrbs.triggerMerge(
          now, this.boxes, this.particles, this.renderer, this.input
        );
        if (mergeData) {
          this._pendingMerges.push(mergeData);
        }
      }
    } else {
      // During merge freeze, just update the merge timer
      this.soulOrbs.update(
        dt, now, this.elapsedTime, this.boxes,
        this.renderer.width, this.renderer.height,
        this.difficulty, this.particles, this.renderer
      );
    }

    // Update particles
    this.particles.update(dt);

    // Update personality system
    this.personality.update(dt, now, this.boxes);

    // 30s celebration
    if (this.elapsedTime >= 30 && (!this._lastCelebration || this.elapsedTime - this._lastCelebration >= 30)) {
      this._lastCelebration = Math.floor(this.elapsedTime / 30) * 30;
      this.personality.triggerCelebration(now);
    }

    // Update achievements
    this.achievements.update({
      boxes: this.boxes,
      triangles: this.triangles,
      elapsedTime: this.elapsedTime,
      canvasWidth: this.renderer.width,
    });

    // Check death
    if (this.boxes.length === 0) {
      this.finalScore = this.elapsedTime;
      this.ui.updateHighScore(this.finalScore);
      this._deathRank = this.leaderboard.qualifies(this.finalScore);

      if (this._deathRank > 0) {
        this.ui.resetNameEntry();
        this.state = State.ENTERING_NAME;
        announce('Game over! Score: ' + this.finalScore.toFixed(1) + ' seconds. Rank ' + this._deathRank + '! Enter your initials.');
      } else {
        this.state = State.DEAD;
        announce('Game over! Score: ' + this.finalScore.toFixed(1) + ' seconds. Press any key to retry.');
      }
      this._stateJustChanged = true;
    }
  }

  _renderPlaying(now, dt) {
    const ctx = this.renderer.ctx;

    for (const box of this.boxes) {
      box.render(ctx, now);
    }
    for (const tri of this.triangles) {
      tri.render(ctx);
    }

    // Render soul orb (between game objects and particles)
    this.soulOrbs.renderOrb(ctx, now);

    // Particles on top of game objects
    this.particles.render(ctx);

    // Kawaii personality: sparkles, speech bubbles, anime text
    this.personality.render(ctx, this.boxes);

    this.ui.renderScore(ctx, this.elapsedTime, this.renderer.width);

    // Soul orb counter at bottom
    this.soulOrbs.renderCounter(ctx, this.renderer.width, this.renderer.height, now);
  }

  _handleHeartCollision(box, boxIndex, now) {
    if (box.splitDepth <= 0 || box.merging) {
      // Can't merge further — grant brief shield/immunity instead
      box.immuneUntil = Math.max(box.immuneUntil, now + HEART_SHIELD_DURATION_MS);
      this.particles.emitMerge(box.x, box.y, box.width, box.height);
      return;
    }

    // Find nearest sibling at the same split depth
    let nearestIdx = -1;
    let nearestDist = Infinity;
    const boxCx = box.x + box.width / 2;

    for (let i = 0; i < this.boxes.length; i++) {
      if (i === boxIndex) continue;
      const other = this.boxes[i];
      if (other.splitDepth !== box.splitDepth) continue;
      if (other.merging) continue;
      const dist = Math.abs((other.x + other.width / 2) - boxCx);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }

    if (nearestIdx === -1) {
      // No sibling found — grant shield instead
      box.immuneUntil = Math.max(box.immuneUntil, now + HEART_SHIELD_DURATION_MS);
      this.particles.emitMerge(box.x, box.y, box.width, box.height);
      return;
    }

    const sibling = this.boxes[nearestIdx];
    const mergedWidth = box.width * 2;

    // Calculate midpoint for both to slide toward
    const midX = ((box.x + box.width / 2) + (sibling.x + sibling.width / 2)) / 2;

    // Start merge animation
    box.merging = true;
    box.mergeTargetX = midX - box.width / 2;
    sibling.merging = true;
    sibling.mergeTargetX = midX - sibling.width / 2;

    // Make both immune during merge
    box.immuneUntil = now + 2000;
    sibling.immuneUntil = now + 2000;

    this._pendingMerges.push({
      boxA: box,
      boxB: sibling,
      targetX: midX,
      targetY: box.y,
      mergedWidth,
    });
  }

  _cleanRecentColumns(now) {
    while (
      this.recentColumnTimestamps.length > 0 &&
      now - this.recentColumnTimestamps[0] > TRIANGLE_COLUMN_COOLDOWN_MS
    ) {
      this.recentColumns.shift();
      this.recentColumnTimestamps.shift();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  new Game(canvas);
});

// src/game.js — Game loop, state machine, initialization
import { InputManager } from './input.js';
import { DifficultyManager } from './difficulty.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { PlayerBox } from './player.js';
import { Triangle, spawnTriangle } from './triangle.js';
import { ParticleSystem } from './particles.js';
import { aabbOverlap, tipHitsBox, edgeContact, boxOverlap } from './collision.js';
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, MAX_SPLIT_DEPTH,
  TRIANGLE_COLUMN_COOLDOWN_MS, BOX_COLLISION_DAMPING,
} from './constants.js';

const State = { READY: 'READY', PLAYING: 'PLAYING', DEAD: 'DEAD' };

class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.difficulty = new DifficultyManager();
    this.ui = new UI();
    this.particles = new ParticleSystem();

    this.state = State.READY;
    this.boxes = [];
    this.triangles = [];
    this.elapsedTime = 0;
    this.finalScore = 0;
    this.recentColumns = [];
    this.recentColumnTimestamps = [];

    this._lastFrameTime = 0;
    this._stateJustChanged = false;

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
        if (this.input.anyKeyPressed() && !this._stateJustChanged) {
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
          this.finalScore, now
        );
        if (this.input.anyKeyPressed() && !this._stateJustChanged) {
          this.input.clear();
          this.state = State.READY;
          this._stateJustChanged = true;
          this.ui.resetReadyScreen();
        }
        this._stateJustChanged = false;
        break;
    }

    this.renderer.endFrame();
    requestAnimationFrame(this._loop);
  }

  _startGame() {
    this.input.clear();
    this.input.resetAllocations();
    this.difficulty.reset();
    this.boxes = [];
    this.triangles = [];
    this.particles.clear();
    this.elapsedTime = 0;
    this.recentColumns = [];
    this.recentColumnTimestamps = [];
    this.ui.resetDeathScreen();

    const startX = this.renderer.width / 2 - PLAYER_WIDTH / 2;
    const startY = this.renderer.height - PLAYER_HEIGHT - 20;
    const keyPair = this.input.allocateKeyPair();
    this.boxes.push(new PlayerBox(startX, startY, PLAYER_WIDTH, PLAYER_HEIGHT, 0, keyPair));

    this.state = State.PLAYING;
    this._stateJustChanged = true;
  }

  _updatePlaying(dt, now) {
    this.elapsedTime += dt;

    // Update boxes
    for (const box of this.boxes) {
      box.update(dt, this.input, this.renderer.width);
    }

    // Box-to-box collisions
    for (let i = 0; i < this.boxes.length; i++) {
      for (let j = i + 1; j < this.boxes.length; j++) {
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
      this.triangles.push(new Triangle(spawn.x, spawn.y, tier.fallSpeed));
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
        this.particles.emitTriangleTrail(tri.x, tri.y - 45);
      }

      if (tri.isOffScreen(this.renderer.height)) {
        trianglesToRemove.add(t);
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
          if (box.splitDepth >= MAX_SPLIT_DEPTH) {
            // Destroy — big red particle burst
            this.particles.emitDestroy(box.x, box.y, box.width, box.height);
            boxesToRemove.push(b);
            this.renderer.triggerShake(now, 1.5);
          } else {
            // Split — cyan particle burst
            this.particles.emitSplit(box.x, box.y, box.width, box.height);
            const newPair = this.input.allocateKeyPair();
            const children = box.split(newPair, now);
            boxesToRemove.push(b);
            boxesToAdd.push(...children);
            this.renderer.triggerShake(now, 1);
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

    // Update particles
    this.particles.update(dt);

    // Check death
    if (this.boxes.length === 0) {
      this.finalScore = this.elapsedTime;
      this.ui.updateHighScore(this.finalScore);
      this.state = State.DEAD;
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

    // Particles on top of game objects
    this.particles.render(ctx);

    this.ui.renderScore(ctx, this.elapsedTime, this.renderer.width);
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

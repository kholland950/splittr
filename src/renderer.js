// src/renderer.js — Canvas drawing utilities, animated background, screen shake, bg particles, death flash
import {
  SHAKE_DURATION_MS, SHAKE_MAGNITUDE,
  TRIANGLE_WIDTH, BG_PARTICLE_COUNT,
} from './constants.js';
import { getCurrentSkin } from './skins.js';
import { prefersReducedMotion } from './accessibility.js';

class BgStar {
  constructor(w, h) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = 0.5 + Math.random() * 2;
    this.speed = 5 + Math.random() * 15;
    this.alpha = 0.1 + Math.random() * 0.3;
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = 0.5 + Math.random() * 2;
  }

  update(dt, h) {
    this.y += this.speed * dt;
    this.twinklePhase += this.twinkleSpeed * dt;
    if (this.y > h + 10) {
      this.y = -10;
      this.x = Math.random() * 2000;
    }
  }

  render(ctx) {
    const twinkle = 0.5 + 0.5 * Math.sin(this.twinklePhase);
    ctx.globalAlpha = this.alpha * twinkle;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._shakeUntil = 0;
    this._shakeOffsetX = 0;
    this._shakeOffsetY = 0;
    this._shakeIntensity = 1;
    this._gridOffset = 0;
    this._bgStars = [];
    this._deathFlashAlpha = 0;
    this._difficultyIntensity = 0; // 0-1, controls background color shift
    this.resize();
    this._initBgStars();
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    // Re-init stars on resize
    if (this._bgStars.length > 0) this._initBgStars();
  }

  _initBgStars() {
    this._bgStars = [];
    for (let i = 0; i < BG_PARTICLE_COUNT; i++) {
      this._bgStars.push(new BgStar(this.width, this.height));
    }
  }

  setDifficultyIntensity(intensity) {
    this._difficultyIntensity = Math.min(1, Math.max(0, intensity));
  }

  triggerShake(now, intensity = 1) {
    if (prefersReducedMotion()) return; // Skip screen shake for reduced motion
    this._shakeUntil = now + SHAKE_DURATION_MS;
    this._shakeIntensity = intensity;
  }

  triggerDeathFlash() {
    if (prefersReducedMotion()) return; // Skip flash for reduced motion
    this._deathFlashAlpha = 1;
  }

  beginFrame(now, dt = 0) {
    const ctx = this.ctx;

    // Update background stars
    for (const star of this._bgStars) {
      star.update(dt, this.height);
    }

    // Slowly drift the grid downward for a subtle parallax feel
    this._gridOffset = (this._gridOffset + dt * 15) % TRIANGLE_WIDTH;

    // Apply screen shake with decay
    if (now < this._shakeUntil) {
      const progress = (this._shakeUntil - now) / SHAKE_DURATION_MS;
      const mag = SHAKE_MAGNITUDE * this._shakeIntensity * progress;
      this._shakeOffsetX = (Math.random() - 0.5) * mag * 2;
      this._shakeOffsetY = (Math.random() - 0.5) * mag * 2;
    } else {
      this._shakeOffsetX = 0;
      this._shakeOffsetY = 0;
    }

    ctx.save();
    ctx.translate(this._shakeOffsetX, this._shakeOffsetY);

    // Background with skin colors
    const skin = getCurrentSkin();

    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
    );
    gradient.addColorStop(0, skin.backgroundCenter);
    gradient.addColorStop(1, skin.backgroundColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Background stars
    for (const star of this._bgStars) {
      star.render(ctx);
    }

    // Animated grid with gradient fade
    const gridSize = TRIANGLE_WIDTH;
    ctx.strokeStyle = skin.gridColor;
    ctx.lineWidth = 1;

    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    for (let y = -gridSize + this._gridOffset; y < this.height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Top edge vignette — danger zone glow
    const topGlow = ctx.createLinearGradient(0, 0, 0, 120);
    topGlow.addColorStop(0, skin.dangerGlow);
    topGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, this.width, 120);

    // Death flash overlay (white flash that fades)
    if (this._deathFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this._deathFlashAlpha})`;
      ctx.fillRect(-50, -50, this.width + 100, this.height + 100);
      this._deathFlashAlpha -= dt * 4;
      if (this._deathFlashAlpha < 0) this._deathFlashAlpha = 0;
    }
  }

  endFrame() {
    this.ctx.restore();
  }
}

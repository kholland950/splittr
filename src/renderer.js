// src/renderer.js — Canvas drawing utilities, animated background, and screen shake
import {
  COLOR_BACKGROUND, COLOR_GRID,
  SHAKE_DURATION_MS, SHAKE_MAGNITUDE,
  TRIANGLE_WIDTH,
} from './constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._shakeUntil = 0;
    this._shakeOffsetX = 0;
    this._shakeOffsetY = 0;
    this._shakeIntensity = 1;
    this._gridOffset = 0;
    this.resize();
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  triggerShake(now, intensity = 1) {
    this._shakeUntil = now + SHAKE_DURATION_MS;
    this._shakeIntensity = intensity;
  }

  beginFrame(now, dt = 0) {
    const ctx = this.ctx;

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

    // Background with subtle radial gradient
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) * 0.7
    );
    gradient.addColorStop(0, '#101440');
    gradient.addColorStop(1, COLOR_BACKGROUND);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    // Animated grid with gradient fade
    const gridSize = TRIANGLE_WIDTH;
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }

    // Horizontal lines — drift downward
    for (let y = -gridSize + this._gridOffset; y < this.height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Top edge vignette — danger zone glow
    const topGlow = ctx.createLinearGradient(0, 0, 0, 120);
    topGlow.addColorStop(0, 'rgba(255, 23, 68, 0.06)');
    topGlow.addColorStop(1, 'rgba(255, 23, 68, 0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, this.width, 120);
  }

  endFrame() {
    this.ctx.restore();
  }
}

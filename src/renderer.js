// src/renderer.js — Canvas drawing utilities and screen shake
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
    this.resize();
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  triggerShake(now) {
    this._shakeUntil = now + SHAKE_DURATION_MS;
  }

  beginFrame(now) {
    const ctx = this.ctx;

    // Apply screen shake
    if (now < this._shakeUntil) {
      this._shakeOffsetX = (Math.random() - 0.5) * SHAKE_MAGNITUDE * 2;
      this._shakeOffsetY = (Math.random() - 0.5) * SHAKE_MAGNITUDE * 2;
    } else {
      this._shakeOffsetX = 0;
      this._shakeOffsetY = 0;
    }

    ctx.save();
    ctx.translate(this._shakeOffsetX, this._shakeOffsetY);

    // Clear and draw background
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle grid
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    const gridSize = TRIANGLE_WIDTH;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  endFrame() {
    this.ctx.restore();
  }
}

// src/triangle.js — Triangle enemy class
import { TRIANGLE_WIDTH, TRIANGLE_HEIGHT, COLOR_TRIANGLE } from './constants.js';

export class Triangle {
  constructor(x, y, fallSpeed) {
    this.x = x;           // center-x of triangle
    this.y = y;            // tip (bottom) y position
    this.fallSpeed = fallSpeed;
    this._wobblePhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.y += this.fallSpeed * dt;
    this._wobblePhase += dt * 8;
  }

  isOffScreen(canvasHeight) {
    return this.y - TRIANGLE_HEIGHT > canvasHeight;
  }

  getTipPosition() {
    return { tipX: this.x, tipY: this.y };
  }

  getBounds() {
    return {
      left: this.x - TRIANGLE_WIDTH / 2,
      right: this.x + TRIANGLE_WIDTH / 2,
      top: this.y - TRIANGLE_HEIGHT,
      bottom: this.y,
    };
  }

  render(ctx) {
    // Subtle horizontal wobble
    const wobble = Math.sin(this._wobblePhase) * 1.5;
    const tx = this.x + wobble;

    // Glow
    ctx.shadowColor = COLOR_TRIANGLE;
    ctx.shadowBlur = 15;

    // Gradient fill
    const grad = ctx.createLinearGradient(tx, this.y - TRIANGLE_HEIGHT, tx, this.y);
    grad.addColorStop(0, '#ff6b6b');
    grad.addColorStop(0.5, COLOR_TRIANGLE);
    grad.addColorStop(1, '#cc0033');
    ctx.fillStyle = grad;

    // Main triangle
    ctx.beginPath();
    ctx.moveTo(tx, this.y);                                            // tip (bottom center)
    ctx.lineTo(tx - TRIANGLE_WIDTH / 2, this.y - TRIANGLE_HEIGHT);    // top left
    ctx.lineTo(tx + TRIANGLE_WIDTH / 2, this.y - TRIANGLE_HEIGHT);    // top right
    ctx.closePath();
    ctx.fill();

    // Inner highlight triangle
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    const inset = 6;
    const innerH = TRIANGLE_HEIGHT - inset * 2;
    const innerW = TRIANGLE_WIDTH * (innerH / TRIANGLE_HEIGHT);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(tx, this.y - inset);
    ctx.lineTo(tx - innerW / 2, this.y - TRIANGLE_HEIGHT + inset);
    ctx.lineTo(tx + innerW / 2, this.y - TRIANGLE_HEIGHT + inset);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, this.y);
    ctx.lineTo(tx - TRIANGLE_WIDTH / 2, this.y - TRIANGLE_HEIGHT);
    ctx.lineTo(tx + TRIANGLE_WIDTH / 2, this.y - TRIANGLE_HEIGHT);
    ctx.closePath();
    ctx.stroke();
  }
}

export function spawnTriangle(canvasWidth, recentColumns) {
  const columnCount = Math.floor(canvasWidth / TRIANGLE_WIDTH);
  let col;
  let attempts = 0;
  do {
    col = Math.floor(Math.random() * columnCount);
    attempts++;
  } while (recentColumns.includes(col) && attempts < 20);

  const x = col * TRIANGLE_WIDTH + TRIANGLE_WIDTH / 2;
  const y = -TRIANGLE_HEIGHT;
  return { x, y, col };
}

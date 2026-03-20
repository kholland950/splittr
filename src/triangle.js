// src/triangle.js — Triangle enemy class
import { TRIANGLE_WIDTH, TRIANGLE_HEIGHT, COLOR_TRIANGLE } from './constants.js';

export class Triangle {
  constructor(x, y, fallSpeed) {
    this.x = x;           // center-x of triangle
    this.y = y;            // tip (bottom) y position
    this.fallSpeed = fallSpeed;
  }

  update(dt) {
    this.y += this.fallSpeed * dt;
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
    ctx.fillStyle = COLOR_TRIANGLE;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);                                    // tip (bottom center)
    ctx.lineTo(this.x - TRIANGLE_WIDTH / 2, this.y - TRIANGLE_HEIGHT); // top left
    ctx.lineTo(this.x + TRIANGLE_WIDTH / 2, this.y - TRIANGLE_HEIGHT); // top right
    ctx.closePath();
    ctx.fill();
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
  // fallSpeed is set by caller from DifficultyManager
  return { x, y, col };
}

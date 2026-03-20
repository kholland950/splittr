// src/triangle.js — Triangle enemy class with variety
import {
  TRIANGLE_WIDTH, TRIANGLE_HEIGHT, COLOR_TRIANGLE, COLOR_GOLDEN, COLOR_HEART,
  GOLDEN_TRIANGLE_CHANCE, BIG_TRIANGLE_CHANCE, FAST_TRIANGLE_CHANCE,
  WOBBLE_TRIANGLE_CHANCE, HEART_TRIANGLE_CHANCE,
} from './constants.js';
import { getCurrentSkin } from './skins.js';

export class Triangle {
  constructor(x, y, fallSpeed, variant = 'normal') {
    this.x = x;           // center-x of triangle
    this.y = y;            // tip (bottom) y position
    this.variant = variant;
    this._wobblePhase = Math.random() * Math.PI * 2;

    // Apply variant modifiers
    this.sizeMultiplier = 1;
    this.wobbleIntensity = 1.5;

    if (variant === 'golden') {
      this.fallSpeed = fallSpeed * 0.7; // slower
      this.sizeMultiplier = 1.1;
      this.wobbleIntensity = 3;
    } else if (variant === 'big') {
      this.fallSpeed = fallSpeed * 0.8;
      this.sizeMultiplier = 1.6;
      this.wobbleIntensity = 1;
    } else if (variant === 'fast') {
      this.fallSpeed = fallSpeed * 1.5;
      this.sizeMultiplier = 0.85;
      this.wobbleIntensity = 0.5;
    } else if (variant === 'wobbler') {
      this.fallSpeed = fallSpeed;
      this.wobbleIntensity = 6;
    } else if (variant === 'heart') {
      this.fallSpeed = fallSpeed * 0.6; // slower than normal
      this.sizeMultiplier = 1.15;
      this.wobbleIntensity = 0; // handled by custom drift
      this._driftPhase = Math.random() * Math.PI * 2;
    } else {
      this.fallSpeed = fallSpeed;
    }
  }

  get effectiveWidth() {
    return TRIANGLE_WIDTH * this.sizeMultiplier;
  }

  get effectiveHeight() {
    return TRIANGLE_HEIGHT * this.sizeMultiplier;
  }

  update(dt) {
    this.y += this.fallSpeed * dt;
    this._wobblePhase += dt * 8;
    if (this.variant === 'heart') {
      this._driftPhase += dt * 2;
      this.x += Math.sin(this._driftPhase) * 40 * dt;
    }
  }

  isOffScreen(canvasHeight) {
    return this.y - this.effectiveHeight > canvasHeight;
  }

  getTipPosition() {
    return { tipX: this.x, tipY: this.y };
  }

  getBounds() {
    return {
      left: this.x - this.effectiveWidth / 2,
      right: this.x + this.effectiveWidth / 2,
      top: this.y - this.effectiveHeight,
      bottom: this.y,
    };
  }

  render(ctx) {
    const wobble = Math.sin(this._wobblePhase) * this.wobbleIntensity;
    const tx = this.x + wobble;
    const w = this.effectiveWidth;
    const h = this.effectiveHeight;

    if (this.variant === 'heart') {
      this._renderHeart(ctx, tx, w, h);
    } else if (this.variant === 'golden') {
      this._renderGolden(ctx, tx, w, h);
    } else if (this.variant === 'fast') {
      this._renderFast(ctx, tx, w, h);
    } else {
      this._renderNormal(ctx, tx, w, h);
    }
  }

  _renderNormal(ctx, tx, w, h) {
    const skin = getCurrentSkin();
    // Glow
    ctx.shadowColor = skin.triangleGlow;
    ctx.shadowBlur = 15;

    // Gradient fill
    const grad = ctx.createLinearGradient(tx, this.y - h, tx, this.y);
    grad.addColorStop(0, skin.triangleGradientTop);
    grad.addColorStop(0.5, skin.triangleColor);
    grad.addColorStop(1, skin.triangleGradientBottom);
    ctx.fillStyle = grad;

    // Main triangle
    ctx.beginPath();
    ctx.moveTo(tx, this.y);
    ctx.lineTo(tx - w / 2, this.y - h);
    ctx.lineTo(tx + w / 2, this.y - h);
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    const inset = 6 * this.sizeMultiplier;
    const innerH = h - inset * 2;
    const innerW = w * (innerH / h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.moveTo(tx, this.y - inset);
    ctx.lineTo(tx - innerW / 2, this.y - h + inset);
    ctx.lineTo(tx + innerW / 2, this.y - h + inset);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = skin.triangleBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, this.y);
    ctx.lineTo(tx - w / 2, this.y - h);
    ctx.lineTo(tx + w / 2, this.y - h);
    ctx.closePath();
    ctx.stroke();
  }

  _renderGolden(ctx, tx, w, h) {
    const pulse = 0.8 + 0.2 * Math.sin(performance.now() / 150);

    // Golden glow
    ctx.shadowColor = COLOR_GOLDEN;
    ctx.shadowBlur = 25 * pulse;

    // Golden gradient
    const grad = ctx.createLinearGradient(tx, this.y - h, tx, this.y);
    grad.addColorStop(0, '#fff8dc');
    grad.addColorStop(0.3, '#ffd700');
    grad.addColorStop(0.7, '#ffaa00');
    grad.addColorStop(1, '#ff8c00');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(tx, this.y);
    ctx.lineTo(tx - w / 2, this.y - h);
    ctx.lineTo(tx + w / 2, this.y - h);
    ctx.closePath();
    ctx.fill();

    // Star sparkle on top
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * pulse})`;
    const starY = this.y - h * 0.6;
    const starSize = 4;
    ctx.beginPath();
    ctx.moveTo(tx, starY - starSize);
    ctx.lineTo(tx + starSize * 0.3, starY);
    ctx.lineTo(tx, starY + starSize);
    ctx.lineTo(tx - starSize * 0.3, starY);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx - starSize, starY);
    ctx.lineTo(tx, starY - starSize * 0.3);
    ctx.lineTo(tx + starSize, starY);
    ctx.lineTo(tx, starY + starSize * 0.3);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(tx, this.y);
    ctx.lineTo(tx - w / 2, this.y - h);
    ctx.lineTo(tx + w / 2, this.y - h);
    ctx.closePath();
    ctx.stroke();
  }

  _renderHeart(ctx, tx, w, h) {
    const now = performance.now();
    const pulse = 0.85 + 0.15 * Math.sin(now / 200);
    const size = (Math.min(w, h) * 0.55) * pulse;

    // Center the heart in the triangle's bounding area
    const cx = tx;
    const cy = this.y - h * 0.5;

    // Glow
    ctx.shadowColor = COLOR_HEART;
    ctx.shadowBlur = 18 + 8 * Math.sin(now / 300);

    // Heart gradient
    const grad = ctx.createRadialGradient(cx, cy - size * 0.2, 0, cx, cy, size * 1.2);
    grad.addColorStop(0, '#ff99cc');
    grad.addColorStop(0.5, COLOR_HEART);
    grad.addColorStop(1, '#cc1155');
    ctx.fillStyle = grad;

    // Draw heart shape
    ctx.beginPath();
    ctx.moveTo(cx, cy + size * 0.7);
    // Left curve
    ctx.bezierCurveTo(
      cx - size * 1.2, cy + size * 0.1,
      cx - size * 1.2, cy - size * 0.7,
      cx, cy - size * 0.35
    );
    // Right curve
    ctx.bezierCurveTo(
      cx + size * 1.2, cy - size * 0.7,
      cx + size * 1.2, cy + size * 0.1,
      cx, cy + size * 0.7
    );
    ctx.closePath();
    ctx.fill();

    // Inner highlight
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = `rgba(255, 255, 255, ${0.15 + 0.1 * Math.sin(now / 250)})`;
    const hs = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + hs * 0.3);
    ctx.bezierCurveTo(
      cx - hs * 1.2, cy - hs * 0.1,
      cx - hs * 1.0, cy - hs * 0.7,
      cx, cy - hs * 0.35
    );
    ctx.bezierCurveTo(
      cx + hs * 1.0, cy - hs * 0.7,
      cx + hs * 1.2, cy - hs * 0.1,
      cx, cy + hs * 0.3
    );
    ctx.closePath();
    ctx.fill();

    // Sparkles around the heart
    ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + 0.3 * Math.sin(now / 180)})`;
    for (let i = 0; i < 3; i++) {
      const angle = (now / 800 + i * Math.PI * 2 / 3);
      const dist = size * 1.3 + Math.sin(now / 250 + i) * 3;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      const sparkSize = 1.5 + Math.sin(now / 200 + i * 2) * 1;
      ctx.beginPath();
      ctx.arc(sx, sy, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderFast(ctx, tx, w, h) {
    const skin = getCurrentSkin();
    // Speed lines behind fast triangles
    ctx.strokeStyle = skin.triangleBorder;
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const offset = (i + 1) * 8;
      ctx.beginPath();
      ctx.moveTo(tx - w / 3 + i * 5, this.y - h - offset);
      ctx.lineTo(tx - w / 3 + i * 5, this.y - h - offset - 15);
      ctx.stroke();
    }

    // Render like normal but with brighter color
    ctx.shadowColor = skin.fastGlow;
    ctx.shadowBlur = 20;

    const grad = ctx.createLinearGradient(tx, this.y - h, tx, this.y);
    grad.addColorStop(0, skin.fastGradientTop);
    grad.addColorStop(0.5, skin.fastGradientMid);
    grad.addColorStop(1, skin.fastGradientBottom);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(tx, this.y);
    ctx.lineTo(tx - w / 2, this.y - h);
    ctx.lineTo(tx + w / 2, this.y - h);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    ctx.strokeStyle = skin.triangleBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx, this.y);
    ctx.lineTo(tx - w / 2, this.y - h);
    ctx.lineTo(tx + w / 2, this.y - h);
    ctx.closePath();
    ctx.stroke();
  }
}

// Smart spawning: when boxes are provided, bias spawn toward box positions
export function spawnTriangle(canvasWidth, recentColumns, boxes = null) {
  const columnCount = Math.floor(canvasWidth / TRIANGLE_WIDTH);
  let col;
  let attempts = 0;

  // Anti-cheese: detect if all boxes are camping in edges (within 15% of screen width)
  const edgeZone = canvasWidth * 0.15;
  let allInCorner = false;
  if (boxes && boxes.length > 0) {
    allInCorner = boxes.every(b => {
      const cx = b.x + b.width / 2;
      return cx < edgeZone || cx > canvasWidth - edgeZone;
    });
  }

  // Smart targeting: 40% normally, 85% if camping in corners
  const targetChance = allInCorner ? 0.85 : 0.4;
  const shouldTarget = boxes && boxes.length >= 1 && Math.random() < targetChance;

  if (shouldTarget) {
    // Pick a random box and aim at it
    const targetBox = boxes[Math.floor(Math.random() * boxes.length)];
    const targetX = targetBox.x + targetBox.width / 2;
    const targetCol = Math.floor(targetX / TRIANGLE_WIDTH);
    // Tighter spread when anti-cheesing (0 spread = dead-on)
    const maxSpread = allInCorner ? 1 : 2;
    const spread = Math.floor(Math.random() * (maxSpread * 2 + 1)) - maxSpread;
    col = Math.max(0, Math.min(columnCount - 1, targetCol + spread));
    if (recentColumns.includes(col)) {
      col = null;
    }
  }

  if (col == null) {
    do {
      col = Math.floor(Math.random() * columnCount);
      attempts++;
    } while (recentColumns.includes(col) && attempts < 20);
  }

  const x = col * TRIANGLE_WIDTH + TRIANGLE_WIDTH / 2;
  const y = -TRIANGLE_HEIGHT;

  // Determine variant
  const roll = Math.random();
  let variant = 'normal';
  let cumulative = 0;
  if (roll < (cumulative += HEART_TRIANGLE_CHANCE)) {
    variant = 'heart';
  } else if (roll < (cumulative += GOLDEN_TRIANGLE_CHANCE)) {
    variant = 'golden';
  } else if (roll < (cumulative += BIG_TRIANGLE_CHANCE)) {
    variant = 'big';
  } else if (roll < (cumulative += FAST_TRIANGLE_CHANCE)) {
    variant = 'fast';
  } else if (roll < (cumulative += WOBBLE_TRIANGLE_CHANCE)) {
    variant = 'wobbler';
  }

  return { x, y, col, variant };
}

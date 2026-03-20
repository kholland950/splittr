// src/player.js — PlayerBox class
import {
  PLAYER_ACCEL, PLAYER_FRICTION, PLAYER_WALL_BOUNCE,
  SPLIT_FLY_APART_MULTIPLIER, SPLIT_INITIAL_VELOCITY,
  SPLIT_IMMUNITY_MS,
} from './constants.js';

export class PlayerBox {
  constructor(x, y, width, height, splitDepth, keyPair) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.splitDepth = splitDepth;
    this.keyPair = keyPair;
    this.velocity = 0;
    this.immuneUntil = 0;
  }

  update(dt, input, canvasWidth) {
    let accel = 0;
    if (input.isDown(this.keyPair.left)) accel -= PLAYER_ACCEL;
    if (input.isDown(this.keyPair.right)) accel += PLAYER_ACCEL;

    // Friction opposes current velocity
    if (this.velocity !== 0) {
      const frictionSign = this.velocity > 0 ? -1 : 1;
      accel += PLAYER_FRICTION * frictionSign;
    }

    this.velocity += accel * dt;

    // Stop at near-zero velocity to prevent jitter
    if (Math.abs(this.velocity) < 1 && accel === 0) {
      this.velocity = 0;
    }

    this.x += this.velocity * dt;

    // Wall bounce
    if (this.x < 0) {
      this.x = 0;
      this.velocity *= -PLAYER_WALL_BOUNCE;
    } else if (this.x + this.width > canvasWidth) {
      this.x = canvasWidth - this.width;
      this.velocity *= -PLAYER_WALL_BOUNCE;
    }
  }

  split(newKeyPair, now = performance.now()) {
    const childWidth = this.width / 2;
    const childHeight = this.height;
    const separation = childWidth * SPLIT_FLY_APART_MULTIPLIER;
    const centerX = this.x + this.width / 2;

    const left = new PlayerBox(
      centerX - separation - childWidth / 2,
      this.y, childWidth, childHeight,
      this.splitDepth + 1, this.keyPair
    );
    left.velocity = -SPLIT_INITIAL_VELOCITY;
    left.immuneUntil = now + SPLIT_IMMUNITY_MS;

    const right = new PlayerBox(
      centerX + separation - childWidth / 2,
      this.y, childWidth, childHeight,
      this.splitDepth + 1, newKeyPair
    );
    right.velocity = SPLIT_INITIAL_VELOCITY;
    right.immuneUntil = now + SPLIT_IMMUNITY_MS;

    return [left, right];
  }

  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }

  isImmune(now) {
    return now < this.immuneUntil;
  }

  render(ctx, now) {
    const immune = this.isImmune(now);

    // Flashing during immunity
    if (immune) {
      ctx.globalAlpha = Math.floor(now / 60) % 2 === 0 ? 0.3 : 1.0;
    }

    // Glow effect
    const glowHue = 190;
    const glowLightness = 50 + this.splitDepth * 8;
    ctx.shadowColor = `hsl(${glowHue}, 100%, ${glowLightness}%)`;
    ctx.shadowBlur = immune ? 20 + Math.sin(now / 50) * 10 : 12;

    // Gradient fill that lightens with split depth
    const lightBase = Math.min(40 + this.splitDepth * 10, 75);
    const lightTop = Math.min(55 + this.splitDepth * 10, 90);
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
    grad.addColorStop(0, `hsl(${glowHue}, 100%, ${lightTop}%)`);
    grad.addColorStop(1, `hsl(${glowHue}, 100%, ${lightBase}%)`);
    ctx.fillStyle = grad;

    // Rounded rectangle
    const r = Math.min(6, this.width / 8);
    this._roundRect(ctx, this.x, this.y, this.width, this.height, r);
    ctx.fill();

    // Inner highlight (top edge shine)
    const shine = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height * 0.4);
    shine.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
    shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = shine;
    this._roundRect(ctx, this.x, this.y, this.width, this.height, r);
    ctx.fill();

    // Border
    ctx.strokeStyle = `hsla(${glowHue}, 100%, ${lightTop + 10}%, 0.6)`;
    ctx.lineWidth = 1.5;
    this._roundRect(ctx, this.x, this.y, this.width, this.height, r);
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    // Key labels on the box face
    const fontSize = Math.max(10, Math.min(24, this.width / 3));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerY = this.y + this.height / 2;
    const quarter = this.width / 4;

    // Text shadow for readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(this.keyPair.leftLabel, this.x + quarter + 1, centerY + 1);
    ctx.fillText(this.keyPair.rightLabel, this.x + this.width - quarter + 1, centerY + 1);

    // Actual text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(this.keyPair.leftLabel, this.x + quarter, centerY);
    ctx.fillText(this.keyPair.rightLabel, this.x + this.width - quarter, centerY);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

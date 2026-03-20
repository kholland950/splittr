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
    // Flashing during immunity
    if (this.isImmune(now)) {
      ctx.globalAlpha = Math.floor(now / 60) % 2 === 0 ? 0.3 : 1.0;
    }

    // Box color lightens with split depth
    const lightness = Math.min(50 + this.splitDepth * 10, 90);
    ctx.fillStyle = `hsl(190, 100%, ${lightness}%)`;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.globalAlpha = 1.0;

    // Key labels on the box face
    const fontSize = Math.max(10, Math.min(24, this.width / 3));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerY = this.y + this.height / 2;
    const quarter = this.width / 4;
    ctx.fillText(this.keyPair.leftLabel, this.x + quarter, centerY);
    ctx.fillText(this.keyPair.rightLabel, this.x + this.width - quarter, centerY);
  }
}

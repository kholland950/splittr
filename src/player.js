// src/player.js — PlayerBox class with trail, speed lines, shield, and kawaii faces
import {
  PLAYER_ACCEL, PLAYER_FRICTION, PLAYER_WALL_BOUNCE,
  SPLIT_FLY_APART_MULTIPLIER, SPLIT_INITIAL_VELOCITY,
  SPLIT_IMMUNITY_MS, TRAIL_SPEED_THRESHOLD, TRAIL_MAX_LENGTH,
  MERGE_SLIDE_SPEED,
} from './constants.js';
import { getCurrentSkin } from './skins.js';

// Personality system reference — set externally by game.js
let _personalitySystem = null;
export function setPersonalitySystem(ps) { _personalitySystem = ps; }

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
    this.shieldUntil = 0; // golden triangle shield
    this._trail = []; // trail positions for motion trail
    this._gamepadIndex = -1; // set externally for gamepad control
    this.merging = false; // true when sliding toward merge partner
    this.mergeTargetX = 0; // x position to slide toward
  }

  update(dt, input, canvasWidth, touchInput) {
    // If merging, slide toward target and skip normal controls
    if (this.merging) {
      const diff = this.mergeTargetX - this.x;
      if (Math.abs(diff) < 2) {
        this.x = this.mergeTargetX;
      } else {
        this.x += Math.sign(diff) * MERGE_SLIDE_SPEED * dt;
      }
      return;
    }

    let accel = 0;
    if (input.isDown(this.keyPair.left)) accel -= PLAYER_ACCEL;
    if (input.isDown(this.keyPair.right)) accel += PLAYER_ACCEL;

    // Touch input (for mobile — only the selected box gets this)
    if (touchInput) {
      const dir = touchInput.getDirection();
      if (dir !== 0) accel += dir * PLAYER_ACCEL;
    }

    // Gamepad input (additive to keyboard)
    if (this._gamepadIndex >= 0) {
      const axis = input.getGamepadAxis(this._gamepadIndex);
      if (axis !== 0) accel += axis * PLAYER_ACCEL;
    }

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

    // Update trail
    if (Math.abs(this.velocity) > TRAIL_SPEED_THRESHOLD) {
      this._trail.push({ x: this.x, y: this.y, alpha: 1 });
      if (this._trail.length > TRAIL_MAX_LENGTH) {
        this._trail.shift();
      }
    } else {
      // Fade out existing trail
      for (let i = this._trail.length - 1; i >= 0; i--) {
        this._trail[i].alpha -= dt * 4;
        if (this._trail[i].alpha <= 0) this._trail.splice(i, 1);
      }
    }
    // Decay trail alpha
    for (const t of this._trail) {
      t.alpha -= dt * 3;
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
    left.shieldUntil = this.shieldUntil; // inherit shield

    const right = new PlayerBox(
      centerX + separation - childWidth / 2,
      this.y, childWidth, childHeight,
      this.splitDepth + 1, newKeyPair
    );
    right.velocity = SPLIT_INITIAL_VELOCITY;
    right.immuneUntil = now + SPLIT_IMMUNITY_MS;
    right.shieldUntil = this.shieldUntil; // inherit shield

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

  hasShield(now) {
    return now < this.shieldUntil;
  }

  render(ctx, now) {
    const immune = this.isImmune(now);
    const shielded = this.hasShield(now);

    // Render trail (behind the box)
    this._renderTrail(ctx);

    // Render speed lines when moving fast
    if (Math.abs(this.velocity) > TRAIL_SPEED_THRESHOLD * 1.5) {
      this._renderSpeedLines(ctx);
    }

    // Flashing during immunity
    if (immune) {
      ctx.globalAlpha = Math.floor(now / 60) % 2 === 0 ? 0.3 : 1.0;
    }

    // Glow effect
    const skin = getCurrentSkin();
    const glowHue = shielded ? 45 : skin.playerHue; // gold when shielded
    const glowLightness = 50 + this.splitDepth * 8;
    ctx.shadowColor = `hsl(${glowHue}, 100%, ${glowLightness}%)`;
    ctx.shadowBlur = immune ? 20 + Math.sin(now / 50) * 10 : shielded ? 25 : 12;

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

    // Shield bubble effect
    if (shielded) {
      const shieldPulse = 0.3 + 0.15 * Math.sin(now / 100);
      // Flicker warning when shield is about to expire
      const remaining = this.shieldUntil - now;
      const flickerAlpha = remaining < 800 ? (Math.floor(now / 80) % 2 === 0 ? 0.1 : shieldPulse) : shieldPulse;
      ctx.strokeStyle = `rgba(255, 215, 0, ${flickerAlpha})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLOR_GOLDEN_GLOW;
      ctx.shadowBlur = 15;
      const pad = 5;
      this._roundRect(ctx, this.x - pad, this.y - pad, this.width + pad * 2, this.height + pad * 2, r + pad);
      ctx.stroke();
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;

    // Draw smiley face — expression changes with split depth
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height * 0.38;
    const faceSize = Math.min(this.width, this.height) * 0.28;

    this._drawFace(ctx, cx, cy, faceSize, this.splitDepth, now, shielded);

    // Key labels below the face
    const fontSize = Math.max(8, Math.min(18, this.width / 4));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labelY = this.y + this.height * 0.78;
    const quarter = this.width / 4;

    // Text shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(this.keyPair.leftLabel, this.x + quarter + 1, labelY + 1);
    ctx.fillText(this.keyPair.rightLabel, this.x + this.width - quarter + 1, labelY + 1);

    // Actual text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(this.keyPair.leftLabel, this.x + quarter, labelY);
    ctx.fillText(this.keyPair.rightLabel, this.x + this.width - quarter, labelY);
  }

  _renderTrail(ctx) {
    for (let i = 0; i < this._trail.length; i++) {
      const t = this._trail[i];
      if (t.alpha <= 0) continue;
      const alpha = Math.max(0, t.alpha * 0.4 * (i / this._trail.length));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${getCurrentSkin().playerHue}, 100%, 60%)`;
      const r = Math.min(4, this.width / 10);
      this._roundRect(ctx, t.x, t.y, this.width, this.height, r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _renderSpeedLines(ctx) {
    const speed = Math.abs(this.velocity);
    const dir = this.velocity > 0 ? -1 : 1;
    const intensity = Math.min(1, (speed - TRAIL_SPEED_THRESHOLD) / 800);
    const lineCount = Math.floor(3 + intensity * 5);
    ctx.strokeStyle = `rgba(${getCurrentSkin().accentRgb}, ${0.15 * intensity})`;
    ctx.lineWidth = 1;

    for (let i = 0; i < lineCount; i++) {
      const offsetY = this.y + Math.random() * this.height;
      const startX = dir > 0 ? this.x + this.width : this.x;
      const length = 20 + Math.random() * 40 * intensity;
      ctx.beginPath();
      ctx.moveTo(startX, offsetY);
      ctx.lineTo(startX + dir * length, offsetY);
      ctx.stroke();
    }
  }

  _drawFace(ctx, cx, cy, size, depth, now, shielded) {
    const s = size;
    const ps = _personalitySystem;
    const isBlinking = ps ? ps.getBlinkState(this, now) : false;
    const hasCatMouth = ps ? ps.hasCatMouth(this) : false;
    const personality = ps ? ps.getPersonality(this) : 'brave';
    const isCelebrating = ps ? ps.isCelebrating(now) : false;

    // Sleepy personality: half-closed eyes modifier
    const isSleepy = personality === 'sleepy';
    // Scared personality: freaks out one depth earlier
    const effectiveDepth = personality === 'scared' ? Math.min(depth + 1, 5)
      : personality === 'brave' ? Math.max(depth - 1, 0)
      : depth;

    ctx.save();

    // Eyes
    const eyeSpacing = s * 0.35;
    const eyeY = cy - s * 0.1;
    const eyeSize = s * 0.18;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';

    if (shielded) {
      // Cool sunglasses look when shielded
      ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY, eyeSize * 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing, eyeY, eyeSize * 1.2, 0, Math.PI * 2);
      ctx.fill();
      // Big grin
      const mouthY = cy + s * 0.3;
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
      ctx.lineWidth = Math.max(1.5, s * 0.07);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, mouthY - s * 0.1, s * 0.4, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Celebration override — party face!
    if (isCelebrating) {
      // Sparkle star eyes
      ctx.fillStyle = 'rgba(255, 215, 0, 0.95)';
      ctx.font = `bold ${eyeSize * 3}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', cx - eyeSpacing, eyeY);
      ctx.fillText('★', cx + eyeSpacing, eyeY);
      // Big happy mouth
      const mouthY = cy + s * 0.3;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = Math.max(1.5, s * 0.08);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, mouthY - s * 0.1, s * 0.45, 0.05 * Math.PI, 0.95 * Math.PI);
      ctx.stroke();
      // Blush marks
      ctx.fillStyle = 'rgba(255, 105, 180, 0.5)';
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing * 1.5, eyeY + eyeSize * 2.5, eyeSize * 0.9, eyeSize * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + eyeSpacing * 1.5, eyeY + eyeSize * 2.5, eyeSize * 0.9, eyeSize * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    // === BLINKING: draw closed eyes ===
    if (isBlinking && effectiveDepth < 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = Math.max(1.5, s * 0.08);
      ctx.lineCap = 'round';
      // Simple horizontal lines for closed eyes
      const blinkW = eyeSize * (isSleepy ? 0.6 : 1.0);
      ctx.beginPath();
      ctx.moveTo(cx - eyeSpacing - blinkW, eyeY);
      ctx.lineTo(cx - eyeSpacing + blinkW, eyeY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + eyeSpacing - blinkW, eyeY);
      ctx.lineTo(cx + eyeSpacing + blinkW, eyeY);
      ctx.stroke();
    } else if (isSleepy && effectiveDepth < 3) {
      // Sleepy half-closed eyes — draw upper half arc only
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY, eyeSize, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing, eyeY, eyeSize, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.fill();
    } else if (effectiveDepth === 0) {
      if (depth === 0 && this.splitDepth === 0) {
        // Starting box: sparkle star eyes ★
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = `bold ${eyeSize * 2.8}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', cx - eyeSpacing, eyeY);
        ctx.fillText('★', cx + eyeSpacing, eyeY);
      } else {
        // Happy — round eyes
        ctx.beginPath();
        ctx.arc(cx - eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + eyeSpacing, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Blush marks on happy face
      ctx.fillStyle = 'rgba(255, 105, 180, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing * 1.5, eyeY + eyeSize * 2.2, eyeSize * 0.8, eyeSize * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + eyeSpacing * 1.5, eyeY + eyeSize * 2.2, eyeSize * 0.8, eyeSize * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (effectiveDepth === 1) {
      // Worried — wider eyes, raised eyebrows, sweat drop
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing, eyeY, eyeSize * 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing, eyeY, eyeSize * 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = Math.max(1.5, s * 0.07);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - eyeSpacing - eyeSize, eyeY - eyeSize * 2.2);
      ctx.lineTo(cx - eyeSpacing + eyeSize, eyeY - eyeSize * 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + eyeSpacing + eyeSize, eyeY - eyeSize * 2.2);
      ctx.lineTo(cx + eyeSpacing - eyeSize, eyeY - eyeSize * 1.6);
      ctx.stroke();

      // Sweat drop
      const sweatX = cx + eyeSpacing + eyeSize * 2;
      const sweatY = eyeY - eyeSize * 1.5;
      const sweatBob = Math.sin(now / 300) * 2;
      ctx.fillStyle = 'rgba(100, 180, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(sweatX, sweatY + sweatBob);
      ctx.quadraticCurveTo(sweatX + eyeSize * 0.7, sweatY + eyeSize * 1.2 + sweatBob,
        sweatX, sweatY + eyeSize * 1.8 + sweatBob);
      ctx.quadraticCurveTo(sweatX - eyeSize * 0.7, sweatY + eyeSize * 1.2 + sweatBob,
        sweatX, sweatY + sweatBob);
      ctx.fill();
    } else if (effectiveDepth === 2) {
      // Scared — tall oval eyes with watery reflections
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing, eyeY, eyeSize * 1.1, eyeSize * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + eyeSpacing, eyeY, eyeSize * 1.1, eyeSize * 1.6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Watery eye reflections (shiny dots)
      ctx.fillStyle = 'rgba(200, 230, 255, 0.8)';
      const reflectSize = eyeSize * 0.35;
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing - eyeSize * 0.3, eyeY - eyeSize * 0.6, reflectSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing - eyeSize * 0.3, eyeY - eyeSize * 0.6, reflectSize, 0, Math.PI * 2);
      ctx.fill();
      // Smaller secondary reflection
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing + eyeSize * 0.3, eyeY + eyeSize * 0.3, reflectSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing + eyeSize * 0.3, eyeY + eyeSize * 0.3, reflectSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (effectiveDepth === 3) {
      // Terrified — darting pupils
      const dart = Math.sin(now / 80) * eyeSize * 0.3;
      ctx.beginPath();
      ctx.ellipse(cx - eyeSpacing, eyeY, eyeSize * 1.3, eyeSize * 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + eyeSpacing, eyeY, eyeSize * 1.3, eyeSize * 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = getCurrentSkin().backgroundColor;
      ctx.beginPath();
      ctx.arc(cx - eyeSpacing + dart, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + eyeSpacing + dart, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Max depth — spiral eyes (@@) instead of X eyes
      const spiralTime = now / 200;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = Math.max(1.5, s * 0.06);
      ctx.lineCap = 'round';

      // Draw spiral for each eye
      for (const ex of [cx - eyeSpacing, cx + eyeSpacing]) {
        ctx.beginPath();
        const spiralSize = eyeSize * 1.2;
        for (let a = 0; a < Math.PI * 4; a += 0.2) {
          const r = (a / (Math.PI * 4)) * spiralSize;
          const px = ex + Math.cos(a + spiralTime) * r;
          const py = eyeY + Math.sin(a + spiralTime) * r;
          if (a === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }

    // Mouth
    const mouthY = cy + s * 0.3;
    const mouthWidth = s * 0.4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    ctx.lineCap = 'round';

    if (hasCatMouth && effectiveDepth < 3) {
      // Cat mouth (ω) — draw a w-shape
      ctx.beginPath();
      const mw = mouthWidth * 0.7;
      const my = mouthY - s * 0.05;
      ctx.moveTo(cx - mw, my);
      ctx.quadraticCurveTo(cx - mw * 0.5, my + mw * 0.7, cx, my);
      ctx.quadraticCurveTo(cx + mw * 0.5, my + mw * 0.7, cx + mw, my);
      ctx.stroke();
    } else if (effectiveDepth === 0) {
      ctx.beginPath();
      ctx.arc(cx, mouthY - s * 0.1, mouthWidth, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    } else if (effectiveDepth === 1) {
      ctx.beginPath();
      ctx.arc(cx, mouthY + s * 0.2, mouthWidth * 0.6, 1.2 * Math.PI, 1.8 * Math.PI);
      ctx.stroke();
    } else if (effectiveDepth === 2) {
      const wobble = Math.sin(now / 200) * s * 0.02;
      ctx.beginPath();
      ctx.arc(cx, mouthY + s * 0.3 + wobble, mouthWidth * 0.7, 1.15 * Math.PI, 1.85 * Math.PI);
      ctx.stroke();
    } else if (effectiveDepth === 3) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.ellipse(cx, mouthY, mouthWidth * 0.25, mouthWidth * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      const wobble = Math.sin(now / 40) * s * 0.06;
      ctx.ellipse(cx, mouthY + wobble, mouthWidth * 0.4, mouthWidth * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
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

const COLOR_GOLDEN_GLOW = 'rgba(255, 215, 0, 0.6)';

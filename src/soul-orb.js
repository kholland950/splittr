// src/soul-orb.js — Soul Orb system: brutally hard merge/restore mechanic
import { prefersReducedMotion } from './accessibility.js';

// Soul Orb constants
const ORB_REQUIRED = 3;           // orbs needed for merge
const ORB_WINDOW_MS = 4000;       // time window to collect all 3
const ORB_BETWEEN_MS = 6000;      // max time between consecutive orb pickups
const ORB_LIFESPAN = 3.0;         // seconds before orb despawns
const ORB_FLEE_RADIUS = 100;      // px — when player box within this, orb flees
const ORB_FLEE_ACCEL = 800;       // horizontal acceleration when fleeing
const ORB_ZIGZAG_BASE_INTERVAL = 0.25; // seconds between direction changes
const ORB_MERGE_FREEZE_MS = 500;  // dramatic pause duration
const ORB_MERGE_IMMUNITY_MS = 1000; // post-merge immunity
const ORB_SLOWMO_MS = 100;        // brief slowmo on collection

// Difficulty scaling thresholds
const PHASE_1_TIME = 15;  // no orbs before this
const PHASE_2_TIME = 30;  // moderate zigzag
const PHASE_3_TIME = 60;  // aggressive

export class SoulOrb {
  constructor(x, canvasWidth, fallSpeed, elapsedTime) {
    this.x = x;
    this.y = -20;
    this.canvasWidth = canvasWidth;

    // Size scales down at higher difficulty
    const phase = SoulOrbSystem.getPhase(elapsedTime);
    this.radius = phase >= 3 ? 8 : 10; // tiny!

    // Speed: 1.5x current triangle speed
    this.fallSpeed = fallSpeed * 1.5;

    // Zigzag state
    this.vx = 0;
    this._zigzagTimer = 0;
    this._zigzagInterval = ORB_ZIGZAG_BASE_INTERVAL;
    this._zigzagDirection = Math.random() > 0.5 ? 1 : -1;
    this._zigzagStrength = phase >= 3 ? 500 : phase >= 2 ? 350 : 250;

    // Flee AI state
    this._fleeing = false;
    this._fleeTimer = 0;
    this._fleeAccel = phase >= 3 ? ORB_FLEE_ACCEL * 1.5 : ORB_FLEE_ACCEL;

    // Lifespan
    this.age = 0;
    this.maxAge = ORB_LIFESPAN;
    this.dead = false;
    this.collected = false;

    // Visual state
    this._pulsePhase = Math.random() * Math.PI * 2;
    this._trailPositions = [];
  }

  update(dt, boxes) {
    this.age += dt;
    if (this.age >= this.maxAge) {
      this.dead = true;
      return;
    }

    // Fall
    this.y += this.fallSpeed * dt;

    // Zigzag — jagged, not smooth
    this._zigzagTimer += dt;
    if (this._zigzagTimer >= this._zigzagInterval) {
      this._zigzagTimer = 0;
      this._zigzagDirection = -this._zigzagDirection;
      // Randomize next interval for unpredictability
      this._zigzagInterval = ORB_ZIGZAG_BASE_INTERVAL * (0.5 + Math.random());
      this.vx = this._zigzagDirection * this._zigzagStrength * (0.7 + Math.random() * 0.6);
    }

    // Flee AI — check proximity to any player box
    this._fleeing = false;
    if (boxes && boxes.length > 0) {
      let closestDist = Infinity;
      let closestBox = null;
      for (const box of boxes) {
        const boxCx = box.x + box.width / 2;
        const boxCy = box.y + box.height / 2;
        const dx = this.x - boxCx;
        const dy = this.y - boxCy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < closestDist) {
          closestDist = dist;
          closestBox = box;
        }
      }
      if (closestDist < ORB_FLEE_RADIUS && closestBox) {
        this._fleeing = true;
        this._fleeTimer = 0.2; // brief red flash timer
        const boxCx = closestBox.x + closestBox.width / 2;
        // Accelerate AWAY from nearest box horizontally
        const fleeDir = this.x > boxCx ? 1 : -1;
        this.vx += fleeDir * this._fleeAccel * dt;
      }
    }

    // Apply horizontal movement
    this.x += this.vx * dt;

    // Friction on horizontal velocity
    this.vx *= 0.95;

    // Keep on screen
    if (this.x < this.radius) {
      this.x = this.radius;
      this.vx = Math.abs(this.vx) * 0.5;
    } else if (this.x > this.canvasWidth - this.radius) {
      this.x = this.canvasWidth - this.radius;
      this.vx = -Math.abs(this.vx) * 0.5;
    }

    // Off-screen bottom
    if (this.y > 2000) {
      this.dead = true;
    }

    // Update flee timer
    if (this._fleeTimer > 0) this._fleeTimer -= dt;

    // Trail positions for sparkle trail
    this._pulsePhase += dt * 6;
    if (!prefersReducedMotion() && Math.random() > 0.5) {
      this._trailPositions.push({ x: this.x, y: this.y, alpha: 1 });
      if (this._trailPositions.length > 8) this._trailPositions.shift();
    }
    for (const t of this._trailPositions) {
      t.alpha -= dt * 4;
    }
    this._trailPositions = this._trailPositions.filter(t => t.alpha > 0);
  }

  getBounds() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius,
    };
  }

  overlapsBox(box) {
    const bounds = box.getBounds();
    const orbBounds = this.getBounds();
    return orbBounds.left < bounds.right && orbBounds.right > bounds.left &&
           orbBounds.top < bounds.bottom && orbBounds.bottom > bounds.top;
  }

  render(ctx, now) {
    const lifeRatio = 1 - this.age / this.maxAge;
    const pulse = 0.7 + 0.3 * Math.sin(this._pulsePhase);
    const despawnWarn = lifeRatio < 0.3;

    // Trailing sparkle particles
    if (!prefersReducedMotion()) {
      for (const t of this._trailPositions) {
        ctx.save();
        ctx.globalAlpha = t.alpha * 0.5 * lifeRatio;
        ctx.fillStyle = '#c4a0ff';
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.save();

    // Despawn warning: flicker
    if (despawnWarn) {
      ctx.globalAlpha = Math.floor(now / 80) % 2 === 0 ? 0.4 : 1.0;
    }

    // Flee flash — brief red tint
    const isFleeing = this._fleeTimer > 0;

    // Outer glow
    const glowColor = isFleeing ? 'rgba(255, 80, 80, 0.6)' : 'rgba(180, 130, 255, 0.6)';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15 + 5 * pulse;

    // Gradient fill — purple/white
    const grad = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    if (isFleeing) {
      grad.addColorStop(0, '#ffaaaa');
      grad.addColorStop(0.5, '#ff6666');
      grad.addColorStop(1, '#cc3333');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#d4b0ff');
      grad.addColorStop(1, '#8844cc');
    }
    ctx.fillStyle = grad;

    // Draw orb
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner shine
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.2 * pulse})`;
    ctx.beginPath();
    ctx.arc(this.x - this.radius * 0.25, this.y - this.radius * 0.25, this.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class SoulOrbSystem {
  constructor() {
    this.orb = null;           // current orb on screen (only 1 at a time)
    this.orbCount = 0;         // 0-3 collected
    this.firstCollectTime = 0; // timestamp of first orb in current chain
    this.lastCollectTime = 0;  // timestamp of most recent collection
    this._lastSpawnCheck = 0;
    this._mergeActive = false; // true during the dramatic merge pause
    this._mergeTimer = 0;
    this._mergeBoxA = null;
    this._mergeBoxB = null;
    this._restoredTextTimer = 0;
    this._restoredTextY = 0;
    this._counterFlashTimer = 0; // visual flash on collection
    this._counterFlashCount = 0;
    this._slowmoTimer = 0;    // brief slowmo on collection
  }

  static getPhase(elapsedTime) {
    if (elapsedTime < PHASE_1_TIME) return 0;  // no spawns
    if (elapsedTime < PHASE_2_TIME) return 1;  // moderate
    if (elapsedTime < PHASE_3_TIME) return 2;  // harder
    return 3;                                    // brutal
  }

  reset() {
    this.orb = null;
    this.orbCount = 0;
    this.firstCollectTime = 0;
    this.lastCollectTime = 0;
    this._lastSpawnCheck = 0;
    this._mergeActive = false;
    this._mergeTimer = 0;
    this._mergeBoxA = null;
    this._mergeBoxB = null;
    this._restoredTextTimer = 0;
    this._counterFlashTimer = 0;
    this._counterFlashCount = 0;
    this._slowmoTimer = 0;
  }

  // Called when player gets hit by a triangle — resets counter
  onPlayerHit() {
    if (this.orbCount > 0) {
      this.orbCount = 0;
      this.firstCollectTime = 0;
      this.lastCollectTime = 0;
    }
  }

  // Called when an orb despawns without being collected — resets counter
  onOrbMissed() {
    this.orbCount = 0;
    this.firstCollectTime = 0;
    this.lastCollectTime = 0;
  }

  get isMerging() {
    return this._mergeActive;
  }

  get slowmoActive() {
    return this._slowmoTimer > 0;
  }

  update(dt, now, elapsedTime, boxes, canvasWidth, canvasHeight, difficulty, particles, renderer) {
    // Update merge animation
    if (this._mergeActive) {
      this._mergeTimer -= dt * 1000;
      if (this._mergeTimer <= 0) {
        this._mergeActive = false;
      }
      return null; // no other updates during merge freeze
    }

    // Update slowmo timer
    if (this._slowmoTimer > 0) {
      this._slowmoTimer -= dt * 1000;
    }

    // Update counter flash
    if (this._counterFlashTimer > 0) {
      this._counterFlashTimer -= dt;
    }

    // Update restored text
    if (this._restoredTextTimer > 0) {
      this._restoredTextTimer -= dt;
    }

    // Check timeout between collections
    if (this.orbCount > 0 && this.lastCollectTime > 0) {
      if (now - this.lastCollectTime > ORB_BETWEEN_MS) {
        this.orbCount = 0;
        this.firstCollectTime = 0;
        this.lastCollectTime = 0;
      }
    }

    // Check overall window timeout
    if (this.orbCount > 0 && this.firstCollectTime > 0) {
      if (now - this.firstCollectTime > ORB_WINDOW_MS) {
        this.orbCount = 0;
        this.firstCollectTime = 0;
        this.lastCollectTime = 0;
      }
    }

    // Update existing orb
    if (this.orb) {
      this.orb.update(dt, boxes);

      if (this.orb.dead && !this.orb.collected) {
        this.onOrbMissed();
        this.orb = null;
      } else if (this.orb.collected || this.orb.dead) {
        this.orb = null;
      } else {
        // Check collection: any player box overlapping
        for (const box of boxes) {
          if (this.orb.overlapsBox(box)) {
            this.orb.collected = true;
            this.orb.dead = true;
            this._handleCollection(now, this.orb.x, this.orb.y, particles, renderer);
            this.orb = null;
            break;
          }
        }
      }
    }

    // Spawn logic
    const phase = SoulOrbSystem.getPhase(elapsedTime);
    if (phase === 0 || this.orb !== null) {
      return null; // no spawn
    }

    // Spawn rate based on phase
    let spawnChance;
    if (phase === 1) spawnChance = 0.02;
    else if (phase === 2) spawnChance = 0.03;
    else spawnChance = 0.04;

    // Check spawn (tied to difficulty spawn checks for consistency)
    const tier = difficulty.getTier(elapsedTime);
    const intervalSec = tier.spawnInterval / 1000;
    if (elapsedTime - this._lastSpawnCheck >= intervalSec) {
      this._lastSpawnCheck = elapsedTime;
      if (Math.random() < spawnChance) {
        // Spawn orb at random x position
        const margin = 40;
        const x = margin + Math.random() * (canvasWidth - margin * 2);
        this.orb = new SoulOrb(x, canvasWidth, tier.fallSpeed, elapsedTime);
      }
    }

    // Check if 3 orbs collected — return merge signal
    if (this.orbCount >= ORB_REQUIRED) {
      return 'merge';
    }

    return null;
  }

  _handleCollection(now, x, y, particles, renderer) {
    this.orbCount++;
    if (this.orbCount === 1) {
      this.firstCollectTime = now;
    }
    this.lastCollectTime = now;

    // Visual feedback
    this._counterFlashTimer = 0.5;
    this._counterFlashCount = this.orbCount;

    // Purple particle burst at collection point
    if (particles && !prefersReducedMotion()) {
      const count = 15;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 50;
        const hue = 270 + Math.random() * 30;
        const color = `hsl(${hue}, 80%, ${60 + Math.random() * 30}%)`;
        const size = 2 + Math.random() * 3;
        const life = 0.3 + Math.random() * 0.4;
        // Use the Particle constructor from particles module
        particles.particles.push({
          x, y, vx, vy, color, size, life, maxLife: life,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 10,
          update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 200 * dt;
            this.vx *= 0.99;
            this.life -= dt;
            this.rotation += this.rotSpeed * dt;
          },
          get alpha() { return Math.max(0, this.life / this.maxLife); },
          get dead() { return this.life <= 0; },
        });
      }
    }

    // Brief screen shake
    if (renderer) {
      renderer.triggerShake(performance.now(), 0.5);
    }

    // Brief slowmo
    this._slowmoTimer = ORB_SLOWMO_MS;
  }

  // Called by game.js when orbCount reaches 3 — performs the merge
  triggerMerge(now, boxes, particles, renderer, input) {
    this.orbCount = 0;
    this.firstCollectTime = 0;
    this.lastCollectTime = 0;

    // Find the two smallest boxes (highest splitDepth)
    if (boxes.length < 2) return null;

    // Sort copies by splitDepth descending, then by index for stability
    const sorted = boxes
      .map((b, i) => ({ box: b, idx: i }))
      .filter(b => !b.box.merging && b.box.splitDepth > 0)
      .sort((a, b) => b.box.splitDepth - a.box.splitDepth);

    if (sorted.length < 2) {
      // Can't merge — no boxes with splitDepth > 0
      // Still give the reward of immunity
      for (const box of boxes) {
        box.immuneUntil = Math.max(box.immuneUntil, now + ORB_MERGE_IMMUNITY_MS);
      }
      return null;
    }

    // Pick the two smallest (same depth preferred)
    const boxA = sorted[0].box;
    let boxB = null;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].box.splitDepth === boxA.splitDepth) {
        boxB = sorted[i].box;
        break;
      }
    }
    if (!boxB) boxB = sorted[1].box;

    // Freeze everything for dramatic pause
    this._mergeActive = true;
    this._mergeTimer = ORB_MERGE_FREEZE_MS;
    this._mergeBoxA = boxA;
    this._mergeBoxB = boxB;

    // Screen shake + massive particle explosion
    if (renderer) {
      renderer.triggerShake(now, 3);
    }

    if (particles && !prefersReducedMotion()) {
      const cx = (boxA.x + boxA.width / 2 + boxB.x + boxB.width / 2) / 2;
      const cy = (boxA.y + boxB.y) / 2 + boxA.height / 2;

      // Massive purple/white explosion
      const count = 50;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 200 + Math.random() * 500;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 150;
        const isPurple = Math.random() > 0.3;
        const color = isPurple
          ? `hsl(${270 + Math.random() * 30}, 80%, ${50 + Math.random() * 40}%)`
          : `hsl(0, 0%, ${80 + Math.random() * 20}%)`;
        const size = 3 + Math.random() * 6;
        const life = 0.5 + Math.random() * 0.8;
        particles.particles.push({
          x: cx, y: cy, vx, vy, color, size, life, maxLife: life,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 10,
          update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 200 * dt;
            this.vx *= 0.99;
            this.life -= dt;
            this.rotation += this.rotSpeed * dt;
          },
          get alpha() { return Math.max(0, this.life / this.maxLife); },
          get dead() { return this.life <= 0; },
        });
      }

      this._restoredTextTimer = 2.0;
      this._restoredTextY = cy - 60;
    }

    // Start the merge animation (boxes slide together)
    const midX = ((boxA.x + boxA.width / 2) + (boxB.x + boxB.width / 2)) / 2;
    boxA.merging = true;
    boxA.mergeTargetX = midX - boxA.width / 2;
    boxB.merging = true;
    boxB.mergeTargetX = midX - boxB.width / 2;

    // Make all boxes immune during merge + after
    for (const box of boxes) {
      box.immuneUntil = Math.max(box.immuneUntil, now + ORB_MERGE_FREEZE_MS + ORB_MERGE_IMMUNITY_MS);
    }

    return {
      boxA,
      boxB,
      targetX: midX,
      targetY: boxA.y,
      mergedWidth: boxA.width * 2,
    };
  }

  // Render the orb counter at bottom-center of screen
  renderCounter(ctx, canvasWidth, canvasHeight, now) {
    // Don't show counter if no orbs collected and no active chain
    const phase = SoulOrbSystem.getPhase(0); // always show once system is known
    const showCounter = this.orbCount > 0 || this.orb !== null;

    const y = canvasHeight - 35;
    const cx = canvasWidth / 2;
    const diamondSize = 12;
    const spacing = 30;

    // Draw 3 diamond shapes
    for (let i = 0; i < ORB_REQUIRED; i++) {
      const dx = cx + (i - 1) * spacing;
      const filled = i < this.orbCount;
      const isFlashing = this._counterFlashTimer > 0 && i < this._counterFlashCount;

      ctx.save();

      if (filled) {
        // Filled diamond — glowing purple
        const glow = 0.7 + 0.3 * Math.sin(now / 200 + i);
        ctx.shadowColor = isFlashing ? '#ffffff' : '#b060ff';
        ctx.shadowBlur = isFlashing ? 20 : 10 * glow;

        const grad = ctx.createRadialGradient(dx, y, 0, dx, y, diamondSize);
        grad.addColorStop(0, '#e0c0ff');
        grad.addColorStop(0.5, '#b060ff');
        grad.addColorStop(1, '#7030aa');
        ctx.fillStyle = grad;
      } else if (showCounter) {
        // Empty diamond — subtle outline
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'transparent';
        ctx.strokeStyle = '#8844cc';
        ctx.lineWidth = 1.5;
      } else {
        // Hidden when nothing active
        ctx.restore();
        continue;
      }

      // Draw diamond
      ctx.beginPath();
      ctx.moveTo(dx, y - diamondSize);
      ctx.lineTo(dx + diamondSize * 0.6, y);
      ctx.lineTo(dx, y + diamondSize);
      ctx.lineTo(dx - diamondSize * 0.6, y);
      ctx.closePath();

      if (filled) {
        ctx.fill();
      } else {
        ctx.stroke();
      }

      ctx.restore();
    }

    // "MERGE!" text when 3/3
    if (this.orbCount >= ORB_REQUIRED) {
      const pulse = 0.5 + 0.5 * Math.sin(now / 100);
      ctx.save();
      ctx.shadowColor = '#b060ff';
      ctx.shadowBlur = 20 * pulse;
      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = `rgba(220, 180, 255, ${0.8 + 0.2 * pulse})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('MERGE!', cx, y - 30);
      ctx.restore();
    }

    // "RESTORED!" floating text after merge
    if (this._restoredTextTimer > 0) {
      const alpha = Math.min(1, this._restoredTextTimer);
      const scale = 1 + (2 - this._restoredTextTimer) * 0.1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(canvasWidth / 2, this._restoredTextY);
      ctx.scale(scale, scale);

      // Rainbow glow
      const hue = (now / 3) % 360;
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
      ctx.shadowBlur = 25;
      ctx.font = 'bold 48px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('RESTORED!', 0, 0);

      // Purple underline
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(180, 96, 255, ${alpha * 0.7})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-120, 25);
      ctx.lineTo(120, 25);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Render the orb itself (called from game._renderPlaying)
  renderOrb(ctx, now) {
    if (this.orb && !this.orb.dead) {
      this.orb.render(ctx, now);
    }
  }
}

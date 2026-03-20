// src/achievements.js — Achievement system with tracking, popups, and gallery
import { MAX_SPLIT_DEPTH, COMBO_WINDOW_MS } from './constants.js';

const ACHIEVEMENTS_KEY = 'splittr-achievements';

const ACHIEVEMENT_DEFS = [
  {
    id: 'first_split',
    name: 'First Split',
    description: 'Survive your first split',
    icon: '\u2702',
  },
  {
    id: 'octopus',
    name: 'Octopus',
    description: 'Control 8+ boxes at once',
    icon: '\ud83d\udc19',
  },
  {
    id: 'full_house',
    name: 'Full House',
    description: 'Reach max split depth (16 boxes)',
    icon: '\ud83c\udfe0',
  },
  {
    id: 'survivor',
    name: 'Survivor',
    description: 'Survive 30 seconds',
    icon: '\u23f1',
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: 'Survive 60 seconds',
    icon: '\ud83c\udf96',
  },
  {
    id: 'untouchable',
    name: 'Untouchable',
    description: 'Dodge 20 triangles without getting hit',
    icon: '\ud83d\udc7b',
  },
  {
    id: 'combo_king',
    name: 'Combo King',
    description: 'Get a 5x combo (splits within 2s)',
    icon: '\ud83d\udd25',
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Move a box at max velocity',
    icon: '\u26a1',
  },
  {
    id: 'bouncer',
    name: 'Bouncer',
    description: 'Bounce off walls 10 times in one game',
    icon: '\ud83c\udfd3',
  },
  {
    id: 'close_call',
    name: 'Close Call',
    description: 'Triangle passes within 5px without hitting',
    icon: '\ud83d\ude13',
  },
];

export class AchievementTracker {
  constructor() {
    this._unlocked = this._load();
    this._popupQueue = [];
    this._activePopup = null;
    this._popupStartTime = 0;

    // Per-game tracking state
    this._dodgedTriangles = 0;
    this._hitThisGame = false;
    this._wallBounces = 0;
    this._splitTimes = [];
    this._showGallery = false;

    // For wall-bounce detection: track previous velocity signs
    this._prevVelocities = new Map();
  }

  // Called when a new game starts
  resetGame() {
    this._dodgedTriangles = 0;
    this._hitThisGame = false;
    this._wallBounces = 0;
    this._splitTimes = [];
    this._prevVelocities.clear();
  }

  // Called each frame during PLAYING state
  update(gameState) {
    const { boxes, triangles, elapsedTime, canvasWidth } = gameState;

    // Survivor / Veteran
    if (elapsedTime >= 30) this._tryUnlock('survivor');
    if (elapsedTime >= 60) this._tryUnlock('veteran');

    // Octopus
    if (boxes.length >= 8) this._tryUnlock('octopus');

    // Full House — 2^MAX_SPLIT_DEPTH = 16
    if (boxes.length >= (1 << MAX_SPLIT_DEPTH)) this._tryUnlock('full_house');

    // Speed Demon — velocity threshold ~2000
    for (const box of boxes) {
      if (Math.abs(box.velocity) >= 2000) {
        this._tryUnlock('speed_demon');
      }
    }

    // Wall bounce detection: check if velocity sign flipped AND box is at wall
    for (const box of boxes) {
      const id = box; // use object reference as key
      const prevVel = this._prevVelocities.get(id);
      if (prevVel !== undefined) {
        const atLeftWall = box.x <= 0.5;
        const atRightWall = box.x + box.width >= canvasWidth - 0.5;
        if ((atLeftWall || atRightWall) && prevVel !== 0 && Math.sign(prevVel) !== Math.sign(box.velocity) && box.velocity !== 0) {
          this._wallBounces++;
          if (this._wallBounces >= 10) this._tryUnlock('bouncer');
        }
      }
      this._prevVelocities.set(id, box.velocity);
    }

    // Close Call — check each triangle tip distance to each box
    for (const tri of triangles) {
      const tip = tri.getTipPosition();
      for (const box of boxes) {
        const bounds = box.getBounds();
        // Distance from tip to nearest point on box
        const nearestX = Math.max(bounds.left, Math.min(tip.tipX, bounds.right));
        const nearestY = Math.max(bounds.top, Math.min(tip.tipY, bounds.bottom));
        const dx = tip.tipX - nearestX;
        const dy = tip.tipY - nearestY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // Within 5px but NOT inside the box
        if (dist > 0 && dist <= 5) {
          this._tryUnlock('close_call');
        }
      }
    }
  }

  // Called when a split happens
  onSplit() {
    this._tryUnlock('first_split');

    // Combo tracking
    const now = performance.now();
    this._splitTimes.push(now);
    // Remove old split times outside the combo window
    this._splitTimes = this._splitTimes.filter(t => now - t <= COMBO_WINDOW_MS);
    if (this._splitTimes.length >= 5) {
      this._tryUnlock('combo_king');
    }
  }

  // Called when a triangle goes off-screen without hitting anything
  onTriangleDodged() {
    if (!this._hitThisGame) {
      this._dodgedTriangles++;
      if (this._dodgedTriangles >= 20) this._tryUnlock('untouchable');
    }
  }

  // Called when a box gets hit (split or destroy)
  onBoxHit() {
    this._hitThisGame = true;
    this._dodgedTriangles = 0;
  }

  isGalleryOpen() {
    return this._showGallery;
  }

  toggleGallery() {
    this._showGallery = !this._showGallery;
  }

  closeGallery() {
    this._showGallery = false;
  }

  // Render achievement popup banner
  renderPopup(ctx, canvasWidth, now) {
    // Advance popup queue
    if (!this._activePopup && this._popupQueue.length > 0) {
      this._activePopup = this._popupQueue.shift();
      this._popupStartTime = now;
    }

    if (!this._activePopup) return;

    const elapsed = (now - this._popupStartTime) / 1000;
    const duration = 2.5; // total display time in seconds
    const slideTime = 0.3;

    if (elapsed > duration) {
      this._activePopup = null;
      return;
    }

    // Slide in/out animation
    let slideY;
    if (elapsed < slideTime) {
      // Slide in from top
      slideY = -80 + (elapsed / slideTime) * 80;
    } else if (elapsed > duration - slideTime) {
      // Slide out to top
      const outProgress = (elapsed - (duration - slideTime)) / slideTime;
      slideY = -outProgress * 80;
    } else {
      slideY = 0;
    }

    const def = this._activePopup;
    const bannerWidth = 340;
    const bannerHeight = 64;
    const bannerX = (canvasWidth - bannerWidth) / 2;
    const bannerY = 90 + slideY;

    ctx.save();

    // Banner background with gold trim
    ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
    ctx.shadowBlur = 20;

    // Outer gold border
    const borderRadius = 10;
    this._roundRect(ctx, bannerX - 2, bannerY - 2, bannerWidth + 4, bannerHeight + 4, borderRadius + 1);
    const goldGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerHeight);
    goldGrad.addColorStop(0, '#ffd700');
    goldGrad.addColorStop(0.5, '#ffaa00');
    goldGrad.addColorStop(1, '#ffd700');
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Inner dark background
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    this._roundRect(ctx, bannerX, bannerY, bannerWidth, bannerHeight, borderRadius);
    const bgGrad = ctx.createLinearGradient(bannerX, bannerY, bannerX, bannerY + bannerHeight);
    bgGrad.addColorStop(0, 'rgba(20, 25, 60, 0.95)');
    bgGrad.addColorStop(1, 'rgba(10, 14, 39, 0.95)');
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // Achievement icon
    ctx.font = '28px serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(def.icon, bannerX + 14, bannerY + bannerHeight / 2);

    // "ACHIEVEMENT UNLOCKED" label
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'left';
    ctx.fillText('ACHIEVEMENT UNLOCKED', bannerX + 52, bannerY + 18);

    // Achievement name
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(def.name, bannerX + 52, bannerY + 36);

    // Description
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillText(def.description, bannerX + 52, bannerY + 52);

    ctx.restore();
  }

  // Render achievement gallery screen
  renderGallery(ctx, canvasWidth, canvasHeight, now) {
    // Full-screen overlay
    ctx.save();
    ctx.fillStyle = 'rgba(10, 14, 39, 0.92)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Title
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 36px monospace';
    ctx.fillStyle = '#ffd700';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ACHIEVEMENTS', canvasWidth / 2, 60);
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Decorative line
    const lineGrad = ctx.createLinearGradient(canvasWidth / 2 - 150, 0, canvasWidth / 2 + 150, 0);
    lineGrad.addColorStop(0, 'transparent');
    lineGrad.addColorStop(0.2, '#ffd700');
    lineGrad.addColorStop(0.8, '#ffd700');
    lineGrad.addColorStop(1, 'transparent');
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2 - 150, 85);
    ctx.lineTo(canvasWidth / 2 + 150, 85);
    ctx.stroke();

    // Count unlocked
    const unlockedCount = Object.values(this._unlocked).filter(Boolean).length;
    ctx.font = '14px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText(`${unlockedCount} / ${ACHIEVEMENT_DEFS.length}`, canvasWidth / 2, 105);

    // Grid of achievements
    const cols = Math.min(2, Math.floor((canvasWidth - 40) / 320));
    const cardWidth = 300;
    const cardHeight = 70;
    const gap = 16;
    const gridWidth = cols * cardWidth + (cols - 1) * gap;
    const startX = (canvasWidth - gridWidth) / 2;
    const startY = 130;

    for (let i = 0; i < ACHIEVEMENT_DEFS.length; i++) {
      const def = ACHIEVEMENT_DEFS[i];
      const unlocked = this._unlocked[def.id];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (cardWidth + gap);
      const y = startY + row * (cardHeight + gap);

      // Card background
      this._roundRect(ctx, x, y, cardWidth, cardHeight, 8);
      if (unlocked) {
        const cardGrad = ctx.createLinearGradient(x, y, x, y + cardHeight);
        cardGrad.addColorStop(0, 'rgba(40, 50, 90, 0.8)');
        cardGrad.addColorStop(1, 'rgba(25, 30, 60, 0.8)');
        ctx.fillStyle = cardGrad;
      } else {
        ctx.fillStyle = 'rgba(20, 25, 45, 0.6)';
      }
      ctx.fill();

      // Gold border for unlocked
      if (unlocked) {
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, x, y, cardWidth, cardHeight, 8);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        this._roundRect(ctx, x, y, cardWidth, cardHeight, 8);
        ctx.stroke();
      }

      // Icon or silhouette
      ctx.font = '28px serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      if (unlocked) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(def.icon, x + 14, y + cardHeight / 2);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillText('?', x + 20, y + cardHeight / 2);
      }

      // Name or ???
      ctx.textAlign = 'left';
      if (unlocked) {
        ctx.font = 'bold 15px monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(def.name, x + 52, y + 26);

        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText(def.description, x + 52, y + 46);
      } else {
        ctx.font = 'bold 15px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillText('???', x + 52, y + 26);

        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillText('Locked', x + 52, y + 46);
      }
    }

    // Hint to close
    const pulse = 0.5 + 0.5 * Math.sin(now / 400);
    ctx.globalAlpha = pulse;
    ctx.font = '14px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Press A to close', canvasWidth / 2, canvasHeight - 40);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  _tryUnlock(id) {
    if (this._unlocked[id]) return;
    this._unlocked[id] = true;
    this._save();
    const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
    if (def) {
      this._popupQueue.push(def);
    }
  }

  _load() {
    try {
      const data = localStorage.getItem(ACHIEVEMENTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  _save() {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this._unlocked));
    } catch (_) { /* unavailable */ }
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

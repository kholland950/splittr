// src/touch.js — Mobile touch controls for Splittr
// On mobile: tap left/right halves of screen to move the selected box
// Tap a box to select it. Swipe to move. Tap screen to start/restart.

export class TouchManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.enabled = false;
    this.activeBoxIndex = 0;
    this._touches = {}; // trackingId -> { startX, startY, currentX, currentY }
    this._tapDetected = false;
    this._leftHeld = false;
    this._rightHeld = false;

    // Detect mobile
    this.enabled = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (this.enabled) {
      this._onTouchStart = this._handleTouchStart.bind(this);
      this._onTouchMove = this._handleTouchMove.bind(this);
      this._onTouchEnd = this._handleTouchEnd.bind(this);
      canvas.addEventListener('touchstart', this._onTouchStart, { passive: false });
      canvas.addEventListener('touchmove', this._onTouchMove, { passive: false });
      canvas.addEventListener('touchend', this._onTouchEnd, { passive: false });
      canvas.addEventListener('touchcancel', this._onTouchEnd, { passive: false });
    }
  }

  get isMobile() {
    return this.enabled;
  }

  // Returns true if any touch happened this frame (for start/restart)
  consumeTap() {
    if (this._tapDetected) {
      this._tapDetected = false;
      return true;
    }
    return false;
  }

  // Get movement direction for the currently selected box: -1, 0, or 1
  getDirection() {
    if (this._leftHeld && !this._rightHeld) return -1;
    if (this._rightHeld && !this._leftHeld) return 1;
    return 0;
  }

  // Check if a tap hit a specific box (for box selection)
  checkBoxTap(boxes) {
    // handled in touchstart — sets activeBoxIndex
  }

  // Select the nearest box to a tap position
  selectBoxAt(x, y, boxes) {
    if (boxes.length === 0) return;
    let closest = 0;
    let closestDist = Infinity;
    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const bx = box.x + box.width / 2;
      const by = box.y + box.height / 2;
      const dist = Math.hypot(x - bx, y - by);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    }
    this.activeBoxIndex = closest;
  }

  clear() {
    this._touches = {};
    this._leftHeld = false;
    this._rightHeld = false;
    this._tapDetected = false;
    this.activeBoxIndex = 0;
  }

  // Render touch controls overlay
  render(ctx, canvasWidth, canvasHeight, boxes) {
    if (!this.enabled) return;

    // Semi-transparent left/right zones
    const zoneAlpha = 0.04;

    // Left zone
    ctx.fillStyle = `rgba(0, 212, 255, ${this._leftHeld ? 0.12 : zoneAlpha})`;
    ctx.fillRect(0, canvasHeight * 0.5, canvasWidth / 2, canvasHeight * 0.5);

    // Right zone
    ctx.fillStyle = `rgba(0, 212, 255, ${this._rightHeld ? 0.12 : zoneAlpha})`;
    ctx.fillRect(canvasWidth / 2, canvasHeight * 0.5, canvasWidth / 2, canvasHeight * 0.5);

    // Arrows
    ctx.globalAlpha = this._leftHeld ? 0.5 : 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('◀', canvasWidth * 0.15, canvasHeight * 0.82);

    ctx.globalAlpha = this._rightHeld ? 0.5 : 0.15;
    ctx.fillText('▶', canvasWidth * 0.85, canvasHeight * 0.82);
    ctx.globalAlpha = 1;

    // Selected box indicator
    if (boxes.length > 1 && boxes[this.activeBoxIndex]) {
      const box = boxes[this.activeBoxIndex];
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(box.x - 4, box.y - 4, box.width + 8, box.height + 8);
      ctx.setLineDash([]);

      // "TAP BOX TO SELECT" hint if multiple boxes
      ctx.font = '12px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.textAlign = 'center';
      ctx.fillText('TAP A BOX TO SELECT IT', canvasWidth / 2, canvasHeight * 0.5 - 10);
    }
  }

  // Render mobile start hint
  renderStartHint(ctx, canvasWidth, canvasHeight) {
    if (!this.enabled) return;
    ctx.font = '18px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('TAP TO START', canvasWidth / 2, canvasHeight * 0.72);
  }

  _handleTouchStart(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();

    for (const touch of e.changedTouches) {
      const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);

      this._touches[touch.identifier] = { startX: x, startY: y, currentX: x, currentY: y };

      // Detect which half of screen
      if (y > this.canvas.height * 0.5) {
        // Bottom half — movement controls
        if (x < this.canvas.width / 2) {
          this._leftHeld = true;
        } else {
          this._rightHeld = true;
        }
      }

      this._tapDetected = true;
    }
  }

  _handleTouchMove(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      if (this._touches[touch.identifier]) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        const y = (touch.clientY - rect.top) * (this.canvas.height / rect.height);
        this._touches[touch.identifier].currentX = x;
        this._touches[touch.identifier].currentY = y;

        // Update held state based on current position
        this._recalcHeld();
      }
    }
  }

  _handleTouchEnd(e) {
    e.preventDefault();
    for (const touch of e.changedTouches) {
      delete this._touches[touch.identifier];
    }
    this._recalcHeld();
  }

  _recalcHeld() {
    this._leftHeld = false;
    this._rightHeld = false;
    for (const id in this._touches) {
      const t = this._touches[id];
      if (t.currentY > this.canvas.height * 0.5) {
        if (t.currentX < this.canvas.width / 2) {
          this._leftHeld = true;
        } else {
          this._rightHeld = true;
        }
      }
    }
  }
}

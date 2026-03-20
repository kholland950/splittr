// src/ui.js — Score display, death screen, high score, leaderboard, name entry, combo, floating text, stats
import { COLOR_TEXT, COLOR_TEXT_DIM, HIGH_SCORE_KEY, COLOR_GOLD, COLOR_SILVER, COLOR_BRONZE } from './constants.js';
import { getCurrentSkin } from './skins.js';

class FloatingText {
  constructor(text, x, y, color, size = 20) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.life = 1.5;
    this.maxLife = 1.5;
    this.vy = -60;
  }

  update(dt) {
    this.y += this.vy * dt;
    this.vy *= 0.98;
    this.life -= dt;
  }

  get alpha() { return Math.max(0, this.life / this.maxLife); }
  get dead() { return this.life <= 0; }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.font = `bold ${this.size}px monospace`;
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

export class UI {
  constructor() {
    this.highScore = this._loadHighScore();
    this._deathTime = 0;
    this._readyTime = 0;
    this._leaderboardTime = 0;
    this._nameEntryTime = 0;
    this._floatingTexts = [];

    // Combo display
    this._comboText = '';
    this._comboAlpha = 0;
    this._comboScale = 1;

    // Stats for death screen
    this.stats = {
      splitsSurvived: 0,
      trianglesDodged: 0,
      maxCombo: 0,
      goldenTrianglesCollected: 0,
      timeAlive: 0,
    };

    // Name entry state
    this._nameChars = [65, 65, 65]; // ASCII 'A'
    this._nameCursor = 0;
    this._nameLastInput = 0;
    this._nameConfirmed = false;

    // Leaderboard display
    this._newEntryRank = 0; // 1-based rank of newly added entry, 0 if none
  }

  // Add floating score popup
  addFloatingText(text, x, y, color = '#00d4ff', size = 20) {
    this._floatingTexts.push(new FloatingText(text, x, y, color, size));
  }

  // Show combo text
  showCombo(count) {
    this._comboText = `${count}x COMBO!`;
    this._comboAlpha = 1;
    this._comboScale = 1.5;
  }

  resetStats() {
    this.stats = {
      splitsSurvived: 0,
      trianglesDodged: 0,
      maxCombo: 0,
      goldenTrianglesCollected: 0,
      timeAlive: 0,
    };
  }

  // Render floating texts and combo during gameplay
  renderFloatingUI(ctx, canvasWidth, canvasHeight, dt) {
    // Floating texts
    for (let i = this._floatingTexts.length - 1; i >= 0; i--) {
      this._floatingTexts[i].update(dt);
      this._floatingTexts[i].render(ctx);
      if (this._floatingTexts[i].dead) {
        this._floatingTexts.splice(i, 1);
      }
    }

    // Combo text
    if (this._comboAlpha > 0) {
      this._comboAlpha -= dt * 0.8;
      this._comboScale = Math.max(1, this._comboScale - dt * 2);

      ctx.save();
      ctx.globalAlpha = Math.max(0, this._comboAlpha);
      ctx.translate(canvasWidth / 2, canvasHeight / 2 - 50);
      ctx.scale(this._comboScale, this._comboScale);

      const hue = (performance.now() / 3) % 360;
      ctx.font = 'bold 42px monospace';
      ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      ctx.shadowBlur = 20;
      ctx.fillText(this._comboText, 0, 0);
      ctx.restore();
    }
  }

  renderScore(ctx, elapsedSeconds, canvasWidth) {
    const scoreText = elapsedSeconds.toFixed(1);
    const skin = getCurrentSkin();

    // Score glow
    ctx.save();
    ctx.shadowColor = `rgba(${skin.accentRgb}, 0.5)`;
    ctx.shadowBlur = 10;
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = skin.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(scoreText, canvasWidth / 2, 20);
    ctx.restore();

    // Thin decorative line under score
    const textWidth = ctx.measureText(scoreText).width;
    ctx.strokeStyle = `rgba(${skin.accentRgb}, 0.3)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2 - textWidth / 2 - 10, 75);
    ctx.lineTo(canvasWidth / 2 + textWidth / 2 + 10, 75);
    ctx.stroke();
  }

  renderReadyScreen(ctx, canvasWidth, canvasHeight, now) {
    if (this._readyTime === 0) this._readyTime = now;
    const elapsed = (now - this._readyTime) / 1000;
    const skin = getCurrentSkin();

    // Animated background scanlines
    ctx.fillStyle = `rgba(${skin.accentRgb}, 0.015)`;
    for (let y = 0; y < canvasHeight; y += 4) {
      if (Math.sin(y * 0.1 + now * 0.002) > 0.5) {
        ctx.fillRect(0, y, canvasWidth, 2);
      }
    }

    // Title with letter-by-letter entrance
    const title = 'SPLITTR';
    const titleY = canvasHeight / 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < title.length; i++) {
      const letterDelay = i * 0.08;
      const letterElapsed = Math.max(0, elapsed - letterDelay);
      const scale = Math.min(1, letterElapsed * 4);
      const bounce = scale < 1 ? 0 : Math.sin((letterElapsed - 0.25) * 8) * Math.exp(-(letterElapsed - 0.25) * 5) * 15;

      const totalWidth = title.length * 52;
      const letterX = canvasWidth / 2 - totalWidth / 2 + i * 52 + 26;
      const letterY = titleY - bounce;

      ctx.save();
      ctx.globalAlpha = scale;

      // Letter glow
      ctx.shadowColor = skin.accentColor;
      ctx.shadowBlur = 20;
      ctx.font = 'bold 72px monospace';
      ctx.fillStyle = skin.textColor;
      ctx.fillText(title[i], letterX, letterY);

      // Accent tint on the letter
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(${skin.accentRgb}, 0.3)`;
      ctx.fillText(title[i], letterX, letterY);

      ctx.restore();
    }

    // Decorative line under title
    const lineAlpha = Math.min(1, Math.max(0, elapsed - 0.7) * 2);
    if (lineAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = lineAlpha * 0.5;
      const lineGrad = ctx.createLinearGradient(canvasWidth / 2 - 180, 0, canvasWidth / 2 + 180, 0);
      lineGrad.addColorStop(0, 'transparent');
      lineGrad.addColorStop(0.2, skin.accentColor);
      lineGrad.addColorStop(0.8, skin.accentColor);
      lineGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvasWidth / 2 - 180, titleY + 50);
      ctx.lineTo(canvasWidth / 2 + 180, titleY + 50);
      ctx.stroke();
      ctx.restore();
    }

    // High score with fade-in
    if (this.highScore > 0 && elapsed > 0.8) {
      const hsAlpha = Math.min(1, (elapsed - 0.8) * 2);
      ctx.save();
      ctx.globalAlpha = hsAlpha;
      ctx.font = '22px monospace';
      ctx.fillStyle = `rgba(${skin.accentRgb}, 0.7)`;
      ctx.textAlign = 'center';
      ctx.fillText(`BEST: ${this.highScore.toFixed(1)}s`, canvasWidth / 2, titleY + 80);
      ctx.restore();
    }

    // Pulsing prompt with shimmer
    if (elapsed > 1.2) {
      const promptAlpha = Math.min(1, (elapsed - 1.2) * 2);
      const pulse = 0.5 + 0.5 * Math.sin(now / 400);
      ctx.save();
      ctx.globalAlpha = promptAlpha * pulse;
      ctx.font = '18px monospace';
      ctx.fillStyle = skin.textColor;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 8;
      const isMobile = 'ontouchstart' in window;
      ctx.fillText(isMobile ? 'TAP TO START' : 'PRESS ANY KEY', canvasWidth / 2, canvasHeight * 2 / 3);
      ctx.restore();
    }

    // Leaderboard and skin hints
    if (elapsed > 1.5) {
      const hintAlpha = Math.min(1, (elapsed - 1.5) * 2);
      ctx.save();
      ctx.globalAlpha = hintAlpha * 0.5;
      ctx.font = '14px monospace';
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText('TAB — LEADERBOARD', canvasWidth / 2, canvasHeight * 2 / 3 + 35);
      ctx.fillText('[A] ACHIEVEMENTS', canvasWidth / 2, canvasHeight * 2 / 3 + 55);
      ctx.fillText(`[S] SKIN: ${skin.name.toUpperCase()}`, canvasWidth / 2, canvasHeight * 2 / 3 + 75);
      ctx.restore();
    }

    // Big friendly smiley face above the prompt
    if (elapsed > 1.0) {
      const smileyAlpha = Math.min(1, (elapsed - 1.0) * 2);
      const bob = Math.sin(now / 600) * 5;
      ctx.save();
      ctx.globalAlpha = smileyAlpha;
      const sy = canvasHeight / 2 + bob;
      const sSize = 30;

      // Face circle
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 3;
      ctx.shadowColor = skin.accentColor;
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, sy, sSize, 0, Math.PI * 2);
      ctx.stroke();

      // Eyes
      ctx.fillStyle = skin.accentColor;
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(canvasWidth / 2 - 10, sy - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(canvasWidth / 2 + 10, sy - 8, 4, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.strokeStyle = skin.accentColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, sy - 2, 14, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();

      ctx.restore();
    }

    // Small triangles falling in background for ambiance
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = skin.bgTriangleColor;
    for (let i = 0; i < 8; i++) {
      const tx = ((now * 0.02 + i * 137) % canvasWidth);
      const ty = ((now * 0.04 + i * 213) % (canvasHeight + 100)) - 50;
      const size = 15 + i * 3;
      ctx.beginPath();
      ctx.moveTo(tx, ty + size);
      ctx.lineTo(tx - size / 2, ty);
      ctx.lineTo(tx + size / 2, ty);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  renderDeathScreen(ctx, canvasWidth, canvasHeight, finalScore, now, rank) {
    if (this._deathTime === 0) this._deathTime = now;
    const elapsed = (now - this._deathTime) / 1000;

    // Darken background with animated vignette
    const vignetteAlpha = Math.min(0.7, elapsed * 2);
    const vignette = ctx.createRadialGradient(
      canvasWidth / 2, canvasHeight / 3, 50,
      canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight) * 0.6
    );
    vignette.addColorStop(0, `rgba(0, 0, 0, ${vignetteAlpha * 0.3})`);
    vignette.addColorStop(1, `rgba(0, 0, 0, ${vignetteAlpha})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Score zoom-in animation
    const scoreScale = Math.min(1, elapsed * 3);
    const scoreBounce = scoreScale < 1 ? 0 : Math.sin((elapsed - 0.33) * 6) * Math.exp(-(elapsed - 0.33) * 4) * 0.15;
    const finalScale = scoreScale + scoreBounce;

    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 3);
    ctx.scale(finalScale, finalScale);

    // Score glow
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = 25;
    ctx.font = 'bold 72px monospace';
    ctx.fillStyle = COLOR_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(finalScore.toFixed(1) + 's', 0, 0);
    ctx.restore();

    // Rank display
    if (rank > 0 && elapsed > 0.3) {
      const rankAlpha = Math.min(1, (elapsed - 0.3) * 3);
      ctx.save();
      ctx.globalAlpha = rankAlpha;
      ctx.textAlign = 'center';

      const isNew = rank === 1;
      const rankText = isNew ? 'NEW #1!' : `RANK #${rank}`;
      const rankColor = this._getRankColor(rank);

      // Glow effect for rank
      ctx.shadowColor = rankColor;
      ctx.shadowBlur = isNew ? 20 + Math.sin(now / 100) * 10 : 12;
      ctx.font = 'bold 32px monospace';
      ctx.fillStyle = rankColor;
      ctx.fillText(rankText, canvasWidth / 2, canvasHeight / 3 + 55);
      ctx.restore();
    }

    // High score / new record (shifted down if rank shown)
    const infoY = rank > 0 ? canvasHeight / 3 + 90 : canvasHeight / 3 + 60;
    const isNewRecord = finalScore > this.highScore;
    if (elapsed > 0.4) {
      const infoAlpha = Math.min(1, (elapsed - 0.4) * 3);
      ctx.save();
      ctx.globalAlpha = infoAlpha;
      ctx.textAlign = 'center';

      if (isNewRecord && rank === 0) {
        // Only show NEW RECORD if not already showing rank
        const hue = (now / 5) % 360;
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 15;
        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('NEW RECORD!', canvasWidth / 2, infoY);
      } else if (!isNewRecord && this.highScore > 0) {
        ctx.font = '22px monospace';
        ctx.fillStyle = COLOR_TEXT_DIM;
        ctx.fillText(`BEST: ${this.highScore.toFixed(1)}s`, canvasWidth / 2, infoY);
      }
      ctx.restore();
    }

    // Stats panel
    if (elapsed > 0.6) {
      const statsAlpha = Math.min(1, (elapsed - 0.6) * 2);
      ctx.save();
      ctx.globalAlpha = statsAlpha;
      ctx.textAlign = 'center';
      ctx.font = '15px monospace';

      const statsY = (rank > 0 ? canvasHeight / 3 + 120 : canvasHeight / 3 + 90);
      const lineHeight = 24;
      const statsData = [
        { label: 'SPLITS SURVIVED', value: String(this.stats.splitsSurvived), color: getCurrentSkin().accentColor },
        { label: 'TRIANGLES DODGED', value: String(this.stats.trianglesDodged), color: '#66e5ff' },
        { label: 'MAX COMBO', value: this.stats.maxCombo + 'x', color: '#ffcc00' },
        { label: 'TIME ALIVE', value: this.stats.timeAlive.toFixed(1) + 's', color: '#ffffff' },
      ];

      if (this.stats.goldenTrianglesCollected > 0) {
        statsData.push({
          label: 'GOLDEN TRIANGLES',
          value: String(this.stats.goldenTrianglesCollected),
          color: '#ffd700',
        });
      }

      for (let i = 0; i < statsData.length; i++) {
        const s = statsData[i];
        const y = statsY + i * lineHeight;
        ctx.fillStyle = COLOR_TEXT_DIM;
        ctx.textAlign = 'right';
        ctx.fillText(s.label, canvasWidth / 2 - 10, y);
        ctx.fillStyle = s.color;
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(s.value, canvasWidth / 2 + 10, y);
        ctx.font = '15px monospace';
      }

      ctx.restore();
    }

    // Retry prompt
    if (elapsed > 1.2) {
      const promptAlpha = Math.min(1, (elapsed - 1.2) * 2);
      const pulse = 0.5 + 0.5 * Math.sin(now / 400);
      ctx.save();
      ctx.globalAlpha = promptAlpha * pulse;
      ctx.font = '18px monospace';
      ctx.fillStyle = COLOR_TEXT;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 6;
      const isMobile2 = 'ontouchstart' in window;
      ctx.fillText(isMobile2 ? 'TAP TO RETRY' : 'PRESS ANY KEY TO RETRY', canvasWidth / 2, canvasHeight * 0.78);
      ctx.restore();
    }
  }

  // --- Name Entry Screen (arcade-style 3-char initials) ---

  resetNameEntry() {
    this._nameChars = [65, 65, 65];
    this._nameCursor = 0;
    this._nameConfirmed = false;
    this._nameEntryTime = 0;
    this._nameLastInput = 0;
  }

  isNameConfirmed() {
    return this._nameConfirmed;
  }

  getEnteredName() {
    return String.fromCharCode(...this._nameChars);
  }

  handleNameInput(key, now) {
    // Debounce inputs by 120ms
    if (now - this._nameLastInput < 120) return;
    this._nameLastInput = now;

    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      this._nameChars[this._nameCursor]++;
      if (this._nameChars[this._nameCursor] > 90) this._nameChars[this._nameCursor] = 65; // wrap Z->A
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      this._nameChars[this._nameCursor]--;
      if (this._nameChars[this._nameCursor] < 65) this._nameChars[this._nameCursor] = 90; // wrap A->Z
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      this._nameCursor = Math.min(2, this._nameCursor + 1);
    } else if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      this._nameCursor = Math.max(0, this._nameCursor - 1);
    } else if (key === 'Enter' || key === ' ') {
      this._nameConfirmed = true;
    }
    // Allow direct letter typing
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
      this._nameChars[this._nameCursor] = key.charCodeAt(0);
      if (this._nameCursor < 2) this._nameCursor++;
    } else if (key.length === 1 && key >= 'a' && key <= 'z') {
      this._nameChars[this._nameCursor] = key.toUpperCase().charCodeAt(0);
      if (this._nameCursor < 2) this._nameCursor++;
    }
  }

  renderNameEntry(ctx, canvasWidth, canvasHeight, finalScore, rank, now) {
    if (this._nameEntryTime === 0) this._nameEntryTime = now;
    const elapsed = (now - this._nameEntryTime) / 1000;

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const centerY = canvasHeight / 2;

    // Title
    if (elapsed > 0.1) {
      const alpha = Math.min(1, (elapsed - 0.1) * 3);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Rank announcement
      const rankColor = this._getRankColor(rank);
      ctx.shadowColor = rankColor;
      ctx.shadowBlur = 15;
      ctx.font = 'bold 36px monospace';
      ctx.fillStyle = rankColor;
      const rankText = rank === 1 ? 'NEW #1!' : `RANK #${rank}!`;
      ctx.fillText(rankText, canvasWidth / 2, centerY - 120);

      // Score
      ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 48px monospace';
      ctx.fillStyle = COLOR_TEXT;
      ctx.fillText(finalScore.toFixed(1) + 's', canvasWidth / 2, centerY - 70);
      ctx.restore();
    }

    // "ENTER YOUR INITIALS" prompt
    if (elapsed > 0.3) {
      const alpha = Math.min(1, (elapsed - 0.3) * 3);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '20px monospace';
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText('ENTER YOUR INITIALS', canvasWidth / 2, centerY - 20);
      ctx.restore();
    }

    // Letter slots
    if (elapsed > 0.4) {
      const alpha = Math.min(1, (elapsed - 0.4) * 3);
      ctx.save();
      ctx.globalAlpha = alpha;

      const slotWidth = 60;
      const slotGap = 15;
      const totalWidth = slotWidth * 3 + slotGap * 2;
      const startX = canvasWidth / 2 - totalWidth / 2;

      for (let i = 0; i < 3; i++) {
        const sx = startX + i * (slotWidth + slotGap);
        const sy = centerY + 10;
        const isCurrent = i === this._nameCursor;

        // Slot background
        const skin2 = getCurrentSkin();
        ctx.fillStyle = isCurrent ? `rgba(${skin2.accentRgb}, 0.15)` : 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(sx, sy, slotWidth, 70);

        // Slot border
        ctx.strokeStyle = isCurrent ? skin2.accentColor : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isCurrent ? 2 : 1;
        ctx.strokeRect(sx, sy, slotWidth, 70);

        // Letter
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isCurrent ? skin2.accentColor : COLOR_TEXT;
        if (isCurrent) {
          ctx.shadowColor = skin2.accentColor;
          ctx.shadowBlur = 10;
        }
        ctx.fillText(String.fromCharCode(this._nameChars[i]), sx + slotWidth / 2, sy + 35);
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // Arrow indicators for current slot
        if (isCurrent) {
          const arrowBob = Math.sin(now / 200) * 3;
          ctx.font = '18px monospace';
          ctx.fillStyle = `rgba(${skin2.accentRgb}, 0.7)`;
          ctx.fillText('\u25B2', sx + slotWidth / 2, sy - 10 + arrowBob);
          ctx.fillText('\u25BC', sx + slotWidth / 2, sy + 85 - arrowBob);
        }
      }

      ctx.restore();
    }

    // Controls hint
    if (elapsed > 0.6) {
      const alpha = Math.min(1, (elapsed - 0.6) * 2);
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.font = '14px monospace';
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText('\u2190\u2192 MOVE   \u2191\u2193 CHANGE   ENTER CONFIRM', canvasWidth / 2, centerY + 120);
      ctx.fillText('OR TYPE LETTERS DIRECTLY', canvasWidth / 2, centerY + 140);
      ctx.restore();
    }
  }

  // --- Leaderboard Screen ---

  resetLeaderboardScreen() {
    this._leaderboardTime = 0;
    this._newEntryRank = 0;
  }

  setNewEntryRank(rank) {
    this._newEntryRank = rank;
  }

  renderLeaderboardScreen(ctx, canvasWidth, canvasHeight, entries, now) {
    if (this._leaderboardTime === 0) this._leaderboardTime = now;
    const elapsed = (now - this._leaderboardTime) / 1000;
    const skin = getCurrentSkin();

    // Dark background
    ctx.fillStyle = 'rgba(10, 14, 39, 0.97)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Animated scanlines
    ctx.fillStyle = `rgba(${skin.accentRgb}, 0.01)`;
    for (let y = 0; y < canvasHeight; y += 4) {
      if (Math.sin(y * 0.1 + now * 0.002) > 0.5) {
        ctx.fillRect(0, y, canvasWidth, 2);
      }
    }

    // Title
    const titleY = 60;
    if (elapsed > 0.05) {
      const alpha = Math.min(1, elapsed * 4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.shadowColor = skin.accentColor;
      ctx.shadowBlur = 15;
      ctx.font = 'bold 42px monospace';
      ctx.fillStyle = skin.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LEADERBOARD', canvasWidth / 2, titleY);
      ctx.restore();
    }

    // Decorative line
    if (elapsed > 0.15) {
      const lineAlpha = Math.min(1, (elapsed - 0.15) * 3);
      ctx.save();
      ctx.globalAlpha = lineAlpha * 0.5;
      const lineGrad = ctx.createLinearGradient(canvasWidth / 2 - 200, 0, canvasWidth / 2 + 200, 0);
      lineGrad.addColorStop(0, 'transparent');
      lineGrad.addColorStop(0.2, COLOR_GOLD);
      lineGrad.addColorStop(0.5, skin.accentColor);
      lineGrad.addColorStop(0.8, COLOR_GOLD);
      lineGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvasWidth / 2 - 200, titleY + 28);
      ctx.lineTo(canvasWidth / 2 + 200, titleY + 28);
      ctx.stroke();
      ctx.restore();
    }

    // Header row
    const tableTop = titleY + 55;
    const rowHeight = 42;
    if (elapsed > 0.2) {
      const alpha = Math.min(1, (elapsed - 0.2) * 3);
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.font = '14px monospace';
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.textAlign = 'left';
      const colRank = canvasWidth / 2 - 180;
      const colName = canvasWidth / 2 - 110;
      const colScore = canvasWidth / 2 + 40;
      const colDate = canvasWidth / 2 + 120;
      ctx.fillText('RANK', colRank, tableTop);
      ctx.fillText('NAME', colName, tableTop);
      ctx.fillText('SCORE', colScore, tableTop);
      ctx.fillText('DATE', colDate, tableTop);
      ctx.restore();
    }

    // Entries
    if (entries.length === 0 && elapsed > 0.3) {
      const alpha = Math.min(1, (elapsed - 0.3) * 2);
      ctx.save();
      ctx.globalAlpha = alpha * 0.5;
      ctx.font = '20px monospace';
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.textAlign = 'center';
      ctx.fillText('NO SCORES YET', canvasWidth / 2, tableTop + 80);
      ctx.fillText('PLAY A GAME!', canvasWidth / 2, tableTop + 110);
      ctx.restore();
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const rowDelay = 0.25 + i * 0.06;
      if (elapsed <= rowDelay) continue;

      const rowAlpha = Math.min(1, (elapsed - rowDelay) * 3);
      const rowY = tableTop + 25 + i * rowHeight;
      const isNewEntry = i + 1 === this._newEntryRank;
      const rankColor = this._getRankColor(i + 1);

      ctx.save();
      ctx.globalAlpha = rowAlpha;

      // Highlight row for new entry
      if (isNewEntry) {
        const pulse = 0.3 + 0.15 * Math.sin(now / 300);
        ctx.fillStyle = `rgba(${skin.accentRgb}, ${pulse})`;
        ctx.fillRect(canvasWidth / 2 - 195, rowY - 14, 390, rowHeight - 4);

        // Animated slide-in from left
        const slideIn = Math.min(1, (elapsed - rowDelay) * 2);
        ctx.globalAlpha = rowAlpha * slideIn;
      }

      const colRank = canvasWidth / 2 - 180;
      const colName = canvasWidth / 2 - 110;
      const colScore = canvasWidth / 2 + 40;
      const colDate = canvasWidth / 2 + 120;

      // Rank number with medal color
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      if (i < 3) {
        ctx.shadowColor = rankColor;
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = rankColor;
      const rankLabel = i < 3 ? ['1st', '2nd', '3rd'][i] : `${i + 1}th`;
      ctx.fillText(rankLabel, colRank, rowY);
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      // Name
      ctx.font = 'bold 22px monospace';
      ctx.fillStyle = isNewEntry ? skin.accentColor : skin.textColor;
      ctx.fillText(entry.initials, colName, rowY);

      // Score
      ctx.font = '20px monospace';
      ctx.fillStyle = isNewEntry ? COLOR_TEXT : COLOR_TEXT_DIM;
      ctx.fillText(entry.score.toFixed(1) + 's', colScore, rowY);

      // Date
      ctx.font = '14px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText(entry.date || '', colDate, rowY);

      ctx.restore();
    }

    // Back prompt
    if (elapsed > 0.8) {
      const alpha = Math.min(1, (elapsed - 0.8) * 2);
      const pulse = 0.5 + 0.5 * Math.sin(now / 400);
      ctx.save();
      ctx.globalAlpha = alpha * pulse;
      ctx.font = '16px monospace';
      ctx.fillStyle = COLOR_TEXT;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 6;
      ctx.fillText('PRESS ESC OR TAB TO GO BACK', canvasWidth / 2, canvasHeight - 40);
      ctx.restore();
    }
  }

  resetDeathScreen() {
    this._deathTime = 0;
  }

  resetReadyScreen() {
    this._readyTime = 0;
  }

  updateHighScore(score) {
    if (score > this.highScore) {
      this.highScore = score;
      try {
        localStorage.setItem(HIGH_SCORE_KEY, String(score));
      } catch (_) { /* localStorage unavailable */ }
    }
  }

  _getRankColor(rank) {
    if (rank === 1) return COLOR_GOLD;
    if (rank === 2) return COLOR_SILVER;
    if (rank === 3) return COLOR_BRONZE;
    return COLOR_TEXT;
  }

  _loadHighScore() {
    try {
      return parseFloat(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch (_) {
      return 0;
    }
  }
}

// src/ui.js — Score display, death screen, high score — polished and juicy
import { COLOR_TEXT, COLOR_TEXT_DIM, HIGH_SCORE_KEY } from './constants.js';

export class UI {
  constructor() {
    this.highScore = this._loadHighScore();
    this._deathTime = 0;
    this._readyTime = 0;
  }

  renderScore(ctx, elapsedSeconds, canvasWidth) {
    const scoreText = elapsedSeconds.toFixed(1);

    // Score glow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 212, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = COLOR_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(scoreText, canvasWidth / 2, 20);
    ctx.restore();

    // Thin decorative line under score
    const textWidth = ctx.measureText(scoreText).width;
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(canvasWidth / 2 - textWidth / 2 - 10, 75);
    ctx.lineTo(canvasWidth / 2 + textWidth / 2 + 10, 75);
    ctx.stroke();
  }

  renderReadyScreen(ctx, canvasWidth, canvasHeight, now) {
    if (this._readyTime === 0) this._readyTime = now;
    const elapsed = (now - this._readyTime) / 1000;

    // Animated background scanlines
    ctx.fillStyle = 'rgba(0, 212, 255, 0.015)';
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
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 20;
      ctx.font = 'bold 72px monospace';
      ctx.fillStyle = COLOR_TEXT;
      ctx.fillText(title[i], letterX, letterY);

      // Cyan tint on the letter
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
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
      lineGrad.addColorStop(0.2, '#00d4ff');
      lineGrad.addColorStop(0.8, '#00d4ff');
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
      ctx.fillStyle = 'rgba(0, 212, 255, 0.7)';
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
      ctx.fillStyle = COLOR_TEXT;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 8;
      ctx.fillText('PRESS ANY KEY', canvasWidth / 2, canvasHeight * 2 / 3);
      ctx.restore();
    }

    // Small triangles falling in background for ambiance
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ff1744';
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

  renderDeathScreen(ctx, canvasWidth, canvasHeight, finalScore, now) {
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

    // High score / new record
    const isNewRecord = finalScore > this.highScore;
    if (elapsed > 0.4) {
      const infoAlpha = Math.min(1, (elapsed - 0.4) * 3);
      ctx.save();
      ctx.globalAlpha = infoAlpha;
      ctx.textAlign = 'center';

      if (isNewRecord) {
        // Glowing "NEW RECORD!" with color cycling
        const hue = (now / 5) % 360;
        ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        ctx.shadowBlur = 15;
        ctx.font = 'bold 28px monospace';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('NEW RECORD!', canvasWidth / 2, canvasHeight / 3 + 60);
      } else if (this.highScore > 0) {
        ctx.font = '22px monospace';
        ctx.fillStyle = COLOR_TEXT_DIM;
        ctx.fillText(`BEST: ${this.highScore.toFixed(1)}s`, canvasWidth / 2, canvasHeight / 3 + 60);
      }
      ctx.restore();
    }

    // Retry prompt
    if (elapsed > 0.8) {
      const promptAlpha = Math.min(1, (elapsed - 0.8) * 2);
      const pulse = 0.5 + 0.5 * Math.sin(now / 400);
      ctx.save();
      ctx.globalAlpha = promptAlpha * pulse;
      ctx.font = '18px monospace';
      ctx.fillStyle = COLOR_TEXT;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
      ctx.shadowBlur = 6;
      ctx.fillText('PRESS ANY KEY TO RETRY', canvasWidth / 2, canvasHeight * 2 / 3);
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

  _loadHighScore() {
    try {
      return parseFloat(localStorage.getItem(HIGH_SCORE_KEY)) || 0;
    } catch (_) {
      return 0;
    }
  }
}

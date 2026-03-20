// src/ui.js — Score display, death screen, high score
import { COLOR_TEXT, COLOR_TEXT_DIM, HIGH_SCORE_KEY } from './constants.js';

export class UI {
  constructor() {
    this.highScore = this._loadHighScore();
  }

  renderScore(ctx, elapsedSeconds, canvasWidth) {
    const scoreText = elapsedSeconds.toFixed(1);
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = COLOR_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(scoreText, canvasWidth / 2, 20);
  }

  renderReadyScreen(ctx, canvasWidth, canvasHeight, now) {
    ctx.font = 'bold 72px monospace';
    ctx.fillStyle = COLOR_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SPLITTR', canvasWidth / 2, canvasHeight / 3);

    if (this.highScore > 0) {
      ctx.font = '24px monospace';
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.fillText(`BEST: ${this.highScore.toFixed(1)}s`, canvasWidth / 2, canvasHeight / 3 + 60);
    }

    // Pulsing prompt
    const alpha = 0.5 + 0.5 * Math.sin(now / 300);
    ctx.font = '20px monospace';
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText('PRESS ANY KEY', canvasWidth / 2, canvasHeight * 2 / 3);
  }

  renderDeathScreen(ctx, canvasWidth, canvasHeight, finalScore, now) {
    // Darken background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Score
    ctx.font = 'bold 72px monospace';
    ctx.fillStyle = COLOR_TEXT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(finalScore.toFixed(1) + 's', canvasWidth / 2, canvasHeight / 3);

    // High score
    const isNewRecord = finalScore > this.highScore;
    if (isNewRecord) {
      ctx.font = 'bold 28px monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('NEW RECORD!', canvasWidth / 2, canvasHeight / 3 + 60);
    } else if (this.highScore > 0) {
      ctx.font = '24px monospace';
      ctx.fillStyle = COLOR_TEXT_DIM;
      ctx.fillText(`BEST: ${this.highScore.toFixed(1)}s`, canvasWidth / 2, canvasHeight / 3 + 60);
    }

    // Retry prompt (pulsing)
    const alpha = 0.5 + 0.5 * Math.sin(now / 300);
    ctx.font = '20px monospace';
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText('PRESS ANY KEY TO RETRY', canvasWidth / 2, canvasHeight * 2 / 3);
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

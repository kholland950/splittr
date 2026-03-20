// src/accessibility.js — Accessibility utilities for screen readers and reduced motion

// Detect reduced motion preference
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let _reducedMotion = reducedMotionQuery.matches;
reducedMotionQuery.addEventListener('change', (e) => {
  _reducedMotion = e.matches;
});

/**
 * Returns true if the user prefers reduced motion.
 * Used to disable screen shake, reduce particles, simplify animations.
 */
export function prefersReducedMotion() {
  return _reducedMotion;
}

/**
 * Announce an important game state change to screen readers via aria-live="assertive".
 * Use for: game start, game over, split events, achievements.
 */
export function announce(message) {
  const el = document.getElementById('game-announcements');
  if (el) {
    // Clear first to ensure re-announcement of same message
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = message; });
  }
}

/**
 * Announce score updates to screen readers via aria-live="polite".
 * Use for: periodic score updates during gameplay.
 */
export function announceScore(message) {
  const el = document.getElementById('game-score-announce');
  if (el) el.textContent = message;
}

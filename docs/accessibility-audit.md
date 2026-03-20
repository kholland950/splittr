# Accessibility Audit Report — Splittr

## Audit Overview
- **Product**: Splittr — HTML5 Canvas arcade game (vanilla JS, GitHub Pages)
- **Standard**: WCAG 2.2 Level AA
- **Date**: 2026-03-19
- **Auditor**: AccessibilityAuditor
- **Tools**: Manual code review, WCAG 2.2 criteria analysis, assistive technology pattern review
- **Note**: This is a real-time action game rendered entirely in `<canvas>`. Many WCAG criteria apply differently to games than to typical web content. The audit accounts for this context.

## Testing Methodology
- **Code Review**: All source files in `src/`, `index.html`, and `css/main.css` reviewed
- **Screen Reader Patterns**: Evaluated DOM structure for VoiceOver/NVDA compatibility
- **Keyboard Testing**: Analyzed all interactive flows for keyboard-only navigation
- **Visual Testing**: Reviewed color values for contrast ratios, animation patterns for motion sensitivity
- **Cognitive Review**: Assessed game comprehensibility, instructions, and feedback mechanisms

## Summary
- **Total Issues Found**: 14
  - Critical: 3 (blocks access entirely for some users)
  - Serious: 4 (major barriers requiring workarounds)
  - Moderate: 4 (causes difficulty but has workarounds)
  - Minor: 3 (annoyances that reduce usability)

- **WCAG Conformance**: PARTIALLY CONFORMS (after fixes applied)
- **Assistive Technology Compatibility**: PARTIAL (inherent canvas limitation)

---

## Issues Found (Pre-Fix)

### Issue 1: Canvas has no accessible name or description
**WCAG Criterion**: 1.1.1 Non-text Content (Level A)
**Severity**: Critical
**User Impact**: Screen reader users have no idea what the canvas element is or what the game does. They hear "game-canvas" (the ID) with no context.
**Location**: `index.html`, line 10
**Status**: FIXED
**Fix Applied**: Added `aria-label`, `aria-describedby`, `role="img"`, fallback text content, and a visually hidden `#game-description` element explaining the game mechanics.

### Issue 2: No screen reader announcements for game state changes
**WCAG Criterion**: 4.1.3 Status Messages (Level AA)
**Severity**: Critical
**User Impact**: Screen reader users cannot know when the game starts, when they score, when they split, or when they die. The entire game is invisible to them.
**Location**: `src/game.js` — all state transitions
**Status**: FIXED
**Fix Applied**: Added `aria-live="assertive"` region (`#game-announcements`) for critical state changes (game start, game over, score) and `aria-live="polite"` region (`#game-score-announce`) for periodic score updates every 10 seconds. Created `src/accessibility.js` module with `announce()` and `announceScore()` functions.

### Issue 3: No prefers-reduced-motion support
**WCAG Criterion**: 2.3.3 Animation from Interactions (Level AAA) / Best Practice
**Severity**: Critical
**User Impact**: Users with vestibular disorders or motion sensitivity experience screen shake, particle bursts, death flashes, pulsing animations, and constant background particle movement with no way to disable them.
**Location**: `src/renderer.js`, `src/particles.js`, `src/ui.js`
**Status**: FIXED
**Fix Applied**:
- Created `src/accessibility.js` with `prefersReducedMotion()` detector that responds to OS-level `prefers-reduced-motion: reduce` setting
- `renderer.js`: Screen shake (`triggerShake`) and death flash (`triggerDeathFlash`) are skipped when reduced motion is preferred
- `particles.js`: All particle emission functions (`emitSplit`, `emitDestroy`, `emitMerge`, `emitHeartTrail`, `emitTriangleTrail`) are skipped when reduced motion is preferred
- `css/main.css`: Added `@media (prefers-reduced-motion: reduce)` rule to disable CSS animations/transitions

### Issue 4: No skip link or semantic page structure
**WCAG Criterion**: 2.4.1 Bypass Blocks (Level A)
**Severity**: Serious
**User Impact**: Screen reader and keyboard users land on the page with no heading structure, no landmark regions, and no way to skip directly to the game.
**Location**: `index.html`
**Status**: FIXED
**Fix Applied**: Added `<main role="main">` landmark, `<h1 class="sr-only">` heading, and a skip link (`<a href="#game-canvas" class="sr-only sr-only-focusable">Skip to game</a>`) that becomes visible on focus.

### Issue 5: Page title is not descriptive
**WCAG Criterion**: 2.4.2 Page Titled (Level A)
**Severity**: Moderate
**User Impact**: "splittr" as a title tells users nothing about what the page is. Screen reader users and users with many tabs open cannot identify this page.
**Location**: `index.html`, `<title>` tag
**Status**: FIXED
**Fix Applied**: Changed to `<title>Splittr - Dodge, Split, Survive</title>`. Added `<meta name="description">` for SEO/accessibility.

### Issue 6: Canvas not keyboard-focusable with visible indicator
**WCAG Criterion**: 2.4.7 Focus Visible (Level AA)
**Severity**: Serious
**User Impact**: Keyboard users cannot visually confirm that the game canvas has focus. Without `tabindex`, the canvas cannot receive focus at all.
**Location**: `index.html`, `css/main.css`
**Status**: FIXED
**Fix Applied**: Added `tabindex="0"` to the canvas element and a `:focus` CSS rule with a visible cyan outline (`3px solid #00d4ff`).

### Issue 7: No visually hidden utility class
**WCAG Criterion**: (Supporting technique for multiple criteria)
**Severity**: Moderate
**User Impact**: Without a `.sr-only` class, there's no way to provide screen-reader-only content like game descriptions, instructions, or state announcements.
**Location**: `css/main.css`
**Status**: FIXED
**Fix Applied**: Added `.sr-only` class (clip-rect technique) and `.sr-only-focusable:focus` for the skip link.

### Issue 8: Color contrast — dim text on dark background
**WCAG Criterion**: 1.4.3 Contrast (Minimum) (Level AA)
**Severity**: Serious
**User Impact**: Several UI text elements use `rgba(255, 255, 255, 0.5)` (`COLOR_TEXT_DIM`) on dark backgrounds. At 50% opacity white on `#0a0e27`, the contrast ratio is approximately 3.5:1, below the 4.5:1 minimum for normal text.
**Location**: `src/ui.js` — leaderboard hints, high score display, death screen secondary text; `src/constants.js` line 62
**Status**: NOT FIXED (requires design decision)
**Recommendation**: Increase `COLOR_TEXT_DIM` to `rgba(255, 255, 255, 0.65)` minimum, or use a lighter color like `#a0a0a0` on the dark background. Verify each skin's text color against its background.

### Issue 9: Pulsing "PRESS ANY KEY" text may be invisible at certain moments
**WCAG Criterion**: 1.4.3 Contrast (Minimum) (Level AA)
**Severity**: Moderate
**User Impact**: The prompt text pulses between 0% and 100% opacity using a sine wave. At the low point of the pulse, the text is completely invisible. Users looking at the screen at the wrong moment may not see the instruction.
**Location**: `src/ui.js`, `renderReadyScreen` and `renderDeathScreen` — `pulse` calculation
**Status**: NOT FIXED (requires design decision)
**Recommendation**: Clamp the minimum pulse opacity to 0.4 or higher: `const pulse = 0.4 + 0.6 * Math.sin(now / 400)` so the text never fully disappears.

### Issue 10: Game instructions only visible inside canvas
**WCAG Criterion**: 3.3.2 Labels or Instructions (Level A)
**Severity**: Serious
**User Impact**: All game instructions (controls, mechanics, how to play) are rendered as canvas text. A screen reader user receives zero instruction on how to play.
**Location**: `src/ui.js` — ready screen
**Status**: FIXED (via Issue 1)
**Fix Applied**: The visually hidden `#game-description` div now contains full gameplay instructions accessible to screen readers.

### Issue 11: Achievement gallery uses 'A' key with no ARIA context
**WCAG Criterion**: 2.1.1 Keyboard (Level A) / 4.1.2 Name, Role, Value (Level A)
**Severity**: Moderate
**User Impact**: The 'A' key toggles the achievement gallery, but there's no way for a screen reader user to know this control exists or what state it's in.
**Location**: `src/game.js` — achievement gallery toggle; `src/ui.js` — ready screen hint
**Status**: PARTIALLY FIXED
**Fix Applied**: The `#game-description` now mentions the 'A' key for achievements. Full ARIA state management for gallery open/close is not implemented (would require DOM updates for a canvas-rendered overlay).

### Issue 12: No `lang` attribute issues but missing `meta` tags
**WCAG Criterion**: 3.1.1 Language of Page (Level A)
**Severity**: Minor
**User Impact**: The `lang="en"` attribute was already present. However, `<meta name="description">` and `<meta name="theme-color">` were missing.
**Location**: `index.html`
**Status**: FIXED
**Fix Applied**: Added meta description and theme-color.

### Issue 13: FPS counter has low contrast
**WCAG Criterion**: 1.4.3 Contrast (Minimum) (Level AA)
**Severity**: Minor
**User Impact**: FPS display uses `rgba(255, 255, 255, 0.35)` — extremely low contrast. However, this is a debug/developer-facing element, not user-facing content.
**Location**: `src/game.js`, FPS counter rendering
**Status**: NOT FIXED (by design — debug element)
**Recommendation**: Consider hiding the FPS counter in production builds or making it togglable.

### Issue 14: Background animations in title screen not disableable
**WCAG Criterion**: 2.2.2 Pause, Stop, Hide (Level A)
**Severity**: Minor
**User Impact**: Scanlines, falling triangle silhouettes, bobbing smiley face, and twinkling background stars animate continuously on the title screen with no pause control. The reduced motion fix addresses particles and shake but not these canvas-drawn animations.
**Location**: `src/ui.js` — `renderReadyScreen`; `src/renderer.js` — `BgStar`, grid animation
**Status**: PARTIALLY FIXED
**Fix Applied**: Particle effects are disabled with `prefers-reduced-motion`. Background star twinkle, scanlines, and decorative animations still run in the canvas. Full fix would require threading `prefersReducedMotion()` into every render function.
**Recommendation**: When `prefers-reduced-motion` is active, skip scanline animation, freeze background stars, and disable the bobbing smiley. These are cosmetic and non-essential.

---

## What's Working Well
- **Keyboard controls are the primary input** — the game is inherently keyboard-first, using letter key pairs. This is excellent for keyboard accessibility.
- **Gamepad support** is included as an alternative input method.
- **`lang="en"` is present** on the `<html>` element.
- **Game state machine is clean** — READY/PLAYING/DEAD states make it straightforward to announce transitions.
- **Visual feedback is strong** — glow effects, particle bursts, and face expressions communicate game state visually. The smiley face expressions (happy -> worried -> scared -> dead) are a creative accessibility win for communicating danger level.
- **Control key labels are rendered on each box** — users can always see which keys control which box.
- **Color choices use high-saturation, high-contrast colors** for game elements (cyan boxes on dark blue, red triangles) — the primary gameplay elements are visually distinct.

---

## Remediation Priority

### Immediate (Fixed in this audit)
1. Canvas `aria-label` and `aria-describedby` for screen readers
2. Live region announcements for game state changes
3. `prefers-reduced-motion` support (particles, screen shake, death flash disabled)
4. Semantic HTML structure (main landmark, h1, skip link)
5. Page title improvement and meta tags
6. Canvas focus indicator and `tabindex`
7. Visually hidden game description with full instructions
8. `.sr-only` CSS utility class

### Short-term (Requires design decisions)
1. Increase `COLOR_TEXT_DIM` contrast ratio to meet 4.5:1 minimum
2. Clamp pulsing text minimum opacity to ensure always-visible prompts
3. Disable title screen decorative animations under `prefers-reduced-motion`
4. Add ARIA state announcements for achievement gallery open/close

### Ongoing
1. Audit each skin theme for sufficient contrast between text and background
2. Consider adding a visible "How to Play" overlay accessible outside of canvas
3. Consider adding configurable text size for canvas-rendered text
4. Test with actual screen readers (VoiceOver + Safari, NVDA + Chrome) to verify live region timing

---

## Recommended Next Steps

1. **Test with VoiceOver on macOS**: Navigate the page, start a game, play, die, and retry — verify all announcements are read correctly and at the right time
2. **Review skin contrast**: Run each skin's text color against its background through a contrast checker (the Ice skin uses dark text on light background — verify sufficient contrast)
3. **Consider an accessible game mode**: A simplified mode with slower speed and fewer visual effects for players who need reduced cognitive load
4. **Add audio cues**: The `AudioManager` already provides sound effects — ensure these are informative enough to convey game state (they already seem well-designed for this)
5. **Internationalization**: If the game is translated, ensure the live region announcements and `#game-description` are translated too

---

## Files Modified in This Audit
- `index.html` — Semantic structure, aria attributes, live regions, meta tags, skip link
- `css/main.css` — `.sr-only` class, focus indicator, `prefers-reduced-motion` media query
- `src/accessibility.js` — NEW: Reduced motion detection, screen reader announcement utilities
- `src/game.js` — Import accessibility module, announce game state transitions, periodic score announcements
- `src/renderer.js` — Skip screen shake and death flash when reduced motion preferred
- `src/particles.js` — Skip all particle emissions when reduced motion preferred

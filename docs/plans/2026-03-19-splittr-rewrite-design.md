# Splittr Rewrite Design

**Date:** 2026-03-19
**Status:** Draft

## Overview

Splittr is a casual arcade game where triangles fall from the sky and split you. You control a block at the bottom of the screen. Each time a triangle hits you, your block splits into two smaller pieces — each needing independent control. As the splits accumulate, the chaos escalates until you lose control entirely. The goal is to survive as long as possible.

The game targets the same addictive loop as Flappy Bird: dead-simple to understand, one-second onboarding, instant restart, and a score you can't stop trying to beat.

## Design Decisions

### Why It's Addicting

The Flappy Bird formula:
1. **Instant understanding** — triangles fall, dodge them. No tutorial needed.
2. **One-tap restart** — die and retry in under a second.
3. **Escalating chaos** — each split makes things harder, but you caused it. "I can handle one more split" is the hook.
4. **Score as identity** — a single number (survival time) that you share and compete over.
5. **Sessions under 60 seconds** — short enough to always play "one more."

### Core Mechanic: Splitting

When a triangle's tip contacts your block, the block splits into two halves that fly apart. Each half is independently controlled. The original block's control keys are inherited by the left child; the right child gets new keys.

- **Max split depth: 4** — yields up to 16 boxes at maximum chaos
- **Split immunity: 400ms** — newly split boxes flash and can't be re-split immediately
- **Death condition:** When a triangle's tip hits a box at max split depth, that box is destroyed. Edge-contact pushes still work on max-depth boxes (they push, never destroy). When all boxes are destroyed, game over.
- **Push mechanic preserved:** Triangles that graze a box (edge contact, not tip) push it sideways rather than splitting it.
- **Triangle consumed on tip-hit:** When a triangle's tip contacts a box (triggering a split or destroy), the triangle is removed. Triangles that only push (edge contact) are NOT consumed — they continue falling and can affect other boxes below.
- **Split fly-apart:** When a box splits, the two children separate by 1.5x the child's width and receive an initial velocity of +/-300 px/s outward. These values live in `constants.js`.

### Controls

**Desktop:**
- Key pairs assigned per box from a pool of 24 predefined pairs (same pool as original code: D/F, J/K, A/S, L/;, Q/W, O/P, E/R, U/I, T/Y, G/H, Z/X, B/N, C/V, M/comma, 1/2, 3/4, 5/6, 7/8, 9/0, -/=, [/], .//, '/\, plus one spare). Max 16 boxes needs 16 pairs — the pool of 24 is always sufficient, so no fallback needed.
- Left key = move left, right key = move right
- Each box displays its assigned keys on the face

**Mobile:**
- Tap left/right half of screen to move ALL boxes in that direction
- After first split: tilt device (accelerometer) to move left child, tap to move right child
- Fallback if no accelerometer: two-zone tap (left zone = left box, right zone = right box), with zones subdividing as splits happen

**Simplification for v1:** Desktop keyboard controls only. Mobile touch as stretch goal. The keyboard control chaos IS the game on desktop — trying to remember which keys control which box.

### Difficulty Progression

Difficulty scales with survival time, not score:

| Time (s) | Triangle spawn rate | Triangle fall speed | Max simultaneous |
|-----------|-------------------|--------------------|-----------------|
| 0-10      | Every 1.5s        | 200 px/s           | 3               |
| 10-20     | Every 1.0s        | 300 px/s           | 5               |
| 20-40     | Every 0.7s        | 400 px/s           | 8               |
| 40-60     | Every 0.5s        | 500 px/s           | 12              |
| 60+       | Every 0.3s        | 600 px/s           | 20              |

Triangles spawn at random X positions across the top, snapped to a grid of `triangleWidth` (60px) columns. No two triangles spawn in the same column within 0.5s. The 60+ tier is an intentional plateau — difficulty stops increasing, and the game becomes a pure endurance test at that point.

### Scoring

- **Primary score: Survival time** in seconds (displayed with one decimal place, e.g. "23.4")
- **Secondary stat: Split count** — total times you've been split (bragging rights)
- **High score** persisted in localStorage
- Displayed prominently during gameplay and on death screen

### Visual Design

**Minimalist, high-contrast, geometric.**

- **Background:** Dark navy (#0a0e27) with subtle grid lines
- **Player boxes:** Bright cyan (#00d4ff) — shrink and lighten as split depth increases
- **Triangles:** Hot red (#ff1744) — simple filled triangles pointing down
- **Score:** Large, white, top-center, monospace font
- **Death screen:** Score zooms in, "TAP TO RETRY" pulses, high score shown if beaten
- **Screen shake** on split (subtle, 3-4 frames)

No sprites, no images. Everything is drawn with Canvas primitives. This keeps the game lightweight and the aesthetic clean.

### Audio (Stretch Goal)

- Split sound: short percussive "crack"
- Destroy sound: lower "shatter"
- Background: none (Flappy Bird didn't need it)
- All audio via Web Audio API, generated programmatically (no audio files)

## Technical Architecture

### Tech Stack

- **Vanilla JavaScript** — no frameworks, no build step
- **HTML5 Canvas API** — direct rendering, no CreateJS dependency
- **Zero dependencies** — the entire game is index.html + a few JS files
- **GitHub Pages deployment** — push to main and it's live

### File Structure

```
splittr/
  index.html          # Entry point, canvas element
  css/
    main.css          # Minimal styling (canvas fullscreen, death overlay)
  src/
    game.js           # Game loop, state machine, initialization
    player.js         # PlayerBox class — movement, splitting, rendering
    triangle.js       # Triangle class — spawning, falling, collision
    input.js          # Keyboard input manager
    collision.js      # AABB collision detection, tip-in-box test
    renderer.js       # Canvas drawing utilities, screen shake
    difficulty.js     # Difficulty curve, spawn timing
    ui.js             # Score display, death screen, high score
    constants.js      # All tunable game values in one place
```

### Module Loading

All JS files use ES modules (`import`/`export`) loaded via `<script type="module" src="src/game.js">` in index.html. `game.js` is the entry point and imports everything else. No bundler needed — modern browsers support ES modules natively.

### Game Loop

RequestAnimationFrame-based with delta time:

```
State machine: READY -> PLAYING -> DEAD -> READY (restart)

READY: Shows game title, high score, and "PRESS ANY KEY" prompt. First keypress starts the game.
PLAYING: Active gameplay.
DEAD: Score zooms in, shows high score if beaten, "PRESS ANY KEY TO RETRY" pulses. Any keypress resets to PLAYING.

Each frame (PLAYING state):
  1. Calculate delta time
  2. Read input state
  3. Update player boxes (apply input, friction, movement)
  4. Resolve box-to-box collisions
  5. Update triangles (move, check spawn timer)
  6. Check triangle-box collisions (split or push)
  7. Check death condition
  8. Update score
  9. Render everything
```

### Key Classes

**Game** — State machine, owns the loop. Manages transitions between READY/PLAYING/DEAD states.

**PlayerBox** — Represents one player-controlled block. Properties: position, velocity, width, height, splitDepth, keyPair, immuneUntil. Methods: update(dt), render(ctx), split() -> [PlayerBox, PlayerBox].

**Triangle** — A falling enemy. Properties: x, y, velocity, width, height. Methods: update(dt), render(ctx), getBounds().

**InputManager** — Tracks keyboard state via keydown/keyup. Provides `isDown(keyCode)` query interface. Holds the key pair pool and allocation.

**DifficultyManager** — Given elapsed time, returns current spawn rate, fall speed, and max triangle count.

**CollisionSystem** — Pure functions: `tipHitsBox(triangle, box) -> bool`, `edgeContact(triangle, box) -> 'left'|'right'|null`, `boxOverlap(a, b) -> overlap|null`.

### Collision Detection

Two-phase collision for triangles vs boxes:
1. **AABB broadphase** — quick rectangle overlap check
2. **Tip test** — is the triangle's bottom-center point inside the box rectangle? If yes: split. If no but AABB overlaps: push.

Box-to-box collision resolution:
1. Detect AABB overlap between each pair of boxes
2. Calculate overlap amount on X axis
3. Push each box apart by half the overlap + 1px (equal separation)
4. Swap velocities with 0.8 damping factor (energy-losing collision)

With max 16 boxes, worst case is 120 pair checks per frame — trivially fast.

### Canvas Rendering

All rendering through a single 2D canvas context. Draw order:
1. Background + grid
2. Player boxes (with key labels)
3. Triangles
4. UI overlay (score, death screen)

Canvas resizes to fill viewport. Game world coordinates match pixel coordinates (no virtual resolution needed for this type of game).

**Boundary behavior:** Boxes are confined to the canvas. When a box hits a wall, it bounces back with 0.4x velocity damping (same feel as original). Boxes cannot leave the screen.

### State Persistence

- `localStorage.setItem('splittr-highscore', score)` — that's it
- No accounts, no server, no leaderboard (v1)

## Scope: What's In v1, What's Not

### In v1
- Core split mechanic with keyboard controls
- Difficulty progression curve
- Score + high score (localStorage)
- Death screen with instant restart
- Clean geometric visual style
- Screen shake on split
- Responsive canvas (fills viewport)
- GitHub Pages deployment

### Not In v1 (Future)
- Mobile touch/tilt controls
- Programmatic audio
- Particle effects on destroy
- Leaderboard / score sharing
- Power-ups or special triangles
- Pause menu
- Multiple game modes

## Success Criteria

1. A new player understands the game within 3 seconds of seeing it
2. Average session length: 15-45 seconds
3. The "one more try" impulse is strong — death-to-playing takes < 1 second
4. Runs at 60fps on any modern browser
5. Deploys to GitHub Pages with zero build step
6. Total JS bundle under 20KB unminified

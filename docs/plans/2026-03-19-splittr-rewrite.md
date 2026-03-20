# Splittr Rewrite Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite Splittr from scratch as a zero-dependency HTML5 Canvas arcade game where falling triangles split player-controlled blocks, deployed to GitHub Pages.

**Architecture:** State-machine game loop (READY/PLAYING/DEAD) driven by requestAnimationFrame with delta time. ES modules for code organization — each file has one responsibility. Pure-logic modules (collision, difficulty, input) are unit-tested via a minimal browser test runner. Canvas rendering uses direct 2D context calls with no framework.

**Tech Stack:** Vanilla JavaScript (ES modules), HTML5 Canvas API, localStorage for high scores, GitHub Pages deployment.

**Design Doc:** `docs/plans/2026-03-19-splittr-rewrite-design.md`

---

## File Structure

```
splittr/
  index.html              # Entry point, canvas element, loads game.js as module
  css/
    main.css              # Canvas fullscreen, death overlay styling
  src/
    constants.js          # All tunable game values (speeds, sizes, colors, key pairs)
    input.js              # Keyboard state tracker, key pair pool allocation
    difficulty.js         # Difficulty curve: spawn rate, speed, max count by elapsed time
    collision.js          # AABB broadphase, tip-in-box test, box-box overlap resolution
    player.js             # PlayerBox class: position, velocity, splitting, rendering
    triangle.js           # Triangle class: spawning, falling, rendering
    renderer.js           # Canvas drawing utilities, background grid, screen shake
    ui.js                 # Score display, death screen, high score (localStorage)
    game.js               # Game loop, state machine, initialization, orchestration
  tests/
    test-runner.js        # Minimal assertion library + test registry (no dependencies)
    test-constants.js     # Tests for constants integrity
    test-collision.js     # Tests for collision detection functions
    test-difficulty.js    # Tests for difficulty curve
    test-input.js         # Tests for input manager
    test-player.js        # Tests for player box logic (splitting, movement)
    test-triangle.js      # Tests for triangle spawning/update logic
  test.html               # Runs all tests in browser, displays pass/fail
```

---

## Chunk 1: Foundation — Constants, Test Infrastructure, Project Scaffolding

### Task 1: Create constants module

**Files:**
- Create: `src/constants.js`

- [ ] **Step 1: Create `src/constants.js` with all game constants**

```js
// src/constants.js — All tunable game values in one place

// Player
export const PLAYER_WIDTH = 160;
export const PLAYER_HEIGHT = 120;
export const PLAYER_ACCEL = 3000;
export const PLAYER_FRICTION = 400;
export const PLAYER_WALL_BOUNCE = 0.4;
export const MAX_SPLIT_DEPTH = 4;
export const SPLIT_IMMUNITY_MS = 400;
export const SPLIT_FLY_APART_MULTIPLIER = 1.5;
export const SPLIT_INITIAL_VELOCITY = 300;
export const BOX_COLLISION_DAMPING = 0.8;

// Triangles
export const TRIANGLE_WIDTH = 60;
export const TRIANGLE_HEIGHT = 50;
export const TRIANGLE_COLUMN_COOLDOWN_MS = 500;

// Difficulty tiers: [maxTime, spawnIntervalMs, fallSpeed, maxSimultaneous]
export const DIFFICULTY_TIERS = [
  { maxTime: 10,       spawnInterval: 1500, fallSpeed: 200, maxTriangles: 3 },
  { maxTime: 20,       spawnInterval: 1000, fallSpeed: 300, maxTriangles: 5 },
  { maxTime: 40,       spawnInterval: 700,  fallSpeed: 400, maxTriangles: 8 },
  { maxTime: 60,       spawnInterval: 500,  fallSpeed: 500, maxTriangles: 12 },
  { maxTime: Infinity, spawnInterval: 300,  fallSpeed: 600, maxTriangles: 20 },
];

// Colors
export const COLOR_BACKGROUND = '#0a0e27';
export const COLOR_GRID = 'rgba(255, 255, 255, 0.03)';
export const COLOR_PLAYER = '#00d4ff';
export const COLOR_PLAYER_LIGHT = '#66e5ff';
export const COLOR_TRIANGLE = '#ff1744';
export const COLOR_TEXT = '#ffffff';
export const COLOR_TEXT_DIM = 'rgba(255, 255, 255, 0.5)';

// Screen shake
export const SHAKE_DURATION_MS = 67; // ~4 frames at 60fps
export const SHAKE_MAGNITUDE = 4;

// Key pair pool: [leftKey, rightKey] — labels used for display, codes for input
export const KEY_PAIRS = [
  { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' },
  { left: 'j', right: 'k', leftLabel: 'J', rightLabel: 'K' },
  { left: 'a', right: 's', leftLabel: 'A', rightLabel: 'S' },
  { left: 'l', right: ';', leftLabel: 'L', rightLabel: ';' },
  { left: 'q', right: 'w', leftLabel: 'Q', rightLabel: 'W' },
  { left: 'o', right: 'p', leftLabel: 'O', rightLabel: 'P' },
  { left: 'e', right: 'r', leftLabel: 'E', rightLabel: 'R' },
  { left: 'u', right: 'i', leftLabel: 'U', rightLabel: 'I' },
  { left: 't', right: 'y', leftLabel: 'T', rightLabel: 'Y' },
  { left: 'g', right: 'h', leftLabel: 'G', rightLabel: 'H' },
  { left: 'z', right: 'x', leftLabel: 'Z', rightLabel: 'X' },
  { left: 'b', right: 'n', leftLabel: 'B', rightLabel: 'N' },
  { left: 'c', right: 'v', leftLabel: 'C', rightLabel: 'V' },
  { left: 'm', right: ',', leftLabel: 'M', rightLabel: ',' },
  { left: '1', right: '2', leftLabel: '1', rightLabel: '2' },
  { left: '3', right: '4', leftLabel: '3', rightLabel: '4' },
  { left: '5', right: '6', leftLabel: '5', rightLabel: '6' },
  { left: '7', right: '8', leftLabel: '7', rightLabel: '8' },
  { left: '9', right: '0', leftLabel: '9', rightLabel: '0' },
  { left: '-', right: '=', leftLabel: '-', rightLabel: '=' },
  { left: '[', right: ']', leftLabel: '[', rightLabel: ']' },
  { left: '.', right: '/', leftLabel: '.', rightLabel: '/' },
  { left: "'", right: '\\', leftLabel: "'", rightLabel: '\\' },
  { left: '`', right: 'Backspace', leftLabel: '`', rightLabel: 'BS' },
];

// localStorage key
export const HIGH_SCORE_KEY = 'splittr-highscore';
```

- [ ] **Step 2: Commit**

```bash
git add src/constants.js
git commit -m "feat: add constants module with all tunable game values"
```

---

### Task 2: Create minimal test infrastructure

**Files:**
- Create: `tests/test-runner.js`
- Create: `test.html`

- [ ] **Step 1: Create `tests/test-runner.js`**

A minimal test runner — no dependencies, runs in browser, reports pass/fail.

```js
// tests/test-runner.js — Minimal browser test runner

const tests = [];
let currentSuite = '';

export function describe(name, fn) {
  currentSuite = name;
  fn();
  currentSuite = '';
}

export function it(name, fn) {
  tests.push({ suite: currentSuite, name, fn });
}

export function expect(actual) {
  return {
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toBeCloseTo(expected, tolerance = 0.01) {
      if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`Expected ~${expected}, got ${actual} (tolerance: ${tolerance})`);
      }
    },
    toBeTruthy() {
      if (!actual) throw new Error(`Expected truthy, got ${JSON.stringify(actual)}`);
    },
    toBeFalsy() {
      if (actual) throw new Error(`Expected falsy, got ${JSON.stringify(actual)}`);
    },
    toBeGreaterThan(expected) {
      if (!(actual > expected)) throw new Error(`Expected ${actual} > ${expected}`);
    },
    toBeLessThan(expected) {
      if (!(actual < expected)) throw new Error(`Expected ${actual} < ${expected}`);
    },
    toEqual(expected) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      if (a !== b) throw new Error(`Expected ${b}, got ${a}`);
    },
    toBeNull() {
      if (actual !== null) throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
    },
    toBeNotNull() {
      if (actual === null) throw new Error(`Expected non-null, got null`);
    },
  };
}

export async function runAll() {
  const results = document.getElementById('results');
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const label = test.suite ? `${test.suite} > ${test.name}` : test.name;
    try {
      test.fn();
      passed++;
      const div = document.createElement('div');
      div.className = 'pass';
      div.textContent = `PASS: ${label}`;
      results.appendChild(div);
    } catch (err) {
      failed++;
      const div = document.createElement('div');
      div.className = 'fail';
      div.textContent = `FAIL: ${label} — ${err.message}`;
      results.appendChild(div);
    }
  }

  const summary = document.createElement('div');
  summary.className = 'summary';
  summary.textContent = `${passed} passed, ${failed} failed, ${tests.length} total`;
  results.prepend(summary);

  // Set title for easy CI/human check
  document.title = failed === 0 ? 'ALL TESTS PASSED' : `${failed} TESTS FAILED`;
}
```

- [ ] **Step 2: Create `test.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Splittr Tests</title>
  <style>
    body { font-family: monospace; background: #1a1a2e; color: #eee; padding: 20px; }
    .pass { color: #0f0; margin: 2px 0; }
    .fail { color: #f44; margin: 2px 0; font-weight: bold; }
    .summary { font-size: 1.4em; margin-bottom: 16px; padding: 8px; border-bottom: 1px solid #444; }
  </style>
</head>
<body>
  <div id="results"></div>
  <script type="module">
    // Import all test files — each registers tests via describe/it
    import './tests/test-constants.js';
    import './tests/test-collision.js';
    import './tests/test-difficulty.js';
    import './tests/test-input.js';
    import './tests/test-player.js';
    import './tests/test-triangle.js';
    import { runAll } from './tests/test-runner.js';
    runAll();
  </script>
</body>
</html>
```

- [ ] **Step 3: Create placeholder test files so test.html loads without errors**

Create each of these files with a single placeholder test:

`tests/test-constants.js`:
```js
import { describe, it, expect } from './test-runner.js';
import { MAX_SPLIT_DEPTH, KEY_PAIRS } from '../src/constants.js';

describe('constants', () => {
  it('MAX_SPLIT_DEPTH is 4', () => {
    expect(MAX_SPLIT_DEPTH).toBe(4);
  });

  it('KEY_PAIRS has at least 16 entries (enough for max boxes)', () => {
    expect(KEY_PAIRS.length >= 16).toBeTruthy();
  });

  it('KEY_PAIRS has 24 entries', () => {
    expect(KEY_PAIRS.length).toBe(24);
  });
});
```

`tests/test-collision.js`, `tests/test-difficulty.js`, `tests/test-input.js`, `tests/test-player.js`, `tests/test-triangle.js`:
Each starts as an empty file with just the import:
```js
import { describe, it, expect } from './test-runner.js';
// Tests added when module is implemented
```

- [ ] **Step 4: Open `test.html` in browser and verify all tests pass**

Run: Open `test.html` in a browser (e.g., `open test.html` on macOS).
Expected: Page title is "ALL TESTS PASSED", constants tests show green.

- [ ] **Step 5: Commit**

```bash
git add tests/ test.html
git commit -m "feat: add minimal browser test runner and constants tests"
```

---

## Chunk 2: Pure Logic Modules — Input, Difficulty, Collision

### Task 3: Implement InputManager

**Files:**
- Create: `src/input.js`
- Modify: `tests/test-input.js`

- [ ] **Step 1: Write failing tests in `tests/test-input.js`**

```js
import { describe, it, expect } from './test-runner.js';
import { InputManager } from '../src/input.js';

describe('InputManager', () => {
  it('tracks key down state', () => {
    const input = new InputManager();
    input.handleKeyDown({ key: 'a' });
    expect(input.isDown('a')).toBeTruthy();
  });

  it('tracks key up state', () => {
    const input = new InputManager();
    input.handleKeyDown({ key: 'a' });
    input.handleKeyUp({ key: 'a' });
    expect(input.isDown('a')).toBeFalsy();
  });

  it('returns false for keys never pressed', () => {
    const input = new InputManager();
    expect(input.isDown('z')).toBeFalsy();
  });

  it('allocates key pairs from the pool', () => {
    const input = new InputManager();
    const pair1 = input.allocateKeyPair();
    const pair2 = input.allocateKeyPair();
    expect(pair1.left).toBe('d');
    expect(pair1.right).toBe('f');
    expect(pair2.left).toBe('j');
    expect(pair2.right).toBe('k');
  });

  it('resets allocation index', () => {
    const input = new InputManager();
    input.allocateKeyPair();
    input.allocateKeyPair();
    input.resetAllocations();
    const pair = input.allocateKeyPair();
    expect(pair.left).toBe('d');
  });

  it('anyKeyPressed returns true after key press', () => {
    const input = new InputManager();
    input.handleKeyDown({ key: 'x' });
    expect(input.anyKeyPressed()).toBeTruthy();
  });

  it('clear resets all key states', () => {
    const input = new InputManager();
    input.handleKeyDown({ key: 'a' });
    input.clear();
    expect(input.isDown('a')).toBeFalsy();
  });
});
```

- [ ] **Step 2: Open `test.html` to verify tests fail**

Expected: FAIL — `InputManager` is not exported from `../src/input.js`.

- [ ] **Step 3: Implement `src/input.js`**

```js
// src/input.js — Keyboard input manager
import { KEY_PAIRS } from './constants.js';

export class InputManager {
  constructor() {
    this._keys = {};
    this._nextPairIndex = 0;
  }

  handleKeyDown(event) {
    this._keys[event.key] = true;
  }

  handleKeyUp(event) {
    this._keys[event.key] = false;
  }

  isDown(key) {
    return !!this._keys[key];
  }

  anyKeyPressed() {
    return Object.values(this._keys).some(Boolean);
  }

  clear() {
    this._keys = {};
  }

  allocateKeyPair() {
    const pair = KEY_PAIRS[this._nextPairIndex];
    this._nextPairIndex++;
    return pair;
  }

  resetAllocations() {
    this._nextPairIndex = 0;
  }

  attach() {
    this._onKeyDown = (e) => this.handleKeyDown(e);
    this._onKeyUp = (e) => this.handleKeyUp(e);
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
  }

  detach() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
  }
}
```

- [ ] **Step 4: Open `test.html` to verify all InputManager tests pass**

Expected: ALL TESTS PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/input.js tests/test-input.js
git commit -m "feat: add InputManager with keyboard tracking and key pair allocation"
```

---

### Task 4: Implement DifficultyManager

**Files:**
- Create: `src/difficulty.js`
- Modify: `tests/test-difficulty.js`

- [ ] **Step 1: Write failing tests in `tests/test-difficulty.js`**

```js
import { describe, it, expect } from './test-runner.js';
import { DifficultyManager } from '../src/difficulty.js';

describe('DifficultyManager', () => {
  it('returns tier 1 values at time 0', () => {
    const dm = new DifficultyManager();
    const tier = dm.getTier(0);
    expect(tier.spawnInterval).toBe(1500);
    expect(tier.fallSpeed).toBe(200);
    expect(tier.maxTriangles).toBe(3);
  });

  it('returns tier 2 values at time 15', () => {
    const dm = new DifficultyManager();
    const tier = dm.getTier(15);
    expect(tier.spawnInterval).toBe(1000);
    expect(tier.fallSpeed).toBe(300);
    expect(tier.maxTriangles).toBe(5);
  });

  it('returns final tier at time 90', () => {
    const dm = new DifficultyManager();
    const tier = dm.getTier(90);
    expect(tier.spawnInterval).toBe(300);
    expect(tier.fallSpeed).toBe(600);
    expect(tier.maxTriangles).toBe(20);
  });

  it('shouldSpawn respects spawn interval', () => {
    const dm = new DifficultyManager();
    // At time 0, spawn interval is 1500ms. First call should allow spawn.
    expect(dm.shouldSpawn(0, 0)).toBeTruthy();
    // Just 100ms later, should not spawn yet.
    expect(dm.shouldSpawn(0.1, 0)).toBeFalsy();
    // At 1.5s, should spawn again.
    expect(dm.shouldSpawn(1.5, 0)).toBeTruthy();
  });

  it('shouldSpawn respects max triangle count', () => {
    const dm = new DifficultyManager();
    dm.shouldSpawn(0, 0); // resets timer
    // At time 0, max is 3. With 3 triangles, should not spawn.
    expect(dm.shouldSpawn(1.6, 3)).toBeFalsy();
    // With 2 triangles, should spawn (if interval elapsed).
    expect(dm.shouldSpawn(1.6, 2)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Open `test.html` to verify tests fail**

Expected: FAIL — `DifficultyManager` not exported.

- [ ] **Step 3: Implement `src/difficulty.js`**

```js
// src/difficulty.js — Difficulty curve manager
import { DIFFICULTY_TIERS } from './constants.js';

export class DifficultyManager {
  constructor() {
    this._lastSpawnTime = -Infinity;
  }

  getTier(elapsedSeconds) {
    for (const tier of DIFFICULTY_TIERS) {
      if (elapsedSeconds < tier.maxTime) {
        return tier;
      }
    }
    return DIFFICULTY_TIERS[DIFFICULTY_TIERS.length - 1];
  }

  shouldSpawn(elapsedSeconds, currentTriangleCount) {
    const tier = this.getTier(elapsedSeconds);
    if (currentTriangleCount >= tier.maxTriangles) return false;
    const intervalSec = tier.spawnInterval / 1000;
    if (elapsedSeconds - this._lastSpawnTime >= intervalSec) {
      this._lastSpawnTime = elapsedSeconds;
      return true;
    }
    return false;
  }

  reset() {
    this._lastSpawnTime = -Infinity;
  }
}
```

- [ ] **Step 4: Open `test.html` to verify all DifficultyManager tests pass**

Expected: ALL TESTS PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/difficulty.js tests/test-difficulty.js
git commit -m "feat: add DifficultyManager with tiered spawn rate and speed curve"
```

---

### Task 5: Implement CollisionSystem

**Files:**
- Create: `src/collision.js`
- Modify: `tests/test-collision.js`

- [ ] **Step 1: Write failing tests in `tests/test-collision.js`**

```js
import { describe, it, expect } from './test-runner.js';
import { aabbOverlap, tipHitsBox, edgeContact, boxOverlap } from '../src/collision.js';

describe('collision: aabbOverlap', () => {
  it('detects overlapping rectangles', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 25, right: 75, top: 25, bottom: 75 };
    expect(aabbOverlap(a, b)).toBeTruthy();
  });

  it('returns false for non-overlapping rectangles', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 100, right: 150, top: 0, bottom: 50 };
    expect(aabbOverlap(a, b)).toBeFalsy();
  });

  it('returns false for edge-touching (no overlap)', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 50, right: 100, top: 0, bottom: 50 };
    expect(aabbOverlap(a, b)).toBeFalsy();
  });
});

describe('collision: tipHitsBox', () => {
  it('returns true when triangle tip is inside box', () => {
    // Triangle tip at (30, 80), box from (10,60) to (50,100)
    const tri = { tipX: 30, tipY: 80 };
    const box = { left: 10, right: 50, top: 60, bottom: 100 };
    expect(tipHitsBox(tri, box)).toBeTruthy();
  });

  it('returns false when triangle tip is outside box', () => {
    const tri = { tipX: 5, tipY: 80 };
    const box = { left: 10, right: 50, top: 60, bottom: 100 };
    expect(tipHitsBox(tri, box)).toBeFalsy();
  });
});

describe('collision: edgeContact', () => {
  it('returns "left" when triangle center is left of box center', () => {
    const triCenterX = 20;
    const boxCenterX = 40;
    expect(edgeContact(triCenterX, boxCenterX)).toBe('left');
  });

  it('returns "right" when triangle center is right of box center', () => {
    expect(edgeContact(60, 40)).toBe('right');
  });
});

describe('collision: boxOverlap', () => {
  it('returns overlap info for overlapping boxes', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 40, right: 90, top: 0, bottom: 50 };
    const result = boxOverlap(a, b);
    expect(result).toBeNotNull();
    expect(result.overlap).toBe(10);
    expect(result.aIsLeft).toBeTruthy();
  });

  it('returns null for non-overlapping boxes', () => {
    const a = { left: 0, right: 50, top: 0, bottom: 50 };
    const b = { left: 100, right: 150, top: 0, bottom: 50 };
    expect(boxOverlap(a, b)).toBeNull();
  });
});
```

- [ ] **Step 2: Open `test.html` to verify tests fail**

Expected: FAIL — functions not exported.

- [ ] **Step 3: Implement `src/collision.js`**

```js
// src/collision.js — Pure collision detection functions

export function aabbOverlap(a, b) {
  return a.left < b.right && a.right > b.left &&
         a.top < b.bottom && a.bottom > b.top;
}

export function tipHitsBox(tri, box) {
  return tri.tipX >= box.left && tri.tipX <= box.right &&
         tri.tipY >= box.top && tri.tipY <= box.bottom;
}

export function edgeContact(triCenterX, boxCenterX) {
  return triCenterX < boxCenterX ? 'left' : 'right';
}

export function boxOverlap(a, b) {
  if (!aabbOverlap(a, b)) return null;
  const overlapLeft = a.right - b.left;
  const overlapRight = b.right - a.left;
  const overlap = Math.min(overlapLeft, overlapRight);
  const aCenterX = (a.left + a.right) / 2;
  const bCenterX = (b.left + b.right) / 2;
  return { overlap, aIsLeft: aCenterX < bCenterX };
}
```

- [ ] **Step 4: Open `test.html` to verify all collision tests pass**

Expected: ALL TESTS PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/collision.js tests/test-collision.js
git commit -m "feat: add collision detection — AABB, tip-in-box, edge contact, box overlap"
```

---

## Chunk 3: Game Entities — PlayerBox and Triangle

### Task 6: Implement PlayerBox class

**Files:**
- Create: `src/player.js`
- Modify: `tests/test-player.js`

- [ ] **Step 1: Write failing tests in `tests/test-player.js`**

```js
import { describe, it, expect } from './test-runner.js';
import { PlayerBox } from '../src/player.js';

describe('PlayerBox', () => {
  it('creates with correct default properties', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(400, 500, 160, 120, 0, pair);
    expect(box.x).toBe(400);
    expect(box.y).toBe(500);
    expect(box.width).toBe(160);
    expect(box.height).toBe(120);
    expect(box.splitDepth).toBe(0);
    expect(box.velocity).toBe(0);
  });

  it('update applies acceleration from input', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(400, 500, 160, 120, 0, pair);
    const fakeInput = { isDown: (k) => k === 'd' };
    box.update(1 / 60, fakeInput, 800);
    // Should have moved left (negative direction)
    expect(box.x < 400).toBeTruthy();
  });

  it('stays within canvas bounds', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(0, 500, 160, 120, 0, pair);
    box.velocity = -1000;
    box.update(1 / 60, { isDown: () => false }, 800);
    expect(box.x >= 0).toBeTruthy();
  });

  it('split returns two children at depth+1', () => {
    const parentPair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const childPair = { left: 'j', right: 'k', leftLabel: 'J', rightLabel: 'K' };
    const box = new PlayerBox(400, 500, 160, 120, 0, parentPair);
    const children = box.split(childPair, 1000);
    expect(children.length).toBe(2);
    expect(children[0].splitDepth).toBe(1);
    expect(children[1].splitDepth).toBe(1);
    // Left child inherits parent keys
    expect(children[0].keyPair.left).toBe('d');
    // Right child gets new keys
    expect(children[1].keyPair.left).toBe('j');
    // Children have half width
    expect(children[0].width).toBe(80);
    expect(children[1].width).toBe(80);
  });

  it('split children fly apart with initial velocity', () => {
    const parentPair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const childPair = { left: 'j', right: 'k', leftLabel: 'J', rightLabel: 'K' };
    const box = new PlayerBox(400, 500, 160, 120, 0, parentPair);
    const children = box.split(childPair, 1000);
    // Left child has negative velocity, right child has positive
    expect(children[0].velocity < 0).toBeTruthy();
    expect(children[1].velocity > 0).toBeTruthy();
  });

  it('split children have immunity set', () => {
    const parentPair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const childPair = { left: 'j', right: 'k', leftLabel: 'J', rightLabel: 'K' };
    const box = new PlayerBox(400, 500, 160, 120, 0, parentPair);
    const children = box.split(childPair, 5000);
    // Both children should be immune at time 5000
    expect(children[0].isImmune(5000)).toBeTruthy();
    expect(children[1].isImmune(5000)).toBeTruthy();
    // Both children should NOT be immune well after the immunity window
    expect(children[0].isImmune(6000)).toBeFalsy();
    expect(children[1].isImmune(6000)).toBeFalsy();
  });

  it('getBounds returns correct rectangle', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(100, 200, 60, 40, 0, pair);
    const b = box.getBounds();
    expect(b.left).toBe(100);
    expect(b.right).toBe(160);
    expect(b.top).toBe(200);
    expect(b.bottom).toBe(240);
  });

  it('isImmune returns true when within immunity window', () => {
    const pair = { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' };
    const box = new PlayerBox(100, 200, 60, 40, 0, pair);
    box.immuneUntil = 1000;
    expect(box.isImmune(500)).toBeTruthy();
    expect(box.isImmune(1500)).toBeFalsy();
  });
});
```

- [ ] **Step 2: Open `test.html` to verify tests fail**

Expected: FAIL — `PlayerBox` not exported.

- [ ] **Step 3: Implement `src/player.js`**

```js
// src/player.js — PlayerBox class
import {
  PLAYER_ACCEL, PLAYER_FRICTION, PLAYER_WALL_BOUNCE,
  SPLIT_FLY_APART_MULTIPLIER, SPLIT_INITIAL_VELOCITY,
  SPLIT_IMMUNITY_MS,
} from './constants.js';

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
  }

  update(dt, input, canvasWidth) {
    let accel = 0;
    if (input.isDown(this.keyPair.left)) accel -= PLAYER_ACCEL;
    if (input.isDown(this.keyPair.right)) accel += PLAYER_ACCEL;

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

    const right = new PlayerBox(
      centerX + separation - childWidth / 2,
      this.y, childWidth, childHeight,
      this.splitDepth + 1, newKeyPair
    );
    right.velocity = SPLIT_INITIAL_VELOCITY;
    right.immuneUntil = now + SPLIT_IMMUNITY_MS;

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

  render(ctx, now) {
    // Flashing during immunity
    if (this.isImmune(now)) {
      ctx.globalAlpha = Math.floor(now / 60) % 2 === 0 ? 0.3 : 1.0;
    }

    // Box color lightens with split depth
    const lightness = Math.min(50 + this.splitDepth * 10, 90);
    ctx.fillStyle = `hsl(190, 100%, ${lightness}%)`;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.globalAlpha = 1.0;

    // Key labels on the box face
    const fontSize = Math.max(10, Math.min(24, this.width / 3));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerY = this.y + this.height / 2;
    const quarter = this.width / 4;
    ctx.fillText(this.keyPair.leftLabel, this.x + quarter, centerY);
    ctx.fillText(this.keyPair.rightLabel, this.x + this.width - quarter, centerY);
  }
}
```

- [ ] **Step 4: Open `test.html` to verify all PlayerBox tests pass**

Expected: ALL TESTS PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/player.js tests/test-player.js
git commit -m "feat: add PlayerBox class with movement, splitting, bounds, and rendering"
```

---

### Task 7: Implement Triangle class

**Files:**
- Create: `src/triangle.js`
- Modify: `tests/test-triangle.js`

- [ ] **Step 1: Write failing tests in `tests/test-triangle.js`**

```js
import { describe, it, expect } from './test-runner.js';
import { Triangle, spawnTriangle } from '../src/triangle.js';

describe('Triangle', () => {
  it('creates with correct properties', () => {
    const tri = new Triangle(100, -50, 200);
    expect(tri.x).toBe(100);
    expect(tri.y).toBe(-50);
    expect(tri.fallSpeed).toBe(200);
  });

  it('update moves triangle down by fallSpeed * dt', () => {
    const tri = new Triangle(100, 0, 200);
    tri.update(0.5);
    expect(tri.y).toBe(100);
  });

  it('isOffScreen returns true when below canvas', () => {
    const tri = new Triangle(100, 700, 200);
    expect(tri.isOffScreen(600)).toBeTruthy();
  });

  it('isOffScreen returns false when on screen', () => {
    const tri = new Triangle(100, 200, 200);
    expect(tri.isOffScreen(600)).toBeFalsy();
  });

  it('getTipPosition returns bottom-center point', () => {
    const tri = new Triangle(100, 0, 200);
    const tip = tri.getTipPosition();
    expect(tip.tipX).toBe(100);
    expect(tip.tipY).toBe(0);
  });

  it('getBounds returns correct AABB', () => {
    const tri = new Triangle(100, 50, 200);
    const b = tri.getBounds();
    expect(b.left).toBe(70);  // 100 - 60/2
    expect(b.right).toBe(130); // 100 + 60/2
    expect(b.top).toBe(0);    // 50 - 50
    expect(b.bottom).toBe(50); // y is the tip (bottom)
  });
});

describe('spawnTriangle', () => {
  it('returns spawn position at top of screen in a valid column', () => {
    const spawn = spawnTriangle(800, []);
    expect(spawn.y < 0).toBeTruthy();
    expect(spawn.x >= 0).toBeTruthy();
    expect(spawn.x <= 800).toBeTruthy();
  });

  it('returns a valid column index', () => {
    const spawn = spawnTriangle(800, []);
    expect(typeof spawn.col === 'number').toBeTruthy();
    expect(spawn.col >= 0).toBeTruthy();
  });
});
```

- [ ] **Step 2: Open `test.html` to verify tests fail**

Expected: FAIL — `Triangle` not exported.

- [ ] **Step 3: Implement `src/triangle.js`**

```js
// src/triangle.js — Triangle enemy class
import { TRIANGLE_WIDTH, TRIANGLE_HEIGHT, COLOR_TRIANGLE } from './constants.js';

export class Triangle {
  constructor(x, y, fallSpeed) {
    this.x = x;           // center-x of triangle
    this.y = y;            // tip (bottom) y position
    this.fallSpeed = fallSpeed;
  }

  update(dt) {
    this.y += this.fallSpeed * dt;
  }

  isOffScreen(canvasHeight) {
    return this.y - TRIANGLE_HEIGHT > canvasHeight;
  }

  getTipPosition() {
    return { tipX: this.x, tipY: this.y };
  }

  getBounds() {
    return {
      left: this.x - TRIANGLE_WIDTH / 2,
      right: this.x + TRIANGLE_WIDTH / 2,
      top: this.y - TRIANGLE_HEIGHT,
      bottom: this.y,
    };
  }

  render(ctx) {
    ctx.fillStyle = COLOR_TRIANGLE;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);                                    // tip (bottom center)
    ctx.lineTo(this.x - TRIANGLE_WIDTH / 2, this.y - TRIANGLE_HEIGHT); // top left
    ctx.lineTo(this.x + TRIANGLE_WIDTH / 2, this.y - TRIANGLE_HEIGHT); // top right
    ctx.closePath();
    ctx.fill();
  }
}

export function spawnTriangle(canvasWidth, recentColumns) {
  const columnCount = Math.floor(canvasWidth / TRIANGLE_WIDTH);
  let col;
  let attempts = 0;
  do {
    col = Math.floor(Math.random() * columnCount);
    attempts++;
  } while (recentColumns.includes(col) && attempts < 20);

  const x = col * TRIANGLE_WIDTH + TRIANGLE_WIDTH / 2;
  const y = -TRIANGLE_HEIGHT;
  // fallSpeed is set by caller from DifficultyManager
  return { x, y, col };
}
```

- [ ] **Step 4: Open `test.html` to verify all Triangle tests pass**

Expected: ALL TESTS PASSED.

- [ ] **Step 5: Commit**

```bash
git add src/triangle.js tests/test-triangle.js
git commit -m "feat: add Triangle class with movement, bounds, tip detection, and spawning"
```

---

## Chunk 4: Rendering and UI

### Task 8: Implement Renderer

**Files:**
- Create: `src/renderer.js`

The renderer draws background, grid, and manages screen shake. It wraps the canvas context. This module is mostly side-effectful (canvas drawing), so no unit tests — verified visually in integration.

- [ ] **Step 1: Implement `src/renderer.js`**

```js
// src/renderer.js — Canvas drawing utilities and screen shake
import {
  COLOR_BACKGROUND, COLOR_GRID,
  SHAKE_DURATION_MS, SHAKE_MAGNITUDE,
  TRIANGLE_WIDTH,
} from './constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this._shakeUntil = 0;
    this._shakeOffsetX = 0;
    this._shakeOffsetY = 0;
    this.resize();
  }

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  triggerShake(now) {
    this._shakeUntil = now + SHAKE_DURATION_MS;
  }

  beginFrame(now) {
    const ctx = this.ctx;

    // Apply screen shake
    if (now < this._shakeUntil) {
      this._shakeOffsetX = (Math.random() - 0.5) * SHAKE_MAGNITUDE * 2;
      this._shakeOffsetY = (Math.random() - 0.5) * SHAKE_MAGNITUDE * 2;
    } else {
      this._shakeOffsetX = 0;
      this._shakeOffsetY = 0;
    }

    ctx.save();
    ctx.translate(this._shakeOffsetX, this._shakeOffsetY);

    // Clear and draw background
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle grid
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    const gridSize = TRIANGLE_WIDTH;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }
  }

  endFrame() {
    this.ctx.restore();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer.js
git commit -m "feat: add Renderer with background grid and screen shake"
```

---

### Task 9: Implement UI module

**Files:**
- Create: `src/ui.js`

UI handles score display, death screen overlay, high score persistence. Side-effectful (canvas text), no unit tests.

- [ ] **Step 1: Implement `src/ui.js`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add src/ui.js
git commit -m "feat: add UI module with score display, death screen, and high score persistence"
```

---

## Chunk 5: Game Loop, Integration, and Deployment

### Task 10: Implement Game class (state machine + game loop)

**Files:**
- Create: `src/game.js` (overwrite existing)

- [ ] **Step 1: Implement `src/game.js`**

This is the orchestrator. It owns the game loop, state machine, and wires all modules together.

```js
// src/game.js — Game loop, state machine, initialization
import { InputManager } from './input.js';
import { DifficultyManager } from './difficulty.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { PlayerBox } from './player.js';
import { Triangle, spawnTriangle } from './triangle.js';
import { aabbOverlap, tipHitsBox, edgeContact, boxOverlap } from './collision.js';
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, MAX_SPLIT_DEPTH,
  TRIANGLE_COLUMN_COOLDOWN_MS, BOX_COLLISION_DAMPING,
} from './constants.js';

const State = { READY: 'READY', PLAYING: 'PLAYING', DEAD: 'DEAD' };

class Game {
  constructor(canvas) {
    this.renderer = new Renderer(canvas);
    this.input = new InputManager();
    this.difficulty = new DifficultyManager();
    this.ui = new UI();

    this.state = State.READY;
    this.boxes = [];
    this.triangles = [];
    this.elapsedTime = 0;
    this.finalScore = 0;
    this.recentColumns = []; // columns spawned in last COLUMN_COOLDOWN
    this.recentColumnTimestamps = [];

    this._lastFrameTime = 0;
    this._stateJustChanged = false;

    this.input.attach();
    window.addEventListener('resize', () => this.renderer.resize());

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _loop(timestamp) {
    const dt = Math.min((timestamp - this._lastFrameTime) / 1000, 0.05); // cap at 50ms
    this._lastFrameTime = timestamp;
    const now = performance.now();

    this.renderer.beginFrame(now);

    switch (this.state) {
      case State.READY:
        this.ui.renderReadyScreen(
          this.renderer.ctx, this.renderer.width, this.renderer.height, now
        );
        if (this.input.anyKeyPressed() && !this._stateJustChanged) {
          this._startGame();
        }
        this._stateJustChanged = false;
        break;

      case State.PLAYING:
        this._updatePlaying(dt, now);
        this._renderPlaying(now);
        break;

      case State.DEAD:
        this._renderPlaying(now);
        this.ui.renderDeathScreen(
          this.renderer.ctx, this.renderer.width, this.renderer.height,
          this.finalScore, now
        );
        if (this.input.anyKeyPressed() && !this._stateJustChanged) {
          this.input.clear();
          this.state = State.READY;
          this._stateJustChanged = true;
        }
        this._stateJustChanged = false;
        break;
    }

    this.renderer.endFrame();
    requestAnimationFrame(this._loop);
  }

  _startGame() {
    this.input.clear();
    this.input.resetAllocations();
    this.difficulty.reset();
    this.boxes = [];
    this.triangles = [];
    this.elapsedTime = 0;
    this.recentColumns = [];
    this.recentColumnTimestamps = [];

    const startX = this.renderer.width / 2 - PLAYER_WIDTH / 2;
    const startY = this.renderer.height - PLAYER_HEIGHT - 20;
    const keyPair = this.input.allocateKeyPair();
    this.boxes.push(new PlayerBox(startX, startY, PLAYER_WIDTH, PLAYER_HEIGHT, 0, keyPair));

    this.state = State.PLAYING;
    this._stateJustChanged = true;
  }

  _updatePlaying(dt, now) {
    this.elapsedTime += dt;

    // Update boxes
    for (const box of this.boxes) {
      box.update(dt, this.input, this.renderer.width);
    }

    // Box-to-box collisions
    for (let i = 0; i < this.boxes.length; i++) {
      for (let j = i + 1; j < this.boxes.length; j++) {
        const a = this.boxes[i].getBounds();
        const b = this.boxes[j].getBounds();
        const overlap = boxOverlap(a, b);
        if (overlap) {
          const pushEach = overlap.overlap / 2 + 1;
          if (overlap.aIsLeft) {
            this.boxes[i].x -= pushEach;
            this.boxes[j].x += pushEach;
          } else {
            this.boxes[i].x += pushEach;
            this.boxes[j].x -= pushEach;
          }
          const tempVel = this.boxes[i].velocity;
          this.boxes[i].velocity = this.boxes[j].velocity * BOX_COLLISION_DAMPING;
          this.boxes[j].velocity = tempVel * BOX_COLLISION_DAMPING;
        }
      }
    }

    // Spawn triangles
    this._cleanRecentColumns(now);
    if (this.difficulty.shouldSpawn(this.elapsedTime, this.triangles.length)) {
      const tier = this.difficulty.getTier(this.elapsedTime);
      const spawn = spawnTriangle(this.renderer.width, this.recentColumns);
      this.triangles.push(new Triangle(spawn.x, spawn.y, tier.fallSpeed));
      this.recentColumns.push(spawn.col);
      this.recentColumnTimestamps.push(now);
    }

    // Update triangles and check collisions
    const trianglesToRemove = new Set();
    const boxesToRemove = [];
    const boxesToAdd = [];

    for (let t = 0; t < this.triangles.length; t++) {
      const tri = this.triangles[t];
      tri.update(dt);

      if (tri.isOffScreen(this.renderer.height)) {
        trianglesToRemove.add(t);
        continue;
      }

      const triBounds = tri.getBounds();
      const tip = tri.getTipPosition();

      for (let b = 0; b < this.boxes.length; b++) {
        if (boxesToRemove.includes(b)) continue;
        const box = this.boxes[b];
        if (box.isImmune(now)) continue;

        const boxBounds = box.getBounds();
        if (!aabbOverlap(triBounds, boxBounds)) continue;

        if (tipHitsBox(tip, boxBounds)) {
          // Direct hit
          if (box.splitDepth >= MAX_SPLIT_DEPTH) {
            // Destroy the box
            boxesToRemove.push(b);
          } else {
            // Split the box
            const newPair = this.input.allocateKeyPair();
            const children = box.split(newPair, now);
            boxesToRemove.push(b);
            boxesToAdd.push(...children);
            this.renderer.triggerShake(now);
          }
          trianglesToRemove.add(t);
          break; // triangle consumed
        } else {
          // Edge push — triangle NOT consumed
          const triCenterX = tri.x;
          const boxCenterX = (boxBounds.left + boxBounds.right) / 2;
          const side = edgeContact(triCenterX, boxCenterX);
          const pushForce = 600;
          box.velocity += (side === 'left' ? 1 : -1) * pushForce * dt;
        }
      }
    }

    // Apply removals/additions (reverse order for indices)
    boxesToRemove.sort((a, b) => b - a);
    for (const i of boxesToRemove) {
      this.boxes.splice(i, 1);
    }
    this.boxes.push(...boxesToAdd);

    const triIndices = [...trianglesToRemove].sort((a, b) => b - a);
    for (const i of triIndices) {
      this.triangles.splice(i, 1);
    }

    // Check death
    if (this.boxes.length === 0) {
      this.finalScore = this.elapsedTime;
      this.ui.updateHighScore(this.finalScore);
      this.state = State.DEAD;
      this._stateJustChanged = true;
    }
  }

  _renderPlaying(now) {
    const ctx = this.renderer.ctx;

    for (const box of this.boxes) {
      box.render(ctx, now);
    }
    for (const tri of this.triangles) {
      tri.render(ctx);
    }

    this.ui.renderScore(ctx, this.elapsedTime, this.renderer.width);
  }

  _cleanRecentColumns(now) {
    while (
      this.recentColumnTimestamps.length > 0 &&
      now - this.recentColumnTimestamps[0] > TRIANGLE_COLUMN_COOLDOWN_MS
    ) {
      this.recentColumns.shift();
      this.recentColumnTimestamps.shift();
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  new Game(canvas);
});
```

- [ ] **Step 2: Commit**

```bash
git add src/game.js
git commit -m "feat: add Game class with state machine, game loop, and full orchestration"
```

---

### Task 11: Create index.html and main.css

**Files:**
- Overwrite: `index.html`
- Overwrite: `css/main.css`

- [ ] **Step 1: Overwrite `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>splittr</title>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <canvas id="game-canvas"></canvas>
  <script type="module" src="src/game.js"></script>
</body>
</html>
```

- [ ] **Step 2: Overwrite `css/main.css`**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0a0e27;
}

#game-canvas {
  display: block;
  width: 100%;
  height: 100%;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html css/main.css
git commit -m "feat: update index.html and main.css for canvas fullscreen rewrite"
```

---

### Task 12: Integration testing — play the game

This is a manual integration verification step.

- [ ] **Step 1: Open `test.html` and verify all unit tests pass**

Run: Open `test.html` in browser.
Expected: Title shows "ALL TESTS PASSED".

- [ ] **Step 2: Open `index.html` and verify the game runs**

Run: Serve the project locally (e.g., `python3 -m http.server 8000` from project root, then open `http://localhost:8000`). Note: ES modules require a local server; `file://` won't work.

Verify these behaviors:
1. READY screen shows "SPLITTR" title and "PRESS ANY KEY"
2. Pressing a key starts the game — cyan box appears at bottom
3. D/F keys move the box left/right
4. Red triangles fall from the top
5. Triangle tip hit splits the box into two smaller boxes with screen shake
6. Left child uses D/F, right child uses J/K
7. Edge contact pushes the box sideways (triangle continues falling)
8. Max depth (4 splits = 16 boxes) causes destroy on tip hit
9. All boxes destroyed → death screen with score
10. Any key restarts
11. High score persists across refreshes (check localStorage)
12. Difficulty increases over time (faster spawns, faster triangles)

- [ ] **Step 3: Fix any issues found during playtesting**

Address each bug individually, run tests after each fix.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address issues found during integration playtesting"
```

---

### Task 13: Clean up old files

**Files:**
- Remove: `.floo` (CreateJS project file, no longer needed)
- Remove: `.flooignore` (CreateJS project file, no longer needed)

- [ ] **Step 1: Remove legacy CreateJS files**

```bash
git rm .floo .flooignore
```

- [ ] **Step 2: Commit**

```bash
git commit -m "chore: remove legacy CreateJS project files"
```

---

### Task 14: Verify GitHub Pages deployment readiness

- [ ] **Step 1: Verify file structure is correct for GitHub Pages**

GitHub Pages serves from root. Verify:
- `index.html` exists at root
- All paths in `index.html` are relative (`css/main.css`, `src/game.js`)
- No build step required
- `CNAME` file preserved if it exists

- [ ] **Step 2: Check total JS size is under 20KB**

Run: `cat src/*.js | wc -c`
Expected: Under 20,480 bytes.

- [ ] **Step 3: Commit (if any path fixes needed)**

```bash
git add -A
git commit -m "chore: verify GitHub Pages deployment readiness"
```

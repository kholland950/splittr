# Splittr Rewrite QA Test Plan

## Document Information

| Field | Value |
|-------|-------|
| **System** | Splittr - HTML5 Canvas Arcade Game Rewrite |
| **Date** | 2026-03-19 |
| **Design Doc** | `docs/plans/2026-03-19-splittr-rewrite-design.md` |
| **Implementation Plan** | `docs/plans/2026-03-19-splittr-rewrite.md` |
| **Total Test Cases** | 211 |
| **P0 (Critical)** | 103 |
| **P1 (Important)** | 87 |
| **P2 (Nice-to-have)** | 21 |

---

## 1. Constants & Configuration

### 1.1 Constants Integrity

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| CONST-001 | Constants | MAX_SPLIT_DEPTH equals 4 | constants.js loaded | Unit | P0 | :x: |
| CONST-002 | Constants | KEY_PAIRS has exactly 24 entries | constants.js loaded | Unit | P0 | :x: |
| CONST-003 | Constants | KEY_PAIRS has at least 16 entries (enough for max 16 boxes) | constants.js loaded | Unit | P0 | :x: |
| CONST-004 | Constants | Each KEY_PAIRS entry has left, right, leftLabel, rightLabel fields | constants.js loaded | Unit | P1 | :x: |
| CONST-005 | Constants | No duplicate keys across KEY_PAIRS (left and right keys unique across all pairs) | constants.js loaded | Unit | P1 | :x: |
| CONST-006 | Constants | DIFFICULTY_TIERS has 5 entries with ascending maxTime values | constants.js loaded | Unit | P1 | :x: |
| CONST-007 | Constants | Final difficulty tier has maxTime of Infinity | constants.js loaded | Unit | P1 | :x: |
| CONST-008 | Constants | SPLIT_IMMUNITY_MS is 400 | constants.js loaded | Unit | P1 | :x: |
| CONST-009 | Constants | PLAYER_WIDTH is 160 and PLAYER_HEIGHT is 120 | constants.js loaded | Unit | P2 | :x: |
| CONST-010 | Constants | TRIANGLE_WIDTH is 60 and TRIANGLE_HEIGHT is 50 | constants.js loaded | Unit | P2 | :x: |
| CONST-011 | Constants | Color constants are valid CSS color strings | constants.js loaded | Unit | P2 | :x: |
| CONST-012 | Constants | HIGH_SCORE_KEY is 'splittr-highscore' | constants.js loaded | Unit | P2 | :x: |

---

## 2. Input Management

### 2.1 Keyboard State Tracking

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| INPUT-001 | Input | isDown returns true after handleKeyDown for that key | InputManager instantiated | Unit | P0 | :x: |
| INPUT-002 | Input | isDown returns false after handleKeyUp for that key | InputManager instantiated, key pressed | Unit | P0 | :x: |
| INPUT-003 | Input | isDown returns false for keys never pressed | InputManager instantiated | Unit | P0 | :x: |
| INPUT-004 | Input | Multiple keys can be tracked simultaneously | InputManager instantiated | Unit | P0 | :x: |
| INPUT-005 | Input | anyKeyPressed returns true when at least one key is down | InputManager instantiated, key pressed | Unit | P0 | :x: |
| INPUT-006 | Input | anyKeyPressed returns false when no keys are down | InputManager instantiated | Unit | P1 | :x: |
| INPUT-007 | Input | clear resets all key states to false | InputManager with keys pressed | Unit | P0 | :x: |
| INPUT-008 | Input | Rapid key press/release sequences tracked correctly | InputManager instantiated | Unit | P1 | :x: |

### 2.2 Key Pair Allocation

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| INPUT-009 | Input | First allocateKeyPair returns D/F pair | InputManager instantiated | Unit | P0 | :x: |
| INPUT-010 | Input | Second allocateKeyPair returns J/K pair | InputManager, first pair allocated | Unit | P0 | :x: |
| INPUT-011 | Input | allocateKeyPair returns pairs in defined pool order | InputManager instantiated | Unit | P1 | :x: |
| INPUT-012 | Input | resetAllocations resets allocation index to 0 | InputManager with allocations | Unit | P0 | :x: |
| INPUT-013 | Input | Can allocate at least 16 unique key pairs (enough for max boxes) | InputManager instantiated | Unit | P0 | :x: |
| INPUT-014 | Input | Allocated pair objects have correct left/right/leftLabel/rightLabel | InputManager instantiated | Unit | P1 | :x: |

### 2.3 DOM Event Binding

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| INPUT-015 | Input | attach() registers keydown and keyup event listeners on document | InputManager, DOM available | Integration | P1 | :x: |
| INPUT-016 | Input | detach() removes event listeners from document | InputManager attached | Integration | P1 | :x: |
| INPUT-017 | Input | Actual keyboard events flow through to isDown correctly | InputManager attached, DOM available | Integration | P1 | :x: |

---

## 3. Difficulty Progression

### 3.1 Tier Selection

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| DIFF-001 | Difficulty | getTier(0) returns tier 1: spawnInterval=1500, fallSpeed=200, maxTriangles=3 | DifficultyManager instantiated | Unit | P0 | :x: |
| DIFF-002 | Difficulty | getTier(5) returns tier 1 values (within 0-10 range) | DifficultyManager instantiated | Unit | P1 | :x: |
| DIFF-003 | Difficulty | getTier(10) returns tier 2: spawnInterval=1000, fallSpeed=300, maxTriangles=5 | DifficultyManager instantiated | Unit | P0 | :x: |
| DIFF-004 | Difficulty | getTier(15) returns tier 2 values (within 10-20 range) | DifficultyManager instantiated | Unit | P1 | :x: |
| DIFF-005 | Difficulty | getTier(25) returns tier 3: spawnInterval=700, fallSpeed=400, maxTriangles=8 | DifficultyManager instantiated | Unit | P0 | :x: |
| DIFF-006 | Difficulty | getTier(45) returns tier 4: spawnInterval=500, fallSpeed=500, maxTriangles=12 | DifficultyManager instantiated | Unit | P0 | :x: |
| DIFF-007 | Difficulty | getTier(90) returns tier 5: spawnInterval=300, fallSpeed=600, maxTriangles=20 | DifficultyManager instantiated | Unit | P0 | :x: |
| DIFF-008 | Difficulty | getTier at tier boundaries returns next tier (10s -> tier 2, not tier 1) | DifficultyManager instantiated | Unit | P1 | :x: |
| DIFF-009 | Difficulty | Difficulty plateaus at 60+ seconds (no further increases) | DifficultyManager instantiated | Unit | P1 | :x: |

### 3.2 Spawn Control

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| DIFF-010 | Difficulty | shouldSpawn returns true on first call at time 0 | DifficultyManager instantiated | Unit | P0 | :x: |
| DIFF-011 | Difficulty | shouldSpawn returns false before spawn interval elapses | DifficultyManager, recently spawned | Unit | P0 | :x: |
| DIFF-012 | Difficulty | shouldSpawn returns true after spawn interval elapses | DifficultyManager, interval passed | Unit | P0 | :x: |
| DIFF-013 | Difficulty | shouldSpawn returns false when currentTriangleCount >= maxTriangles | DifficultyManager, at max triangles | Unit | P0 | :x: |
| DIFF-014 | Difficulty | shouldSpawn returns true when under max count and interval elapsed | DifficultyManager instantiated | Unit | P1 | :x: |
| DIFF-015 | Difficulty | reset() allows spawning to start fresh | DifficultyManager with prior spawns | Unit | P1 | :x: |

---

## 4. Collision Detection

### 4.1 AABB Overlap

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| COLL-001 | Collision | aabbOverlap returns true for overlapping rectangles | None | Unit | P0 | :x: |
| COLL-002 | Collision | aabbOverlap returns false for non-overlapping rectangles | None | Unit | P0 | :x: |
| COLL-003 | Collision | aabbOverlap returns false for edge-touching (no actual overlap) | None | Unit | P0 | :x: |
| COLL-004 | Collision | aabbOverlap handles rectangle fully contained within another | None | Unit | P1 | :x: |
| COLL-005 | Collision | aabbOverlap handles rectangles overlapping on Y axis only (not X) | None | Unit | P1 | :x: |
| COLL-006 | Collision | aabbOverlap handles zero-width or zero-height rectangles | None | Unit | P2 | :x: |

### 4.2 Tip-in-Box Test

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| COLL-007 | Collision | tipHitsBox returns true when tip point is inside box | None | Unit | P0 | :x: |
| COLL-008 | Collision | tipHitsBox returns false when tip point is outside box | None | Unit | P0 | :x: |
| COLL-009 | Collision | tipHitsBox returns true when tip is exactly on box left edge | None | Unit | P1 | :x: |
| COLL-010 | Collision | tipHitsBox returns true when tip is exactly on box right edge | None | Unit | P1 | :x: |
| COLL-011 | Collision | tipHitsBox returns true when tip is exactly on box top edge | None | Unit | P1 | :x: |
| COLL-012 | Collision | tipHitsBox returns true when tip is exactly on box bottom edge | None | Unit | P1 | :x: |
| COLL-013 | Collision | tipHitsBox returns false when tip is one pixel outside box on all sides | None | Unit | P1 | :x: |

### 4.3 Edge Contact

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| COLL-014 | Collision | edgeContact returns 'left' when triangle center is left of box center | None | Unit | P0 | :x: |
| COLL-015 | Collision | edgeContact returns 'right' when triangle center is right of box center | None | Unit | P0 | :x: |
| COLL-016 | Collision | edgeContact handles equal center positions (defaults to 'right') | None | Unit | P2 | :x: |

### 4.4 Box-Box Overlap

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| COLL-017 | Collision | boxOverlap returns overlap info for overlapping boxes | None | Unit | P0 | :x: |
| COLL-018 | Collision | boxOverlap returns correct overlap amount | None | Unit | P0 | :x: |
| COLL-019 | Collision | boxOverlap correctly identifies which box is left (aIsLeft) | None | Unit | P0 | :x: |
| COLL-020 | Collision | boxOverlap returns null for non-overlapping boxes | None | Unit | P0 | :x: |
| COLL-021 | Collision | boxOverlap handles one box fully inside another | None | Unit | P1 | :x: |

---

## 5. Player Box

### 5.1 Construction & Properties

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| PLAYER-001 | Player | PlayerBox constructor sets x, y, width, height, splitDepth, keyPair | None | Unit | P0 | :x: |
| PLAYER-002 | Player | Initial velocity is 0 | None | Unit | P0 | :x: |
| PLAYER-003 | Player | Initial immuneUntil is 0 | None | Unit | P1 | :x: |
| PLAYER-004 | Player | getBounds returns correct left/right/top/bottom rectangle | None | Unit | P0 | :x: |

### 5.2 Movement

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| PLAYER-005 | Player | Left key input applies negative acceleration | PlayerBox created | Unit | P0 | :x: |
| PLAYER-006 | Player | Right key input applies positive acceleration | PlayerBox created | Unit | P0 | :x: |
| PLAYER-007 | Player | No key input applies friction to slow box down | PlayerBox with velocity | Unit | P0 | :x: |
| PLAYER-008 | Player | Both keys pressed simultaneously results in net zero acceleration (minus friction) | PlayerBox created | Unit | P1 | :x: |
| PLAYER-009 | Player | Velocity near zero with no input snaps to zero (prevents jitter) | PlayerBox with tiny velocity | Unit | P1 | :x: |
| PLAYER-010 | Player | Box stays within left canvas boundary (x >= 0) | PlayerBox at left edge | Unit | P0 | :x: |
| PLAYER-011 | Player | Box stays within right canvas boundary (x + width <= canvasWidth) | PlayerBox at right edge | Unit | P0 | :x: |
| PLAYER-012 | Player | Wall bounce reverses velocity with 0.4x damping | PlayerBox hitting wall | Unit | P0 | :x: |
| PLAYER-013 | Player | Position updates based on velocity * dt | PlayerBox with velocity | Unit | P1 | :x: |

### 5.3 Splitting

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| PLAYER-014 | Player | split() returns array of exactly 2 PlayerBox children | PlayerBox at depth < 4 | Unit | P0 | :x: |
| PLAYER-015 | Player | Children have splitDepth = parent.splitDepth + 1 | PlayerBox split | Unit | P0 | :x: |
| PLAYER-016 | Player | Children have half the width of parent | PlayerBox split | Unit | P0 | :x: |
| PLAYER-017 | Player | Children have same height as parent | PlayerBox split | Unit | P1 | :x: |
| PLAYER-018 | Player | Left child inherits parent's key pair | PlayerBox split | Unit | P0 | :x: |
| PLAYER-019 | Player | Right child receives the new key pair | PlayerBox split | Unit | P0 | :x: |
| PLAYER-020 | Player | Left child has negative initial velocity (flies left) | PlayerBox split | Unit | P0 | :x: |
| PLAYER-021 | Player | Right child has positive initial velocity (flies right) | PlayerBox split | Unit | P0 | :x: |
| PLAYER-022 | Player | Children separated by 1.5x child width | PlayerBox split | Unit | P1 | :x: |
| PLAYER-023 | Player | Split initial velocity magnitude is SPLIT_INITIAL_VELOCITY (300 px/s) | PlayerBox split | Unit | P1 | :x: |

### 5.4 Immunity

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| PLAYER-024 | Player | isImmune returns true when now < immuneUntil | PlayerBox with immunity set | Unit | P0 | :x: |
| PLAYER-025 | Player | isImmune returns false when now >= immuneUntil | PlayerBox past immunity window | Unit | P0 | :x: |
| PLAYER-026 | Player | Newly split children are immune for SPLIT_IMMUNITY_MS (400ms) | PlayerBox just split | Unit | P0 | :x: |
| PLAYER-027 | Player | Immunity expires after 400ms | PlayerBox split 400ms+ ago | Unit | P1 | :x: |

### 5.5 Rendering

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| PLAYER-028 | Player | Box renders with fill color based on split depth (lightens as depth increases) | Canvas context available | Unit | P1 | :x: |
| PLAYER-029 | Player | Box renders key labels (leftLabel and rightLabel) on face | Canvas context available | Unit | P1 | :x: |
| PLAYER-030 | Player | Immune box flashes (alpha alternates between 0.3 and 1.0) | Canvas context, box immune | Unit | P1 | :x: |
| PLAYER-031 | Player | Font size scales with box width (min 10, max 24, width/3) | Canvas context, various box widths | Unit | P2 | :x: |
| PLAYER-032 | Player | globalAlpha reset to 1.0 after rendering immune box | Canvas context, box immune | Unit | P1 | :x: |

---

## 6. Triangle

### 6.1 Construction & Properties

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| TRI-001 | Triangle | Triangle constructor sets x (center), y (tip), and fallSpeed | None | Unit | P0 | :x: |
| TRI-002 | Triangle | getBounds returns correct AABB (accounts for TRIANGLE_WIDTH and TRIANGLE_HEIGHT) | Triangle created | Unit | P0 | :x: |
| TRI-003 | Triangle | getTipPosition returns bottom-center point {tipX: x, tipY: y} | Triangle created | Unit | P0 | :x: |

### 6.2 Movement

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| TRI-004 | Triangle | update moves triangle down by fallSpeed * dt | Triangle created | Unit | P0 | :x: |
| TRI-005 | Triangle | isOffScreen returns true when triangle bottom is below canvas height | Triangle below canvas | Unit | P0 | :x: |
| TRI-006 | Triangle | isOffScreen returns false when triangle is still visible | Triangle on screen | Unit | P0 | :x: |
| TRI-007 | Triangle | Triangle at y=0 with TRIANGLE_HEIGHT=50 has bounds.top=-50 | Triangle at y=0 | Unit | P1 | :x: |

### 6.3 Spawning

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| TRI-008 | Triangle | spawnTriangle returns position above screen (y < 0) | canvasWidth provided | Unit | P0 | :x: |
| TRI-009 | Triangle | spawnTriangle x is within canvas bounds (0 to canvasWidth) | canvasWidth provided | Unit | P0 | :x: |
| TRI-010 | Triangle | spawnTriangle returns a valid column index | canvasWidth provided | Unit | P1 | :x: |
| TRI-011 | Triangle | spawnTriangle avoids recent columns when possible | recentColumns provided | Unit | P1 | :x: |
| TRI-012 | Triangle | spawnTriangle x aligns to TRIANGLE_WIDTH (60px) grid column centers | canvasWidth provided | Unit | P1 | :x: |
| TRI-013 | Triangle | spawnTriangle does not infinite-loop when all columns are recent (max 20 attempts) | All columns in recentColumns | Unit | P1 | :x: |

### 6.4 Rendering

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| TRI-014 | Triangle | Triangle renders as filled downward-pointing triangle | Canvas context available | Unit | P2 | :x: |
| TRI-015 | Triangle | Triangle fill color is COLOR_TRIANGLE (#ff1744) | Canvas context available | Unit | P2 | :x: |

---

## 7. Game State Machine

### 7.1 State Transitions

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| STATE-001 | Game State | Game initializes in READY state | Game instantiated | Integration | P0 | :x: |
| STATE-002 | Game State | READY -> PLAYING on any key press | Game in READY state | Integration | P0 | :x: |
| STATE-003 | Game State | PLAYING -> DEAD when all boxes are destroyed | Game in PLAYING, all boxes destroyed | Integration | P0 | :x: |
| STATE-004 | Game State | DEAD -> READY on any key press | Game in DEAD state | Integration | P0 | :x: |
| STATE-005 | Game State | READY -> PLAYING on second play (restart cycle) | Game returned to READY from DEAD | Integration | P0 | :x: |
| STATE-006 | Game State | State transition doesn't trigger on same frame as previous transition | Game transitioning | Integration | P1 | :x: |
| STATE-007 | Game State | Key press that caused death doesn't immediately restart | Game transitioning to DEAD | Integration | P1 | :x: |

### 7.2 Game Initialization

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| STATE-008 | Game Init | Starting game creates one PlayerBox at bottom center | Game starts PLAYING | Integration | P0 | :x: |
| STATE-009 | Game Init | Starting box has PLAYER_WIDTH (160) and PLAYER_HEIGHT (120) | Game starts PLAYING | Integration | P1 | :x: |
| STATE-010 | Game Init | Starting box has splitDepth 0 | Game starts PLAYING | Integration | P0 | :x: |
| STATE-011 | Game Init | Starting box assigned D/F key pair (first in pool) | Game starts PLAYING | Integration | P0 | :x: |
| STATE-012 | Game Init | Elapsed time resets to 0 on game start | Game restarts | Integration | P0 | :x: |
| STATE-013 | Game Init | Triangles array clears on game start | Game restarts | Integration | P1 | :x: |
| STATE-014 | Game Init | Key pair allocations reset on game start | Game restarts | Integration | P1 | :x: |
| STATE-015 | Game Init | Input state cleared on game start | Game restarts | Integration | P1 | :x: |

---

## 8. Game Loop & Frame Logic

### 8.1 Frame Timing

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| LOOP-001 | Game Loop | Delta time calculated from requestAnimationFrame timestamps | Game running | Integration | P1 | :x: |
| LOOP-002 | Game Loop | Delta time capped at 50ms (0.05s) to prevent physics explosions | Game running after tab switch | Integration | P0 | :x: |
| LOOP-003 | Game Loop | Game loop uses requestAnimationFrame (not setInterval) | Game running | Integration | P1 | :x: |

### 8.2 Frame Update Order

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| LOOP-004 | Game Loop | Player boxes update before collision checks | Game in PLAYING state | Integration | P1 | :x: |
| LOOP-005 | Game Loop | Box-to-box collisions resolved before triangle-box collisions | Game in PLAYING state | Integration | P1 | :x: |
| LOOP-006 | Game Loop | Triangle spawning happens before triangle movement | Game in PLAYING state | Integration | P2 | :x: |
| LOOP-007 | Game Loop | Death condition checked after collision resolution | Game in PLAYING state | Integration | P1 | :x: |
| LOOP-008 | Game Loop | Score updates each frame while PLAYING | Game in PLAYING state | Integration | P1 | :x: |

---

## 9. Gameplay Mechanics Integration

### 9.1 Triangle-Box Collision (Split)

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| MECH-001 | Mechanics | Triangle tip hitting box at depth < 4 triggers split | Game playing, box exists | E2E | P0 | :x: |
| MECH-002 | Mechanics | Split removes parent box and adds two children | Game playing, split triggered | E2E | P0 | :x: |
| MECH-003 | Mechanics | Triangle consumed (removed) on tip-hit split | Game playing, split triggered | E2E | P0 | :x: |
| MECH-004 | Mechanics | Screen shake triggered on split | Game playing, split triggered | E2E | P1 | :x: |
| MECH-005 | Mechanics | Immune box ignores triangle tip-hit (no split, no destroy) | Game playing, box immune | E2E | P0 | :x: |

### 9.2 Triangle-Box Collision (Push)

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| MECH-006 | Mechanics | Edge contact (AABB overlap, no tip hit) pushes box sideways | Game playing, edge contact | E2E | P0 | :x: |
| MECH-007 | Mechanics | Push direction based on relative position (triangle left of box pushes right) | Game playing, edge contact | E2E | P1 | :x: |
| MECH-008 | Mechanics | Triangle NOT consumed on edge push (continues falling) | Game playing, edge push | E2E | P0 | :x: |
| MECH-009 | Mechanics | Pushing triangle can affect multiple boxes as it falls | Game playing, multiple boxes stacked | E2E | P1 | :x: |

### 9.3 Triangle-Box Collision (Destroy)

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| MECH-010 | Mechanics | Triangle tip hitting box at max split depth (4) destroys box | Game playing, max-depth box | E2E | P0 | :x: |
| MECH-011 | Mechanics | Triangle consumed on destroy (tip-hit at max depth) | Game playing, max-depth destroy | E2E | P0 | :x: |
| MECH-012 | Mechanics | Edge contact on max-depth box pushes (does not destroy) | Game playing, max-depth box edge | E2E | P0 | :x: |

### 9.4 Box-Box Collision

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| MECH-013 | Mechanics | Overlapping boxes push apart by half overlap + 1px each | Two boxes overlapping | Integration | P0 | :x: |
| MECH-014 | Mechanics | Box-box collision swaps velocities with 0.8 damping | Two boxes colliding | Integration | P0 | :x: |
| MECH-015 | Mechanics | Multiple simultaneous box-box collisions resolve correctly | 3+ boxes overlapping | Integration | P1 | :x: |

### 9.5 Death Condition

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| MECH-016 | Mechanics | Game transitions to DEAD when last box is destroyed | Last box destroyed by triangle | E2E | P0 | :x: |
| MECH-017 | Mechanics | Game does not end when at least one box remains | One of multiple boxes destroyed | E2E | P0 | :x: |
| MECH-018 | Mechanics | Final score captures elapsed time at moment of death | All boxes destroyed | E2E | P0 | :x: |

### 9.6 Cascading Splits

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| MECH-019 | Mechanics | Splitting from depth 0 to depth 1 yields 2 boxes | Single box, one split | E2E | P0 | :x: |
| MECH-020 | Mechanics | Splitting all depth-1 boxes yields 4 boxes at depth 2 | 2 boxes at depth 1 | E2E | P1 | :x: |
| MECH-021 | Mechanics | Maximum of 16 boxes possible (all at depth 4) | Repeated splitting | E2E | P1 | :x: |
| MECH-022 | Mechanics | Each split allocates a new unique key pair for right child | Multiple splits occur | E2E | P0 | :x: |

### 9.7 Column Cooldown

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| MECH-023 | Mechanics | No two triangles spawn in same column within 500ms | Game playing, rapid spawns | Integration | P1 | :x: |
| MECH-024 | Mechanics | Column cooldown expires after TRIANGLE_COLUMN_COOLDOWN_MS | Game playing, time elapsed | Integration | P2 | :x: |

---

## 10. Rendering & Visual

### 10.1 Canvas Setup

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| RENDER-001 | Rendering | Canvas fills entire viewport | Page loaded | E2E | P0 | :x: |
| RENDER-002 | Rendering | Canvas resizes on window resize | Window resized | E2E | P1 | :x: |
| RENDER-003 | Rendering | Background is dark navy (#0a0e27) | Game rendering | E2E | P1 | :x: |
| RENDER-004 | Rendering | Subtle grid lines drawn on background | Game rendering | E2E | P2 | :x: |

### 10.2 Draw Order

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| RENDER-005 | Rendering | Background drawn first (behind everything) | Game in PLAYING state | E2E | P1 | :x: |
| RENDER-006 | Rendering | Player boxes drawn on top of background | Game in PLAYING state | E2E | P1 | :x: |
| RENDER-007 | Rendering | Triangles drawn on top of background | Game in PLAYING state | E2E | P1 | :x: |
| RENDER-008 | Rendering | Score UI drawn on top of game elements | Game in PLAYING state | E2E | P2 | :x: |

### 10.3 Screen Shake

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| RENDER-009 | Rendering | Screen shake triggers on box split | Split occurs | E2E | P1 | :x: |
| RENDER-010 | Rendering | Screen shake lasts approximately 67ms (~4 frames at 60fps) | Shake triggered | E2E | P2 | :x: |
| RENDER-011 | Rendering | Screen shake magnitude is 4px | Shake triggered | E2E | P2 | :x: |
| RENDER-012 | Rendering | Canvas transform resets after shake ends | Shake expired | E2E | P1 | :x: |

---

## 11. UI & Scoring

### 11.1 Score Display

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| UI-001 | UI | Score displayed during PLAYING state | Game in PLAYING | E2E | P0 | :x: |
| UI-002 | UI | Score shows survival time with one decimal place (e.g., "23.4") | Game in PLAYING | E2E | P0 | :x: |
| UI-003 | UI | Score positioned at top-center of canvas | Game in PLAYING | E2E | P1 | :x: |
| UI-004 | UI | Score displayed in white, bold, monospace, 48px | Game in PLAYING | E2E | P2 | :x: |

### 11.2 Ready Screen

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| UI-005 | UI | "SPLITTR" title displayed on READY screen | Game in READY state | E2E | P0 | :x: |
| UI-006 | UI | "PRESS ANY KEY" prompt displayed and pulsing | Game in READY state | E2E | P0 | :x: |
| UI-007 | UI | High score displayed on READY screen (if > 0) | Game in READY, high score exists | E2E | P1 | :x: |
| UI-008 | UI | No high score shown on first play (high score = 0) | Fresh game, no localStorage | E2E | P1 | :x: |

### 11.3 Death Screen

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| UI-009 | UI | Final score displayed prominently on death screen | Game in DEAD state | E2E | P0 | :x: |
| UI-010 | UI | "PRESS ANY KEY TO RETRY" prompt displayed and pulsing | Game in DEAD state | E2E | P0 | :x: |
| UI-011 | UI | "NEW RECORD!" shown when score beats high score | New high score achieved | E2E | P1 | :x: |
| UI-012 | UI | Previous best shown when score does not beat high score | Score < high score | E2E | P1 | :x: |
| UI-013 | UI | Semi-transparent dark overlay on death screen | Game in DEAD state | E2E | P2 | :x: |

### 11.4 High Score Persistence

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| UI-014 | UI | High score saved to localStorage under 'splittr-highscore' key | New high score | Integration | P0 | :x: |
| UI-015 | UI | High score loaded from localStorage on game init | localStorage has saved score | Integration | P0 | :x: |
| UI-016 | UI | High score persists across page refreshes | Score saved, page refreshed | E2E | P0 | :x: |
| UI-017 | UI | High score only updates when new score exceeds current best | Score < high score | Integration | P1 | :x: |
| UI-018 | UI | Game handles missing/corrupt localStorage gracefully (defaults to 0) | localStorage unavailable or corrupt | Integration | P1 | :x: |

---

## 12. Performance & Edge Cases

### 12.1 Performance

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| PERF-001 | Performance | Game runs at 60fps with 1 box and 3 triangles (early game) | Game in early PLAYING state | E2E | P0 | :x: |
| PERF-002 | Performance | Game runs at 60fps with 16 boxes and 20 triangles (max chaos) | Game at max difficulty | E2E | P0 | :x: |
| PERF-003 | Performance | Box-box collision check (120 pairs max) completes within frame budget | 16 boxes active | E2E | P1 | :x: |
| PERF-004 | Performance | Total JS bundle under 20KB unminified | All source files created | Unit | P1 | :x: |

### 12.2 Edge Cases

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| EDGE-001 | Edge Cases | Game handles window resize during PLAYING state | Game in PLAYING, window resized | E2E | P1 | :x: |
| EDGE-002 | Edge Cases | Boxes remain in bounds after canvas resize | Game playing, canvas resized smaller | E2E | P2 | :x: |
| EDGE-003 | Edge Cases | Tab-away and return doesn't cause physics explosion (dt capped) | Game playing, tab switched and returned | E2E | P0 | :x: |
| EDGE-004 | Edge Cases | Rapidly pressing keys during state transition doesn't break state machine | Any state transition | E2E | P1 | :x: |
| EDGE-005 | Edge Cases | Split at canvas edge doesn't push children off-screen permanently | Box at screen edge, split triggered | E2E | P1 | :x: |
| EDGE-006 | Edge Cases | Multiple triangles hitting same box on same frame resolves cleanly | Multiple triangles converging | E2E | P1 | :x: |
| EDGE-007 | Edge Cases | Triangle spawning works at various canvas widths (narrow and wide) | Different window sizes | E2E | P2 | :x: |
| EDGE-008 | Edge Cases | Game recovers from localStorage errors (quota exceeded, private mode) | localStorage throws | Integration | P2 | :x: |

---

## 13. Deployment & Browser Compatibility

### 13.1 GitHub Pages Deployment

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| DEPLOY-001 | Deployment | index.html exists at project root | Files created | Unit | P0 | :x: |
| DEPLOY-002 | Deployment | All paths in index.html are relative | index.html created | Unit | P0 | :x: |
| DEPLOY-003 | Deployment | No build step required (zero dependencies) | All files created | Integration | P0 | :x: |
| DEPLOY-004 | Deployment | ES modules load correctly via HTTP server | Local server running | E2E | P0 | :x: |
| DEPLOY-005 | Deployment | Game loads and runs on GitHub Pages | Deployed to GitHub Pages | E2E | P1 | :x: |

### 13.2 Browser Compatibility

| ID | Category | Description | Preconditions | Test Type | Priority | Status |
|----|----------|-------------|---------------|-----------|----------|--------|
| COMPAT-001 | Compatibility | Game runs in Chrome (latest) | Deployed game | E2E | P1 | :x: |
| COMPAT-002 | Compatibility | Game runs in Firefox (latest) | Deployed game | E2E | P1 | :x: |
| COMPAT-003 | Compatibility | Game runs in Safari (latest) | Deployed game | E2E | P1 | :x: |
| COMPAT-004 | Compatibility | Game runs in Edge (latest) | Deployed game | E2E | P2 | :x: |
| COMPAT-005 | Compatibility | ES modules supported (script type="module") | Modern browser | E2E | P1 | :x: |

---

## Coverage Summary

| Category | P0 | P1 | P2 | Total |
|----------|----|----|-----|-------|
| Constants & Configuration | 3 | 5 | 4 | 12 |
| Input Management | 10 | 7 | 0 | 17 |
| Difficulty Progression | 9 | 6 | 0 | 15 |
| Collision Detection | 11 | 8 | 2 | 21 |
| Player Box | 19 | 12 | 1 | 32 |
| Triangle | 8 | 5 | 2 | 15 |
| Game State Machine | 9 | 6 | 0 | 15 |
| Game Loop & Frame Logic | 1 | 6 | 1 | 8 |
| Gameplay Mechanics | 16 | 7 | 1 | 24 |
| Rendering & Visual | 1 | 7 | 4 | 12 |
| UI & Scoring | 9 | 7 | 2 | 18 |
| Performance & Edge Cases | 3 | 6 | 3 | 12 |
| Deployment & Browser Compat | 4 | 5 | 1 | 10 |
| **Total** | **103** | **87** | **21** | **211** |

---

## High-Priority Gaps

The following areas represent the highest-risk gaps if left untested:

1. **Triangle-box collision chain resolution (MECH-001 through MECH-012):** The split/push/destroy decision tree is the core mechanic. Incorrect behavior here breaks the entire game. These P0 tests should be implemented first.

2. **State machine transitions (STATE-001 through STATE-007):** Broken transitions mean the game can't start, can't restart, or gets stuck. The `_stateJustChanged` guard is particularly important to test since it prevents accidental double-transitions.

3. **Split mechanic correctness (PLAYER-014 through PLAYER-023):** Splitting is the signature mechanic. Key pair inheritance, child sizing, and fly-apart behavior must all work correctly for the game to function.

4. **Death condition (MECH-016 through MECH-018):** If death detection is wrong, the game either ends prematurely or never ends.

5. **Delta time cap (LOOP-002, EDGE-003):** Without the 50ms cap, returning from a background tab could cause boxes to teleport off-screen or physics to explode.

6. **High score persistence (UI-014 through UI-016):** This is the only persistent state in the game and drives the "one more try" loop.

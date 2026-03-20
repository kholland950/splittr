// src/constants.js — All tunable game values in one place

// Player
export const PLAYER_WIDTH = 180;
export const PLAYER_HEIGHT = 135;
export const PLAYER_ACCEL = 5000;
export const PLAYER_FRICTION = 300;
export const PLAYER_WALL_BOUNCE = 0.5;
export const MAX_SPLIT_DEPTH = 4; // limited naturally by 5 home-row key pairs
export const SPLIT_IMMUNITY_MS = 350;
export const SPLIT_FLY_APART_MULTIPLIER = 2.0;
export const SPLIT_INITIAL_VELOCITY = 550;
export const BOX_COLLISION_DAMPING = 0.75;

// Player trail
export const TRAIL_SPEED_THRESHOLD = 200;
export const TRAIL_MAX_LENGTH = 12;

// Triangles
export const TRIANGLE_WIDTH = 80;
export const TRIANGLE_HEIGHT = 70;
export const TRIANGLE_COLUMN_COOLDOWN_MS = 350;

// Triangle variety
export const GOLDEN_TRIANGLE_CHANCE = 0.04; // 4% chance
export const GOLDEN_SHIELD_DURATION_MS = 3000;
export const BIG_TRIANGLE_CHANCE = 0.12;
export const FAST_TRIANGLE_CHANCE = 0.15;
export const WOBBLE_TRIANGLE_CHANCE = 0.1;
export const HEART_TRIANGLE_CHANCE = 0.05; // 5% chance

// Heart / Merge
export const HEART_SHIELD_DURATION_MS = 2000;
export const MERGE_SLIDE_SPEED = 600; // px/sec boxes slide toward each other
export const COLOR_HEART = '#ff69b4';

// Difficulty tiers: [maxTime, spawnIntervalMs, fallSpeed, maxSimultaneous]
export const DIFFICULTY_TIERS = [
  { maxTime: 5,        spawnInterval: 1200, fallSpeed: 300, maxTriangles: 3 },
  { maxTime: 12,       spawnInterval: 800,  fallSpeed: 420, maxTriangles: 6 },
  { maxTime: 25,       spawnInterval: 550,  fallSpeed: 550, maxTriangles: 10 },
  { maxTime: 45,       spawnInterval: 380,  fallSpeed: 680, maxTriangles: 15 },
  { maxTime: Infinity, spawnInterval: 250,  fallSpeed: 800, maxTriangles: 25 },
];

// Combo system
export const COMBO_WINDOW_MS = 2000; // time between splits to maintain combo
export const COMBO_DISPLAY_DURATION_MS = 1500;

// Slow-mo
export const SLOWMO_DURATION_MS = 200;
export const SLOWMO_FACTOR = 0.25;

// Colors
export const COLOR_BACKGROUND = '#0a0e27';
export const COLOR_GRID = 'rgba(255, 255, 255, 0.03)';
export const COLOR_PLAYER = '#00d4ff';
export const COLOR_PLAYER_LIGHT = '#66e5ff';
export const COLOR_TRIANGLE = '#ff1744';
export const COLOR_GOLDEN = '#ffd700';
export const COLOR_TEXT = '#ffffff';
export const COLOR_TEXT_DIM = 'rgba(255, 255, 255, 0.5)';

// Screen shake
export const SHAKE_DURATION_MS = 80; // ~5 frames at 60fps
export const SHAKE_MAGNITUDE = 6;

// Background particles
export const BG_PARTICLE_COUNT = 40;

// Home row key pairs — spatially mapped left-to-right across the keyboard
// Center pair is the starter, splits expand outward
export const KEY_PAIRS_START = [
  { left: 'g', right: 'h', leftLabel: 'G', rightLabel: 'H' },
];

export const KEY_PAIRS_LEFT = [
  { left: 'd', right: 'f', leftLabel: 'D', rightLabel: 'F' },
  { left: 'a', right: 's', leftLabel: 'A', rightLabel: 'S' },
];

export const KEY_PAIRS_RIGHT = [
  { left: 'j', right: 'k', leftLabel: 'J', rightLabel: 'K' },
  { left: 'l', right: ';', leftLabel: 'L', rightLabel: ';' },
];

// Combined for legacy compatibility
export const KEY_PAIRS = [...KEY_PAIRS_LEFT, ...KEY_PAIRS_START, ...KEY_PAIRS_RIGHT];

// Leaderboard
export const LEADERBOARD_MAX_ENTRIES = 10;
export const COLOR_GOLD = '#ffd700';
export const COLOR_SILVER = '#c0c0c0';
export const COLOR_BRONZE = '#cd7f32';

// localStorage key
export const HIGH_SCORE_KEY = 'splittr-highscore';

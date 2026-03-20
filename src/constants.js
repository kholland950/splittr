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

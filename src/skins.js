// src/skins.js — Skin/theme system for cosmetic color swaps

const SKIN_STORAGE_KEY = 'splittr-skin';

const SKINS = [
  {
    name: 'Classic',
    playerHue: 190,
    playerColor: '#00d4ff',
    playerGlow: '#00d4ff',
    triangleColor: '#ff1744',
    triangleGradientTop: '#ff6b6b',
    triangleGradientBottom: '#cc0033',
    triangleGlow: '#ff1744',
    triangleBorder: 'rgba(255, 100, 100, 0.5)',
    fastGlow: '#ff4444',
    fastGradientTop: '#ff8888',
    fastGradientMid: '#ff2222',
    fastGradientBottom: '#cc0000',
    backgroundColor: '#0a0e27',
    backgroundCenter: '#101440',
    gridColor: 'rgba(255, 255, 255, 0.03)',
    textColor: '#ffffff',
    accentColor: '#00d4ff',
    accentRgb: '0, 212, 255',
    dangerGlow: 'rgba(255, 23, 68, 0.06)',
    bgTriangleColor: '#ff1744',
  },
  {
    name: 'Neon',
    playerHue: 320,
    playerColor: '#ff1493',
    playerGlow: '#ff1493',
    triangleColor: '#39ff14',
    triangleGradientTop: '#7dff6b',
    triangleGradientBottom: '#1abf00',
    triangleGlow: '#39ff14',
    triangleBorder: 'rgba(57, 255, 20, 0.5)',
    fastGlow: '#66ff44',
    fastGradientTop: '#99ff88',
    fastGradientMid: '#44ff22',
    fastGradientBottom: '#22cc00',
    backgroundColor: '#000000',
    backgroundCenter: '#0a0a0a',
    gridColor: 'rgba(255, 20, 147, 0.04)',
    textColor: '#ffffff',
    accentColor: '#ff1493',
    accentRgb: '255, 20, 147',
    dangerGlow: 'rgba(57, 255, 20, 0.06)',
    bgTriangleColor: '#39ff14',
  },
  {
    name: 'Sunset',
    playerHue: 30,
    playerColor: '#ff8c00',
    playerGlow: '#ffa500',
    triangleColor: '#9b30ff',
    triangleGradientTop: '#bf7fff',
    triangleGradientBottom: '#6a0dad',
    triangleGlow: '#9b30ff',
    triangleBorder: 'rgba(155, 48, 255, 0.5)',
    fastGlow: '#bb55ff',
    fastGradientTop: '#cc88ff',
    fastGradientMid: '#aa33ff',
    fastGradientBottom: '#7700cc',
    backgroundColor: '#1a0a2e',
    backgroundCenter: '#2d1b4e',
    gridColor: 'rgba(255, 165, 0, 0.03)',
    textColor: '#fff5e6',
    accentColor: '#ffa500',
    accentRgb: '255, 165, 0',
    dangerGlow: 'rgba(155, 48, 255, 0.06)',
    bgTriangleColor: '#9b30ff',
  },
  {
    name: 'Matrix',
    playerHue: 120,
    playerColor: '#00ff41',
    playerGlow: '#00ff41',
    triangleColor: '#00cc33',
    triangleGradientTop: '#33ff66',
    triangleGradientBottom: '#009926',
    triangleGlow: '#00ff41',
    triangleBorder: 'rgba(0, 255, 65, 0.4)',
    fastGlow: '#33ff55',
    fastGradientTop: '#66ff88',
    fastGradientMid: '#22cc44',
    fastGradientBottom: '#008822',
    backgroundColor: '#000000',
    backgroundCenter: '#001a00',
    gridColor: 'rgba(0, 255, 65, 0.04)',
    textColor: '#00ff41',
    accentColor: '#00ff41',
    accentRgb: '0, 255, 65',
    dangerGlow: 'rgba(0, 204, 51, 0.08)',
    bgTriangleColor: '#00cc33',
  },
  {
    name: 'Vaporwave',
    playerHue: 290,
    playerColor: '#ff71ce',
    playerGlow: '#ff71ce',
    triangleColor: '#b967ff',
    triangleGradientTop: '#d4a0ff',
    triangleGradientBottom: '#8b35e0',
    triangleGlow: '#b967ff',
    triangleBorder: 'rgba(185, 103, 255, 0.5)',
    fastGlow: '#cc88ff',
    fastGradientTop: '#ddaaff',
    fastGradientMid: '#bb66ff',
    fastGradientBottom: '#8833cc',
    backgroundColor: '#0d0221',
    backgroundCenter: '#1a0a3e',
    gridColor: 'rgba(255, 113, 206, 0.04)',
    textColor: '#01cdfe',
    accentColor: '#01cdfe',
    accentRgb: '1, 205, 254',
    dangerGlow: 'rgba(185, 103, 255, 0.06)',
    bgTriangleColor: '#b967ff',
  },
  {
    name: 'Capybara',
    secret: true,
    playerHue: 30,
    playerColor: '#c4956a',
    playerGlow: '#d4a574',
    triangleColor: '#ff6b35',
    triangleGradientTop: '#ff9966',
    triangleGradientBottom: '#cc4400',
    triangleGlow: '#ff6b35',
    triangleBorder: 'rgba(255, 107, 53, 0.5)',
    fastGlow: '#ff8844',
    fastGradientTop: '#ffaa77',
    fastGradientMid: '#ff7733',
    fastGradientBottom: '#cc5500',
    backgroundColor: '#2d5016',
    backgroundCenter: '#3a6b1e',
    gridColor: 'rgba(196, 149, 106, 0.05)',
    textColor: '#f5e6d0',
    accentColor: '#c4956a',
    accentRgb: '196, 149, 106',
    dangerGlow: 'rgba(255, 107, 53, 0.06)',
    bgTriangleColor: '#ff6b35',
  },
  {
    name: 'Ice',
    playerHue: 200,
    playerColor: '#e0f0ff',
    playerGlow: '#87ceeb',
    triangleColor: '#1a3a5c',
    triangleGradientTop: '#2a5a8c',
    triangleGradientBottom: '#0a1a2e',
    triangleGlow: '#1a3a5c',
    triangleBorder: 'rgba(26, 58, 92, 0.6)',
    fastGlow: '#2255aa',
    fastGradientTop: '#3366bb',
    fastGradientMid: '#1a4488',
    fastGradientBottom: '#0a2244',
    backgroundColor: '#c8e6f5',
    backgroundCenter: '#ddeeff',
    gridColor: 'rgba(26, 58, 92, 0.06)',
    textColor: '#1a3a5c',
    accentColor: '#4a9ece',
    accentRgb: '74, 158, 206',
    dangerGlow: 'rgba(26, 58, 92, 0.06)',
    bgTriangleColor: '#1a3a5c',
  },
];

const UNLOCK_STORAGE_KEY = 'splittr-unlocked-skins';
let _currentIndex = 0;
let _unlockedSecrets = new Set();

// Load saved state on module init
try {
  const saved = localStorage.getItem(SKIN_STORAGE_KEY);
  if (saved !== null) {
    const idx = SKINS.findIndex(s => s.name === saved);
    if (idx >= 0) _currentIndex = idx;
  }
  const unlocked = localStorage.getItem(UNLOCK_STORAGE_KEY);
  if (unlocked) _unlockedSecrets = new Set(JSON.parse(unlocked));
} catch (_) { /* localStorage unavailable */ }

function _isAvailable(skin) {
  return !skin.secret || _unlockedSecrets.has(skin.name);
}

export function unlockSkin(name) {
  const skin = SKINS.find(s => s.name === name);
  if (!skin || !skin.secret) return false;
  if (_unlockedSecrets.has(name)) return false;
  _unlockedSecrets.add(name);
  try {
    localStorage.setItem(UNLOCK_STORAGE_KEY, JSON.stringify([..._unlockedSecrets]));
  } catch (_) { /* localStorage unavailable */ }
  return true; // newly unlocked
}

export function isSkinUnlocked(name) {
  const skin = SKINS.find(s => s.name === name);
  if (!skin) return false;
  return _isAvailable(skin);
}

export function getCurrentSkin() {
  return SKINS[_currentIndex];
}

export function cycleSkin() {
  // Skip locked secret skins
  let next = (_currentIndex + 1) % SKINS.length;
  let attempts = 0;
  while (!_isAvailable(SKINS[next]) && attempts < SKINS.length) {
    next = (next + 1) % SKINS.length;
    attempts++;
  }
  _currentIndex = next;
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, SKINS[_currentIndex].name);
  } catch (_) { /* localStorage unavailable */ }
  return SKINS[_currentIndex];
}

export function getSkinCount() {
  return SKINS.filter(s => _isAvailable(s)).length;
}

export function getTotalSkinCount() {
  return SKINS.length;
}

export function getCurrentSkinIndex() {
  return _currentIndex;
}

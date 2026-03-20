// src/leaderboard.js — Local ranked leaderboard (top 10, localStorage)

const STORAGE_KEY = 'splittr-leaderboard';
const MAX_ENTRIES = 10;

export class Leaderboard {
  constructor() {
    this.entries = this._load();
  }

  // Returns the rank (1-based) this score would get, or 0 if it doesn't qualify
  qualifies(score) {
    if (score <= 0) return 0;
    for (let i = 0; i < this.entries.length; i++) {
      if (score > this.entries[i].score) return i + 1;
    }
    if (this.entries.length < MAX_ENTRIES) return this.entries.length + 1;
    return 0;
  }

  // Add entry and return the rank (1-based)
  add(initials, score) {
    const entry = {
      initials: initials.toUpperCase(),
      score,
      date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    };
    const rank = this.qualifies(score);
    if (rank === 0) return 0;
    this.entries.splice(rank - 1, 0, entry);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries.length = MAX_ENTRIES;
    }
    this._save();
    return rank;
  }

  getEntries() {
    return this.entries;
  }

  _load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(0, MAX_ENTRIES);
    } catch (_) {
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch (_) { /* localStorage unavailable */ }
  }
}

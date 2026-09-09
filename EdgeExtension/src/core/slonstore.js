/**
 * slonstore.js — хранилище слона (ctxslon)
 * Ключ: chrome.storage.local 'ctxslon'
 * Структура: { statuses: { [coord]: { coord, time, author, rank, descript, history: [] } }, ranks: [...] }
 */

const CTX_STORAGE_KEY = 'ctxslon';

// Ранги: пустой массив — управляющий заполняет сам через дверь
const DEFAULT_RANKS = [];

class SlonStore {
  constructor() {
    this.cache = null;
  }

  async load() {
    const result = await chrome.storage.local.get(CTX_STORAGE_KEY);
    this.cache = result[CTX_STORAGE_KEY] || { statuses: {}, ranks: JSON.parse(JSON.stringify(DEFAULT_RANKS)) };
    return this.cache;
  }

  async save() {
    if (!this.cache) return;
    await chrome.storage.local.set({ [CTX_STORAGE_KEY]: this.cache });
  }

  async getStatus(coord) {
    if (!this.cache) await this.load();
    return this.cache.statuses[coord] || null;
  }

  async setStatus(coord, time, author, rank, descript = '') {
    if (!this.cache) await this.load();

    const existing = this.cache.statuses[coord];
    const historyEntry = { coord, time, author, rank, descript };

    if (existing) {
      existing.rank = rank;
      existing.descript = descript;
      existing.time = time;
      existing.author = author;
      existing.history.push(historyEntry);
    } else {
      this.cache.statuses[coord] = {
        coord,
        time,
        author,
        rank,
        descript,
        history: [historyEntry]
      };
    }

    await this.save();
    return this.cache.statuses[coord];
  }

  async deleteStatus(coord) {
    if (!this.cache) await this.load();
    delete this.cache.statuses[coord];
    await this.save();
  }

  async getRanks() {
    if (!this.cache) await this.load();
    return this.cache.ranks;
  }

  async getAllStatuses() {
    if (!this.cache) await this.load();
    return this.cache.statuses;
  }
}

const CTX_SLON = new SlonStore();

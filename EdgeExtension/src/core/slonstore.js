/**
 * slonstore.js — хранилище слона (ctxslon)
 * Ключ: chrome.storage.local 'ctxslon'
 * Структура: { statuses: { [coord]: { coord, time, author, rank, descript, history: [] } }, ranks: [...] }
 */

const CTX_STORAGE_KEY = 'ctxslon';

// Эталонные ранги из dmiandr/context (TASK-0173)
const DEFAULT_RANKS = [
  { id: 0, name: 'Не читать', color: '#FF0000', desc: '' },
  { id: 1, name: 'Не комментировать', color: '#FFB6B6', desc: '' },
  { id: 2, name: 'Хам', color: '#FFA500', desc: 'Может сорваться на хамство без видимого повода' },
  { id: 3, name: 'Обидчивый', color: '#FFD700', desc: 'Оскорбляется на любую нейтральную реплику' },
  { id: 4, name: 'Религиозный', color: '#FFFF00', desc: 'Тему религии не поднимать' },
  { id: 5, name: 'Упертый', color: '#ADFF2F', desc: 'Излагать мысли краткими фразами' },
  { id: 6, name: 'Не закончен разговор', color: '#90EE90', desc: 'Не начинать новых дискуссий, пока не выполнены обещания по старым' },
  { id: 7, name: 'Хороший собеседник', color: '#00FF00', desc: 'Умеет беседовать содержательно, без демагогии' },
  { id: 8, name: 'Читать', color: '#17760f', desc: '' }
];

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

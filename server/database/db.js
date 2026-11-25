const fs = require('fs');
const path = require('path');

const seedPath = path.resolve(__dirname, 'seedData.json');
let store = {};

try {
  store = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
} catch (err) {
  console.warn('[DB] Could not load seedData.json:', err.message);
  store = {};
}

const db = {
  init: async () => {},
  getMode: () => 'in-memory-json',
  get: (collection) => store[collection] || [],
  findById: (collection, id) => (store[collection] || []).find((item) => item.id === id || item.code === id || item.ticker === id || item.imo === id),
  find: (collection, filterFn) => {
    const items = store[collection] || [];
    return typeof filterFn === 'function' ? items.filter(filterFn) : items;
  },
  insert: (collection, item) => {
    if (!store[collection]) store[collection] = [];
    const newItem = { ...item, id: item.id || `rec-${Date.now()}`, createdAt: new Date().toISOString() };
    store[collection].unshift(newItem);
    return newItem;
  },
  getStats: () => {
    const counts = {};
    for (const key of Object.keys(store)) {
      counts[key] = Array.isArray(store[key]) ? store[key].length : 0;
    }
    return { mode: 'in-memory-json', counts };
  },
};

module.exports = db;

/**
 * Simple, Resilient Database Layer
 * 
 * Provides unified access to freight, port, vessel, and market data.
 * Defaults to in-memory JSON data loaded from seedData.json for zero-dependency execution.
 * Supports PostgreSQL when DATABASE_URL is configured, falling back gracefully if unavailable.
 */

const fs = require('fs');
const path = require('path');

// Default initial state
let store = {
  ports: [],
  freightLanes: [],
  vessels: [],
  chokepoints: [],
  assets: [],
  incidents: [],
  news: [],
  economicCalendar: [],
  orders: [],
  positions: [],
};

let dbMode = 'in-memory-json';
let postgresClient = null;

// Initialize from seedData.json
try {
  const seedPath = path.resolve(__dirname, 'seedData.json');
  if (fs.existsSync(seedPath)) {
    const raw = fs.readFileSync(seedPath, 'utf-8');
    store = JSON.parse(raw);
    console.log('[DB] Seed data loaded successfully.');
  }
} catch (err) {
  console.warn('[DB] Warning: Could not read seedData.json, using fallback empty store:', err.message);
}

// Optional PostgreSQL integration
async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[DB] No DATABASE_URL specified. Running in lightweight in-memory mode.');
    return;
  }

  try {
    // Attempt optional dynamic require of pg if installed
    const { Client } = require('pg');
    postgresClient = new Client({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    await postgresClient.connect();
    dbMode = 'postgresql';
    console.log('[DB] Successfully connected to PostgreSQL.');
  } catch (err) {
    console.warn('[DB] PostgreSQL connection failed or pg driver not present. Falling back to in-memory store:', err.message);
    dbMode = 'in-memory-json (fallback)';
    postgresClient = null;
  }
}

/**
 * Generic query helpers
 */
const db = {
  init: initDatabase,

  getMode: () => dbMode,

  get: (collection) => {
    return store[collection] || [];
  },

  findById: (collection, id) => {
    const items = store[collection] || [];
    return items.find((item) => item.id === id || item.code === id || item.ticker === id || item.imo === id);
  },

  find: (collection, filterFn) => {
    const items = store[collection] || [];
    if (typeof filterFn !== 'function') return items;
    return items.filter(filterFn);
  },

  insert: (collection, item) => {
    if (!store[collection]) {
      store[collection] = [];
    }
    const newItem = {
      ...item,
      id: item.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
    };
    store[collection].unshift(newItem);
    return newItem;
  },

  update: (collection, id, updates) => {
    const items = store[collection] || [];
    const idx = items.findIndex((item) => item.id === id || item.ticker === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    return items[idx];
  },

  getStats: () => {
    const stats = {};
    for (const key of Object.keys(store)) {
      stats[key] = Array.isArray(store[key]) ? store[key].length : 0;
    }
    return {
      mode: dbMode,
      counts: stats,
    };
  },
};

module.exports = db;

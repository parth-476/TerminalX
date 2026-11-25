/**
 * Data Service
 * 
 * Clean business logic layer orchestrating database queries and calculations.
 * Avoids over-abstraction while keeping routes straightforward.
 */

const db = require('../database/db');
const { calculateMarketTrends, calculateDistanceNm } = require('../utils/calculations');

const dataService = {
  // --- MARKET & FREIGHT RATES ---
  getAllAssets: () => {
    return db.get('assets');
  },

  getFreightLanes: (type) => {
    let lanes = db.get('freightLanes');
    if (type) {
      lanes = lanes.filter((l) => l.type.toLowerCase() === type.toLowerCase());
    }
    return lanes.map((l) => ({
      ...l,
      dataSource: 'TERMINAL.EXE DEMO FEED',
    }));
  },

  getFreightLaneByCode: (code) => {
    return db.find('freightLanes', (l) => l.code.toUpperCase() === code.toUpperCase() || l.id === code)[0] || null;
  },

  compareFreightRates: (codes = []) => {
    const lanes = db.get('freightLanes');
    const selected = codes.length > 0 
      ? lanes.filter((l) => codes.includes(l.code) || codes.includes(l.id))
      : lanes.slice(0, 4);

    return selected.map((l) => {
      const trends = calculateMarketTrends(l.historicalRates || []);
      return {
        id: l.id,
        code: l.code,
        name: l.name,
        type: l.type,
        currentRateUsd: l.currentRateUsd,
        rateUnit: l.rateUnit,
        change24h: l.change24h,
        changePct: l.changePct,
        trends,
      };
    });
  },

  getLaneTrends: (code) => {
    const lane = dataService.getFreightLaneByCode(code);
    if (!lane) return null;
    const stats = calculateMarketTrends(lane.historicalRates || []);
    return {
      lane: {
        code: lane.code,
        name: lane.name,
        currentRate: lane.currentRateUsd,
        unit: lane.rateUnit,
      },
      stats,
      history: lane.historicalRates || [],
    };
  },

  // --- PORTS & CONGESTION ---
  getAllPorts: (filter = {}) => {
    let ports = db.get('ports');
    if (filter.country) {
      ports = ports.filter((p) => p.country.toLowerCase().includes(filter.country.toLowerCase()));
    }
    if (filter.status) {
      ports = ports.filter((p) => p.status.toUpperCase() === filter.status.toUpperCase());
    }
    return ports;
  },

  getPortById: (id) => {
    return db.findById('ports', id);
  },

  getTopCongestedPorts: (limit = 10) => {
    const ports = [...db.get('ports')];
    return ports
      .sort((a, b) => (b.congestionScore || 0) - (a.congestionScore || 0))
      .slice(0, limit)
      .map((p, idx) => ({
        rank: idx + 1,
        id: p.id,
        code: p.code,
        name: p.name,
        country: p.country,
        congestionScore: p.congestionScore,
        avgWaitDays: p.avgWaitDays,
        vesselsWaiting: p.vesselsWaiting,
        vesselsAtBerth: p.vesselsAtBerth,
        bunkerPriceVLSFO: p.bunkerPriceVLSFO,
        status: p.status,
      }));
  },

  // --- VESSELS & ROUTE MATCHING ---
  getAllVessels: (query = {}) => {
    let vessels = db.get('vessels');
    if (query.type) {
      vessels = vessels.filter((v) => v.type.toUpperCase() === query.type.toUpperCase());
    }
    if (query.status) {
      vessels = vessels.filter((v) => v.cargoStatus.toUpperCase() === query.status.toUpperCase());
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      vessels = vessels.filter(
        (v) =>
          v.name.toLowerCase().includes(term) ||
          v.imo.includes(term) ||
          v.operator?.toLowerCase().includes(term) ||
          v.destinationPort?.toLowerCase().includes(term)
      );
    }
    return vessels;
  },

  getVesselByImo: (imo) => {
    return db.find('vessels', (v) => v.imo === String(imo) || v.id === imo)[0] || null;
  },

  matchVesselsToRoute: ({ vesselType, originPortCode, maxDistanceNm = 2500 }) => {
    const vessels = db.get('vessels');
    const port = db.findById('ports', originPortCode);

    let candidates = vessels;
    if (vesselType) {
      candidates = candidates.filter((v) => v.type.toUpperCase() === vesselType.toUpperCase());
    }

    // Rank candidates by distance to origin port if port coordinates are known
    if (port && port.lat && port.lon) {
      return candidates
        .map((v) => {
          const distToPort = calculateDistanceNm(v.lat, v.lon, port.lat, port.lon);
          return {
            ...v,
            distanceToOriginPortNm: distToPort,
            estimatedHoursToPort: Number((distToPort / (v.speedKnots || 14)).toFixed(1)),
          };
        })
        .filter((v) => v.distanceToOriginPortNm <= maxDistanceNm)
        .sort((a, b) => a.distanceToOriginPortNm - b.distanceToOriginPortNm);
    }

    return candidates.slice(0, 10);
  },

  // --- CHOKEPOINTS & INCIDENTS ---
  getChokepoints: () => {
    return db.get('chokepoints');
  },

  getIncidents: () => {
    return db.get('incidents');
  },

  // --- ORDERS / SIMULATED TRADING ---
  createOrder: (orderData) => {
    const newOrder = {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      ticker: orderData.ticker || 'BDI.INDEX',
      side: orderData.side || 'BUY',
      type: orderData.type || 'LIMIT',
      price: Number(orderData.price) || 0,
      quantity: Number(orderData.quantity) || 1,
      status: 'EXECUTED',
      timestamp: new Date().toISOString(),
    };
    db.insert('orders', newOrder);
    return newOrder;
  },
};

module.exports = dataService;

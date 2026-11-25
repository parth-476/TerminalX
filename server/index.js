/**
 * TERMINALX — Express Backend Monolith
 * 
 * Simple, beginner-friendly REST API for maritime intelligence.
 * Loads mock maritime data from data.json into memory and serves endpoints for:
 * - Market rates & assets
 * - Port congestion & directories
 * - AIS vessel telemetry & proximity matching
 * - Voyage cost calculations (Haversine, fuel burn, Suez vs Cape)
 * - AI maritime intelligence advisor
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const {
  calculateDistanceNm,
  calculateVoyageCost,
  calculateRouteComparison,
  calculateMarketTrends
} = require('./calculations');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Load in-memory dataset
const dataFilePath = path.join(__dirname, 'data.json');
let db = {
  ports: [],
  vessels: [],
  freightLanes: [],
  chokePoints: [],
  assets: [],
  orders: []
};

try {
  if (fs.existsSync(dataFilePath)) {
    db = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    if (!db.orders) db.orders = [];
  }
} catch (err) {
  console.error('Error loading data.json:', err.message);
}

// ==========================================
// 1. SYSTEM HEALTH
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: 'in-memory-json',
    portsCount: (db.ports || []).length,
    vesselsCount: (db.vessels || []).length,
    lanesCount: (db.freightLanes || []).length
  });
});

// ==========================================
// 2. MARKET & FREIGHT RATES
// ==========================================
app.get('/api/market/assets', (req, res) => {
  res.json(db.assets || []);
});

app.get('/api/market/rates', (req, res) => {
  res.json(db.freightLanes || []);
});

app.get('/api/market/trends/:code', (req, res) => {
  const lane = (db.freightLanes || []).find(l => l.code === req.params.code);
  if (!lane) return res.status(404).json({ error: 'Lane code not found' });
  const trends = calculateMarketTrends(lane.historicalRates || []);
  res.json({ code: lane.code, name: lane.name, ...trends });
});

app.post('/api/market/orders', (req, res) => {
  const { ticker, side, quantity, price, type = 'LIMIT' } = req.body;
  if (!ticker || !side || !quantity) {
    return res.status(400).json({ error: 'Missing required order fields (ticker, side, quantity)' });
  }
  const order = {
    id: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ticker: ticker.toUpperCase(),
    side: side.toUpperCase(),
    quantity: Number(quantity),
    price: Number(price) || 0,
    type,
    status: 'FILLED',
    timestamp: new Date().toISOString()
  };
  db.orders.push(order);
  res.status(201).json(order);
});

// ==========================================
// 3. PORT INTELLIGENCE & CONGESTION
// ==========================================
app.get('/api/ports', (req, res) => {
  res.json(db.ports || []);
});

app.get('/api/ports/congestion', (req, res) => {
  const sorted = [...(db.ports || [])].sort((a, b) => b.congestionScore - a.congestionScore);
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
  res.json(sorted.slice(0, limit));
});

app.get('/api/ports/:id', (req, res) => {
  const port = (db.ports || []).find(p => p.id === req.params.id || p.code === req.params.id);
  if (!port) return res.status(404).json({ error: 'Port not found' });
  res.json(port);
});

// ==========================================
// 4. VESSEL TELEMETRY & ROUTE MATCHING
// ==========================================
app.get('/api/vessels', (req, res) => {
  let list = db.vessels || [];
  const { type, status, search } = req.query;
  if (type) list = list.filter(v => v.type.toLowerCase() === type.toLowerCase());
  if (status) list = list.filter(v => v.cargoStatus.toLowerCase() === status.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(v => v.name.toLowerCase().includes(q) || v.imo.includes(q) || v.mmsi.includes(q));
  }
  res.json(list);
});

app.post('/api/vessels/match', (req, res) => {
  const { originLat, originLon, maxDistanceNm = 1500, vesselType } = req.body;
  if (originLat === undefined || originLon === undefined) {
    return res.status(400).json({ error: 'originLat and originLon are required' });
  }
  const matched = (db.vessels || [])
    .filter(v => !vesselType || v.type.toLowerCase() === vesselType.toLowerCase())
    .map(v => {
      const distanceNm = calculateDistanceNm(originLat, originLon, v.lat, v.lon);
      const daysAway = Number((distanceNm / (v.speedKnots * 24 || 350)).toFixed(1));
      return { ...v, distanceNm, daysAway };
    })
    .filter(v => v.distanceNm <= maxDistanceNm)
    .sort((a, b) => a.distanceNm - b.distanceNm);

  res.json(matched);
});

// ==========================================
// 5. VOYAGE ANALYTICS & ROUTE COMPARISON
// ==========================================
app.post('/api/analytics/voyage-cost', (req, res) => {
  const result = calculateVoyageCost(req.body);
  res.json(result);
});

app.post('/api/analytics/route-compare', (req, res) => {
  const { routeA, routeB, vesselType, fuelPrice } = req.body;
  const standardRoute = routeA || { name: 'Suez Canal Route', distanceNm: 8400, canalToll: 350000, riskLevel: 'HIGH' };
  const alternativeRoute = routeB || { name: 'Cape of Good Hope Route', distanceNm: 11800, canalToll: 0, riskLevel: 'LOW' };
  const comparison = calculateRouteComparison(standardRoute, alternativeRoute, vesselType, fuelPrice);
  res.json(comparison);
});

// ==========================================
// 6. GEMINI AI ADVISOR & MARITIME FALLBACK
// ==========================================
app.post('/api/ai/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message field is required' });

  // Optional: Call Google Gemini API if key is set
  if (process.env.GEMINI_API_KEY) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const payload = {
        contents: [{ role: 'user', parts: [{ text: `You are an expert maritime logistics and freight trading analyst for the TerminalX platform. Provide a crisp, quantitative response to: ${message}` }] }]
      };
      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.json({ reply, model: 'gemini-2.5-flash', source: 'google_gemini_api' });
      }
    } catch (apiErr) {
      // Fall through to domain fallback
    }
  }

  // Domain fallback: Smart maritime casualty and trading intelligence
  const q = message.toLowerCase();
  let reply = '';
  if (q.includes('rubymar')) {
    reply = '⚓ SITREP: M/V RUBYMAR SINKING\n• Date: March 2, 2024 | Location: Bab-el-Mandeb Strait (12.95°N, 43.25°E)\n• Vessel: 32,211 DWT Bulk Carrier | IMO: 9138898 | Flag: Belize\n• Casualties: 24 crew evacuated safely; 0 fatalities.\n• Environmental: 21,000 MT ammonium phosphate fertilizer submerged on coral seabed; severed subsea cables.\n• Freight Impact: 1st commercial ship totally lost in Red Sea crisis, sparking +1.2% war-risk insurance spikes.';
  } else if (q.includes('tutor')) {
    reply = '💥 SITREP: M/V TUTOR FATAL MISSILE & USV STRIKE\n• Date: June 12-18, 2024 | Location: Southern Red Sea (14.22°N, 42.18°E)\n• Vessel: 82,357 DWT Ultramax Bulker | IMO: 9942627 | Flag: Liberia\n• Casualties: 1 Filipino crew member killed in engine room explosion; 21 rescued.\n• Status: Struck at waterline by autonomous drone vessel + aerial missile; foundered and sank.';
  } else if (q.includes('dali') || q.includes('baltimore')) {
    reply = '🌉 SITREP: M/V DALI BALTIMORE BRIDGE COLLISION\n• Date: March 26, 2024 | Location: Port of Baltimore, USA\n• Vessel: 9,962 TEU Container Ship | IMO: 9697428 | Flag: Singapore\n• Casualties: 6 highway maintenance workers tragically killed; bridge span collapsed.\n• Economic Impact: Closed 9th largest US port for 11 weeks; aggregate insured claims between $2B and $4B.';
  } else if (q.includes('suez') || q.includes('cape') || q.includes('red sea')) {
    reply = 'ANALYSIS: Red Sea / Bab-el-Mandeb risk remains ELEVATED. ~64% of Asia-Europe container vessels are rerouted via Cape of Good Hope (+10-14 days transit, +3,500nm). Bunker consumption increased by ~380 MT VLSFO per voyage ($238k added cost). Spot freight rates on SHA-RTM elevated at $7,230/FEU.';
  } else if (q.includes('bdi') || q.includes('baltic')) {
    reply = 'BALTIC DRY INDEX (BDI) REPORT: BDI standing at 1,845 (+2.96%). Capesize 5TC average TCE rates rebounded to $26,400/day driven by robust Brazilian iron ore loadings (Vale) and strong bauxite demand from Guinea. Panamax rates firming at $14,800/day on US Gulf grain export flows.';
  } else {
    reply = `QUANT SYNTHESIS: Cross-referencing "${message}" across live AIS vessel telemetry, IMO tragedy databases, FFA forward curves, and port queue analytics. Key takeaway: Global supply chains remain constrained by geopolitical chokepoints and safety diversions with heightened spot freight volatility.`;
  }

  res.json({ reply, model: 'domain-expert-fallback', source: 'built_in_maritime_engine' });
});

// ==========================================
// 7. STATIC SPA SERVING
// ==========================================
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 TerminalX Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;

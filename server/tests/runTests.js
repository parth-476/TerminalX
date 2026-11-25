/**
 * Self-contained Test Runner for TerminalX Monolith API
 * 
 * Tests all key routes and calculations without external test harness dependencies.
 */

const assert = require('assert');
const calculations = require('../utils/calculations');
const dataService = require('../services/dataService');
const aiService = require('../services/aiService');

async function runTests() {
  console.log('🧪 Starting TerminalX Backend Validation Suite...\n');
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  async function testAsync(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}:`, err.message);
      failed++;
    }
  }

  // --- 1. CALCULATIONS ENGINE TESTS ---
  console.log('[Suite 1: Calculation Engine]');
  test('Haversine distance calculation between Shanghai & Singapore', () => {
    // SHA ~ 30.62, 122.06 | SIN ~ 1.28, 103.85
    const dist = calculations.calculateDistanceNm(30.62, 122.06, 1.28, 103.85);
    assert.ok(dist > 1800 && dist < 2500, `Expected distance ~2000nm, got ${dist}`);
  });

  test('Voyage cost calculation returns valid breakdown', () => {
    const cost = calculations.calculateVoyageCost({
      distanceNm: 8400,
      vesselType: 'CONTAINER',
      speedKnots: 18.5,
      fuelPricePerTon: 628,
      canalToll: 350000,
      portDues: 55000,
    });
    assert.strictEqual(typeof cost.totalVoyageCost, 'number');
    assert.ok(cost.seaDays > 15 && cost.seaDays < 25, `Expected seaDays ~18.9, got ${cost.seaDays}`);
    assert.ok(cost.totalVoyageCost > 500000, 'Expected total voyage cost > $500,000');
    assert.strictEqual(cost.canalToll, 350000);
    assert.ok(cost.environmental.co2EmissionsTons > 0);
  });

  test('Route comparison between Suez and Cape of Good Hope calculates deltas correctly', () => {
    const comp = calculations.calculateRouteComparison(
      { name: 'Suez Route', distanceNm: 8400, canalToll: 350000, riskLevel: 'HIGH' },
      { name: 'Cape Route', distanceNm: 11800, canalToll: 0, riskLevel: 'LOW' },
      'CONTAINER',
      628
    );
    assert.strictEqual(comp.delta.extraDistanceNm, 3400);
    assert.ok(comp.delta.extraTransitDays > 6, `Expected extra days > 6, got ${comp.delta.extraTransitDays}`);
    assert.ok(comp.delta.recommendation.length > 10);
  });

  test('Market trend calculations handle historical rate series', () => {
    const history = [
      { date: '2026-08-01', rate: 4000 },
      { date: '2026-08-08', rate: 4200 },
      { date: '2026-08-15', rate: 4500 },
      { date: '2026-08-22', rate: 4800 },
    ];
    const trends = calculations.calculateMarketTrends(history);
    assert.strictEqual(trends.currentRate, 4800);
    assert.strictEqual(trends.trend, 'BULLISH');
    assert.ok(trends.volatilityPct > 0);
    assert.ok(trends.forecast30d >= 4800);
  });

  // --- 2. DATA SERVICE TESTS ---
  console.log('\n[Suite 2: Data Service]');
  test('getAllAssets returns financial and freight instruments', () => {
    const assets = dataService.getAllAssets();
    assert.ok(Array.isArray(assets) && assets.length > 0, 'Assets array should not be empty');
    assert.ok(assets.some((a) => a.ticker === 'BDI.INDEX' || a.ticker.includes('FE-EUR')));
  });

  test('getFreightLanes returns lanes with rate information', () => {
    const lanes = dataService.getFreightLanes();
    assert.ok(Array.isArray(lanes) && lanes.length > 0);
    const first = lanes[0];
    assert.ok(first.code && first.currentRateUsd);
    assert.strictEqual(first.dataSource, 'TERMINAL.EXE DEMO FEED');
  });

  test('getAllPorts and getTopCongestedPorts return ranked ports', () => {
    const ports = dataService.getAllPorts();
    assert.ok(ports.length >= 10, 'Expected at least 10 ports');
    const top = dataService.getTopCongestedPorts(5);
    assert.strictEqual(top.length, 5);
    assert.ok(top[0].congestionScore >= top[1].congestionScore, 'Ports should be sorted descending by congestion');
  });

  test('getAllVessels and matchVesselsToRoute find candidate vessels', () => {
    const vessels = dataService.getAllVessels();
    assert.ok(vessels.length > 0, 'Vessels list should not be empty');
    const matches = dataService.matchVesselsToRoute({
      originPortCode: 'port-sha',
      vesselType: 'CONTAINER',
      maxDistanceNm: 5000,
    });
    assert.ok(Array.isArray(matches));
  });

  test('createOrder inserts and returns confirmed ticket', () => {
    const order = dataService.createOrder({
      ticker: 'SHA-RTM',
      side: 'BUY',
      price: 4850,
      quantity: 5,
    });
    assert.ok(order.orderId.startsWith('ORD-'));
    assert.strictEqual(order.status, 'EXECUTED');
    assert.strictEqual(order.price, 4850);
  });

  // --- 3. AI SERVICE TESTS ---
  console.log('\n[Suite 3: AI Service & Maritime Fallbacks]');
  await testAsync('aiService provides domain intelligence for maritime casualties without API key', async () => {
    const res = await aiService.generateInsight('What recent maritime tragedies and casualties occurred?');
    assert.ok(res && res.text);
    assert.ok(res.text.includes('TUTOR') || res.text.includes('RUBYMAR') || res.text.includes('DALI'));
    assert.ok(res.source);
  });

  await testAsync('aiService provides Cape vs Suez routing trade-off analysis', async () => {
    const res = await aiService.generateInsight('Explain Suez vs Cape rerouting costs and risks');
    assert.ok(res.text.includes('Cape') && res.text.includes('Suez'));
  });

  console.log(`\n=========================================`);
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=========================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();

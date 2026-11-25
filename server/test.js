/**
 * TerminalX Backend Automated Test Suite
 * 
 * Tests calculation math and Express HTTP endpoints without needing heavy external test frameworks.
 */

const assert = require('assert');
const http = require('http');
const app = require('./index');
const {
  calculateDistanceNm,
  calculateVoyageCost,
  calculateRouteComparison,
  calculateMarketTrends
} = require('./calculations');

let passed = 0;
let failed = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Starting TerminalX Backend Validation Suite...\n');

  console.log('[Suite 1: Calculation Engine]');
  it('Haversine distance calculation between Shanghai & Singapore', () => {
    // Shanghai: 31.23, 121.47; Singapore: 1.35, 103.82
    const dist = calculateDistanceNm(31.23, 121.47, 1.35, 103.82);
    assert(dist > 2000 && dist < 2500, `Expected ~2200-2400nm, got ${dist}`);
  });

  it('Voyage cost calculation returns valid breakdown', () => {
    const cost = calculateVoyageCost({
      distanceNm: 8400,
      vesselType: 'CONTAINER',
      speedKnots: 18.5,
      dailyFuelBurnTons: 65,
      fuelPricePerTon: 628,
      dailyCharterRate: 35000,
      canalToll: 350000
    });
    assert.strictEqual(typeof cost.totalVoyageCost, 'number');
    assert(cost.totalVoyageCost > 1000000, 'Voyage cost should be > $1M');
    assert.strictEqual(typeof cost.seaDays, 'number');
    assert(cost.seaDays > 15 && cost.seaDays < 25, 'Sea days should be ~18-20');
  });

  it('Route comparison between Suez and Cape of Good Hope calculates deltas correctly', () => {
    const comparison = calculateRouteComparison(
      { name: 'Suez Route', distanceNm: 8400, canalToll: 350000, riskLevel: 'HIGH' },
      { name: 'Cape Route', distanceNm: 11800, canalToll: 0, riskLevel: 'LOW' }
    );
    assert(comparison.delta.extraDistanceNm === 3400, 'Extra distance should be 3400nm');
    assert(comparison.delta.extraTransitDays > 0, 'Cape route should add transit days');
    assert(comparison.routeA.canalToll === 350000, 'Suez toll should be preserved');
    assert(comparison.routeB.canalToll === 0, 'Cape toll should be 0');
  });

  it('Market trend calculations handle historical rate series', () => {
    const history = [
      { date: '2024-01-01', rate: 4500 },
      { date: '2024-01-02', rate: 4600 },
      { date: '2024-01-03', rate: 4750 },
      { date: '2024-01-04', rate: 4900 }
    ];
    const trends = calculateMarketTrends(history);
    assert.strictEqual(trends.currentRate, 4900);
    assert(trends.movingAvg7d > 4500 && trends.movingAvg7d < 4900);
    assert.strictEqual(trends.trend, 'BULLISH');
  });

  // Start ephemeral server for HTTP endpoint tests
  console.log('\n[Suite 2: Express HTTP Endpoints]');
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  function request(method, path, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const req = http.request(url, {
        method,
        headers: { 'Content-Type': 'application/json' }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      });
      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  try {
    const health = await request('GET', '/api/health');
    it('GET /api/health returns 200 and system status', () => {
      assert.strictEqual(health.status, 200);
      assert.strictEqual(health.body.status, 'ok');
    });

    const rates = await request('GET', '/api/market/rates');
    it('GET /api/market/rates returns active freight corridors', () => {
      assert.strictEqual(rates.status, 200);
      assert(Array.isArray(rates.body) && rates.body.length > 0);
    });

    const congestion = await request('GET', '/api/ports/congestion');
    it('GET /api/ports/congestion returns ranked congested ports', () => {
      assert.strictEqual(congestion.status, 200);
      assert(Array.isArray(congestion.body) && congestion.body.length > 0);
      assert(congestion.body[0].congestionScore >= congestion.body[1].congestionScore);
    });

    const vessels = await request('GET', '/api/vessels');
    it('GET /api/vessels returns live AIS tracked ships', () => {
      assert.strictEqual(vessels.status, 200);
      assert(Array.isArray(vessels.body) && vessels.body.length > 0);
    });

    const voyageCost = await request('POST', '/api/analytics/voyage-cost', {
      distanceNm: 8400,
      vesselType: 'CONTAINER',
      speedKnots: 18.5
    });
    it('POST /api/analytics/voyage-cost returns parametric calculation', () => {
      assert.strictEqual(voyageCost.status, 200);
      assert(voyageCost.body.totalVoyageCost > 500000);
    });

    const aiRes = await request('POST', '/api/ai/chat', {
      message: 'Tell me about the M/V Rubymar sinking and casualties'
    });
    it('POST /api/ai/chat provides maritime casualty sitrep', () => {
      assert.strictEqual(aiRes.status, 200);
      assert(typeof aiRes.body.reply === 'string' && aiRes.body.reply.includes('RUBYMAR'));
    });
  } finally {
    server.close();
  }

  console.log('\n=========================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=========================================');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

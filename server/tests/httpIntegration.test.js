/**
 * HTTP Integration Test
 * 
 * Boots Express app on an ephemeral port and tests real HTTP endpoints.
 */

const assert = require('assert');
const http = require('http');
const app = require('../index');

function request(port, path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: '127.0.0.1',
        port,
        path,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: JSON.parse(body),
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body,
            });
          }
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runHttpTests() {
  console.log('🌐 Testing Express HTTP Endpoints...');
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`  Express test server listening on ephemeral port ${port}`);

  try {
    // 1. Health check
    const health = await request(port, '/api/health');
    assert.strictEqual(health.statusCode, 200);
    assert.strictEqual(health.data.status, 'ONLINE');
    console.log('  ✓ GET /api/health [200 OK]');

    // 2. Market Rates
    const rates = await request(port, '/api/market/rates');
    assert.strictEqual(rates.statusCode, 200);
    assert.ok(rates.data.count > 0);
    console.log(`  ✓ GET /api/market/rates [200 OK, count: ${rates.data.count}]`);

    // 3. Port Congestion
    const ports = await request(port, '/api/ports/congestion');
    assert.strictEqual(ports.statusCode, 200);
    assert.ok(ports.data.data.length > 0);
    console.log(`  ✓ GET /api/ports/congestion [200 OK, count: ${ports.data.data.length}]`);

    // 4. Vessels
    const vessels = await request(port, '/api/vessels');
    assert.strictEqual(vessels.statusCode, 200);
    assert.ok(vessels.data.count > 0);
    console.log(`  ✓ GET /api/vessels [200 OK, count: ${vessels.data.count}]`);

    // 5. Voyage Cost Calculation
    const voyage = await request(port, '/api/analytics/voyage-cost', {
      method: 'POST',
      body: { distanceNm: 8400, vesselType: 'CONTAINER', fuelPricePerTon: 628 },
    });
    assert.strictEqual(voyage.statusCode, 200);
    assert.ok(voyage.data.data.totalVoyageCost > 0);
    console.log(`  ✓ POST /api/analytics/voyage-cost [200 OK, cost: $${voyage.data.data.totalVoyageCost}]`);

    // 6. AI Chat
    const ai = await request(port, '/api/ai/chat', {
      method: 'POST',
      body: { prompt: 'Give me a sitrep on the M/V Tutor incident' },
    });
    assert.strictEqual(ai.statusCode, 200);
    assert.ok(ai.data.data.text.includes('TUTOR'));
    console.log('  ✓ POST /api/ai/chat [200 OK, generated valid maritime intelligence]');

    console.log('\n🎉 All HTTP Integration tests passed successfully!');
    process.exit(0);
  } finally {
    server.close();
  }
}

runHttpTests().catch((err) => {
  console.error('HTTP Test failure:', err);
  process.exit(1);
});

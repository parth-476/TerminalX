import { strict as assert } from 'node:assert';
import { FREIGHT_LANES, MAJOR_PORTS, LIVE_VESSELS_SEED } from '../src/data/freightData';
import { mlForecastFreight } from '../src/utils/mlFreightEngine';
import { validateFreightModels } from '../src/utils/modelValidationEngine';
import { forecastPortCongestion } from '../src/utils/congestionPredictionEngine';
import { buildCharterRecommendation } from '../src/utils/charterEngine';
import { buildProcurementRecommendation } from '../src/utils/procurementEngine';
import { buildIntegratedDecision } from '../src/utils/integratedDecisionEngine';
import { optimizeRoutes } from '../src/utils/routeOptimizationEngine';
import { demoVesselFeed, normalizeVesselFeed } from '../src/utils/vesselDataAdapter';

const lane = FREIGHT_LANES.find(item => (item.historicalRates?.length ?? 0) >= 4);
assert.ok(lane, 'fixture dataset should include a lane with enough history');

const forecast = mlForecastFreight(lane, MAJOR_PORTS, LIVE_VESSELS_SEED);
for (const [label, value] of [
  ['currentRate', forecast.currentRate],
  ['forecast7d', forecast.forecast7d],
  ['forecast14d', forecast.forecast14d],
  ['forecast30d', forecast.forecast30d],
  ['change30dPct', forecast.change30dPct],
  ['volatilityPct', forecast.volatilityPct]
] as const) {
  assert.ok(Number.isFinite(value), `forecast ${label} should be finite`);
}
assert.ok(forecast.forecast7d >= 0 && forecast.forecast14d >= 0 && forecast.forecast30d >= 0, 'freight forecasts should not be negative');
assert.ok(forecast.confidence >= 35 && forecast.confidence <= 70, 'stability score should remain in its documented heuristic range');

const validation = validateFreightModels(lane, MAJOR_PORTS, LIVE_VESSELS_SEED);
assert.equal(validation.length, 2, 'only runtime and baseline models with actual measurements should be reported');
assert.ok(validation.every(row => row.samples > 0 && Number.isFinite(row.mae) && Number.isFinite(row.rmse) && Number.isFinite(row.mape)), 'validation metrics should be finite and measured');

const portForecast = forecastPortCongestion(MAJOR_PORTS[0]);
assert.ok(portForecast.forecast7d >= 0 && portForecast.forecast7d <= 100, '7-day congestion should be bounded');
assert.ok(portForecast.forecast14d >= 0 && portForecast.forecast14d <= 100, '14-day congestion should be bounded');
assert.ok(Number.isFinite(portForecast.delayDays), 'indicative delay should be finite');

const charter = buildCharterRecommendation({ laneId: lane.id, cargoType: lane.type, quantityMt: 50000, laycanDays: 14 }, FREIGHT_LANES, MAJOR_PORTS, LIVE_VESSELS_SEED);
assert.ok(charter, 'charter engine should return a recommendation for a known lane');
assert.ok(['FIX NOW', 'WAIT', 'WATCH'].includes(charter.decision), 'charter action should be recognized');
assert.ok(charter.matches.length <= 5, 'charter engine should cap ranked matches');

const procurement = buildProcurementRecommendation('ALL', 50000, FREIGHT_LANES, MAJOR_PORTS);
assert.equal(procurement.targetQuantityMt, 50000, 'procurement should preserve the requested quantity');
assert.equal(procurement.buyNowQuantityMt + procurement.waitQuantityMt, procurement.targetQuantityMt, 'procurement quantities should reconcile');

const integrated = buildIntegratedDecision(lane, MAJOR_PORTS, LIVE_VESSELS_SEED, 50000, 14);
assert.ok(integrated.score >= 0 && integrated.score <= 100, 'integrated decision score should be bounded');
assert.ok(['FIX NOW', 'SPLIT', 'WAIT', 'WATCH'].includes(integrated.action), 'integrated action should be recognized');
assert.ok(integrated.explanation.length > 0, 'integrated decision should include an explanation');

const route = optimizeRoutes(lane, FREIGHT_LANES, MAJOR_PORTS);
assert.ok(route.recommended && Number.isFinite(route.recommended.totalCostProxy), 'route optimizer should return a finite recommendation');

assert.equal(demoVesselFeed(LIVE_VESSELS_SEED).status.mode, 'DEMO', 'repository vessel fixtures must be marked demo');
const normalized = normalizeVesselFeed({ vessels: [{ id: 'test-vessel', name: 'TEST VESSEL', lat: 1, lon: 2, dwt: 10000, type: 'DRY_BULK' }] });
assert.ok(normalized && normalized.status.mode === 'LIVE', 'valid external vessel payload should normalize as live');
assert.equal(normalizeVesselFeed({ vessels: [] }), null, 'empty provider payload should not be treated as a live feed');

console.log('TerminalX engine smoke tests passed.');

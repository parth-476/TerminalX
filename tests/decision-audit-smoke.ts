import { strict as assert } from 'node:assert';
import { FREIGHT_LANES, MAJOR_PORTS, LIVE_VESSELS_SEED } from '../src/data/freightData';
import { buildIntegratedDecision } from '../src/utils/integratedDecisionEngine';
import { buildDecisionAudit } from '../src/utils/decisionAuditEngine';

const lane = FREIGHT_LANES.find(item => (item.historicalRates?.length ?? 0) >= 4);
assert.ok(lane, 'audit test requires a lane with history');
const decision = buildIntegratedDecision(lane, MAJOR_PORTS, LIVE_VESSELS_SEED, 50000, 14);
const audit = buildDecisionAudit(lane, MAJOR_PORTS, LIVE_VESSELS_SEED, 50000, 14, decision);
assert.equal(audit.status, 'REVIEW REQUIRED', 'valid prototype inputs still require human review');
assert.equal(audit.blockingCount, 0, 'valid fixture inputs should not be blocked');
assert.ok(audit.warningCount >= 2, 'synthetic provenance and heuristic model warnings must be visible');
assert.ok(audit.checks.some(check => check.id === 'execution'), 'audit must state the execution boundary');

const invalid = buildDecisionAudit(lane, MAJOR_PORTS, LIVE_VESSELS_SEED, Number.NaN, -1, decision);
assert.equal(invalid.status, 'INPUTS BLOCKED', 'invalid cargo and laycan must block review');
assert.equal(invalid.blockingCount, 2, 'quantity and laycan should each produce a blocking check');

console.log('TerminalX decision audit tests passed.');

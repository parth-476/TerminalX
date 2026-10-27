import type { FreightLane, Port, Vessel } from '../types';
import type { IntegratedDecision } from './integratedDecisionEngine';

export type AuditSeverity = 'INFO' | 'WARN' | 'BLOCK';
export interface DecisionAuditCheck {
  id: string;
  label: string;
  severity: AuditSeverity;
  detail: string;
}
export interface DecisionAudit {
  status: 'REVIEW REQUIRED' | 'INPUTS BLOCKED';
  checks: DecisionAuditCheck[];
  blockingCount: number;
  warningCount: number;
}

/**
 * Audits a prototype recommendation before a human reviews it.
 * This is a data/input sanity check, not a regulatory or execution approval.
 */
export function buildDecisionAudit(
  lane: FreightLane,
  ports: Port[],
  vessels: Vessel[],
  quantityMt: number,
  laycanDays: number,
  decision: IntegratedDecision
): DecisionAudit {
  const checks: DecisionAuditCheck[] = [];
  const add = (id: string, label: string, severity: AuditSeverity, detail: string) =>
    checks.push({ id, label, severity, detail });

  const validQuantity = Number.isFinite(quantityMt) && quantityMt > 0;
  add('quantity', 'Cargo quantity', validQuantity ? 'INFO' : 'BLOCK',
    validQuantity ? `${quantityMt.toLocaleString()} MT requested.` : 'Enter a finite cargo quantity greater than zero.');

  const validLaycan = Number.isFinite(laycanDays) && laycanDays >= 0;
  add('laycan', 'Laycan window', validLaycan ? 'INFO' : 'BLOCK',
    validLaycan ? `${laycanDays} days supplied to the vessel screen.` : 'Laycan must be a finite number of days and cannot be negative.');

  const validRate = Number.isFinite(lane.currentRateUsd) && lane.currentRateUsd > 0;
  add('rate', 'Current freight input', validRate ? 'INFO' : 'BLOCK',
    validRate ? `Rate input is positive (${lane.rateUnit}); confirm it against a current broker or licensed market quote.` : 'Current freight rate is missing, invalid, or non-positive.');

  const historyCount = (lane.historicalRates ?? []).filter(point => Number.isFinite(Number(point.rate)) && Number(point.rate) > 0).length;
  add('history', 'Freight history', historyCount >= 4 ? 'INFO' : 'WARN',
    historyCount >= 4 ? `${historyCount} usable historical points; prototype fit metrics are not out-of-sample accuracy.` : `Only ${historyCount} usable historical points; forecast stability is especially uncertain.`);

  const destination = ports.find(port => port.code === lane.destinationPort || port.name.toLowerCase().includes(lane.destinationPort.toLowerCase()));
  add('port', 'Destination port', destination ? 'INFO' : 'WARN',
    destination ? `${destination.name} is matched to the destination lane.` : 'No destination port record matched; congestion uses a fallback estimate.');

  const validVessels = vessels.filter(vessel =>
    Number.isFinite(vessel.dwt) && vessel.dwt > 0 &&
    Number.isFinite(vessel.lat) && Number.isFinite(vessel.lon) &&
    vessel.lat >= -90 && vessel.lat <= 90 && vessel.lon >= -180 && vessel.lon <= 180
  );
  const screenedMatches = decision.vessels.filter(match => validVessels.some(vessel => vessel.id === match.vessel.id));
  add('vessel', 'Vessel candidate data', screenedMatches.length ? 'INFO' : 'WARN',
    screenedMatches.length ? `${screenedMatches.length} ranked candidate(s) have basic capacity and position fields.` : 'No ranked vessel passed the basic data check; do not infer vessel availability.');

  add('provenance', 'Data provenance', 'WARN',
    'Freight and port fixtures are synthetic/demo inputs. Verify live freight quotes, port conditions, vessel identity, ETA and draft before operational decisions.');

  add('model', 'Forecast interpretation', 'WARN',
    `Stability score ${Math.round(decision.forecast.confidence)}/100 is heuristic, not calibrated probability. Model-fit metrics are not a guarantee of future performance.`);

  add('execution', 'Execution boundary', 'INFO',
    `Suggested action: ${decision.action}. TerminalX provides decision support only; this audit does not execute a charter, purchase, trade or booking.`);

  const blockingCount = checks.filter(check => check.severity === 'BLOCK').length;
  const warningCount = checks.filter(check => check.severity === 'WARN').length;
  return {
    status: blockingCount ? 'INPUTS BLOCKED' : 'REVIEW REQUIRED',
    checks,
    blockingCount,
    warningCount
  };
}

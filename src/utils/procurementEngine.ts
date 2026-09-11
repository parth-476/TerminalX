import { FreightLane, Port, Vessel } from '../types';
import { mlForecastFreight } from './mlFreightEngine';

export type ProcurementAction = 'BUY NOW' | 'WAIT' | 'SPLIT PROCUREMENT';

export interface ProcurementOption {
  lane: FreightLane;
  originPort?: Port;
  destinationPort?: Port;
  freightPerUnit: number;
  estimatedFreightCost: number;
  estimatedLandedFreightCost: number;
  transitDays: number;
  congestionRisk: number;
  forecastChangePct: number;
  score: number;
  reasons: string[];
}

export interface ProcurementRecommendation {
  action: ProcurementAction;
  targetQuantityMt: number;
  options: ProcurementOption[];
  buyNowQuantityMt: number;
  waitQuantityMt: number;
  rationale: string[];
}

const findPort = (ports: Port[], reference: string): Port | undefined => {
  const target = reference.toLowerCase().trim();
  return ports.find(port => port.code.toLowerCase() === target || port.name.toLowerCase() === target || port.name.toLowerCase().includes(target) || target.includes(port.name.toLowerCase().split(' (')[0]));
};

export function buildProcurementRecommendation(cargoType: string, quantityMt: number, freightLanes: FreightLane[], ports: Port[], destinationPortName?: string): ProcurementRecommendation {
  const safeQty = Math.max(1000, quantityMt || 0);
  const candidates = freightLanes.filter(lane => {
    const type = lane.type.toUpperCase();
    const cargo = cargoType.toUpperCase();
    return cargo === 'ALL' || type.includes(cargo) || (cargo === 'RAW MATERIAL' && (type.includes('DRY') || type.includes('CRUDE')));
  });
  const options = candidates.map(lane => {
    const originPort = findPort(ports, lane.originPort);
    const destinationPort = findPort(ports, destinationPortName ?? lane.destinationPort);
    const forecast = mlForecastFreight(lane, ports);
    const destinationCongestion = destinationPort?.congestionScore ?? 50;
    const congestionRisk = Math.round(lane.congestionIndex * 0.65 + destinationCongestion * 0.35);
    const freightPerUnit = lane.currentRateUsd;
    const estimatedFreightCost = freightPerUnit * safeQty;
    const portAdjustmentPerTon = destinationCongestion * 0.012;
    const estimatedLandedFreightCost = (freightPerUnit + portAdjustmentPerTon) * safeQty;
    const forecastPenalty = Math.min(30, Math.max(-20, forecast.change30dPct));
    const congestionPenalty = congestionRisk * 0.35;
    const transitPenalty = Math.min(25, lane.transitDays * 0.35);
    const score = Math.max(0, Math.min(100, 100 - congestionPenalty - transitPenalty - forecastPenalty));
    const reasons = [`ML freight ${forecast.direction === 'UP' ? 'rising' : forecast.direction === 'DOWN' ? 'falling' : 'flat'} ${Math.abs(forecast.change30dPct).toFixed(1)}% over 30D`, `Model confidence ${forecast.confidence.toFixed(0)}%`, `Congestion ${congestionRisk}/100`, `${lane.transitDays} day transit`];
    if (originPort) reasons.push(`Origin wait ${originPort.avgWaitDays.toFixed(1)}d`);
    if (destinationPort) reasons.push(`Destination wait ${destinationPort.avgWaitDays.toFixed(1)}d`);
    return { lane, originPort, destinationPort, freightPerUnit, estimatedFreightCost, estimatedLandedFreightCost, transitDays: lane.transitDays, congestionRisk, forecastChangePct: forecast.change30dPct, score, reasons };
  }).sort((a, b) => b.score - a.score);
  const top = options[0];
  const second = options[1];
  const rising = top ? top.forecastChangePct > 2 : false;
  const falling = top ? top.forecastChangePct < -2 : false;
  const highRisk = top ? top.congestionRisk >= 70 : false;
  const closeAlternatives = Boolean(second && Math.abs(top.score - second.score) < 10);
  let action: ProcurementAction = 'WAIT';
  if (top && (rising || highRisk)) action = closeAlternatives ? 'SPLIT PROCUREMENT' : 'BUY NOW';
  else if (top && falling) action = 'WAIT';
  const buyNowQuantityMt = action === 'BUY NOW' ? safeQty : action === 'SPLIT PROCUREMENT' ? Math.round(safeQty * 0.6) : 0;
  const waitQuantityMt = safeQty - buyNowQuantityMt;
  const rationale = top ? [`Best origin/route: ${top.lane.originPort} → ${top.lane.destinationPort} with decision score ${Math.round(top.score)}/100.`, `ML forecast signal: ${top.forecastChangePct >= 0 ? '+' : ''}${top.forecastChangePct.toFixed(1)}%; congestion risk ${top.congestionRisk}/100.`, action === 'BUY NOW' ? 'Secure the requirement now because ML freight and/or operational risk is trending against the buyer.' : action === 'SPLIT PROCUREMENT' ? 'Lock a core volume now while preserving optionality across the next procurement window.' : 'Preserve optionality while the ML signal points to softer freight conditions.'] : ['No compatible freight lane exists in the current repository dataset.'];
  return { action, targetQuantityMt: safeQty, options, buyNowQuantityMt, waitQuantityMt, rationale };
}

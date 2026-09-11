import { FreightLane, Port } from '../types';
import { mlForecastFreight } from './mlFreightEngine';
export type ProcurementAction = 'BUY NOW' | 'WAIT' | 'SPLIT PROCUREMENT';
export interface ProcurementOption { lane: FreightLane; originPort?: Port; destinationPort?: Port; freightPerUnit: number; estimatedFreightCost: number; estimatedLandedFreightCost: number; transitDays: number; congestionRisk: number; forecastChangePct: number; score: number; reasons: string[]; }
export interface ProcurementRecommendation { action: ProcurementAction; targetQuantityMt: number; options: ProcurementOption[]; buyNowQuantityMt: number; waitQuantityMt: number; rationale: string[]; }

export function buildProcurementRecommendation(cargoType: string, quantityMt: number, freightLanes: FreightLane[], ports: Port[], destinationPortName?: string): ProcurementRecommendation {
  const safeQty = Math.max(1000, quantityMt || 0);
  const candidates = freightLanes.filter(lane => { const type = lane.type.toUpperCase(); const cargo = cargoType.toUpperCase(); return cargo === 'ALL' || type.includes(cargo) || (cargo === 'RAW MATERIAL' && (type.includes('DRY') || type.includes('CRUDE'))); });
  const options = candidates.map(lane => {
    const originPort = ports.find(p => p.name.toLowerCase().includes(lane.originPort.toLowerCase().split(' ')[0]));
    const destinationPort = destinationPortName ? ports.find(p => p.name.toLowerCase().includes(destinationPortName.toLowerCase().split(' ')[0])) : ports.find(p => p.name.toLowerCase().includes(lane.destinationPort.toLowerCase().split(' ')[0]));
    const forecast = mlForecastFreight(lane, ports, []);
    const destinationCongestion = destinationPort?.congestionScore ?? 50;
    const congestionRisk = Math.round(lane.congestionIndex * 0.65 + destinationCongestion * 0.35);
    const freightPerUnit = lane.currentRateUsd;
    const estimatedFreightCost = freightPerUnit * safeQty;
    const estimatedLandedFreightCost = estimatedFreightCost * (1 + destinationCongestion / 1000);
    const forecastPenalty = Math.min(30, Math.max(-20, forecast.change30dPct));
    const congestionPenalty = congestionRisk * 0.35;
    const transitPenalty = Math.min(25, lane.transitDays * 0.35);
    const supplyPenalty = Math.max(0, 20 - lane.activeVessels) * 0.4;
    const score = Math.max(0, Math.min(100, 100 - congestionPenalty - transitPenalty - forecastPenalty - supplyPenalty));
    const reasons = [`ML freight forecast ${forecast.change30dPct >= 0 ? 'rising' : 'falling'} ${Math.abs(forecast.change30dPct).toFixed(1)}%`, `Congestion ${congestionRisk}/100`, `${lane.transitDays} day transit`, `Forecast confidence ${forecast.confidence.toFixed(0)}%`];
    if (originPort) reasons.push(`Origin wait ${originPort.avgWaitDays.toFixed(1)}d`);
    return { lane, originPort, destinationPort, freightPerUnit, estimatedFreightCost, estimatedLandedFreightCost, transitDays: lane.transitDays, congestionRisk, forecastChangePct: forecast.change30dPct, score, reasons };
  }).sort((a,b)=>b.score-a.score);
  const top = options[0], second = options[1];
  const rising = !!top && top.forecastChangePct > 2, falling = !!top && top.forecastChangePct < -2, highRisk = !!top && top.congestionRisk >= 70;
  const closeAlternatives = !!second && Math.abs(top.score - second.score) < 10;
  let action: ProcurementAction = 'WAIT'; if (top && (rising || highRisk)) action = closeAlternatives ? 'SPLIT PROCUREMENT' : 'BUY NOW'; else if (top && falling) action = 'WAIT';
  const buyNowQuantityMt = action === 'BUY NOW' ? safeQty : action === 'SPLIT PROCUREMENT' ? Math.round(safeQty * 0.6) : 0;
  const waitQuantityMt = safeQty - buyNowQuantityMt;
  const rationale = top ? [`Best route: ${top.lane.originPort} → ${top.lane.destinationPort}, score ${Math.round(top.score)}/100.`, `ML 30D signal: ${top.forecastChangePct >= 0 ? '+' : ''}${top.forecastChangePct.toFixed(1)}%; confidence ${mlForecastFreight(top.lane, ports, []).confidence.toFixed(0)}%.`, `Operational risk: ${top.congestionRisk}/100 congestion with ${top.lane.activeVessels} active vessels.`, action === 'BUY NOW' ? 'Secure volume now because forecast/operational risk is moving against the buyer.' : action === 'SPLIT PROCUREMENT' ? 'Lock core volume now while preserving optionality across the next window.' : 'Preserve optionality while the ML baseline points to softer freight conditions.'] : ['No compatible freight lane exists in the current repository dataset.'];
  return { action, targetQuantityMt: safeQty, options, buyNowQuantityMt, waitQuantityMt, rationale };
}

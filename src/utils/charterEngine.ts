import { FreightLane, Port, Vessel } from '../types';
import { mlForecastFreight, MLForecastResult } from './mlFreightEngine';

export interface CharterRequest { laneId: string; cargoType: FreightLane['type']; quantityMt: number; laycanDays: number; }
export interface VesselMatch { vessel: Vessel; score: number; capacityFit: number; timingFit: number; portFit: number; riskScore: number; reasons: string[]; }
export interface CharterRecommendation { request: CharterRequest; lane: FreightLane; forecast: MLForecastResult; originPort?: Port; destinationPort?: Port; matches: VesselMatch[]; congestionRisk: number; decision: 'FIX NOW' | 'WAIT' | 'WATCH'; rationale: string[]; }

const vesselTypeForLane: Record<FreightLane['type'], Vessel['type']> = { DRY_BULK: 'DRY_BULK', CRUDE: 'CRUDE_TANKER', LNG: 'LNG_CARRIER', CONTAINER: 'CONTAINER' };
const etaDays = (vessel: Vessel) => { const parsed = Date.parse(vessel.eta.replace(' UTC', 'Z')); return Number.isFinite(parsed) ? Math.max(0, (parsed - Date.now()) / 86400000) : Math.max(0, vessel.congestionWaitHours / 24); };

export function buildCharterRecommendation(request: CharterRequest, lanes: FreightLane[], ports: Port[], vessels: Vessel[]): CharterRecommendation | null {
  const lane = lanes.find(item => item.id === request.laneId);
  if (!lane) return null;
  const forecast = mlForecastFreight(lane, ports, vessels);
  const originPort = ports.find(port => port.code === lane.originPort);
  const destinationPort = ports.find(port => port.code === lane.destinationPort);
  const requiredDwt = Math.max(request.quantityMt * 1.08, 1);
  const targetType = vesselTypeForLane[request.cargoType];
  const congestionRisk = Math.round((lane.congestionIndex * 0.65) + ((destinationPort?.congestionScore ?? 50) * 0.35));
  const matches = vessels.filter(vessel => vessel.type === targetType).map(vessel => {
    const capacityFit = Math.min(100, (vessel.dwt / requiredDwt) * 100);
    const eta = etaDays(vessel);
    const timingFit = eta <= request.laycanDays ? Math.max(20, 100 - eta * 5) : Math.max(0, 100 - (eta - request.laycanDays) * 12);
    const portFit = Math.max(0, 100 - congestionRisk * 0.65 - Math.abs((vessel.draftM || 0) - (destinationPort ? 12 : 10)) * 3);
    const riskScore = vessel.riskAlert ? 45 : 85;
    const score = Math.round(capacityFit * 0.4 + timingFit * 0.25 + portFit * 0.2 + riskScore * 0.15);
    const reasons: string[] = [];
    if (capacityFit >= 100) reasons.push('capacity covers cargo + margin'); else reasons.push(`capacity below ideal (${Math.round(capacityFit)}%)`);
    if (timingFit >= 75) reasons.push(`ETA ${eta.toFixed(1)}d fits laycan`); else reasons.push(`ETA ${eta.toFixed(1)}d pressures laycan`);
    if (vessel.congestionWaitHours > 48) reasons.push(`${Math.round(vessel.congestionWaitHours)}h congestion wait`);
    if (vessel.riskAlert) reasons.push(`risk: ${vessel.riskAlert}`);
    return { vessel, score, capacityFit, timingFit, portFit, riskScore, reasons };
  }).filter(match => match.capacityFit >= 70).sort((a, b) => b.score - a.score).slice(0, 5);
  const decision: CharterRecommendation['decision'] = forecast.direction === 'UP' && congestionRisk >= 65 ? 'FIX NOW' : forecast.direction === 'DOWN' && congestionRisk < 70 ? 'WAIT' : 'WATCH';
  const rationale = [`${lane.code} ML freight model: ${forecast.direction} (${forecast.change30dPct >= 0 ? '+' : ''}${forecast.change30dPct.toFixed(1)}% over 30D).`, `Model confidence: ${forecast.confidence.toFixed(0)}%; volatility: ${forecast.volatilityPct.toFixed(1)}%.`, `Combined route/port congestion risk: ${congestionRisk}/100.`, matches.length ? `${matches[0].vessel.name} ranks first at ${matches[0].score}/100.` : 'No vessel currently meets the capacity screen.'];
  return { request, lane, forecast, originPort, destinationPort, matches, congestionRisk, decision, rationale };
}

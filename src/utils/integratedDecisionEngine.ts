import { FreightLane, Port, Vessel } from '../types';
import { mlForecastFreight } from './mlFreightEngine';
import { buildProcurementRecommendation } from './procurementEngine';
import { screenVessels } from './vesselScreeningEngine';
import { forecastPortCongestion } from './congestionPredictionEngine';

export interface IntegratedDecision {
  action: 'FIX NOW' | 'SPLIT' | 'WAIT' | 'WATCH';
  confidence: number;
  forecast: ReturnType<typeof mlForecastFreight>;
  congestion: ReturnType<typeof forecastPortCongestion>;
  vessels: ReturnType<typeof screenVessels>;
  procurement: ReturnType<typeof buildProcurementRecommendation>;
  score: number;
  factors: { label: string; value: number; weight: number; interpretation: string }[];
  explanation: string[];
}

export function buildIntegratedDecision(lane: FreightLane, ports: Port[], vessels: Vessel[], quantityMt: number, laycanDays = 14): IntegratedDecision {
  const forecast = mlForecastFreight(lane, ports, vessels);
  const destination = ports.find(p => p.code === lane.destinationPort) ?? ports.find(p => p.name.toLowerCase().includes(lane.destinationPort.toLowerCase()));
  const congestion = destination ? forecastPortCongestion(destination) : {
    port: { id: 'unknown', name: lane.destinationPort, code: lane.destinationPort, country: 'India', lat: lane.destCoords[1], lon: lane.destCoords[0], throughputTeuM: 0, avgWaitDays: 0, congestionScore: lane.congestionIndex, vesselsAtBerth: 0, vesselsWaiting: 0, bunkerPriceVLSFO: 0, status: 'MODERATE' as const },
    currentScore: lane.congestionIndex, forecast7d: lane.congestionIndex, forecast14d: lane.congestionIndex, direction: 'STABLE' as const, delayDays: lane.transitDays * 0.05, confidence: 55, drivers: [], action: 'Destination port record unavailable.'
  };
  const screened = screenVessels(lane, vessels, quantityMt, laycanDays);
  const procurement = buildProcurementRecommendation(lane.type === 'CRUDE' ? 'CRUDE' : lane.type === 'LNG' ? 'LNG' : 'DRY_BULK', quantityMt, [lane], ports, lane.destinationPort);
  const bestVessel = screened[0];
  const freightPressure = Math.max(-100, Math.min(100, forecast.change30dPct * 8));
  const congestionPressure = (congestion.forecast14d - 50) * 1.1;
  const vesselAvailability = bestVessel ? bestVessel.score - 60 : -40;
  const procurementPressure = procurement.action === 'BUY NOW' ? 35 : procurement.action === 'SPLIT PROCUREMENT' ? 15 : -20;
  const score = Math.max(0, Math.min(100, 50 + freightPressure * 0.35 + congestionPressure * 0.25 + vesselAvailability * 0.2 + procurementPressure * 0.2));
  const action: IntegratedDecision['action'] = score >= 72 ? 'FIX NOW' : score >= 58 ? 'SPLIT' : score <= 40 ? 'WAIT' : 'WATCH';
  const factors = [
    { label: 'Freight momentum', value: freightPressure, weight: 35, interpretation: forecast.direction === 'UP' ? 'Rising freight increases urgency.' : forecast.direction === 'DOWN' ? 'Falling freight supports waiting.' : 'Freight is near neutral.' },
    { label: 'Port congestion', value: congestionPressure, weight: 25, interpretation: congestion.forecast14d >= 70 ? 'Delay risk is elevated.' : 'Port risk remains manageable.' },
    { label: 'Vessel availability', value: vesselAvailability, weight: 20, interpretation: bestVessel ? `${bestVessel.vessel.name} screens at ${bestVessel.score.toFixed(0)}/100.` : 'No suitable vessel match.' },
    { label: 'Procurement signal', value: procurementPressure, weight: 20, interpretation: `Procurement engine says ${procurement.action}.` }
  ];
  const explanation = [
    `Integrated score ${score.toFixed(0)}/100 combines freight direction, destination congestion, vessel fit and procurement timing.`,
    `Freight: ${forecast.direction} ${forecast.change30dPct >= 0 ? '+' : ''}${forecast.change30dPct.toFixed(1)}% over 30D at ${forecast.confidence.toFixed(0)}% model confidence.`,
    `Port: ${congestion.port.code} projected at ${congestion.forecast14d.toFixed(0)}/100 congestion with ${congestion.delayDays.toFixed(1)}d indicative delay.`,
    bestVessel ? `Vessel: ${bestVessel.vessel.name} is the highest screened match at ${bestVessel.score.toFixed(0)}/100.` : 'Vessel: no feasible candidate cleared the screening.',
    `Action: ${action}. This is deterministic decision support, not an executed charter or procurement instruction.`
  ];
  return { action, confidence: Math.round((forecast.confidence + congestion.confidence + (bestVessel?.score ?? 50)) / 3), forecast, congestion, vessels: screened, procurement, score, factors, explanation };
}

import { FreightLane, Vessel, VesselType } from '../types';

export interface VesselScreenResult {
  vessel: Vessel;
  score: number;
  capacityFit: number;
  routeFit: number;
  timingFit: number;
  portFit: number;
  riskPenalty: number;
  recommendation: 'PREFERRED' | 'ALTERNATE' | 'REJECT';
  rationale: string[];
}

const cargoType = (lane: FreightLane): VesselType => lane.type === 'DRY_BULK' ? 'DRY_BULK' : lane.type === 'CRUDE' ? 'CRUDE_TANKER' : 'CONTAINER';

export function screenVessels(lane: FreightLane, vessels: Vessel[], quantityMt: number, laycanDays = 14): VesselScreenResult[] {
  const requiredDwt = quantityMt * 1.08;
  const desiredType = cargoType(lane);
  return vessels.map(vessel => {
    const capacityFit = vessel.type === desiredType ? (vessel.dwt >= requiredDwt ? 100 : Math.max(0, vessel.dwt / requiredDwt * 100)) : 0;
    const routeFit = vessel.destinationPort === lane.destinationPort ? 100 : vessel.currentLaneId === lane.id ? 90 : vessel.originPort === lane.originPort ? 65 : 25;
    const etaDays = vessel.congestionWaitHours / 24;
    const timingFit = etaDays <= laycanDays ? Math.max(20, 100 - etaDays * 5) : Math.max(0, 100 - (etaDays - laycanDays) * 12);
    const portFit = vessel.draftM <= vessel.maxDraftM && vessel.draftM <= 18 ? 100 : 35;
    const riskPenalty = (vessel.riskAlert ? 25 : 0) + Math.min(20, vessel.congestionWaitHours * 0.25);
    const score = Math.max(0, Math.min(100, capacityFit * 0.35 + routeFit * 0.25 + timingFit * 0.20 + portFit * 0.20 - riskPenalty));
    const rationale: string[] = [];
    if (vessel.type === desiredType) rationale.push(`Cargo-compatible ${desiredType.replace('_', ' ').toLowerCase()}`); else rationale.push('Vessel type mismatch');
    if (vessel.dwt >= requiredDwt) rationale.push(`Capacity clears ${Math.round(requiredDwt).toLocaleString()} DWT requirement`); else rationale.push(`Below ${Math.round(requiredDwt).toLocaleString()} DWT requirement`);
    if (vessel.destinationPort === lane.destinationPort) rationale.push('Destination matches selected lane');
    if (vessel.riskAlert) rationale.push(`Risk alert: ${vessel.riskAlert}`); else rationale.push('No active vessel risk alert');
    return { vessel, score, capacityFit, routeFit, timingFit, portFit, riskPenalty, recommendation: score >= 70 ? 'PREFERRED' : score >= 50 ? 'ALTERNATE' : 'REJECT', rationale };
  }).sort((a, b) => b.score - a.score);
}

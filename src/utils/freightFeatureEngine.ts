import { FreightLane, Port, Vessel } from '../types';

export interface FreightFeatures {
  lag1: number;
  lag7: number;
  lag30: number;
  ma7: number;
  ma30: number;
  volatility: number;
  momentum7: number;
  congestion: number;
  vesselSupply: number;
  transitDays: number;
  distanceNm: number;
  activeVessels: number;
  carbonCost: number;
  monthSin: number;
  monthCos: number;
}

const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const std = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map(x => (x - m) ** 2)));
};
const avgLast = (xs: number[], n: number) => mean(xs.slice(Math.max(0, xs.length - n)));

export function engineerFreightFeatures(lane: FreightLane, ports: Port[] = [], vessels: Vessel[] = []): FreightFeatures {
  const rates = (lane.historicalRates ?? []).map(x => Number(x.rate)).filter(Number.isFinite);
  const current = Number(lane.currentRateUsd) || rates.at(-1) || 0;
  const returns = rates.slice(1).map((v, i) => rates[i] ? ((v - rates[i]) / rates[i]) * 100 : 0);
  const month = new Date().getMonth() + 1;
  const relatedVessels = vessels.filter(v => v.currentLaneId === lane.id).length;
  const origin = ports.find(p => p.code === lane.originPort);
  const destination = ports.find(p => p.code === lane.destinationPort);
  const vesselSupply = relatedVessels || lane.activeVessels;
  const monthAngle = (2 * Math.PI * (month - 1)) / 12;
  return {
    lag1: rates.at(-1) ?? current,
    lag7: rates.at(-7) ?? avgLast(rates, 7) || current,
    lag30: rates.at(-30) ?? avgLast(rates, 30) || current,
    ma7: avgLast(rates, 7) || current,
    ma30: avgLast(rates, 30) || current,
    volatility: std(returns),
    momentum7: rates.length > 7 && rates.at(-8) ? ((current - (rates.at(-8) as number)) / (rates.at(-8) as number)) * 100 : 0,
    congestion: (lane.congestionIndex * 0.65) + ((destination?.congestionScore ?? 50) * 0.35),
    vesselSupply,
    transitDays: lane.transitDays,
    distanceNm: lane.distanceNm,
    activeVessels: lane.activeVessels,
    carbonCost: lane.carbonEtsCostEst,
    monthSin: Math.sin(monthAngle),
    monthCos: Math.cos(monthAngle)
  };
}

import { FreightLane, Port, Vessel } from '../types';
import { engineerFreightFeatures } from './freightFeatureEngine';

export interface ModelMetrics { mae: number; rmse: number; mape: number; samples: number; }
export interface MLForecastResult {
  currentRate: number;
  forecast7d: number;
  forecast14d: number;
  forecast30d: number;
  change7dPct: number;
  change14dPct: number;
  change30dPct: number;
  direction: 'UP' | 'DOWN' | 'FLAT';
  confidence: number;
  volatilityPct: number;
  featureContributions: { feature: string; impact: number }[];
  metrics: ModelMetrics;
  modelName: string;
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const solve = (A: number[][], b: number[]) => {
  const n = b.length;
  const m = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-9) continue;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const div = m[col][col];
    for (let j = col; j <= n; j++) m[col][j] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r][col];
      for (let j = col; j <= n; j++) m[r][j] -= f * m[col][j];
    }
  }
  return m.map(row => row[n]);
};

const vectorFor = (lane: FreightLane, ports: Port[], vessels: Vessel[], index: number) => {
  const rates = lane.historicalRates ?? [];
  const sliced = { ...lane, currentRateUsd: Number(rates[index]?.rate ?? lane.currentRateUsd), historicalRates: rates.slice(0, index + 1) };
  const f = engineerFreightFeatures(sliced, ports, vessels);
  return [1, f.lag1, f.ma7, f.ma30, f.momentum7, f.volatility, f.congestion, f.vesselSupply, f.transitDays, f.carbonCost, f.monthSin, f.monthCos];
};

function fit(lane: FreightLane, ports: Port[], vessels: Vessel[]) {
  const rates = lane.historicalRates ?? [];
  const rows: number[][] = [];
  const targets: number[] = [];
  for (let i = 1; i < rates.length; i++) {
    const row = vectorFor(lane, ports, vessels, i - 1);
    if (row.every(Number.isFinite) && Number.isFinite(rates[i].rate)) { rows.push(row); targets.push(Number(rates[i].rate)); }
  }
  if (!rows.length) return { weights: [Number(lane.currentRateUsd)], metrics: { mae: 0, rmse: 0, mape: 0, samples: 0 } as ModelMetrics };
  const p = rows[0].length;
  const XTX = Array.from({ length: p }, () => Array(p).fill(0));
  const XTy = Array(p).fill(0);
  rows.forEach((row, i) => { for (let a = 0; a < p; a++) { XTy[a] += row[a] * targets[i]; for (let b = 0; b < p; b++) XTX[a][b] += row[a] * row[b]; } });
  for (let i = 0; i < p; i++) XTX[i][i] += i === 0 ? 1e-3 : 0.1;
  const weights = solve(XTX, XTy);
  const errors = rows.map((row, i) => targets[i] - row.reduce((s, x, j) => s + x * weights[j], 0));
  const mae = mean(errors.map(Math.abs));
  const rmse = Math.sqrt(mean(errors.map(x => x * x)));
  const mape = mean(errors.map((e, i) => targets[i] ? Math.abs(e / targets[i]) * 100 : 0));
  return { weights, metrics: { mae, rmse, mape, samples: rows.length } };
}

export function mlForecastFreight(lane: FreightLane, ports: Port[] = [], vessels: Vessel[] = []): MLForecastResult {
  const current = Number(lane.currentRateUsd) || 0;
  const fitted = fit(lane, ports, vessels);
  const predict = (days: number) => {
    const base = engineerFreightFeatures(lane, ports, vessels);
    const x = [1, base.lag1, base.ma7, base.ma30, base.momentum7, base.volatility, base.congestion, base.vesselSupply, base.transitDays, base.carbonCost, base.monthSin, base.monthCos];
    const raw = x.reduce((s, v, i) => s + v * (fitted.weights[i] ?? 0), 0);
    const momentum = base.momentum7 / 7;
    const congestionPressure = (base.congestion - 50) * 0.0025 * current;
    const horizonFactor = days / 30;
    return Math.max(0, current * 0.55 + raw * 0.35 + (current * momentum * horizonFactor) + (congestionPressure * horizonFactor));
  };
  const forecast7d = predict(7), forecast14d = predict(14), forecast30d = predict(30);
  const change30dPct = current ? ((forecast30d - current) / current) * 100 : 0;
  const returns = (lane.historicalRates ?? []).slice(1).map((x, i) => { const prev = lane.historicalRates[i].rate; return prev ? ((x.rate - prev) / prev) * 100 : 0; });
  const volatilityPct = Math.sqrt(mean(returns.map(x => x * x)));
  const confidence = clamp(92 - fitted.metrics.mape * 1.8 - volatilityPct * 1.2 + Math.min(fitted.metrics.samples, 30) * 0.15, 45, 94);
  const direction = change30dPct > 1.5 ? 'UP' : change30dPct < -1.5 ? 'DOWN' : 'FLAT';
  const features = engineerFreightFeatures(lane, ports, vessels);
  const featureContributions = [
    { feature: '7D momentum', impact: lane.currentRateUsd ? features.momentum7 * 0.35 : 0 },
    { feature: 'Port/route congestion', impact: (features.congestion - 50) * 0.25 },
    { feature: 'Vessel supply', impact: -Math.max(0, features.vesselSupply - 10) * 0.2 },
    { feature: 'Seasonality', impact: features.monthSin * 2 }
  ];
  return { currentRate: current, forecast7d, forecast14d, forecast30d, change7dPct: current ? ((forecast7d - current) / current) * 100 : 0, change14dPct: current ? ((forecast14d - current) / current) * 100 : 0, change30dPct, direction, confidence, volatilityPct, featureContributions, metrics: fitted.metrics, modelName: 'Regularized Freight Regression v1' };
}

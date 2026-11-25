import { FreightLane } from '../types';

export interface FreightForecastPoint {
  date: string;
  actual?: number;
  forecast?: number;
}

export interface FreightForecastResult {
  laneId: string;
  currentRate: number;
  forecastRate: number;
  changePct: number;
  direction: 'UP' | 'DOWN' | 'FLAT';
  confidence: number;
  volatilityPct: number;
  trendSlope: number;
  points: FreightForecastPoint[];
}

/**
 * Baseline forecasting model for the prototype.
 * Uses least-squares linear trend on the lane's historical freight series,
 * damped toward the latest observation so short histories do not explode.
 */
export function forecastFreight(lane: FreightLane, horizonDays = 30): FreightForecastResult {
  const history = lane.historicalRates ?? [];
  const values = history.map(point => Number(point.rate)).filter(Number.isFinite);
  const currentRate = Number(lane.currentRateUsd) || values.at(-1) || 0;

  if (values.length < 2) {
    return {
      laneId: lane.id,
      currentRate,
      forecastRate: currentRate,
      changePct: 0,
      direction: 'FLAT',
      confidence: 35,
      volatilityPct: 0,
      trendSlope: 0,
      points: history.map(point => ({ date: point.date, actual: point.rate }))
    };
  }

  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / n;
  let numerator = 0;
  let denominator = 0;

  values.forEach((value, index) => {
    numerator += (index - meanX) * (value - meanY);
    denominator += (index - meanX) ** 2;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const rawForecast = values[n - 1] + slope * Math.min(horizonDays, 30);
  const forecastRate = Math.max(0, currentRate * 0.45 + rawForecast * 0.55);

  const returns = values.slice(1).map((value, index) => {
    const previous = values[index];
    return previous === 0 ? 0 : ((value - previous) / previous) * 100;
  });
  const meanReturn = returns.reduce((sum, value) => sum + value, 0) / Math.max(returns.length, 1);
  const variance = returns.reduce((sum, value) => sum + (value - meanReturn) ** 2, 0) / Math.max(returns.length, 1);
  const volatilityPct = Math.sqrt(variance);

  const changePct = currentRate === 0 ? 0 : ((forecastRate - currentRate) / currentRate) * 100;
  const direction: FreightForecastResult['direction'] =
    changePct > 1 ? 'UP' : changePct < -1 ? 'DOWN' : 'FLAT';

  const confidence = Math.max(45, Math.min(92, 86 - volatilityPct * 2.2 + Math.min(values.length, 12) * 0.7));

  const points: FreightForecastPoint[] = history.map(point => ({
    date: point.date,
    actual: point.rate
  }));
  const lastDate = new Date(history.at(-1)?.date ?? new Date().toISOString());
  for (let day = 1; day <= Math.min(horizonDays, 30); day += 5) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + day);
    const projected = Math.max(0, currentRate * 0.45 + (values[n - 1] + slope * day) * 0.55);
    points.push({ date: date.toISOString().slice(0, 10), forecast: projected });
  }

  return {
    laneId: lane.id,
    currentRate,
    forecastRate,
    changePct,
    direction,
    confidence,
    volatilityPct,
    trendSlope: slope,
    points
  };
}

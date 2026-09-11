import { FreightLane, Port, Vessel } from '../types';
import { mlForecastFreight } from './mlFreightEngine';

export interface ValidationMetricRow {
  model: string;
  mae: number;
  rmse: number;
  mape: number;
  directionHitPct: number;
  samples: number;
  status: 'ACTIVE RUNTIME' | 'BASELINE' | 'OFFLINE TRAINER';
}

const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const evaluate = (actual: number[], predicted: number[], previous: number[]) => {
  const errors = actual.map((value, index) => value - predicted[index]);
  const mae = mean(errors.map(Math.abs));
  const rmse = Math.sqrt(mean(errors.map(error => error * error)));
  const mape = mean(actual.map((value, index) => value ? Math.abs((value - predicted[index]) / value) * 100 : 0));
  const directionHits = actual.map((value, index) => {
    const actualDirection = value >= previous[index] ? 1 : -1;
    const predictedDirection = predicted[index] >= previous[index] ? 1 : -1;
    return actualDirection === predictedDirection ? 1 : 0;
  });
  return { mae, rmse, mape, directionHitPct: mean(directionHits) * 100, samples: actual.length };
};

/**
 * Lightweight chronological validation for the browser runtime.
 * It compares the active regression against a naive persistence baseline.
 * The Python pipeline remains the source for Random Forest / Gradient Boosting
 * offline validation when a generated backtest_results.json is available.
 */
export function validateFreightModels(lane: FreightLane, ports: Port[] = [], vessels: Vessel[] = []): ValidationMetricRow[] {
  const rates = (lane.historicalRates ?? []).map(point => Number(point.rate)).filter(Number.isFinite);
  if (rates.length < 4) return [];

  const actual: number[] = [];
  const activePredictions: number[] = [];
  const baselinePredictions: number[] = [];
  const previous: number[] = [];

  for (let i = 1; i < rates.length; i++) {
    const prefixLane = { ...lane, currentRateUsd: rates[i - 1], historicalRates: lane.historicalRates.slice(0, i) };
    const result = mlForecastFreight(prefixLane, ports, vessels);
    actual.push(rates[i]);
    activePredictions.push(result.forecast7d);
    baselinePredictions.push(rates[i - 1]);
    previous.push(rates[i - 1]);
  }

  const active = evaluate(actual, activePredictions, previous);
  const baseline = evaluate(actual, baselinePredictions, previous);
  return [
    { model: 'Regularized Freight Regression v1', ...active, status: 'ACTIVE RUNTIME' },
    { model: 'Naive Persistence Baseline', ...baseline, status: 'BASELINE' },
    { model: 'Gradient Boosting (Python)', mae: 0, rmse: 0, mape: 0, directionHitPct: 0, samples: 0, status: 'OFFLINE TRAINER' },
    { model: 'Random Forest (Python)', mae: 0, rmse: 0, mape: 0, directionHitPct: 0, samples: 0, status: 'OFFLINE TRAINER' }
  ];
}

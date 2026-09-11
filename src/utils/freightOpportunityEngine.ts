import { FreightLane } from '../types';
import { MLForecastResult } from './mlFreightEngine';

export interface FreightOpportunity {
  currentRate: number;
  forecastRate: number;
  quantityMt: number;
  currentFreightUsd: number;
  forecastFreightUsd: number;
  exposureUsd: number;
  opportunityUsd: number;
  direction: 'BUY_NOW' | 'WAIT' | 'NEUTRAL';
  explanation: string;
}

/**
 * Converts the modelled freight move into a decision-support exposure figure.
 * This is not a guaranteed saving: it excludes commodity price, financing,
 * demurrage, execution slippage and other commercial terms.
 */
export function calculateFreightOpportunity(
  lane: FreightLane,
  forecast: MLForecastResult,
  quantityMt: number
): FreightOpportunity {
  const qty = Math.max(0, quantityMt || 0);
  const currentRate = Math.max(0, forecast.currentRate);
  const forecastRate = Math.max(0, forecast.forecast30d);
  const currentFreightUsd = currentRate * qty;
  const forecastFreightUsd = forecastRate * qty;
  const deltaUsd = (forecastRate - currentRate) * qty;
  const rising = forecast.change30dPct > 1.5;
  const falling = forecast.change30dPct < -1.5;
  const direction: FreightOpportunity['direction'] = rising ? 'BUY_NOW' : falling ? 'WAIT' : 'NEUTRAL';
  const opportunityUsd = Math.abs(deltaUsd);

  const explanation = rising
    ? `Modelled 30D freight increase of ${forecast.change30dPct.toFixed(1)}% creates approximately $${opportunityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} of additional freight exposure on ${qty.toLocaleString()} MT if the full volume is delayed.`
    : falling
      ? `Modelled 30D freight reduction of ${Math.abs(forecast.change30dPct).toFixed(1)}% represents approximately $${opportunityUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} of potential freight saving on ${qty.toLocaleString()} MT if the lower rate materialises.`
      : 'Modelled 30D freight movement is within the neutral band; timing advantage is currently limited.';

  return {
    currentRate,
    forecastRate,
    quantityMt: qty,
    currentFreightUsd,
    forecastFreightUsd,
    exposureUsd: Math.max(0, deltaUsd),
    opportunityUsd,
    direction,
    explanation
  };
}

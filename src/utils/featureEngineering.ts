export const FREIGHT_MODEL_FEATURES = [
  'lag1', 'lag7', 'lag30', 'ma7', 'ma30', 'volatility', 'momentum7',
  'route_congestion', 'vessel_supply', 'transit_days', 'distance_nm',
  'carbon_cost', 'month_sin', 'month_cos'
] as const;

export const FREIGHT_MODEL_TARGET = 'next_period_freight_rate';
export const FREIGHT_FORECAST_HORIZONS = [7, 14, 30] as const;

export function describeFeature(feature: string): string {
  const descriptions: Record<string, string> = {
    lag1: 'Latest observed freight rate', lag7: 'Freight rate seven observations back', lag30: 'Freight rate thirty observations back',
    ma7: 'Seven-observation moving average', ma30: 'Thirty-observation moving average', volatility: 'Historical percentage-return volatility',
    momentum7: 'Seven-period rate momentum', route_congestion: 'Weighted route and destination congestion', vessel_supply: 'Available vessels on the lane',
    transit_days: 'Estimated transit duration', distance_nm: 'Route distance in nautical miles', carbon_cost: 'Estimated carbon ETS cost',
    month_sin: 'Cyclical month seasonality component', month_cos: 'Cyclical month seasonality component'
  };
  return descriptions[feature] ?? 'Model input feature';
}

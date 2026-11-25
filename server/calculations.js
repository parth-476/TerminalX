/**
 * Maritime & Freight Calculation Engine
 * 
 * Provides clear, realistic calculations for voyage economics, fuel consumption,
 * route comparisons (e.g., Suez vs Cape of Good Hope), and freight trend metrics.
 * Designed to be clean, modular, and easy to explain.
 */

/**
 * Calculate the Haversine distance between two coordinates in Nautical Miles.
 */
function calculateDistanceNm(lat1, lon1, lat2, lon2) {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Standard vessel performance defaults by type
 */
const VESSEL_DEFAULTS = {
  CONTAINER: {
    avgSpeedKnots: 18.5,
    dailyFuelBurnTons: 65, // VLSFO tons/day at cruising speed
    dailyCharterRate: 35000,
  },
  BULK: {
    avgSpeedKnots: 12.5,
    dailyFuelBurnTons: 32,
    dailyCharterRate: 22000,
  },
  TANKER: {
    avgSpeedKnots: 13.0,
    dailyFuelBurnTons: 48,
    dailyCharterRate: 38000,
  },
  LNG: {
    avgSpeedKnots: 16.0,
    dailyFuelBurnTons: 55,
    dailyCharterRate: 65000,
  },
};

/**
 * Calculate full voyage cost breakdown
 */
function calculateVoyageCost(params) {
  const {
    distanceNm = 8400,
    vesselType = 'CONTAINER',
    speedKnots,
    dailyFuelBurnTons,
    fuelPricePerTon = 628, // Default Singapore VLSFO price $/MT
    dailyCharterRate,
    canalToll = 0,
    portDues = 55000,
    cargoTeuOrTons = 10000,
  } = params;

  const defaults = VESSEL_DEFAULTS[vesselType.toUpperCase()] || VESSEL_DEFAULTS.CONTAINER;

  const effectiveSpeed = Number(speedKnots) || defaults.avgSpeedKnots;
  const effectiveFuelBurn = Number(dailyFuelBurnTons) || defaults.dailyFuelBurnTons;
  const effectiveCharter = Number(dailyCharterRate) || defaults.dailyCharterRate;

  // Transit calculations
  const transitHours = distanceNm / effectiveSpeed;
  const seaDays = Number((transitHours / 24).toFixed(1));

  // Fuel consumption & cost
  const totalFuelTons = Number((seaDays * effectiveFuelBurn).toFixed(1));
  const totalFuelCost = Math.round(totalFuelTons * fuelPricePerTon);

  // Time charter cost
  const totalCharterCost = Math.round(seaDays * effectiveCharter);

  // Environmental: Carbon emissions (IMO standard 3.114 MT CO2 per MT VLSFO)
  const co2EmissionsTons = Number((totalFuelTons * 3.114).toFixed(1));
  // EU ETS Carbon compliance cost (~$85 / ton of CO2)
  const carbonSurcharge = Math.round(co2EmissionsTons * 85 * 0.5); // 50% EU coverage rule

  // Total voyage expense
  const totalVoyageCost = totalFuelCost + totalCharterCost + Number(canalToll) + Number(portDues) + carbonSurcharge;
  const costPerNauticalMile = Number((totalVoyageCost / distanceNm).toFixed(2));
  const costPerDay = Math.round(totalVoyageCost / (seaDays || 1));
  const costPerUnitCargo = Number((totalVoyageCost / (cargoTeuOrTons || 1)).toFixed(2));

  return {
    distanceNm,
    effectiveSpeedKnots: effectiveSpeed,
    seaDays,
    transitHours: Math.round(transitHours),
    fuelBreakdown: {
      dailyBurnTons: effectiveFuelBurn,
      totalFuelTons,
      fuelPricePerTon,
      totalFuelCost,
    },
    charterBreakdown: {
      dailyCharterRate: effectiveCharter,
      totalCharterCost,
    },
    canalToll: Number(canalToll),
    portDues: Number(portDues),
    environmental: {
      co2EmissionsTons,
      carbonSurcharge,
    },
    totalVoyageCost,
    costPerNauticalMile,
    costPerDay,
    costPerUnitCargo,
  };
}

/**
 * Compare two maritime routes (e.g., standard canal vs cape diversion)
 */
function calculateRouteComparison(routeA, routeB, vesselType = 'CONTAINER', fuelPrice = 628) {
  const calcA = calculateVoyageCost({
    distanceNm: routeA.distanceNm,
    vesselType,
    canalToll: routeA.canalToll || 0,
    fuelPricePerTon: fuelPrice,
    portDues: routeA.portDues || 50000,
  });

  const calcB = calculateVoyageCost({
    distanceNm: routeB.distanceNm,
    vesselType,
    canalToll: routeB.canalToll || 0,
    fuelPricePerTon: fuelPrice,
    portDues: routeB.portDues || 50000,
  });

  const distanceDiff = calcB.distanceNm - calcA.distanceNm;
  const daysDiff = Number((calcB.seaDays - calcA.seaDays).toFixed(1));
  const costDiff = calcB.totalVoyageCost - calcA.totalVoyageCost;
  const fuelDiffTons = Number((calcB.fuelBreakdown.totalFuelTons - calcA.fuelBreakdown.totalFuelTons).toFixed(1));
  const co2DiffTons = Number((calcB.environmental.co2EmissionsTons - calcA.environmental.co2EmissionsTons).toFixed(1));

  return {
    routeA: {
      name: routeA.name || 'Standard Route (via Suez / Panama)',
      ...calcA,
      riskLevel: routeA.riskLevel || 'ELEVATED',
    },
    routeB: {
      name: routeB.name || 'Alternative Diversion (via Cape of Good Hope)',
      ...calcB,
      riskLevel: routeB.riskLevel || 'LOW',
    },
    delta: {
      extraDistanceNm: distanceDiff,
      extraTransitDays: daysDiff,
      costDifferenceUsd: costDiff,
      extraFuelTons: fuelDiffTons,
      extraCo2Tons: co2DiffTons,
      cheaperRoute: costDiff < 0 ? 'routeB' : 'routeA',
      recommendation:
        costDiff > 0 && routeA.riskLevel === 'HIGH'
          ? 'Route B (Cape diversion) adds cost but completely circumvents war-risk chokepoint and avoids missile risk.'
          : costDiff < 0
          ? 'Route B is more economical due to saving canal toll fees.'
          : 'Route A offers significant time savings; evaluate war-risk insurance premiums.',
    },
  };
}

/**
 * Calculate statistical market trends and moving averages from rate history
 */
function calculateMarketTrends(history = []) {
  if (!history || history.length === 0) {
    return {
      currentRate: 0,
      movingAvg7d: 0,
      movingAvg30d: 0,
      volatilityPct: 0,
      trend: 'STABLE',
      forecast30d: 0,
    };
  }

  const rates = history.map((h) => h.rate);
  const currentRate = rates[rates.length - 1];

  // 7-day average (or all available if fewer)
  const slice7 = rates.slice(-Math.min(7, rates.length));
  const movingAvg7d = Math.round(slice7.reduce((a, b) => a + b, 0) / slice7.length);

  // 30-day average
  const slice30 = rates.slice(-Math.min(30, rates.length));
  const movingAvg30d = Math.round(slice30.reduce((a, b) => a + b, 0) / slice30.length);

  // Volatility: standard deviation / mean
  const mean = rates.reduce((a, b) => a + b, 0) / rates.length;
  const variance = rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length;
  const stdDev = Math.sqrt(variance);
  const volatilityPct = Number(((stdDev / mean) * 100).toFixed(2));

  // Momentum direction
  const rateChange = currentRate - rates[0];
  let trend = 'STABLE';
  if (rateChange > rates[0] * 0.04) trend = 'BULLISH';
  else if (rateChange < -rates[0] * 0.04) trend = 'BEARISH';

  // 30-day linear projection
  const slope = (currentRate - rates[0]) / rates.length;
  const forecast30d = Math.round(currentRate + slope * 4);

  return {
    currentRate,
    movingAvg7d,
    movingAvg30d,
    volatilityPct,
    trend,
    forecast30d,
    minRate: Math.min(...rates),
    maxRate: Math.max(...rates),
  };
}

module.exports = {
  calculateDistanceNm,
  calculateVoyageCost,
  calculateRouteComparison,
  calculateMarketTrends,
  VESSEL_DEFAULTS,
};

import { FreightLane, Port } from '../types';

/**
 * SIH26006-specific decision-support fixtures.
 * These values are prototype/demo data and are intentionally separated from
 * the generic global terminal dataset so the SIH workflow can be tested end-to-end.
 */
export const SIH_EAST_COAST_PORTS: Port[] = [
  { id: 'sih-paradip', name: 'Paradip Port', code: 'INPRD', country: 'India', lat: 20.27, lon: 86.70, throughputTeuM: 0.9, avgWaitDays: 1.8, congestionScore: 48, vesselsAtBerth: 19, vesselsWaiting: 11, bunkerPriceVLSFO: 620, status: 'MODERATE' },
  { id: 'sih-vizag', name: 'Visakhapatnam Port', code: 'INVTZ', country: 'India', lat: 17.69, lon: 83.28, throughputTeuM: 0.7, avgWaitDays: 2.1, congestionScore: 56, vesselsAtBerth: 17, vesselsWaiting: 14, bunkerPriceVLSFO: 625, status: 'MODERATE' },
  { id: 'sih-dhamra', name: 'Dhamra Port', code: 'INDMA', country: 'India', lat: 20.78, lon: 86.95, throughputTeuM: 0.4, avgWaitDays: 1.3, congestionScore: 39, vesselsAtBerth: 12, vesselsWaiting: 7, bunkerPriceVLSFO: 618, status: 'NORMAL' },
  { id: 'sih-gangavaram', name: 'Gangavaram Port', code: 'INGAM', country: 'India', lat: 17.63, lon: 83.22, throughputTeuM: 0.3, avgWaitDays: 1.5, congestionScore: 43, vesselsAtBerth: 10, vesselsWaiting: 8, bunkerPriceVLSFO: 623, status: 'NORMAL' }
];

const history = (rates: number[]) => rates.map((rate, index) => ({ date: `2026-0${8 - Math.min(index, 3)}-${String(4 + index * 6).padStart(2, '0')}`, rate }));

export const SIH_PROCUREMENT_LANES: FreightLane[] = [
  {
    id: 'sih-aus-prd', code: 'AUS-INPRD', name: 'Australia Iron Ore → Paradip', type: 'DRY_BULK', originPort: 'Port Hedland', destinationPort: 'INPRD', originCoords: [118.57, -20.31], destCoords: [86.70, 20.27],
    waypoints: [[118.57, -20.31], [125, -5], [110, 5], [95, 10], [86.70, 20.27]], currentRateUsd: 12.20, rateUnit: '$/metric ton', change24h: 0.22, changePct: 1.84, historicalRates: history([10.90, 11.20, 11.55, 11.95, 12.20]), distanceNm: 3280, transitDays: 10, activeVessels: 46, congestionIndex: 42, carbonEtsCostEst: 39000, chokePointsCrossed: ['Lombok / Makassar Strait']
  },
  {
    id: 'sih-aus-vtz', code: 'AUS-INVTZ', name: 'Australia Iron Ore → Visakhapatnam', type: 'DRY_BULK', originPort: 'Port Hedland', destinationPort: 'INVTZ', originCoords: [118.57, -20.31], destCoords: [83.28, 17.69],
    waypoints: [[118.57, -20.31], [124, -3], [105, 7], [90, 12], [83.28, 17.69]], currentRateUsd: 12.70, rateUnit: '$/metric ton', change24h: 0.26, changePct: 2.10, historicalRates: history([11.10, 11.40, 11.85, 12.35, 12.70]), distanceNm: 3480, transitDays: 11, activeVessels: 41, congestionIndex: 49, carbonEtsCostEst: 42000, chokePointsCrossed: ['Lombok / Makassar Strait']
  },
  {
    id: 'sih-aus-dma', code: 'AUS-INDMA', name: 'Australia Iron Ore → Dhamra', type: 'DRY_BULK', originPort: 'Port Hedland', destinationPort: 'INDMA', originCoords: [118.57, -20.31], destCoords: [86.95, 20.78],
    waypoints: [[118.57, -20.31], [124, -5], [110, 7], [95, 12], [86.95, 20.78]], currentRateUsd: 11.95, rateUnit: '$/metric ton', change24h: 0.20, changePct: 1.68, historicalRates: history([10.70, 10.95, 11.30, 11.65, 11.95]), distanceNm: 3190, transitDays: 10, activeVessels: 38, congestionIndex: 35, carbonEtsCostEst: 37000, chokePointsCrossed: ['Lombok / Makassar Strait']
  },
  {
    id: 'sih-aus-gam', code: 'AUS-INGAM', name: 'Australia Iron Ore → Gangavaram', type: 'DRY_BULK', originPort: 'Port Hedland', destinationPort: 'INGAM', originCoords: [118.57, -20.31], destCoords: [83.22, 17.63],
    waypoints: [[118.57, -20.31], [124, -5], [105, 7], [90, 12], [83.22, 17.63]], currentRateUsd: 12.05, rateUnit: '$/metric ton', change24h: 0.18, changePct: 1.49, historicalRates: history([10.85, 11.05, 11.35, 11.70, 12.05]), distanceNm: 3320, transitDays: 10, activeVessels: 35, congestionIndex: 37, carbonEtsCostEst: 38000, chokePointsCrossed: ['Lombok / Makassar Strait']
  },
  {
    id: 'sih-za-vtz', code: 'ZARIB-INVTZ', name: 'Richards Bay Coal → Visakhapatnam', type: 'DRY_BULK', originPort: 'Richards Bay', destinationPort: 'INVTZ', originCoords: [32.03, -28.78], destCoords: [83.28, 17.69],
    waypoints: [[32.03, -28.78], [45, -25], [65, -15], [78, -2], [83.28, 17.69]], currentRateUsd: 18.60, rateUnit: '$/metric ton', change24h: 0.40, changePct: 2.20, historicalRates: history([16.90, 17.20, 17.55, 18.10, 18.60]), distanceNm: 6480, transitDays: 19, activeVessels: 29, congestionIndex: 58, carbonEtsCostEst: 74000, chokePointsCrossed: ['Cape of Good Hope']
  },
  {
    id: 'sih-br-prd', code: 'BRVIT-INPRD', name: 'Brazil Iron Ore → Paradip', type: 'DRY_BULK', originPort: 'Tubarao', destinationPort: 'INPRD', originCoords: [-40.24, -20.28], destCoords: [86.70, 20.27],
    waypoints: [[-40.24, -20.28], [-10, -30], [18.47, -34.35], [55, -20], [80, 5], [86.70, 20.27]], currentRateUsd: 25.90, rateUnit: '$/metric ton', change24h: 0.75, changePct: 2.90, historicalRates: history([23.10, 23.70, 24.20, 25.10, 25.90]), distanceNm: 10100, transitDays: 31, activeVessels: 24, congestionIndex: 67, carbonEtsCostEst: 132000, chokePointsCrossed: ['Cape of Good Hope']
  },
  {
    id: 'sih-aus-coal-prd', code: 'AUSCOAL-INPRD', name: 'Australia Coal → Paradip', type: 'DRY_BULK', originPort: 'Newcastle', destinationPort: 'INPRD', originCoords: [151.78, -32.93], destCoords: [86.70, 20.27],
    waypoints: [[151.78, -32.93], [155, -5], [135, 8], [110, 12], [86.70, 20.27]], currentRateUsd: 13.40, rateUnit: '$/metric ton', change24h: 0.15, changePct: 1.13, historicalRates: history([12.60, 12.75, 12.90, 13.15, 13.40]), distanceNm: 3810, transitDays: 12, activeVessels: 32, congestionIndex: 45, carbonEtsCostEst: 44000, chokePointsCrossed: ['Torres Strait']
  }
];

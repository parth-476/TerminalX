import { FreightLane, Port } from '../types';

export interface RouteOption {
  id: string;
  label: string;
  lane: FreightLane;
  transitDays: number;
  distanceNm: number;
  freightCost: number;
  portDelayDays: number;
  riskScore: number;
  carbonCost: number;
  totalCostProxy: number;
  score: number;
  advantages: string[];
  tradeoffs: string[];
}

export interface RouteOptimizationResult {
  recommended: RouteOption;
  alternatives: RouteOption[];
  method: string[];
}

const riskForLane = (lane: FreightLane): number => {
  const chokeRisk = lane.chokePointsCrossed.reduce((sum, point) => {
    const name = point.toLowerCase();
    if (name.includes('bab-el-mandeb')) return sum + 32;
    if (name.includes('hormuz')) return sum + 28;
    if (name.includes('suez')) return sum + 22;
    if (name.includes('cape')) return sum + 8;
    if (name.includes('malacca')) return sum + 10;
    if (name.includes('panama')) return sum + 14;
    return sum + 5;
  }, 0);
  return Math.min(100, Math.round(chokeRisk + lane.congestionIndex * 0.35));
};

const findPort = (ports: Port[], name: string): Port | undefined => {
  const target = name.toLowerCase();
  return ports.find(port => target.includes(port.name.split(' (')[0].toLowerCase()) || port.name.toLowerCase().includes(target.split(' (')[0]));
};

const buildOption = (lane: FreightLane, ports: Port[], label: string, index: number): RouteOption => {
  const origin = findPort(ports, lane.originPort);
  const destination = findPort(ports, lane.destinationPort);
  const portDelayDays = (origin?.avgWaitDays ?? 0) * 0.35 + (destination?.avgWaitDays ?? 0) * 0.65;
  const riskScore = riskForLane(lane);
  const freightCost = lane.currentRateUsd;
  const carbonCost = lane.carbonEtsCostEst;
  const delayCostProxy = lane.type === 'CONTAINER' ? portDelayDays * 120 : portDelayDays * 1800;
  const riskPremiumProxy = riskScore * (lane.type === 'CONTAINER' ? 22 : 70);
  const totalCostProxy = freightCost + carbonCost / 1000 + delayCostProxy + riskPremiumProxy;
  const score = Math.max(0, Math.min(100, Math.round(100 - riskScore * 0.42 - portDelayDays * 3 - index * 2)));

  return {
    id: lane.id,
    label,
    lane,
    transitDays: lane.transitDays,
    distanceNm: lane.distanceNm,
    freightCost,
    portDelayDays: Number(portDelayDays.toFixed(1)),
    riskScore,
    carbonCost,
    totalCostProxy: Number(totalCostProxy.toFixed(0)),
    score,
    advantages: [
      `${lane.distanceNm.toLocaleString()} nm corridor`,
      `${lane.transitDays} day sailing time`,
      `${lane.activeVessels} active vessels in lane`
    ],
    tradeoffs: [
      `${lane.congestionIndex}/100 lane congestion`,
      `${portDelayDays.toFixed(1)} day estimated port delay`,
      `${riskScore}/100 route risk proxy`
    ]
  };
};

export const optimizeRoutes = (selectedLane: FreightLane, freightLanes: FreightLane[], ports: Port[]): RouteOptimizationResult => {
  const samePair = freightLanes.filter(lane =>
    lane.id !== selectedLane.id &&
    lane.type === selectedLane.type &&
    lane.originPort === selectedLane.originPort &&
    lane.destinationPort === selectedLane.destinationPort
  );

  const candidates = [selectedLane, ...samePair].slice(0, 4);
  const options = candidates.map((lane, index) => buildOption(
    lane,
    ports,
    lane.id === selectedLane.id ? 'CURRENT CORRIDOR' : 'ALTERNATIVE CORRIDOR',
    index
  )).sort((a, b) => b.score - a.score);

  const recommended = options[0];
  const alternatives = options.slice(1);

  const method = [
    'Compares repository-supported lanes with the same cargo type and origin/destination pair.',
    'Balances freight proxy, transit time, port delay, congestion and choke-point risk.',
    'Total cost is a normalized decision-support proxy, not a contractual freight quote.'
  ];

  return { recommended, alternatives, method };
};

import { Port } from '../types';

export interface CongestionForecast {
  port: Port;
  currentScore: number;
  forecast7d: number;
  forecast14d: number;
  direction: 'WORSENING' | 'IMPROVING' | 'STABLE';
  delayDays: number;
  confidence: number;
  drivers: { label: string; impact: number }[];
  action: string;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function forecastPortCongestion(port: Port, recentWeather?: { highWindDays?: number; heavyRainDays?: number; days?: number }): CongestionForecast {
  const queuePressure = port.vesselsWaiting / Math.max(port.vesselsAtBerth, 1);
  const queueImpact = clamp((queuePressure - 0.45) * 35);
  const waitImpact = clamp((port.avgWaitDays - 1) * 7);
  const weatherImpact = recentWeather?.days ? clamp(((recentWeather.highWindDays ?? 0) / recentWeather.days) * 35 + ((recentWeather.heavyRainDays ?? 0) / recentWeather.days) * 20) : 0;
  const structuralPressure = port.congestionScore >= 70 ? 5 : port.congestionScore <= 40 ? -4 : 0;
  const pressure = queueImpact + waitImpact + weatherImpact * 0.35 + structuralPressure;
  const forecast7d = clamp(port.congestionScore + pressure * 0.55);
  const forecast14d = clamp(port.congestionScore + pressure);
  const delta = forecast14d - port.congestionScore;
  const direction = delta > 4 ? 'WORSENING' : delta < -4 ? 'IMPROVING' : 'STABLE';
  const delayDays = Math.max(0.3, port.avgWaitDays * (1 + (forecast14d - 50) / 180));
  const confidence = clamp(78 + Math.min(10, port.vesselsWaiting / 5) - (recentWeather ? 0 : 8), 55, 90);
  const drivers = [
    { label: 'Current congestion', impact: port.congestionScore - 50 },
    { label: 'Queue pressure', impact: queueImpact },
    { label: 'Average wait', impact: waitImpact },
    { label: 'Weather disruption', impact: weatherImpact * 0.35 }
  ];
  const action = forecast14d >= 75 ? 'Plan berth-delay contingency / alternate discharge window.' : forecast14d >= 55 ? 'Maintain buffer and monitor queue conditions.' : 'Operating conditions remain relatively manageable.';
  return { port, currentScore: port.congestionScore, forecast7d, forecast14d, direction, delayDays, confidence, drivers, action };
}

export function rankPortCongestion(ports: Port[], weatherByPort: Record<string, { highWindDays?: number; heavyRainDays?: number; days?: number }> = {}) {
  return ports.map(port => forecastPortCongestion(port, weatherByPort[port.id])).sort((a, b) => b.forecast14d - a.forecast14d);
}

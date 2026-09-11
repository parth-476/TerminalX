import React, { useMemo, useState } from 'react';
import { Activity, BrainCircuit, CalendarDays, Gauge, ShieldAlert, TrendingDown, TrendingUp } from 'lucide-react';
import { FreightLane } from '../../types';
import { forecastFreight } from '../../utils/freightForecastEngine';

interface FreightForecastViewProps {
  freightLanes: FreightLane[];
}

export const FreightForecastView: React.FC<FreightForecastViewProps> = ({ freightLanes }) => {
  const [selectedLaneId, setSelectedLaneId] = useState(freightLanes[0]?.id ?? '');
  const lane = freightLanes.find(item => item.id === selectedLaneId) ?? freightLanes[0];
  const result = useMemo(() => lane ? forecastFreight(lane, 30) : null, [lane]);

  if (!lane || !result) {
    return <div className="h-full bg-black text-gray-500 p-6">NO FREIGHT SERIES AVAILABLE</div>;
  }

  const maxRate = Math.max(...result.points.map(point => point.actual ?? point.forecast ?? 0), result.currentRate) * 1.08;
  const minRate = Math.min(...result.points.map(point => point.actual ?? point.forecast ?? result.currentRate), result.currentRate) * 0.92;
  const range = Math.max(maxRate - minRate, 1);
  const historical = result.points.filter(point => point.actual !== undefined);
  const forecastPoints = result.points.filter(point => point.forecast !== undefined);
  const charterWindow = result.direction === 'DOWN' ? 'WAIT / 7–14D' : result.direction === 'UP' ? 'CHARTER NOW / 0–7D' : 'MONITOR / 7–10D';

  return (
    <div className="h-full overflow-auto bg-black text-[#d1d1d1] font-mono p-3">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#333] pb-2 mb-3">
        <div>
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <BrainCircuit className="w-4 h-4 text-[#F27D26]" />
            FREIGHT FORECAST ENGINE
          </div>
          <div className="text-[10px] text-gray-500 mt-1">BASELINE TREND MODEL • HISTORICAL FREIGHT SERIES • 30D HORIZON</div>
        </div>
        <select value={selectedLaneId} onChange={event => setSelectedLaneId(event.target.value)} className="bg-[#111] border border-[#444] text-white px-2 py-1 text-xs outline-none">
          {freightLanes.map(item => <option key={item.id} value={item.id}>{item.code} — {item.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-3">
        <Metric label="CURRENT" value={`$${result.currentRate.toLocaleString()}`} sub={lane.rateUnit} />
        <Metric label="30D MODEL" value={`$${result.forecastRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub={`${result.changePct >= 0 ? '+' : ''}${result.changePct.toFixed(1)}%`} />
        <Metric label="DIRECTION" value={result.direction} icon={result.direction === 'UP' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />} />
        <Metric label="CONFIDENCE" value={`${result.confidence.toFixed(0)}%`} icon={<Gauge className="w-4 h-4" />} />
        <Metric label="VOLATILITY" value={`${result.volatilityPct.toFixed(2)}%`} icon={<Activity className="w-4 h-4" />} />
        <Metric label="CHARTER WINDOW" value={charterWindow} icon={<CalendarDays className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-3">
        <section className="border border-[#333] bg-[#080808] p-3 min-h-[390px]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[#F27D26] font-bold text-xs">{lane.code} / RATE CURVE</span>
            <span className="text-[9px] text-gray-500">ACTUAL + MODEL PROJECTION</span>
          </div>
          <div className="relative h-[300px] border-l border-b border-[#333]">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0,1,2,3,4].map(i => <div key={i} className="border-t border-[#181818] w-full" />)}
            </div>
            <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              <polyline fill="none" stroke="#F27D26" strokeWidth="3" points={historical.map((point, index) => {
                const x = historical.length === 1 ? 0 : (index / (result.points.length - 1)) * 1000;
                const y = 300 - (((point.actual ?? minRate) - minRate) / range) * 270 - 15;
                return `${x},${y}`;
              }).join(' ')} />
              {forecastPoints.length > 0 && <polyline fill="none" stroke="#00FF41" strokeWidth="2" strokeDasharray="8 6" points={forecastPoints.map((point, index) => {
                const x = ((historical.length - 1 + index) / Math.max(result.points.length - 1, 1)) * 1000;
                const y = 300 - (((point.forecast ?? minRate) - minRate) / range) * 270 - 15;
                return `${x},${y}`;
              }).join(' ')} />}
            </svg>
            <div className="absolute left-2 top-2 text-[9px] text-gray-500">MAX ${maxRate.toFixed(0)}</div>
            <div className="absolute left-2 bottom-2 text-[9px] text-gray-500">MIN ${minRate.toFixed(0)}</div>
          </div>
          <div className="flex gap-4 mt-2 text-[9px] text-gray-500"><span><i className="inline-block w-4 border-t-2 border-[#F27D26] mr-1 align-middle" />HISTORICAL</span><span><i className="inline-block w-4 border-t-2 border-dashed border-[#00FF41] mr-1 align-middle" />FORECAST</span></div>
        </section>

        <section className="space-y-3">
          <div className="border border-[#333] bg-[#080808] p-3">
            <div className="text-[#F27D26] font-bold text-xs mb-2">MODEL DECISION</div>
            <div className="text-white text-lg font-bold mb-2">{result.direction === 'UP' ? 'ACCUMULATE FREIGHT EXPOSURE' : result.direction === 'DOWN' ? 'DEFER CHARTER COMMITMENT' : 'HOLD / MONITOR'}</div>
            <div className="text-[10px] text-gray-400 leading-relaxed">The baseline model detects a {result.direction.toLowerCase()}ward trend with {result.volatilityPct.toFixed(2)}% historical return volatility. This is a decision-support signal, not a guaranteed market prediction.</div>
          </div>
          <div className="border border-[#333] bg-[#080808] p-3">
            <div className="flex items-center gap-2 text-[#00FF41] font-bold text-xs mb-2"><ShieldAlert className="w-3.5 h-3.5" /> SIH CHARTER SIGNAL</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#111] p-2"><span className="text-gray-500 block">ROUTE</span><span className="text-white">{lane.originPort} → {lane.destinationPort}</span></div>
              <div className="bg-[#111] p-2"><span className="text-gray-500 block">CONGESTION</span><span className={lane.congestionIndex >= 70 ? 'text-red-400' : 'text-[#00FF41]'}>{lane.congestionIndex}/100</span></div>
              <div className="bg-[#111] p-2"><span className="text-gray-500 block">VESSELS</span><span className="text-white">{lane.activeVessels}</span></div>
              <div className="bg-[#111] p-2"><span className="text-gray-500 block">TRANSIT</span><span className="text-white">{lane.transitDays} days</span></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric: React.FC<{ label: string; value: string; sub?: string; icon?: React.ReactNode }> = ({ label, value, sub, icon }) => (
  <div className="border border-[#333] bg-[#080808] p-2 min-h-[68px]">
    <div className="text-[9px] text-gray-500 mb-1">{label}</div>
    <div className="text-white font-bold flex items-center gap-1">{icon}{value}</div>
    {sub && <div className="text-[9px] text-[#F27D26] mt-1">{sub}</div>}
  </div>
);

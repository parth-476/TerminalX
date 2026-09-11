import React, { useMemo, useRef, useState } from 'react';
import { Anchor, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BrainCircuit, Gauge, PackageSearch, RefreshCw, Ship, SlidersHorizontal, Sparkles, TrendingDown, TrendingUp, Waves, Zap } from 'lucide-react';
import { FreightLane, Port, Vessel } from '../../types';
import { mlForecastFreight } from '../../utils/mlFreightEngine';
import { buildCharterRecommendation } from '../../utils/charterEngine';
import { buildProcurementRecommendation } from '../../utils/procurementEngine';
import { calculateFreightOpportunity } from '../../utils/freightOpportunityEngine';
import { buildIntegratedDecision } from '../../utils/integratedDecisionEngine';
import { IntegratedDecisionPanel } from '../Charter/IntegratedDecisionPanel';
import { ScenarioAnalysisPanel } from './ScenarioAnalysisPanel';

interface SIHCommandCenterViewProps {
  freightLanes: FreightLane[];
  ports: Port[];
  vessels: Vessel[];
  onNavigateView: (view: 'FCST' | 'PORT' | 'VSL' | 'PROC' | 'CHART') => void;
}

type Horizon = 7 | 14 | 30;
type Focus = 'freight' | 'port' | 'vessel' | 'procurement' | 'decision';

export const SIHCommandCenterView: React.FC<SIHCommandCenterViewProps> = ({ freightLanes, ports, vessels, onNavigateView }) => {
  const sihLanes = freightLanes.filter(lane => lane.type === 'DRY_BULK' && (lane.destinationPort === 'INPAR' || lane.destinationPort === 'INVIS' || lane.destinationPort === 'INDHM' || lane.destinationPort === 'INGAN' || lane.name.toLowerCase().includes('india')));
  const lanes = sihLanes.length ? sihLanes : freightLanes.filter(lane => lane.type === 'DRY_BULK').slice(0, 6);
  const [selectedLaneId, setSelectedLaneId] = useState(lanes[0]?.id ?? '');
  const [quantityMt, setQuantityMt] = useState(60000);
  const [laycanDays, setLaycanDays] = useState(14);
  const [horizon, setHorizon] = useState<Horizon>(30);
  const [focus, setFocus] = useState<Focus>('decision');
  const [refreshKey, setRefreshKey] = useState(0);
  const decisionRef = useRef<HTMLDivElement>(null);

  const lane = lanes.find(item => item.id === selectedLaneId) ?? lanes[0];
  const forecast = useMemo(() => lane ? mlForecastFreight(lane, ports, vessels) : null, [lane, ports, vessels, refreshKey]);
  const charter = useMemo(() => lane ? buildCharterRecommendation({ laneId: lane.id, cargoType: lane.type, quantityMt, laycanDays }, freightLanes, ports, vessels) : null, [lane, quantityMt, laycanDays, freightLanes, ports, vessels]);
  const procurement = useMemo(() => lane ? buildProcurementRecommendation(lane.type === 'CRUDE' ? 'CRUDE' : lane.type === 'LNG' ? 'LNG' : 'DRY_BULK', quantityMt, [lane], ports, lane.destinationPort) : null, [lane, ports, quantityMt]);
  const integrated = useMemo(() => lane ? buildIntegratedDecision(lane, ports, vessels, quantityMt, laycanDays) : null, [lane, ports, vessels, quantityMt, laycanDays]);
  const opportunity = useMemo(() => lane && forecast ? calculateFreightOpportunity(lane, forecast, quantityMt) : null, [lane, forecast, quantityMt]);

  if (!lane || !forecast || !opportunity || !integrated || !procurement) return <div className="h-full bg-black text-gray-500 p-6">NO SIH DRY-BULK DATA AVAILABLE</div>;

  const destination = ports.find(port => port.code === lane.destinationPort);
  const topVessel = integrated.vessels[0] ?? charter?.matches[0];
  const horizonRate = horizon === 7 ? forecast.forecast7d : horizon === 14 ? forecast.forecast14d : forecast.forecast30d;
  const horizonChange = ((horizonRate - forecast.currentRate) / Math.max(forecast.currentRate, 0.01)) * 100;
  const actionLabel = integrated.action === 'FIX NOW' ? 'SECURE FREIGHT' : integrated.action === 'SPLIT' ? 'SPLIT EXPOSURE' : integrated.action === 'WAIT' ? 'WAIT FOR WINDOW' : 'WATCH MARKET';
  const signalUp = horizonChange >= 1.5;
  const signalDown = horizonChange <= -1.5;
  const signal = signalUp ? 'UP' : signalDown ? 'DOWN' : 'FLAT';
  const portRisk = Math.round(integrated.congestion.forecast14d);
  const modelledFreight = horizonRate * quantityMt;
  const currentFreight = forecast.currentRate * quantityMt;
  const impact = Math.abs(modelledFreight - currentFreight);
  const chartHistory = lane.historicalRates.slice(-18).map(item => ({ label: item.date.slice(5), value: item.rate, kind: 'actual' as const }));
  const chartPoints = [...chartHistory, { label: '7D', value: forecast.forecast7d, kind: 'forecast' as const }, { label: '14D', value: forecast.forecast14d, kind: 'forecast' as const }, { label: '30D', value: forecast.forecast30d, kind: 'forecast' as const }];
  const min = Math.min(...chartPoints.map(p => p.value)) * 0.96;
  const max = Math.max(...chartPoints.map(p => p.value)) * 1.04;
  const points = chartPoints.map((point, index) => {
    const x = 28 + (index / Math.max(chartPoints.length - 1, 1)) * 650;
    const y = 172 - ((point.value - min) / Math.max(max - min, 0.01)) * 128;
    return { ...point, x, y };
  });
  const historyPoints = points.slice(0, chartHistory.length);
  const forecastPoints = points.slice(Math.max(chartHistory.length - 1, 0));
  const linePath = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const forecastPath = forecastPoints.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const jumpTo = (nextFocus: Focus) => {
    setFocus(nextFocus);
    requestAnimationFrame(() => decisionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  return <div className="h-full overflow-auto bg-[#030303] text-[#d1d1d1] font-mono p-3 md:p-4">
    <div className="max-w-[1600px] mx-auto">
      <header className="border border-[#2b2b2b] bg-[#070707] px-4 py-3 mb-3 shadow-[0_0_35px_rgba(242,125,38,0.05)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-white font-bold text-lg tracking-tight"><span className="text-[#F27D26]">◉</span> SIH COMMAND CENTER <span className="text-[9px] border border-[#315e3d] text-[#5ee58b] px-2 py-1 ml-2">DECISION COCKPIT</span></div>
            <div className="text-[10px] text-gray-500 mt-1">SIH26006 • EAST COAST INDIA • CARGO → FREIGHT → PORT → VESSEL → PROCUREMENT → CHARTER</div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[9px]">
            <span className="px-2 py-1 bg-[#0b1b10] border border-[#244d31] text-[#5ee58b]">● MODEL ACTIVE</span>
            <span className="px-2 py-1 bg-[#111] border border-[#333] text-cyan-300">● AIS DEMO</span>
            <span className="px-2 py-1 bg-[#111] border border-[#333] text-[#F27D26]">● WEATHER LINKED</span>
            <button onClick={() => setRefreshKey(k => k + 1)} className="px-2 py-1 border border-[#444] hover:border-[#F27D26] text-gray-400 hover:text-white" title="Recalculate cockpit"><RefreshCw className="inline w-3 h-3 mr-1"/>RECALCULATE</button>
          </div>
        </div>
        <div className="grid md:grid-cols-[auto_1fr_auto] gap-3 items-end mt-4">
          <div><label className="block text-[9px] text-gray-500 mb-1">CARGO REQUIREMENT</label><div className="flex items-center gap-2"><input aria-label="Cargo quantity in metric tons" type="number" min="1000" step="1000" value={quantityMt} onChange={e => setQuantityMt(Math.max(1000, Number(e.target.value) || 1000))} className="w-32 bg-black border border-[#555] text-white px-3 py-2 text-sm font-bold outline-none focus:border-[#F27D26]"/><span className="text-[10px] text-gray-500">MT</span></div></div>
          <div><label className="block text-[9px] text-gray-500 mb-1">EAST COAST LANE</label><select aria-label="East Coast freight lane" value={selectedLaneId} onChange={e => setSelectedLaneId(e.target.value)} className="w-full bg-black border border-[#555] text-white px-3 py-2 text-sm outline-none focus:border-[#F27D26]">{lanes.map(item => <option key={item.id} value={item.id}>{item.code} — {item.originPort} → {item.destinationPort}</option>)}</select></div>
          <div><label className="block text-[9px] text-gray-500 mb-1">LAYCAN WINDOW</label><select value={laycanDays} onChange={e => setLaycanDays(Number(e.target.value))} className="bg-black border border-[#555] text-white px-3 py-2 text-sm outline-none focus:border-[#F27D26]"><option value={7}>7 DAYS</option><option value={14}>14 DAYS</option><option value={21}>21 DAYS</option><option value={30}>30 DAYS</option></select></div>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-3">
        <Kpi label="SPOT FREIGHT" value={`$${forecast.currentRate.toFixed(2)}`} sub="/ MT" tone="neutral" onClick={() => jumpTo('freight')} />
        <Kpi label={`${horizon}D FORECAST`} value={`$${horizonRate.toFixed(2)}`} sub={`${horizonChange >= 0 ? '+' : ''}${horizonChange.toFixed(1)}%`} tone={signalUp ? 'red' : signalDown ? 'green' : 'amber'} onClick={() => jumpTo('freight')} />
        <Kpi label="MARKET SIGNAL" value={signal} sub={signalUp ? 'RISING PRESSURE' : signalDown ? 'FALLING PRESSURE' : 'NEUTRAL RANGE'} tone={signalUp ? 'red' : signalDown ? 'green' : 'amber'} icon={signalUp ? <TrendingUp/> : signalDown ? <TrendingDown/> : <ArrowRight/>} onClick={() => jumpTo('freight')} />
        <Kpi label="DECISION CONFIDENCE" value={`${integrated.confidence.toFixed(0)}%`} sub="COMBINED STACK" tone="cyan" icon={<Gauge/>} onClick={() => jumpTo('decision')} />
        <Kpi label="PORT RISK / 14D" value={`${portRisk}/100`} sub={`${integrated.congestion.delayDays.toFixed(1)}D INDICATIVE DELAY`} tone={portRisk >= 70 ? 'red' : portRisk >= 50 ? 'amber' : 'green'} icon={<Anchor/>} onClick={() => jumpTo('port')} />
        <Kpi label="RECOMMENDED ACTION" value={integrated.action} sub={actionLabel} tone={integrated.action === 'FIX NOW' ? 'red' : integrated.action === 'WAIT' ? 'green' : 'amber'} icon={<Zap/>} onClick={() => jumpTo('decision')} />
      </section>

      <div className="grid xl:grid-cols-[minmax(0,1.7fr)_minmax(350px,0.8fr)] gap-3 mb-3">
        <section className="border border-[#333] bg-[#070707] overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#292929]">
            <div><div className="flex items-center gap-2 text-white text-sm font-bold"><BarChart3 className="w-4 h-4 text-[#F27D26]"/> FREIGHT INTELLIGENCE</div><div className="text-[9px] text-gray-500 mt-1">HISTORICAL LANE MOVEMENT + MODEL FORECAST</div></div>
            <div className="flex items-center gap-1 bg-[#0d0d0d] border border-[#292929] p-1">{([7, 14, 30] as Horizon[]).map(days => <button key={days} onClick={() => setHorizon(days)} className={`px-3 py-1 text-[9px] font-bold ${horizon === days ? 'bg-[#F27D26] text-black' : 'text-gray-500 hover:text-white'}`}>{days}D</button>)}</div>
          </div>
          <div className="grid md:grid-cols-[1fr_auto] gap-0">
            <div className="p-3">
              <div className="flex items-end gap-4 mb-2"><div><div className="text-[9px] text-gray-500">SELECTED HORIZON</div><div className="text-2xl text-white font-bold">${horizonRate.toFixed(2)}<span className="text-[10px] text-gray-500 ml-2">/MT</span></div></div><div className={signalDown ? 'text-[#00FF41] text-xs font-bold' : signalUp ? 'text-red-400 text-xs font-bold' : 'text-[#F27D26] text-xs font-bold'}>{horizonChange >= 0 ? '+' : ''}{horizonChange.toFixed(1)}%</div></div>
              <div className="h-[235px] w-full overflow-hidden">
                <svg viewBox="0 0 710 205" className="w-full h-full" role="img" aria-label="Freight history and forecast chart">
                  {[45, 90, 135, 180].map(y => <line key={y} x1="28" x2="680" y1={y} y2={y} stroke="#1e1e1e" strokeWidth="1"/>)}
                  <line x1={historyPoints[historyPoints.length - 1]?.x ?? 0} x2={historyPoints[historyPoints.length - 1]?.x ?? 0} y1="25" y2="182" stroke="#F27D26" strokeDasharray="3 4" opacity="0.45"/>
                  <path d={linePath} fill="none" stroke="#d1d1d1" strokeWidth="2"/>
                  <path d={forecastPath} fill="none" stroke="#F27D26" strokeWidth="3" strokeDasharray="7 5"/>
                  {points.map((p, i) => <g key={`${p.label}-${i}`}><circle cx={p.x} cy={p.y} r={p.kind === 'forecast' ? 4 : 2.2} fill={p.kind === 'forecast' ? '#F27D26' : '#d1d1d1'}/>{p.kind === 'forecast' && <text x={p.x} y={p.y - 9} textAnchor="middle" fill="#999" fontSize="8">{p.label}</text>}</g>)}
                  <text x="28" y="198" fill="#555" fontSize="8">HISTORY</text><text x="600" y="198" fill="#F27D26" fontSize="8">MODEL →</text>
                </svg>
              </div>
              <div className="flex items-center gap-4 text-[8px] text-gray-500"><span><i className="inline-block w-3 h-[2px] bg-gray-400 mr-1 align-middle"/>HISTORY</span><span className="text-[#F27D26]"><i className="inline-block w-3 h-[2px] bg-[#F27D26] mr-1 align-middle"/>FORECAST</span><span className="ml-auto">{forecast.modelName} • {forecast.confidence.toFixed(0)}% model confidence</span></div>
            </div>
            <div className="border-t md:border-t-0 md:border-l border-[#292929] p-4 min-w-[190px] bg-[#050505]">
              <div className="text-[9px] text-gray-500 mb-3">FORECAST LADDER</div>
              <ForecastRow label="NOW" value={forecast.currentRate}/><ForecastRow label="7 DAYS" value={forecast.forecast7d}/><ForecastRow label="14 DAYS" value={forecast.forecast14d}/><ForecastRow label="30 DAYS" value={forecast.forecast30d} active/>
              <div className="border-t border-[#222] mt-4 pt-3"><div className="text-[8px] text-gray-500">MODEL ERROR</div><div className="text-white font-bold text-sm mt-1">MAE {forecast.metrics.mae.toFixed(1)}</div><div className="text-[8px] text-gray-600 mt-1">MAPE {forecast.metrics.mape.toFixed(1)}% • {forecast.metrics.samples} samples</div></div>
            </div>
          </div>
        </section>

        <section ref={decisionRef} className={`border bg-[#070707] transition-all duration-200 ${focus === 'decision' ? 'border-[#F27D26] shadow-[0_0_30px_rgba(242,125,38,0.08)]' : 'border-[#333]'}`}>
          <div className="px-4 py-3 border-b border-[#292929] flex items-center justify-between"><div><div className="flex items-center gap-2 text-white text-sm font-bold"><BrainCircuit className="w-4 h-4 text-[#F27D26]"/> DECISION ENGINE</div><div className="text-[9px] text-gray-500 mt-1">ONE DECISION FROM FOUR SIGNALS</div></div><SparklineBadge score={integrated.score}/></div>
          <div className="p-4">
            <div className="flex items-end justify-between gap-3"><div><div className="text-[9px] text-gray-500">RECOMMENDED ACTION</div><div className={`text-3xl font-black mt-1 ${integrated.action === 'FIX NOW' ? 'text-red-400' : integrated.action === 'WAIT' ? 'text-[#00FF41]' : 'text-[#F27D26]'}`}>{integrated.action}</div></div><div className="text-right"><div className="text-[9px] text-gray-500">CONFIDENCE</div><div className="text-xl text-white font-bold">{integrated.confidence.toFixed(0)}%</div></div></div>
            <div className="mt-4 h-2 bg-[#181818] overflow-hidden"><div className="h-full bg-[#F27D26] transition-all duration-300" style={{ width: `${integrated.score}%` }}/></div><div className="flex justify-between text-[8px] text-gray-600 mt-1"><span>WAIT</span><span>WATCH</span><span>SPLIT</span><span>FIX NOW</span></div>
            <div className="grid grid-cols-2 gap-2 mt-4">{integrated.factors.map(factor => <button key={factor.label} onClick={() => jumpTo(factor.label.toLowerCase().includes('freight') ? 'freight' : factor.label.toLowerCase().includes('port') ? 'port' : factor.label.toLowerCase().includes('vessel') ? 'vessel' : 'procurement')} className="text-left border border-[#242424] bg-[#0c0c0c] p-2 hover:border-[#F27D26]"><div className="flex justify-between text-[8px] text-gray-500"><span>{factor.label.toUpperCase()}</span><span>{factor.weight}%</span></div><div className={factor.value >= 0 ? 'text-[#00FF41] text-sm font-bold mt-1' : 'text-red-400 text-sm font-bold mt-1'}>{factor.value >= 0 ? '+' : ''}{factor.value.toFixed(1)}</div><div className="text-[8px] text-gray-600 mt-1 leading-relaxed">{factor.interpretation}</div></button>)}</div>
            <div className="mt-4 p-3 border border-[#222] bg-[#050505] text-[9px] leading-relaxed text-gray-400"><span className="text-white font-bold">WHY:</span> {integrated.explanation[1]}</div>
          </div>
        </section>
      </div>

      <section className="border border-[#333] bg-[#070707] mb-3">
        <div className="px-4 py-3 border-b border-[#292929] flex flex-wrap items-center justify-between gap-2"><div><div className="flex items-center gap-2 text-white text-sm font-bold"><ArrowRight className="w-4 h-4 text-[#F27D26]"/> DECISION CHAIN</div><div className="text-[9px] text-gray-500 mt-1">CLICK ANY STAGE TO INSPECT OR OPEN ITS FULL MODULE</div></div><div className="text-[9px] text-gray-500">{quantityMt.toLocaleString()} MT • {lane.code} • {laycanDays}D LAYCAN</div></div>
        <div className="p-3 grid md:grid-cols-5 gap-2">
          <ChainCard step="01" title="CARGO" value={`${quantityMt.toLocaleString()} MT`} detail="Requirement" icon={<PackageSearch/>} onClick={() => setFocus('procurement')}/>
          <ChainCard step="02" title="FREIGHT" value={`$${forecast.currentRate.toFixed(2)} → $${horizonRate.toFixed(2)}`} detail={`${horizon}D ${horizonChange >= 0 ? '+' : ''}${horizonChange.toFixed(1)}%`} icon={signalDown ? <ArrowDownRight/> : <ArrowUpRight/>} onClick={() => { setFocus('freight'); onNavigateView('FCST'); }}/>
          <ChainCard step="03" title="PORT" value={`${portRisk}/100`} detail={`${integrated.congestion.delayDays.toFixed(1)}D delay`} icon={<Anchor/>} onClick={() => { setFocus('port'); onNavigateView('PORT'); }}/>
          <ChainCard step="04" title="VESSEL" value={topVessel?.vessel.name ?? 'NO MATCH'} detail={topVessel ? `${topVessel.score.toFixed(0)}/100 • ${topVessel.vessel.dwt.toLocaleString()} DWT` : 'Capacity screen'} icon={<Ship/>} onClick={() => { setFocus('vessel'); onNavigateView('VSL'); }}/>
          <ChainCard step="05" title="DECISION" value={integrated.action} detail={actionLabel} icon={<Zap/>} active onClick={() => jumpTo('decision')}/>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-3 mb-3">
        <SignalPanel title="VESSEL AVAILABILITY" icon={<Ship/>} focus={focus === 'vessel'} onClick={() => jumpTo('vessel')}>
          <div className="flex items-end justify-between"><div><div className="text-2xl text-white font-bold">{topVessel?.score.toFixed(0) ?? '—'}<span className="text-[10px] text-gray-500">/100</span></div><div className="text-[8px] text-gray-500 mt-1">TOP SCREENED MATCH</div></div><div className="text-right"><div className="text-[#00FF41] text-xs font-bold">{lane.activeVessels}</div><div className="text-[8px] text-gray-500">ACTIVE VESSELS</div></div></div><Meter value={topVessel?.score ?? 0}/><div className="grid grid-cols-2 gap-2 mt-3"><MiniStat label="DWT" value={topVessel ? `${topVessel.vessel.dwt.toLocaleString()}` : '—'}/><MiniStat label="WAIT" value={topVessel ? `${topVessel.vessel.congestionWaitHours.toFixed(0)}H` : '—'}/></div>
        </SignalPanel>
        <SignalPanel title="PORT PRESSURE" icon={<Waves/>} focus={focus === 'port'} onClick={() => jumpTo('port')}>
          <div className="flex items-end justify-between"><div><div className={`text-2xl font-bold ${portRisk >= 70 ? 'text-red-400' : portRisk >= 50 ? 'text-[#F27D26]' : 'text-[#00FF41]'}`}>{portRisk}<span className="text-[10px] text-gray-500">/100</span></div><div className="text-[8px] text-gray-500 mt-1">14D PROJECTED CONGESTION</div></div><div className="text-right"><div className="text-white text-xs font-bold">{destination?.name ?? lane.destinationPort}</div><div className="text-[8px] text-gray-500">DESTINATION</div></div></div><Meter value={portRisk}/><div className="grid grid-cols-2 gap-2 mt-3"><MiniStat label="WAIT" value={destination ? `${destination.avgWaitDays.toFixed(1)}D` : '—'}/><MiniStat label="AT BERTH / WAITING" value={destination ? `${destination.vesselsAtBerth}/${destination.vesselsWaiting}` : '—'}/></div>
        </SignalPanel>
        <SignalPanel title="PROCUREMENT TIMING" icon={<PackageSearch/>} focus={focus === 'procurement'} onClick={() => jumpTo('procurement')}>
          <div className="flex items-end justify-between"><div><div className={`text-xl font-black ${procurement.action === 'BUY NOW' ? 'text-red-400' : procurement.action === 'WAIT' ? 'text-[#00FF41]' : 'text-[#F27D26]'}`}>{procurement.action}</div><div className="text-[8px] text-gray-500 mt-1">MODELLED BUYING WINDOW</div></div><div className="text-right"><div className="text-white text-xs font-bold">{procurement.buyNowQuantityMt.toLocaleString()} MT</div><div className="text-[8px] text-gray-500">BUY NOW</div></div></div><div className="grid grid-cols-2 gap-2 mt-4"><MiniStat label="WAIT" value={`${procurement.waitQuantityMt.toLocaleString()} MT`}/><MiniStat label="LANDED FREIGHT" value={`$${procurement.landedFreightCostUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}/></div><button onClick={e => { e.stopPropagation(); onNavigateView('PROC'); }} className="w-full mt-3 border border-[#333] hover:border-[#F27D26] text-[#F27D26] py-2 text-[9px] font-bold">OPEN PROCUREMENT →</button>
        </SignalPanel>
      </div>

      <IntegratedDecisionPanel lane={lane} ports={ports} vessels={vessels} quantityMt={quantityMt} laycanDays={laycanDays}/>
      <ScenarioAnalysisPanel lane={lane} ports={ports} vessels={vessels} quantityMt={quantityMt}/>

      <section className="border border-[#F27D26] bg-[#100b07] p-4 mb-3 shadow-[0_0_30px_rgba(242,125,38,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[#F27D26] text-sm font-bold">FREIGHT ECONOMIC IMPACT</div><div className="text-[9px] text-gray-500 mt-1">{opportunity.direction === 'BUY_NOW' ? 'EXPOSURE CREATED BY DELAY' : opportunity.direction === 'WAIT' ? 'MODELLED SAVING FROM WAITING' : 'MODELLED RATE DELTA'} • {quantityMt.toLocaleString()} MT</div></div><div className="text-right"><div className="text-[9px] text-gray-500">{opportunity.direction === 'BUY_NOW' ? 'DELAY EXPOSURE' : opportunity.direction === 'WAIT' ? 'POTENTIAL SAVING' : 'IMPACT'}</div><div className="text-2xl text-white font-black">${impact.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div></div></div>
        <div className="grid md:grid-cols-3 gap-2 mt-4"><EconomicStat label="CURRENT FREIGHT" value={`$${currentFreight.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}/><EconomicStat label={`${horizon}D MODELLED`} value={`$${modelledFreight.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}/><EconomicStat label="RATE DELTA" value={`${horizonChange >= 0 ? '+' : '-'}$${Math.abs(horizonRate - forecast.currentRate).toFixed(2)}/MT`}/></div>
        <div className="text-[9px] text-gray-500 mt-3">{opportunity.explanation} Modelled decision support only; excludes commodity price, financing, demurrage and execution effects.</div>
      </section>

      <section className="border border-[#333] bg-[#070707] p-4 mb-3"><div className="flex flex-wrap items-center justify-between gap-2 mb-3"><div className="flex items-center gap-2 text-white text-sm font-bold"><SlidersHorizontal className="w-4 h-4 text-[#F27D26]"/> MODEL EXPLAINABILITY</div><span className="text-[9px] text-gray-500">{forecast.modelName} • PROTOTYPE</span></div><div className="grid md:grid-cols-4 gap-2">{forecast.featureContributions.map(item => <button key={item.feature} onClick={() => setFocus('freight')} className="text-left bg-[#0c0c0c] border border-[#242424] hover:border-[#F27D26] p-3"><div className="text-[9px] text-gray-500">{item.feature.toUpperCase()}</div><div className={item.impact >= 0 ? 'text-[#00FF41] font-bold text-base mt-1' : 'text-red-400 font-bold text-base mt-1'}>{item.impact >= 0 ? '+' : ''}{item.impact.toFixed(2)}</div><Meter value={Math.min(100, Math.abs(item.impact) * 10)}/></button>)}</div></section>

      <footer className="flex flex-wrap justify-between gap-2 text-[8px] text-gray-600 py-2"><span>DEMO / DECISION-SUPPORT DATA • NO LIVE BROKER QUOTE OR CHARTER EXECUTION</span><span>Inputs update forecast, vessel screen, port pressure, procurement and integrated decision.</span></footer>
    </div>
  </div>;
};

const Kpi: React.FC<{ label: string; value: string; sub: string; tone: 'neutral' | 'green' | 'red' | 'amber' | 'cyan'; icon?: React.ReactNode; onClick: () => void }> = ({ label, value, sub, tone, icon, onClick }) => {
  const toneClass = tone === 'green' ? 'text-[#00FF41]' : tone === 'red' ? 'text-red-400' : tone === 'cyan' ? 'text-cyan-300' : tone === 'amber' ? 'text-[#F27D26]' : 'text-white';
  return <button onClick={onClick} className="text-left border border-[#292929] bg-[#080808] hover:border-[#F27D26] hover:-translate-y-[1px] transition-all p-3 min-h-[92px]"><div className="text-[9px] text-gray-500 flex items-center justify-between"><span>{label}</span>{icon && React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}</div><div className={`text-xl font-black mt-2 ${toneClass}`}>{value}</div><div className="text-[8px] text-gray-600 mt-1">{sub}</div></button>;
};

const ForecastRow: React.FC<{ label: string; value: number; active?: boolean }> = ({ label, value, active }) => <div className={`flex items-center justify-between border-b border-[#191919] py-2 ${active ? 'text-[#F27D26]' : ''}`}><span className="text-[8px] text-gray-500">{label}</span><span className="text-sm text-white font-bold">${value.toFixed(2)}</span></div>;
const SparklineBadge: React.FC<{ score: number }> = ({ score }) => <div className="text-right"><div className="text-[8px] text-gray-500">STACK SCORE</div><div className="text-[#F27D26] font-bold">{score.toFixed(0)}<span className="text-gray-600">/100</span></div></div>;
const Meter: React.FC<{ value: number }> = ({ value }) => <div className="h-1.5 bg-[#181818] mt-2 overflow-hidden"><div className="h-full bg-[#F27D26] transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></div>;
const MiniStat: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="border border-[#222] bg-[#0b0b0b] p-2"><div className="text-[8px] text-gray-600">{label}</div><div className="text-white text-[11px] font-bold mt-1 truncate">{value}</div></div>;
const EconomicStat: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="border border-[#2b1d13] bg-[#0b0806] p-3"><div className="text-[8px] text-gray-500">{label}</div><div className="text-white text-sm font-bold mt-1">{value}</div></div>;
const ChainCard: React.FC<{ step: string; title: string; value: string; detail: string; icon: React.ReactNode; active?: boolean; onClick: () => void }> = ({ step, title, value, detail, icon, active, onClick }) => <button onClick={onClick} className={`text-left border p-3 transition-all hover:-translate-y-[1px] ${active ? 'border-[#F27D26] bg-[#120d08]' : 'border-[#292929] bg-[#0b0b0b] hover:border-[#F27D26]'}`}><div className="flex items-center justify-between"><span className="text-[8px] text-gray-600">{step}</span><span className="text-[#F27D26]">{React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}</span></div><div className="text-[9px] text-gray-500 mt-2">{title}</div><div className="text-white font-bold text-sm mt-1 truncate">{value}</div><div className="text-[8px] text-gray-600 mt-1">{detail}</div></button>;
const SignalPanel: React.FC<{ title: string; icon: React.ReactNode; focus: boolean; onClick: () => void; children: React.ReactNode }> = ({ title, icon, focus, onClick, children }) => <button onClick={onClick} className={`text-left border p-4 transition-all ${focus ? 'border-[#F27D26] bg-[#0b0b0b]' : 'border-[#333] bg-[#070707] hover:border-[#F27D26]'}`}><div className="flex items-center gap-2 text-[#F27D26] text-xs font-bold mb-4">{React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}{title}</div>{children}</button>;

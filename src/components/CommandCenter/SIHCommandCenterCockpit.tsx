import React, { useMemo, useState } from 'react';
import { Anchor, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BrainCircuit, Gauge, PackageSearch, RefreshCw, Ship, Sparkles, Target, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import { FreightLane, Port, Vessel } from '../../types';
import { mlForecastFreight } from '../../utils/mlFreightEngine';
import { buildCharterRecommendation } from '../../utils/charterEngine';
import { buildProcurementRecommendation } from '../../utils/procurementEngine';
import { calculateFreightOpportunity } from '../../utils/freightOpportunityEngine';
import { buildIntegratedDecision } from '../../utils/integratedDecisionEngine';
import { IntegratedDecisionPanel } from '../Charter/IntegratedDecisionPanel';
import { ScenarioAnalysisPanel } from './ScenarioAnalysisPanel';

interface Props {
  freightLanes: FreightLane[];
  ports: Port[];
  vessels: Vessel[];
  onNavigateView: (view: 'FCST' | 'PORT' | 'VSL' | 'PROC' | 'CHART') => void;
}

type Horizon = 7 | 14 | 30;
type Focus = 'decision' | 'freight' | 'port' | 'vessel' | 'procurement';

const money = (value: number, digits = 2) => `$${value.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;

export const SIHCommandCenterCockpit: React.FC<Props> = ({ freightLanes, ports, vessels, onNavigateView }) => {
  const lanes = freightLanes.filter(lane => lane.type === 'DRY_BULK').slice(0, 8);
  const [laneId, setLaneId] = useState(lanes[0]?.id ?? '');
  const [quantity, setQuantity] = useState(60000);
  const [laycan, setLaycan] = useState(14);
  const [horizon, setHorizon] = useState<Horizon>(30);
  const [focus, setFocus] = useState<Focus>('decision');
  const [refresh, setRefresh] = useState(0);

  const lane = lanes.find(item => item.id === laneId) ?? lanes[0];
  const forecast = useMemo(() => lane ? mlForecastFreight(lane, ports, vessels) : null, [lane, ports, vessels, refresh]);
  const charter = useMemo(() => lane ? buildCharterRecommendation({ laneId: lane.id, cargoType: lane.type, quantityMt: quantity, laycanDays: laycan }, freightLanes, ports, vessels) : null, [lane, quantity, laycan, freightLanes, ports, vessels]);
  const procurement = useMemo(() => lane ? buildProcurementRecommendation('DRY_BULK', quantity, [lane], ports, lane.destinationPort) : null, [lane, quantity, ports]);
  const integrated = useMemo(() => lane ? buildIntegratedDecision(lane, ports, vessels, quantity, laycan) : null, [lane, ports, vessels, quantity, laycan]);
  const opportunity = useMemo(() => lane && forecast ? calculateFreightOpportunity(lane, forecast, quantity) : null, [lane, forecast, quantity]);

  if (!lane || !forecast || !integrated || !procurement || !opportunity) return <div className="h-full bg-black p-6 text-gray-500">NO SIH DRY-BULK DATA AVAILABLE</div>;

  const destination = ports.find(port => port.code === lane.destinationPort);
  const vessel = integrated.vessels[0] ?? charter?.matches[0];
  const rate = horizon === 7 ? forecast.forecast7d : horizon === 14 ? forecast.forecast14d : forecast.forecast30d;
  const change = ((rate - forecast.currentRate) / Math.max(forecast.currentRate, 0.01)) * 100;
  const signal = change >= 1.5 ? 'UP' : change <= -1.5 ? 'DOWN' : 'FLAT';
  const portRisk = Math.round(integrated.congestion.forecast14d);
  const action = integrated.action;
  const actionText = action === 'FIX NOW' ? 'SECURE FREIGHT' : action === 'SPLIT' ? 'SPLIT EXPOSURE' : action === 'WAIT' ? 'WAIT FOR WINDOW' : 'WATCH MARKET';
  const currentFreight = forecast.currentRate * quantity;
  const modelledFreight = rate * quantity;
  const impact = Math.abs(modelledFreight - currentFreight);
  const history = lane.historicalRates.slice(-18);
  const points = [...history.map(item => item.rate), forecast.forecast7d, forecast.forecast14d, forecast.forecast30d];
  const min = Math.min(...points) * 0.96;
  const max = Math.max(...points) * 1.04;
  const svgPoints = points.map((value, index) => ({ value, x: 24 + (index / Math.max(points.length - 1, 1)) * 650, y: 170 - ((value - min) / Math.max(max - min, 0.01)) * 125 }));
  const path = svgPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const forecastPath = svgPoints.slice(history.length - 1).map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');

  return <div className="h-full overflow-auto bg-[#020202] text-[#d4d4d4] font-mono p-3 md:p-4">
    <div className="max-w-[1700px] mx-auto space-y-3">
      <header className="border border-[#303030] bg-[#070707] shadow-[0_0_45px_rgba(242,125,38,0.07)]">
        <div className="px-4 py-3 flex flex-wrap justify-between gap-3 border-b border-[#252525]">
          <div><div className="text-white text-lg font-black"><span className="text-[#F27D26]">◉</span> SIH COMMAND CENTER <span className="ml-2 border border-[#315e3d] text-[#5ee58b] px-2 py-1 text-[8px]">DECISION COCKPIT</span></div><div className="text-[9px] text-gray-500 mt-1">SIH26006 • EAST COAST INDIA • CARGO → FREIGHT → PORT → VESSEL → PROCUREMENT → CHARTER</div></div>
          <div className="flex gap-2 items-center text-[8px]"><span className="border border-[#244d31] text-[#5ee58b] px-2 py-1">● MODEL ACTIVE</span><span className="border border-[#24404a] text-cyan-300 px-2 py-1">● AIS DEMO</span><button onClick={() => setRefresh(value => value + 1)} className="border border-[#444] hover:border-[#F27D26] px-2 py-1"><RefreshCw className="inline w-3 h-3 mr-1"/>RECALCULATE</button></div>
        </div>
        <div className="p-4 grid lg:grid-cols-[1fr_1.7fr_1fr] gap-4 items-end">
          <Field label="CARGO REQUIREMENT"><div className="flex items-center gap-2"><input type="number" min={1000} step={1000} value={quantity} onChange={event => setQuantity(Math.max(1000, Number(event.target.value) || 1000))} className="w-36 bg-black border border-[#555] text-white text-lg font-black px-3 py-2 outline-none focus:border-[#F27D26]"/><span className="text-[9px] text-gray-500">MT</span></div><input type="range" min={10000} max={150000} step={5000} value={quantity} onChange={event => setQuantity(Number(event.target.value))} className="w-full mt-2 accent-[#F27D26]"/></Field>
          <Field label="EAST COAST LANE"><select value={lane.id} onChange={event => setLaneId(event.target.value)} className="w-full bg-black border border-[#555] text-white px-3 py-2 outline-none focus:border-[#F27D26]">{lanes.map(item => <option key={item.id} value={item.id}>{item.code} — {item.originPort} → {item.destinationPort}</option>)}</select><div className="text-[8px] text-gray-600 mt-2">{lane.name} • {lane.distanceNm.toLocaleString()} NM</div></Field>
          <Field label="LAYCAN"><div className="grid grid-cols-4 gap-1">{[7, 14, 21, 30].map(days => <button key={days} onClick={() => setLaycan(days)} className={`py-2 border text-[9px] font-bold ${laycan === days ? 'bg-[#F27D26] text-black border-[#F27D26]' : 'border-[#333] text-gray-500 hover:text-white'}`}>{days}D</button>)}</div></Field>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
        <Kpi label="SPOT FREIGHT" value={money(forecast.currentRate)} sub="CURRENT $/MT" onClick={() => setFocus('freight')} />
        <Kpi label={`${horizon}D FORECAST`} value={money(rate)} sub={`${change >= 0 ? '+' : ''}${change.toFixed(1)}%`} hot={signal === 'UP'} good={signal === 'DOWN'} onClick={() => setFocus('freight')} />
        <Kpi label="MARKET SIGNAL" value={signal} sub={signal === 'UP' ? 'RISING PRESSURE' : signal === 'DOWN' ? 'FALLING PRESSURE' : 'NEUTRAL'} hot={signal === 'UP'} good={signal === 'DOWN'} icon={signal === 'UP' ? <TrendingUp/> : signal === 'DOWN' ? <TrendingDown/> : <ArrowRight/>} onClick={() => setFocus('freight')} />
        <Kpi label="DECISION CONFIDENCE" value={`${integrated.confidence.toFixed(0)}%`} sub="INTEGRATED STACK" cyan icon={<Gauge/>} onClick={() => setFocus('decision')} />
        <Kpi label="PORT RISK / 14D" value={`${portRisk}/100`} sub={`${integrated.congestion.delayDays.toFixed(1)}D DELAY`} hot={portRisk >= 70} good={portRisk < 50} icon={<Anchor/>} onClick={() => setFocus('port')} />
        <Kpi label="RECOMMENDED ACTION" value={action} sub={actionText} hot={action === 'FIX NOW'} good={action === 'WAIT'} icon={<Zap/>} onClick={() => setFocus('decision')} />
      </div>

      <div className="grid xl:grid-cols-[1.7fr_0.85fr] gap-3">
        <section className="border border-[#303030] bg-[#070707]">
          <div className="p-3 border-b border-[#252525] flex flex-wrap justify-between gap-2"><div><div className="text-white font-bold text-sm"><BarChart3 className="inline w-4 h-4 text-[#F27D26] mr-2"/>FREIGHT INTELLIGENCE</div><div className="text-[8px] text-gray-600 mt-1">CLICK 7D / 14D / 30D TO CHANGE THE LIVE SIGNAL</div></div><div className="flex gap-1">{([7, 14, 30] as Horizon[]).map(days => <button key={days} onClick={() => setHorizon(days)} className={`px-4 py-1 text-[9px] font-black ${horizon === days ? 'bg-[#F27D26] text-black' : 'border border-[#333] text-gray-500 hover:text-white'}`}>{days}D</button>)}</div></div>
          <div className="p-3"><div className="flex justify-between items-end"><div><div className="text-[8px] text-gray-600">SELECTED FORECAST</div><div className="text-3xl text-white font-black">{money(rate)}<span className="text-[9px] text-gray-600 ml-2">/MT</span></div></div><div className={`text-2xl font-black ${signal === 'UP' ? 'text-red-400' : signal === 'DOWN' ? 'text-[#00FF41]' : 'text-[#F27D26]'}`}>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</div></div><div className="h-[260px] mt-2"><svg viewBox="0 0 700 205" className="w-full h-full" aria-label="Freight forecast chart">{[45,90,135,180].map(y => <line key={y} x1="24" x2="675" y1={y} y2={y} stroke="#1b1b1b"/>)}<path d={path} fill="none" stroke="#cfcfcf" strokeWidth="2"/><path d={forecastPath} fill="none" stroke="#F27D26" strokeWidth="3" strokeDasharray="7 5"/>{svgPoints.map((point,index) => index >= history.length && <g key={point.x} onClick={() => setHorizon(([7,14,30] as Horizon[])[index - history.length])} className="cursor-pointer"><circle cx={point.x} cy={point.y} r="6" fill="#F27D26"/><text x={point.x} y={point.y - 10} textAnchor="middle" fill="#aaa" fontSize="8">{['7D','14D','30D'][index - history.length]}</text></g>)}</svg></div><div className="text-[8px] text-gray-600">{forecast.modelName} • {forecast.confidence.toFixed(0)}% model confidence • MAE {forecast.metrics.mae.toFixed(1)} • MAPE {forecast.metrics.mape.toFixed(1)}%</div></div>
        </section>

        <section className="border border-[#F27D26] bg-[#090705] shadow-[0_0_35px_rgba(242,125,38,0.08)]"><div className="p-3 border-b border-[#292929] flex justify-between"><div><div className="text-white text-sm font-black"><BrainCircuit className="inline w-4 h-4 text-[#F27D26] mr-2"/>DECISION ENGINE</div><div className="text-[8px] text-gray-600 mt-1">FOUR SIGNALS → ONE ACTION</div></div><div className="text-[#F27D26] font-black">{integrated.score.toFixed(0)}/100</div></div><div className="p-4"><div className="flex justify-between items-end"><div><div className="text-[8px] text-gray-600">RECOMMENDED ACTION</div><div className={`text-3xl font-black ${action === 'FIX NOW' ? 'text-red-400' : action === 'WAIT' ? 'text-[#00FF41]' : 'text-[#F27D26]'}`}>{action}</div><div className="text-[8px] text-gray-600">{actionText}</div></div><div className="text-right"><div className="text-[8px] text-gray-600">CONFIDENCE</div><div className="text-2xl text-white font-black">{integrated.confidence.toFixed(0)}%</div></div></div><div className="h-2 bg-[#181818] mt-4"><div className="h-full bg-[#F27D26]" style={{ width: `${Math.max(0, Math.min(100, integrated.score))}%` }}/></div><div className="grid grid-cols-2 gap-2 mt-4">{integrated.factors.map(factor => <button key={factor.label} onClick={() => setFocus(factor.label.toLowerCase().includes('freight') ? 'freight' : factor.label.toLowerCase().includes('port') ? 'port' : factor.label.toLowerCase().includes('vessel') ? 'vessel' : 'procurement')} className="text-left border border-[#242424] bg-[#0c0c0c] hover:border-[#F27D26] p-2"><div className="text-[7px] text-gray-600">{factor.label.toUpperCase()} • {factor.weight}%</div><div className={factor.value >= 0 ? 'text-[#00FF41] font-bold' : 'text-red-400 font-bold'}>{factor.value >= 0 ? '+' : ''}{factor.value.toFixed(1)}</div><div className="text-[7px] text-gray-600 mt-1">{factor.interpretation}</div></button>)}</div></div></section>
      </div>

      <section className="border border-[#303030] bg-[#070707]"><div className="p-3 border-b border-[#252525] flex justify-between"><div className="text-white text-sm font-black"><Target className="inline w-4 h-4 text-[#F27D26] mr-2"/>DECISION CHAIN</div><div className="text-[8px] text-gray-600">CLICK TO INSPECT</div></div><div className="p-3 grid md:grid-cols-5 gap-2"><Chain title="CARGO" value={`${quantity.toLocaleString()} MT`} active={focus === 'procurement'} onClick={() => setFocus('procurement')} icon={<PackageSearch/>}/><Chain title="FREIGHT" value={`${money(forecast.currentRate)} → ${money(rate)}`} active={focus === 'freight'} onClick={() => setFocus('freight')} icon={signal === 'DOWN' ? <ArrowDownRight/> : <ArrowUpRight/>}/><Chain title="PORT" value={`${portRisk}/100`} active={focus === 'port'} onClick={() => setFocus('port')} icon={<Anchor/>}/><Chain title="VESSEL" value={vessel?.vessel.name ?? 'NO MATCH'} active={focus === 'vessel'} onClick={() => setFocus('vessel')} icon={<Ship/>}/><Chain title="DECISION" value={action} active={focus === 'decision'} onClick={() => setFocus('decision')} icon={<Zap/>}/></div></section>

      <Inspector focus={focus} forecast={forecast} integrated={integrated} procurement={procurement} vessel={vessel} destination={destination} portRisk={portRisk} quantity={quantity} rate={rate} horizon={horizon} change={change} lane={lane} onNavigate={onNavigateView}/>

      <div className="grid lg:grid-cols-2 gap-3"><IntegratedDecisionPanel lane={lane} ports={ports} vessels={vessels} quantityMt={quantity} laycanDays={laycan}/><ScenarioAnalysisPanel lane={lane} ports={ports} vessels={vessels} quantityMt={quantity}/></div>

      <section className="border border-[#F27D26] bg-[#100b07] p-4"><div className="flex justify-between items-end gap-3"><div><div className="text-[#F27D26] text-sm font-black">FREIGHT ECONOMIC IMPACT</div><div className="text-[8px] text-gray-600 mt-1">{quantity.toLocaleString()} MT × selected {horizon}D rate</div></div><div className="text-3xl text-white font-black">{money(impact, 0)}</div></div><div className="grid md:grid-cols-3 gap-2 mt-4"><Economic label="CURRENT FREIGHT" value={money(currentFreight, 0)}/><Economic label="MODELLED FREIGHT" value={money(modelledFreight, 0)}/><Economic label="RATE DELTA" value={`${change >= 0 ? '+' : '-'}${money(Math.abs(rate - forecast.currentRate))}/MT`}/></div><div className="text-[8px] text-gray-600 mt-3">{opportunity.explanation} Modelled decision support only; excludes commodity price, financing, demurrage and execution effects.</div></section>
    </div>
  </div>;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => <div><div className="text-[8px] text-gray-600 mb-1">{label}</div>{children}</div>;
const Kpi: React.FC<{ label: string; value: string; sub: string; hot?: boolean; good?: boolean; cyan?: boolean; icon?: React.ReactNode; onClick: () => void }> = ({ label, value, sub, hot, good, cyan, icon, onClick }) => { const color = hot ? 'text-red-400' : good ? 'text-[#00FF41]' : cyan ? 'text-cyan-300' : 'text-white'; return <button onClick={onClick} className="text-left border border-[#292929] bg-[#080808] hover:border-[#F27D26] hover:-translate-y-0.5 transition-all p-3 min-h-[92px]"><div className="flex justify-between text-[8px] text-gray-600"><span>{label}</span>{icon}</div><div className={`text-xl font-black mt-2 ${color}`}>{value}</div><div className="text-[7px] text-gray-700 mt-1">{sub}</div></button>; };
const Chain: React.FC<{ title: string; value: string; active: boolean; onClick: () => void; icon: React.ReactNode }> = ({ title, value, active, onClick, icon }) => <button onClick={onClick} className={`text-left border p-3 ${active ? 'border-[#F27D26] bg-[#120d08]' : 'border-[#292929] bg-[#0b0b0b] hover:border-[#555]'}`}><div className="flex justify-between text-[#F27D26]"><span className="text-[8px] text-gray-600">{title}</span>{icon}</div><div className="text-white text-sm font-black mt-2 truncate">{value}</div></button>;
const Economic: React.FC<{ label: string; value: string }> = ({ label, value }) => <div className="border border-[#2c1d12] bg-[#0b0806] p-3"><div className="text-[7px] text-gray-600">{label}</div><div className="text-white font-black mt-1">{value}</div></div>;

const Inspector: React.FC<{ focus: Focus; forecast: ReturnType<typeof mlForecastFreight>; integrated: ReturnType<typeof buildIntegratedDecision>; procurement: ReturnType<typeof buildProcurementRecommendation>; vessel: ReturnType<typeof buildIntegratedDecision>['vessels'][number] | undefined; destination?: Port; portRisk: number; quantity: number; rate: number; horizon: Horizon; change: number; lane: FreightLane; onNavigate: Props['onNavigateView'] }> = ({ focus, forecast, integrated, procurement, vessel, destination, portRisk, quantity, rate, horizon, change, lane, onNavigate }) => {
  const title = focus === 'freight' ? 'FREIGHT SIGNAL' : focus === 'port' ? 'PORT PRESSURE' : focus === 'vessel' ? 'VESSEL FIT' : focus === 'procurement' ? 'PROCUREMENT WINDOW' : 'DECISION RATIONALE';
  return <section className="border border-[#303030] bg-[#070707]"><div className="p-3 border-b border-[#252525] flex justify-between"><div className="text-white text-sm font-black">LIVE INSPECTOR — {title}</div><Sparkles className="w-4 h-4 text-[#F27D26]"/></div><div className="p-4">{focus === 'freight' && <div className="flex justify-between items-center gap-4"><div><div className="text-4xl text-white font-black">{money(rate)} <span className="text-[9px] text-gray-600">$/MT</span></div><div className="text-sm text-[#F27D26] font-black mt-1">{change >= 0 ? '+' : ''}{change.toFixed(1)}% over {horizon} days</div><div className="text-[8px] text-gray-600 mt-2">Confidence {forecast.confidence.toFixed(0)}% • MAPE {forecast.metrics.mape.toFixed(1)}%</div></div><button onClick={() => onNavigate('FCST')} className="border border-[#333] hover:border-[#F27D26] text-[#F27D26] px-4 py-3 text-[9px]">OPEN FREIGHT →</button></div>}{focus === 'port' && <div className="flex justify-between items-center gap-4"><div><div className={`text-4xl font-black ${portRisk >= 70 ? 'text-red-400' : portRisk >= 50 ? 'text-[#F27D26]' : 'text-[#00FF41]'}`}>{portRisk}/100</div><div className="text-[8px] text-gray-600">14D PROJECTED CONGESTION • {integrated.congestion.delayDays.toFixed(1)}D DELAY</div></div><div className="grid grid-cols-3 gap-2"><Economic label="DESTINATION" value={destination?.name ?? lane.destinationPort}/><Economic label="WAIT" value={destination ? `${destination.avgWaitDays.toFixed(1)}D` : '—'}/><Economic label="WAITING" value={destination ? String(destination.vesselsWaiting) : '—'}/></div><button onClick={() => onNavigate('PORT')} className="border border-[#333] hover:border-[#F27D26] text-[#F27D26] px-4 py-3 text-[9px]">OPEN PORT →</button></div>}{focus === 'vessel' && <div className="flex justify-between items-center gap-4"><div><div className="text-2xl text-white font-black">{vessel?.vessel.name ?? 'NO MATCH'}</div><div className="text-[8px] text-gray-600 mt-1">BEST FIT FOR {quantity.toLocaleString()} MT</div></div><div className="grid grid-cols-3 gap-2"><Economic label="FIT" value={vessel ? `${vessel.score.toFixed(0)}/100` : '—'}/><Economic label="DWT" value={vessel ? vessel.vessel.dwt.toLocaleString() : '—'}/><Economic label="WAIT" value={vessel ? `${vessel.vessel.congestionWaitHours.toFixed(0)}H` : '—'}/></div><button onClick={() => onNavigate('VSL')} className="border border-[#333] hover:border-[#F27D26] text-[#F27D26] px-4 py-3 text-[9px]">OPEN VESSEL →</button></div>}{focus === 'procurement' && <div className="flex justify-between items-center gap-4"><div><div className={`text-2xl font-black ${procurement.action === 'BUY NOW' ? 'text-red-400' : procurement.action === 'WAIT' ? 'text-[#00FF41]' : 'text-[#F27D26]'}`}>{procurement.action}</div><div className="text-[8px] text-gray-600 mt-1">{quantity.toLocaleString()} MT PROCUREMENT PLAN</div></div><div className="grid grid-cols-3 gap-2"><Economic label="BUY NOW" value={`${procurement.buyNowQuantityMt.toLocaleString()} MT`}/><Economic label="WAIT" value={`${procurement.waitQuantityMt.toLocaleString()} MT`}/><Economic label="LANDED" value={money(procurement.landedFreightCostUsd, 0)}/></div><button onClick={() => onNavigate('PROC')} className="border border-[#333] hover:border-[#F27D26] text-[#F27D26] px-4 py-3 text-[9px]">OPEN PROCUREMENT →</button></div>}{focus === 'decision' && <div className="grid lg:grid-cols-[1fr_2fr_auto] gap-4 items-center"><div><div className={`text-3xl font-black ${integrated.action === 'FIX NOW' ? 'text-red-400' : integrated.action === 'WAIT' ? 'text-[#00FF41]' : 'text-[#F27D26]'}`}>{integrated.action}</div><div className="text-[8px] text-gray-600 mt-1">{quantity.toLocaleString()} MT • {lane.code}</div></div><div className="space-y-2">{integrated.explanation.slice(0, 3).map((item, index) => <div key={index} className="text-[8px] text-gray-500">• {item}</div>)}</div><button onClick={() => onNavigate('CHART')} className="border border-[#333] hover:border-[#F27D26] text-[#F27D26] px-4 py-3 text-[9px]">OPEN CHARTER →</button></div>}</div></section>;
};

import React, { useMemo, useState } from 'react';
import { Anchor, ArrowRight, BrainCircuit, ShieldAlert, Ship, Target } from 'lucide-react';
import { FreightLane, Port, Vessel } from '../../types';
import { buildCharterRecommendation } from '../../utils/charterEngine';
import { RouteOptimizationPanel } from './RouteOptimizationPanel';

interface Props { freightLanes: FreightLane[]; ports: Port[]; vessels: Vessel[]; }

export const CharterRecommendationView: React.FC<Props> = ({ freightLanes, ports, vessels }) => {
  const [laneId, setLaneId] = useState(freightLanes[0]?.id ?? '');
  const [quantityMt, setQuantityMt] = useState(50000);
  const [laycanDays, setLaycanDays] = useState(14);
  const lane = freightLanes.find(item => item.id === laneId) ?? freightLanes[0];
  const recommendation = useMemo(() => lane ? buildCharterRecommendation({ laneId: lane.id, cargoType: lane.type, quantityMt, laycanDays }, freightLanes, ports, vessels) : null, [lane, quantityMt, laycanDays, freightLanes, ports, vessels]);

  if (!recommendation || !lane) return <div className="p-6 text-gray-500 bg-black h-full">NO CHARTER DATA AVAILABLE</div>;

  return <div className="h-full overflow-auto bg-black text-[#d1d1d1] font-mono p-3">
    <div className="flex flex-wrap justify-between gap-3 border-b border-[#333] pb-2 mb-3">
      <div><div className="flex items-center gap-2 text-white font-bold text-sm"><BrainCircuit className="w-4 h-4 text-[#F27D26]"/>CHARTER DECISION ENGINE</div><div className="text-[10px] text-gray-500 mt-1">CARGO → VESSEL → FREIGHT FORECAST → PORT RISK → ROUTE → FIX/WATCH/WAIT</div></div>
      <div className="flex gap-2">
        <select value={laneId} onChange={e => setLaneId(e.target.value)} className="bg-[#111] border border-[#444] text-white px-2 py-1 text-xs">{freightLanes.map(item => <option key={item.id} value={item.id}>{item.code}</option>)}</select>
        <input type="number" min="1000" value={quantityMt} onChange={e => setQuantityMt(Number(e.target.value) || 0)} className="w-24 bg-[#111] border border-[#444] text-white px-2 py-1 text-xs" title="Cargo quantity in metric tonnes" />
        <input type="number" min="1" max="60" value={laycanDays} onChange={e => setLaycanDays(Number(e.target.value) || 1)} className="w-20 bg-[#111] border border-[#444] text-white px-2 py-1 text-xs" title="Laycan window in days" />
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
      <Metric label="CARGO" value={`${quantityMt.toLocaleString()} MT`} />
      <Metric label="ROUTE" value={`${recommendation.lane.originPort} → ${recommendation.lane.destinationPort}`} />
      <Metric label="30D FREIGHT" value={`${recommendation.forecast.changePct >= 0 ? '+' : ''}${recommendation.forecast.changePct.toFixed(1)}%`} />
      <Metric label="CONGESTION RISK" value={`${recommendation.congestionRisk}/100`} />
      <div className="border border-[#F27D26] bg-[#16100b] p-2"><div className="text-[9px] text-gray-500">ACTION</div><div className="text-[#F27D26] text-lg font-bold">{recommendation.decision}</div></div>
    </div>

    <div className="grid lg:grid-cols-[1.25fr_2fr] gap-3">
      <section className="border border-[#333] bg-[#080808] p-3">
        <div className="flex items-center gap-2 text-[#F27D26] font-bold text-xs mb-3"><Target className="w-3.5 h-3.5"/>DECISION RATIONALE</div>
        <div className="space-y-2 text-[10px]">{recommendation.rationale.map((item, index) => <div key={index} className="border-l-2 border-[#444] pl-2 text-gray-300">{item}</div>)}</div>
        <div className="mt-4 border-t border-[#222] pt-3 text-[10px] text-gray-500">MODEL STATUS: prototype baseline. Forecast is derived from the repository's historical freight series; vessel and port fields are decision-support data, not a live booking feed.</div>
      </section>

      <section className="border border-[#333] bg-[#080808] p-3">
        <div className="flex items-center justify-between mb-3"><div className="flex items-center gap-2 text-[#00FF41] font-bold text-xs"><Ship className="w-3.5 h-3.5"/>TOP VESSEL MATCHES</div><span className="text-[9px] text-gray-500">DWT / TIMING / PORT / RISK</span></div>
        <div className="space-y-2">{recommendation.matches.map(match => <div key={match.vessel.id} className="grid grid-cols-[1.5fr_.55fr_.55fr_.55fr_.55fr] gap-2 items-center border border-[#222] bg-[#0d0d0d] p-2 text-[10px]">
          <div><div className="text-white font-bold">{match.vessel.name}</div><div className="text-gray-500">{match.vessel.type} • {match.vessel.dwt.toLocaleString()} DWT</div><div className="text-gray-600 mt-1">{match.reasons.join(' • ')}</div></div>
          <Score label="MATCH" value={match.score}/><Score label="CAP" value={Math.round(match.capacityFit)}/><Score label="TIME" value={Math.round(match.timingFit)}/><Score label="RISK" value={match.riskScore}/>
        </div>)}{recommendation.matches.length === 0 && <div className="p-5 text-center text-red-400">NO FEASIBLE VESSEL FOUND FOR CURRENT CARGO SCREEN</div>}</div>
      </section>
    </div>

    <div className="grid md:grid-cols-3 gap-2 mt-3">
      <Info icon={<Anchor/>} label="ORIGIN" value={recommendation.originPort ? `${recommendation.originPort.name} • ${recommendation.originPort.congestionScore}/100` : recommendation.lane.originPort}/>
      <Info icon={<ArrowRight/>} label="DESTINATION" value={recommendation.destinationPort ? `${recommendation.destinationPort.name} • ${recommendation.destinationPort.congestionScore}/100` : recommendation.lane.destinationPort}/>
      <Info icon={<ShieldAlert/>} label="CHARTER LOGIC" value={recommendation.decision === 'FIX NOW' ? 'Rising freight + elevated congestion: secure suitable tonnage early.' : recommendation.decision === 'WAIT' ? 'Model points lower while congestion is manageable: preserve optionality.' : 'Mixed signals: monitor rate direction, vessel supply and port conditions.'}/>
    </div>

    <RouteOptimizationPanel lane={lane} freightLanes={freightLanes} ports={ports} />
  </div>;
};

const Metric: React.FC<{label:string;value:string}> = ({label,value}) => <div className="border border-[#333] bg-[#080808] p-2 min-h-[64px]"><div className="text-[9px] text-gray-500">{label}</div><div className="text-white font-bold mt-1">{value}</div></div>;
const Score: React.FC<{label:string;value:number}> = ({label,value}) => <div className="text-center"><div className="text-[8px] text-gray-600">{label}</div><div className={value >= 75 ? 'text-[#00FF41] font-bold' : value >= 50 ? 'text-[#F27D26] font-bold' : 'text-red-400 font-bold'}>{value}</div></div>;
const Info: React.FC<{icon:React.ReactElement<{className?:string}>;label:string;value:string}> = ({icon,label,value}) => <div className="border border-[#333] bg-[#080808] p-2"><div className="flex items-center gap-1 text-[#F27D26] text-[9px] font-bold">{React.cloneElement(icon, {className:'w-3 h-3'})}{label}</div><div className="text-[10px] text-white mt-1 leading-relaxed">{value}</div></div>;

import React, { useMemo } from 'react';
import { BrainCircuit, Ship, Timer, TrendingDown, TrendingUp } from 'lucide-react';
import { FreightLane, Port, Vessel } from '../../types';
import { buildIntegratedDecision } from '../../utils/integratedDecisionEngine';
import { DecisionExplainabilityPanel } from './DecisionExplainabilityPanel';

interface Props { lane: FreightLane; ports: Port[]; vessels: Vessel[]; quantityMt: number; laycanDays: number; }

export const IntegratedDecisionPanel: React.FC<Props> = ({ lane, ports, vessels, quantityMt, laycanDays }) => {
  const decision = useMemo(() => buildIntegratedDecision(lane, ports, vessels, quantityMt, laycanDays), [lane, ports, vessels, quantityMt, laycanDays]);
  const top = decision.vessels[0];
  const trend = decision.forecast.direction;
  const trendIcon = trend === 'UP' ? <TrendingUp className="w-3.5 h-3.5"/> : <TrendingDown className="w-3.5 h-3.5"/>;
  const actionClass = decision.action === 'FIX NOW' ? 'text-[#00FF41]' : decision.action === 'WAIT' ? 'text-cyan-400' : 'text-[#F27D26]';
  return <>
    <section className="border border-[#F27D26] bg-[#120d08] p-3 mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><div><div className="flex items-center gap-2 text-white font-bold text-xs"><BrainCircuit className="w-3.5 h-3.5 text-[#F27D26]"/>INTEGRATED CHARTER + PROCUREMENT OPTIMIZER</div><div className="text-[9px] text-gray-500 mt-1">FREIGHT FORECAST • PORT CONGESTION • VESSEL FIT • PROCUREMENT • ONE DECISION</div></div><div className="text-[9px] text-gray-500">{lane.code}</div></div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-3"><Metric label="ACTION" value={decision.action} className={actionClass}/><Metric label="SCORE" value={`${decision.score.toFixed(0)}/100`}/><Metric label="CONFIDENCE" value={`${decision.confidence}%`}/><Metric label="FREIGHT" value={`${trend} ${trendIcon}`}/><Metric label="PORT 14D" value={`${decision.congestion.forecast14d.toFixed(0)}/100`}/><Metric label="TOP VESSEL" value={top ? top.vessel.name : 'NO MATCH'}/></div>
      <div className="grid lg:grid-cols-4 gap-2 text-[9px]">{decision.factors.map(factor => <div key={factor.label} className="border border-[#222] bg-[#0b0b0b] p-2"><div className="flex justify-between"><span className="text-gray-500">{factor.label}</span><span className="text-gray-700">{factor.weight}%</span></div><div className={factor.value >= 0 ? 'text-[#00FF41] font-bold mt-1' : 'text-red-400 font-bold mt-1'}>{factor.value >= 0 ? '+' : ''}{factor.value.toFixed(1)}</div></div>)}</div>
      <div className="grid md:grid-cols-3 gap-2 mt-3 text-[9px]"><div className="bg-[#0b0b0b] border border-[#222] p-2"><div className="text-gray-600">FREIGHT</div><div className="text-white font-bold mt-1">${decision.forecast.currentRate.toFixed(2)} → ${decision.forecast.forecast30d.toFixed(2)}</div><div className="text-gray-500 mt-1">30D {decision.forecast.change30dPct >= 0 ? '+' : ''}{decision.forecast.change30dPct.toFixed(1)}%</div></div><div className="bg-[#0b0b0b] border border-[#222] p-2"><div className="text-gray-600">PORT</div><div className="text-white font-bold mt-1">{decision.congestion.port.code} {decision.congestion.forecast14d.toFixed(0)}/100</div><div className="text-gray-500 mt-1"><Timer className="inline w-3 h-3 mr-1"/>{decision.congestion.delayDays.toFixed(1)}d indicative delay</div></div><div className="bg-[#0b0b0b] border border-[#222] p-2"><div className="text-gray-600">VESSEL</div><div className="text-white font-bold mt-1"><Ship className="inline w-3 h-3 mr-1 text-[#F27D26]"/>{top ? top.vessel.name : 'NO FEASIBLE MATCH'}</div><div className="text-gray-500 mt-1">{top ? `${top.score.toFixed(0)}/100 • ${top.vessel.dwt.toLocaleString()} DWT` : 'Screen capacity / route constraints.'}</div></div></div>
    </section>
    <DecisionExplainabilityPanel decision={decision}/>
  </>;
};

const Metric: React.FC<{label:string;value:string;className?:string}> = ({label,value,className='text-white'}) => <div className="border border-[#333] bg-[#080808] p-2 min-h-[58px]"><div className="text-[8px] text-gray-500">{label}</div><div className={`font-bold mt-1 text-[10px] flex items-center gap-1 ${className}`}>{value}</div></div>;

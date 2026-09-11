import React from 'react';
import { BrainCircuit, CheckCircle2 } from 'lucide-react';
import { IntegratedDecision } from '../../utils/integratedDecisionEngine';

export const DecisionExplainabilityPanel: React.FC<{ decision: IntegratedDecision }> = ({ decision }) => {
  const actionClass = decision.action === 'FIX NOW' ? 'text-[#00FF41]' : decision.action === 'WAIT' ? 'text-cyan-400' : 'text-[#F27D26]';
  return <section className="border border-[#F27D26] bg-[#100c08] p-3 mt-3">
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3"><div className="flex items-center gap-2 text-white font-bold text-xs"><BrainCircuit className="w-3.5 h-3.5 text-[#F27D26]"/>INTEGRATED DECISION / WHY</div><div className="text-[9px] text-gray-500">EXPLAINABLE DECISION SUPPORT</div></div>
    <div className="grid lg:grid-cols-[1fr_2fr] gap-3">
      <div className="border border-[#33271e] bg-[#0b0b0b] p-3"><div className="text-[9px] text-gray-500">RECOMMENDED ACTION</div><div className={`text-xl font-bold mt-1 ${actionClass}`}>{decision.action}</div><div className="text-[10px] text-gray-400 mt-2">Integrated score <span className="text-white font-bold">{decision.score.toFixed(0)}/100</span> • confidence <span className="text-white font-bold">{decision.confidence}%</span></div><div className="text-[9px] text-gray-600 mt-3">The score is a transparent weighted decision proxy. It does not execute a transaction or guarantee a market outcome.</div></div>
      <div className="grid md:grid-cols-2 gap-2">{decision.factors.map(factor => <div key={factor.label} className="border border-[#222] bg-[#0b0b0b] p-2"><div className="flex justify-between"><span className="text-white text-[9px] font-bold">{factor.label}</span><span className="text-gray-600 text-[8px]">{factor.weight}%</span></div><div className={factor.value >= 0 ? 'text-[#00FF41] font-bold mt-1' : 'text-red-400 font-bold mt-1'}>{factor.value >= 0 ? '+' : ''}{factor.value.toFixed(1)}</div><div className="text-[8px] text-gray-500 mt-1 leading-relaxed">{factor.interpretation}</div></div>)}</div>
    </div>
    <div className="mt-3 grid gap-1">{decision.explanation.map((item, index) => <div key={index} className="flex gap-2 items-start text-[9px] text-gray-300"><CheckCircle2 className="w-3 h-3 text-[#F27D26] shrink-0 mt-0.5"/>{item}</div>)}</div>
  </section>;
};

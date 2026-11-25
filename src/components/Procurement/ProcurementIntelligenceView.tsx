import React from 'react';
import { Factory, ShieldCheck, Target, Workflow } from 'lucide-react';
import { FreightLane, Port } from '../../types';
import { ProcurementIntelligencePanel } from '../Charter/ProcurementIntelligencePanel';

interface Props { freightLanes: FreightLane[]; ports: Port[]; }

export const ProcurementIntelligenceView: React.FC<Props> = ({ freightLanes, ports }) => (
  <div className="h-full overflow-auto bg-black text-[#d1d1d1] font-mono p-3">
    <div className="border-b border-[#333] pb-3 mb-3 flex flex-wrap items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-white font-bold text-sm"><Factory className="w-4 h-4 text-[#F27D26]"/>CARGO PROCUREMENT INTELLIGENCE</div>
        <div className="text-[10px] text-gray-500 mt-1">SIH26006 • OVERSEAS ORIGIN → EAST COAST INDIA → LANDED FREIGHT → PROCUREMENT TIMING</div>
      </div>
      <div className="text-[9px] text-[#00FF41] border border-[#1d4d2a] px-2 py-1">PROTOTYPE DECISION SUPPORT</div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
      <Signal icon={<Target/>} title="BUSINESS QUESTION" text="How much cargo should we procure, from where, and when?"/>
      <Signal icon={<Workflow/>} title="DECISION CHAIN" text="Origin + freight + forecast + congestion + transit → procurement action."/>
      <Signal icon={<ShieldCheck/>} title="OUTPUT" text="BUY NOW / WAIT / SPLIT PROCUREMENT with explainable route ranking."/>
    </div>

    <ProcurementIntelligencePanel freightLanes={freightLanes} ports={ports} />

    <div className="mt-3 border border-[#333] bg-[#080808] p-3 text-[9px] text-gray-500 leading-relaxed">
      <span className="text-[#F27D26] font-bold">DATA NOTE:</span> East Coast India lanes and port operating signals in this prototype are SIH-specific demonstration fixtures. Freight forecasts use the repository baseline trend model. No value shown here should be interpreted as a live market quote, supplier offer, vessel booking, or guaranteed forecast.
    </div>
  </div>
);

const Signal: React.FC<{icon: React.ReactElement<{className?: string}>; title: string; text: string}> = ({ icon, title, text }) => (
  <div className="border border-[#222] bg-[#0b0b0b] p-2">
    <div className="flex items-center gap-1 text-[#F27D26] text-[9px] font-bold">{React.cloneElement(icon, { className: 'w-3 h-3' })}{title}</div>
    <div className="text-gray-400 text-[10px] mt-1 leading-relaxed">{text}</div>
  </div>
);

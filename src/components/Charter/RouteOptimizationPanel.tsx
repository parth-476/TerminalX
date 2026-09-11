import React, { useMemo } from 'react';
import { ArrowRight, Gauge, Route, ShieldCheck, Timer } from 'lucide-react';
import { FreightLane, Port } from '../../types';
import { optimizeRoutes } from '../../utils/routeOptimizationEngine';

interface Props { lane: FreightLane; freightLanes: FreightLane[]; ports: Port[]; }

export const RouteOptimizationPanel: React.FC<Props> = ({ lane, freightLanes, ports }) => {
  const result = useMemo(() => optimizeRoutes(lane, freightLanes, ports), [lane, freightLanes, ports]);
  const options = [result.recommended, ...result.alternatives];

  return <section className="border border-[#333] bg-[#080808] p-3 mt-3">
    <div className="flex items-center justify-between gap-2 border-b border-[#222] pb-2 mb-3">
      <div className="flex items-center gap-2 text-[#00FF41] font-bold text-xs"><Route className="w-3.5 h-3.5"/>ROUTE OPTIMIZATION</div>
      <div className="text-[9px] text-gray-500">COST • TIME • CONGESTION • RISK</div>
    </div>

    <div className="grid lg:grid-cols-[1.2fr_2fr] gap-3">
      <div className="border border-[#F27D26] bg-[#120d08] p-3">
        <div className="text-[9px] text-gray-500">RECOMMENDED CORRIDOR</div>
        <div className="text-white font-bold text-sm mt-1">{result.recommended.label}</div>
        <div className="text-[#F27D26] text-lg font-bold mt-2">SCORE {result.recommended.score}/100</div>
        <div className="text-[10px] text-gray-300 mt-2">{result.recommended.lane.name}</div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Mini icon={<Timer/>} label="TRANSIT" value={`${result.recommended.transitDays} D`} />
          <Mini icon={<Gauge/>} label="RISK" value={`${result.recommended.riskScore}/100`} />
          <Mini icon={<ArrowRight/>} label="DISTANCE" value={`${result.recommended.distanceNm.toLocaleString()} NM`} />
          <Mini icon={<ShieldCheck/>} label="COST PROXY" value={`${result.recommended.totalCostProxy.toLocaleString()}`} />
        </div>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => <div key={option.id} className={`border p-2 ${index === 0 ? 'border-[#F27D26] bg-[#0e0b08]' : 'border-[#222] bg-[#0d0d0d]'}`}>
          <div className="flex items-center justify-between gap-2">
            <div><span className="text-white font-bold text-[10px]">{option.lane.code}</span><span className="text-gray-500 text-[9px] ml-2">{index === 0 ? 'RECOMMENDED' : 'ALTERNATIVE'}</span></div>
            <span className={option.score >= 75 ? 'text-[#00FF41] font-bold text-[10px]' : option.score >= 55 ? 'text-[#F27D26] font-bold text-[10px]' : 'text-red-400 font-bold text-[10px]'}>{option.score}/100</span>
          </div>
          <div className="text-[9px] text-gray-400 mt-1">{option.lane.name}</div>
          <div className="grid grid-cols-4 gap-2 mt-2 text-[9px]">
            <Cell label="FRT" value={option.freightCost.toLocaleString()} />
            <Cell label="DAYS" value={`${option.transitDays}`} />
            <Cell label="PORT" value={`${option.portDelayDays}`} />
            <Cell label="RISK" value={`${option.riskScore}`} />
          </div>
        </div>)}
        {options.length === 1 && <div className="text-[9px] text-gray-500 border border-[#222] p-3">No second repository-supported lane shares this exact origin, destination and cargo type. The engine will expand to network routing once live route alternatives are connected.</div>}
      </div>
    </div>

    <div className="mt-3 grid md:grid-cols-3 gap-2">{result.method.map((item, index) => <div key={index} className="border border-[#222] bg-[#0a0a0a] p-2 text-[9px] text-gray-500">{item}</div>)}</div>
  </section>;
};

const Mini: React.FC<{icon:React.ReactElement<{className?:string}>;label:string;value:string}> = ({icon,label,value}) => <div className="border border-[#222] p-2"><div className="flex items-center gap-1 text-gray-600 text-[8px]">{React.cloneElement(icon,{className:'w-3 h-3'})}{label}</div><div className="text-white text-[10px] font-bold mt-1">{value}</div></div>;
const Cell: React.FC<{label:string;value:string}> = ({label,value}) => <div><div className="text-gray-600">{label}</div><div className="text-gray-300 font-bold">{value}</div></div>;

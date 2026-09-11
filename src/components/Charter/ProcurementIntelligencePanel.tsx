import React, { useMemo, useState } from 'react';
import { Factory, PackageCheck, Split, Timer } from 'lucide-react';
import { FreightLane, Port } from '../../types';
import { buildProcurementRecommendation } from '../../utils/procurementEngine';

interface Props { freightLanes: FreightLane[]; ports: Port[]; }

export const ProcurementIntelligencePanel: React.FC<Props> = ({ freightLanes, ports }) => {
  const [cargoType, setCargoType] = useState('DRY_BULK');
  const [quantityMt, setQuantityMt] = useState(100000);
  const recommendation = useMemo(() => buildProcurementRecommendation(cargoType, quantityMt, freightLanes, ports), [cargoType, quantityMt, freightLanes, ports]);
  const top = recommendation.options[0];

  return <section className="border border-[#333] bg-[#080808] p-3 mt-3">
    <div className="flex flex-wrap justify-between gap-3 mb-3">
      <div>
        <div className="flex items-center gap-2 text-white font-bold text-xs"><Factory className="w-3.5 h-3.5 text-[#F27D26]"/>CARGO PROCUREMENT INTELLIGENCE</div>
        <div className="text-[9px] text-gray-500 mt-1">ORIGIN → FREIGHT → LANDED COST → TIMING → BUY / WAIT / SPLIT</div>
      </div>
      <div className="flex gap-2">
        <select value={cargoType} onChange={e => setCargoType(e.target.value)} className="bg-[#111] border border-[#444] text-white px-2 py-1 text-[10px]">
          <option value="DRY_BULK">IRON ORE / COAL</option><option value="CRUDE">CRUDE</option><option value="LNG">LNG</option><option value="CONTAINER">CONTAINER</option><option value="ALL">ALL CARGO</option>
        </select>
        <input type="number" min="1000" value={quantityMt} onChange={e => setQuantityMt(Number(e.target.value) || 0)} className="w-28 bg-[#111] border border-[#444] text-white px-2 py-1 text-[10px]" title="Procurement quantity in metric tonnes"/>
      </div>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3">
      <Metric label="REQUIREMENT" value={`${recommendation.targetQuantityMt.toLocaleString()} MT`}/>
      <Metric label="BUY NOW" value={`${recommendation.buyNowQuantityMt.toLocaleString()} MT`}/>
      <Metric label="WAIT" value={`${recommendation.waitQuantityMt.toLocaleString()} MT`}/>
      <Metric label="BEST ORIGIN" value={top?.lane.originPort ?? 'N/A'}/>
      <div className="border border-[#F27D26] bg-[#16100b] p-2"><div className="text-[9px] text-gray-500">ACTION</div><div className="text-[#F27D26] text-base font-bold">{recommendation.action}</div></div>
    </div>

    <div className="grid lg:grid-cols-[1fr_1.5fr] gap-3">
      <div className="border border-[#222] p-3">
        <div className="text-[#F27D26] text-[10px] font-bold mb-2">PROCUREMENT RATIONALE</div>
        <div className="space-y-2 text-[10px] text-gray-300">{recommendation.rationale.map((r, i) => <div key={i} className="border-l-2 border-[#444] pl-2">{r}</div>)}</div>
      </div>
      <div className="border border-[#222] p-3 overflow-x-auto">
        <div className="flex items-center gap-2 text-[#00FF41] text-[10px] font-bold mb-2"><PackageCheck className="w-3.5 h-3.5"/>ORIGIN / ROUTE COMPARISON</div>
        <div className="min-w-[620px] grid grid-cols-[1.2fr_1.2fr_.7fr_.8fr_.8fr_.5fr] gap-2 text-[8px] text-gray-600 border-b border-[#222] pb-1 mb-1"><span>ORIGIN</span><span>DESTINATION</span><span>FREIGHT</span><span>LANDED FREIGHT</span><span>RISK</span><span>SCORE</span></div>
        {recommendation.options.slice(0, 6).map(option => <div key={option.lane.id} className="min-w-[620px] grid grid-cols-[1.2fr_1.2fr_.7fr_.8fr_.8fr_.5fr] gap-2 items-center py-2 border-b border-[#161616] text-[9px]"><span className="text-white font-bold">{option.lane.originPort}</span><span>{option.lane.destinationPort}</span><span>${option.freightPerUnit.toLocaleString()}</span><span>${Math.round(option.estimatedLandedFreightCost).toLocaleString()}</span><span className={option.congestionRisk >= 70 ? 'text-red-400' : option.congestionRisk >= 50 ? 'text-[#F27D26]' : 'text-[#00FF41]'}>{option.congestionRisk}</span><span className="text-white font-bold">{Math.round(option.score)}</span></div>)}
        {recommendation.options.length === 0 && <div className="text-red-400 text-[10px] py-4">NO COMPATIBLE PROCUREMENT ROUTES IN CURRENT DATASET</div>}
      </div>
    </div>

    <div className="grid md:grid-cols-3 gap-2 mt-3 text-[9px]">
      <Info icon={<Split/>} title="SPLIT PROCUREMENT" text="Use when the top origins are close in score: lock core volume and retain optionality."/>
      <Info icon={<Timer/>} title="TIMING SIGNAL" text="Freight direction and congestion are combined to decide whether to accelerate or defer."/>
      <Info icon={<PackageCheck/>} title="LANDED FREIGHT" text="Prototype estimate uses freight plus a congestion-linked port adjustment; commodity price is not yet included."/>
    </div>
  </section>;
};

const Metric: React.FC<{label:string;value:string}> = ({label,value}) => <div className="border border-[#333] bg-[#0b0b0b] p-2 min-h-[58px]"><div className="text-[8px] text-gray-500">{label}</div><div className="text-white font-bold mt-1 text-[11px]">{value}</div></div>;
const Info: React.FC<{icon:React.ReactElement<{className?:string}>;title:string;text:string}> = ({icon,title,text}) => <div className="border border-[#222] bg-[#0b0b0b] p-2"><div className="flex items-center gap-1 text-[#F27D26] font-bold">{React.cloneElement(icon,{className:'w-3 h-3'})}{title}</div><div className="text-gray-500 mt-1 leading-relaxed">{text}</div></div>;

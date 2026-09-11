import React, { useMemo, useState } from 'react';
import { Anchor, AlertTriangle, MapPin } from 'lucide-react';
import { Port } from '../../types';
import { CongestionForecastPanel } from './CongestionForecastPanel';

export const PortIntelligenceView: React.FC<{ ports: Port[] }> = ({ ports }) => {
  const [selected, setSelected] = useState(ports[0]?.id ?? '');
  const port = ports.find(p => p.id === selected) ?? ports[0];
  const ranked = useMemo(() => [...ports].sort((a,b) => b.congestionScore - a.congestionScore), [ports]);
  if (!port) return <div className="h-full bg-black p-4 text-gray-500">NO PORT DATA</div>;
  const statusClass = port.status === 'CRITICAL' || port.status === 'CONGESTED' ? 'text-red-400' : port.status === 'MODERATE' ? 'text-amber-400' : 'text-[#00FF41]';
  return <div className="h-full overflow-auto bg-black p-3 font-mono text-[#d1d1d1]">
    <div className="flex justify-between items-center border-b border-[#333] pb-2 mb-3"><div><div className="text-white font-bold text-sm"><Anchor className="inline w-4 h-4 text-[#F27D26] mr-2"/>INDIA PORT INTELLIGENCE</div><div className="text-[9px] text-gray-500 mt-1">BERTH • QUEUE • CONGESTION • BUNKER • DELAY RISK • FORECAST</div></div><select value={selected} onChange={e=>setSelected(e.target.value)} className="bg-[#111] border border-[#444] text-white p-1 text-xs">{ports.map(p=><option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}</select></div>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mb-3"><Metric l="STATUS" v={port.status} c={statusClass}/><Metric l="CONGESTION" v={`${port.congestionScore}/100`} c={statusClass}/><Metric l="AVG WAIT" v={`${port.avgWaitDays}d`}/><Metric l="WAITING" v={`${port.vesselsWaiting}`}/><Metric l="VLSFO" v={`$${port.bunkerPriceVLSFO}/MT`}/></div>
    <div className="grid lg:grid-cols-[1.5fr_1fr] gap-3"><section className="border border-[#333] bg-[#080808] p-3"><div className="text-[#F27D26] text-xs font-bold mb-3">PORT OPERATING PROFILE</div><div className="grid grid-cols-2 gap-2 text-[10px]"><Cell l="PORT" v={`${port.name} (${port.code})`}/><Cell l="COUNTRY" v={port.country}/><Cell l="THROUGHPUT" v={`${port.throughputTeuM} M TEU`}/><Cell l="AT BERTH" v={`${port.vesselsAtBerth} vessels`}/><Cell l="WAITING" v={`${port.vesselsWaiting} vessels`}/><Cell l="COORDINATES" v={`${port.lat.toFixed(2)}°, ${port.lon.toFixed(2)}°`}/></div><div className="mt-3 p-2 border border-[#222] bg-[#0d0d0d] text-[10px]"><MapPin className="inline w-3 h-3 text-[#F27D26] mr-1"/>Operational signal: {port.congestionScore >= 70 ? 'High congestion. Consider berth-delay contingency and alternate discharge windows.' : 'Conditions within manageable operating range.'}</div></section><section className="border border-[#333] bg-[#080808] p-3"><div className="text-[#F27D26] text-xs font-bold mb-2">CONGESTION RANKING</div>{ranked.slice(0,8).map((p,i)=><div key={p.id} className="flex items-center gap-2 border-b border-[#181818] py-2 text-[10px]"><span className="w-4 text-gray-600">{i+1}</span><span className="flex-1 text-white">{p.code}</span><span className={p.congestionScore>=70?'text-red-400':p.congestionScore>=45?'text-amber-400':'text-[#00FF41]'}>{p.congestionScore}</span><span className="text-gray-500">{p.avgWaitDays}d</span></div>)}<div className="mt-3 text-[9px] text-gray-600"><AlertTriangle className="inline w-3 h-3 mr-1"/>Current scores are decision-support indicators from the repository dataset.</div></section></div>
    <CongestionForecastPanel ports={ports}/>
  </div>;
};
const Metric=({l,v,c='text-white'}:{l:string;v:string;c?:string})=><div className="border border-[#333] bg-[#080808] p-2"><div className="text-[9px] text-gray-500">{l}</div><div className={`font-bold mt-1 ${c}`}>{v}</div></div>;
const Cell=({l,v}:{l:string;v:string})=><div className="bg-[#111] p-2"><div className="text-gray-500">{l}</div><div className="text-white mt-1">{v}</div></div>;

import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Volume2, VolumeX, Clock, Radio, Activity } from 'lucide-react';
import { AssetQuote, TerminalTheme, TerminalViewId } from '../types';
import { terminalSound } from '../utils/terminalSound';

interface TerminalHeaderProps {
  currentView: TerminalViewId;
  onViewChange: (view: TerminalViewId) => void;
  theme: TerminalTheme;
  onThemeChange: (theme: TerminalTheme) => void;
  assets: AssetQuote[];
  onSelectTicker: (ticker: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const TerminalHeader: React.FC<TerminalHeaderProps> = ({ currentView, onViewChange, theme, onThemeChange, assets, onSelectTicker, soundEnabled, onToggleSound }) => {
  const [commandInput, setCommandInput] = useState('');
  const [open, setOpen] = useState(false);
  const [clock, setClock] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { const tick = () => setClock(new Date().toUTCString().slice(17, 25) + ' UTC'); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const map: Record<string, TerminalViewId> = { F1:'WORKSPACE', F2:'FRGT', F3:'MARKET', F4:'FCST', F5:'PORT', F6:'VSL', F7:'PROC', F8:'CHART', F9:'AI' };
      if (map[e.key]) { e.preventDefault(); onViewChange(map[e.key]); terminalSound.playCommandGo(); }
      if (e.key === '/' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [onViewChange]);

  const commands: { id: TerminalViewId; label: string }[] = [
    { id:'WORKSPACE', label:'DESK [SIH COMMAND]' }, { id:'FRGT', label:'FRGT [GLOBAL + INDIA LANES]' }, { id:'MARKET', label:'MKT [COMMODITIES]' },
    { id:'FCST', label:'FCST [FREIGHT FORECAST]' }, { id:'PORT', label:'PORT [EAST COAST INDIA]' }, { id:'VSL', label:'VSL [VESSEL INTEL]' },
    { id:'PROC', label:'PROC [CARGO PROCUREMENT]' }, { id:'CHART', label:'CHART [CHARTER DECISION]' }, { id:'AI', label:'ASK [AI ANALYST]'}
  ];
  const submit = (e: React.FormEvent) => {
    e.preventDefault(); const raw = commandInput.trim().toUpperCase(); if (!raw) return;
    const aliases: Record<string, TerminalViewId> = { DESK:'WORKSPACE',WORKSPACE:'WORKSPACE',FRGT:'FRGT',SHIP:'FRGT',MAP:'FRGT',MARKET:'MARKET',MKT:'MARKET',FCST:'FCST',FORECAST:'FCST',PORT:'PORT',PORTS:'PORT',VSL:'VSL',VESSEL:'VSL',VESSELS:'VSL',PROC:'PROC',PROCUR:'PROC',PROCUREMENT:'PROC',NEWS:'NEWS',CHART:'CHART',CHARTER:'CHART',OMS:'CHART',AI:'AI',ASK:'AI',ANLY:'FCST',CHAT:'VSL',XL:'NEWS' };
    const id = aliases[raw.replace(' <GO>','')];
    if (id) onViewChange(id); else { const found = assets.find(a => a.ticker.toUpperCase().includes(raw) || a.name.toUpperCase().includes(raw)); if (found) { onSelectTicker(found.ticker); onViewChange('MARKET'); } }
    setCommandInput(''); setOpen(false); terminalSound.playCommandGo();
  };

  return <header className="bg-[#121212] border-b border-[#333] text-[#d1d1d1] select-none sticky top-0 z-50">
    <div className="flex items-center justify-between px-3 py-1 bg-[#080808] border-b border-[#333] text-[10px] font-mono">
      <div className="flex items-center gap-3"><div className="flex items-center gap-1.5 font-bold text-[#F27D26]"><Terminal className="w-4 h-4"/><span className="text-sm">TERMINAL.EXE</span><span className="text-[#666]">[SIH-PRO]</span></div><span className="hidden lg:flex items-center text-[#00FF41]"><Radio className="w-3 h-3 mr-1 animate-pulse"/>[ONLINE] 12ms</span><span className="hidden lg:inline text-gray-600">FEED: FREIGHT / COMMODITIES / PORTS / AIS / PROCUREMENT</span></div>
      <div className="flex items-center gap-3"><span className="text-[#F27D26] font-bold"><Clock className="inline w-3 h-3 mr-1"/>{clock}</span><button onClick={onToggleSound} className={soundEnabled?'text-[#F27D26]':'text-gray-600'}>{soundEnabled?<Volume2 className="w-3.5 h-3.5"/>:<VolumeX className="w-3.5 h-3.5"/>}</button><select value={theme} onChange={e=>onThemeChange(e.target.value as TerminalTheme)} className="bg-[#1a1a1a] border border-[#333] px-1 text-[9px]"><option value="amber">AMBER</option><option value="bloomberg-classic">CLASSIC</option><option value="green">GREEN</option><option value="cyan">CYAN</option></select></div>
    </div>
    <div className="px-3 py-1.5 flex flex-col md:flex-row gap-2 bg-[#080808] border-b border-[#333]">
      <form onSubmit={submit} className="relative flex-1 max-w-2xl"><div className="flex items-center bg-[#121212] border border-[#333] focus-within:border-[#F27D26] px-2 py-1 rounded"><span className="text-[#00FF41] font-bold mr-2">&gt;</span><input ref={inputRef} value={commandInput} onChange={e=>{setCommandInput(e.target.value);setOpen(true)}} onFocus={()=>setOpen(true)} placeholder="ENTER COMMAND: PROC <GO> / FCST <GO> / CHART <GO> / AI <GO>" className="w-full bg-transparent outline-none text-white text-xs uppercase"/><button className="bg-[#F27D26] text-black font-bold px-2 py-0.5 text-[10px]">&lt;GO&gt;</button></div>{open && commandInput && <div className="absolute top-full left-0 right-0 mt-1 bg-[#111] border border-[#333] z-50">{commands.filter(c=>c.label.toLowerCase().includes(commandInput.toLowerCase())||c.id.toLowerCase().includes(commandInput.toLowerCase())).map(c=><button key={c.id} type="button" onClick={()=>{onViewChange(c.id);setCommandInput('');setOpen(false)}} className="w-full text-left px-3 py-1.5 hover:bg-[#1d1d1d] text-[#F27D26] text-xs"><Activity className="inline w-3 h-3 mr-2"/>{c.id} &lt;GO&gt; <span className="text-gray-500">{c.label}</span></button>)}</div>}</form>
      <div className="overflow-hidden whitespace-nowrap flex items-center gap-3 bg-black border border-[#333] px-2 py-1 text-[10px]">{assets.slice(0,6).map(a=><button key={a.ticker} onClick={()=>{onSelectTicker(a.ticker);onViewChange('MARKET')}}><b>{a.ticker}</b> {a.price.toLocaleString()} <span className={a.change>=0?'text-[#00FF41]':'text-red-500'}>{a.change>=0?'▲':'▼'}{Math.abs(a.changePct).toFixed(2)}%</span></button>)}</div>
    </div>
    <nav className="flex overflow-x-auto bg-[#121212] divide-x divide-[#333]">{commands.map((item,i)=><button key={item.id} onClick={()=>{onViewChange(item.id);terminalSound.playCommandGo()}} className={`px-3 py-1.5 text-[10px] whitespace-nowrap ${currentView===item.id?'bg-[#1b1b1b] text-white border-b-2 border-[#F27D26] font-bold':'hover:bg-[#1b1b1b]'}`}><span className="bg-[#222] text-gray-400 px-1 mr-1">F{i+1}</span>{item.label}</button>)}</nav>
  </header>;
};

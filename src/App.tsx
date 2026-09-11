import React, { useEffect, useState } from 'react';
import { Bot, RefreshCw, Send } from 'lucide-react';
import { TerminalHeader } from './components/TerminalHeader';
import { DeskWorkspaceView } from './components/DeskWorkspaceView';
import { FreightTerminalView } from './components/FreightMap/FreightTerminalView';
import { MarketDataView } from './components/MarketData/MarketDataView';
import { AdvancedAnalyticsView } from './components/Analytics/AdvancedAnalyticsView';
import { NewsEconomicView } from './components/News/NewsEconomicView';
import { InstantMessagingView } from './components/Chat/InstantMessagingView';
import { ExcelIntegrationView } from './components/Excel/ExcelIntegrationView';
import { OrderManagementView } from './components/Execution/OrderManagementView';
import { FreightForecastView } from './components/Forecast/FreightForecastView';
import { PortIntelligenceView } from './components/Ports/PortIntelligenceView';
import { VesselIntelligenceView } from './components/Vessels/VesselIntelligenceView';
import { INITIAL_ASSETS } from './data/marketData';
import { FREIGHT_LANES, MAJOR_PORTS, LIVE_VESSELS_SEED, GLOBAL_CHOKEPOINTS } from './data/freightData';
import { AssetQuote, TerminalTheme, TerminalViewId } from './types';
import { terminalSound } from './utils/terminalSound';

export default function App() {
  const [currentView, setCurrentView] = useState<TerminalViewId>('WORKSPACE');
  const [theme, setTheme] = useState<TerminalTheme>('amber');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [assets, setAssets] = useState<AssetQuote[]>(INITIAL_ASSETS);
  const [selectedTicker, setSelectedTicker] = useState(INITIAL_ASSETS[0]?.ticker ?? '');
  const [orderParams, setOrderParams] = useState<{ ticker: string; side: 'BUY' | 'SELL'; price: number } | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    { role: 'assistant', text: 'SIH FREIGHT INTELLIGENCE ANALYST ONLINE. Ask about freight rates, charter windows, port congestion, vessel selection, or route risk.', time: new Date().toISOString().slice(11, 16) }
  ]);

  useEffect(() => {
    const interval = setInterval(() => setAssets(prev => prev.map(asset => {
      if (Math.random() <= 0.6) return asset;
      const pct = (Math.random() - 0.49) * 0.003;
      const decimals = asset.category === 'FX' ? 4 : 2;
      const price = Number((asset.price * (1 + pct)).toFixed(decimals));
      const change = Number((price - asset.previousClose).toFixed(decimals));
      return { ...asset, price, change, changePct: Number(((change / asset.previousClose) * 100).toFixed(2)), lastUpdated: new Date().toISOString().slice(11, 19) + ' UTC' };
    })), 2500);
    return () => clearInterval(interval);
  }, []);

  const openOrder = (ticker: string, side: 'BUY' | 'SELL', price: number) => {
    setOrderParams({ ticker, side, price }); setSelectedTicker(ticker); setCurrentView('OMS'); terminalSound.playTradeFill();
  };

  const askAI = async (text: string) => {
    const query = text.trim();
    if (!query || aiLoading) return;
    const now = new Date().toISOString().slice(11, 16);
    setAiHistory(prev => [...prev, { role: 'user', text: query, time: now }]);
    setAiPrompt('');
    setAiLoading(true);
    terminalSound.playKeyClick();

    const context = {
      selectedTicker,
      freightLanes: FREIGHT_LANES.slice(0, 12).map(lane => ({
        code: lane.code,
        origin: lane.origin,
        destination: lane.destination,
        currentRateUsd: lane.currentRateUsd,
        rateUnit: lane.rateUnit,
        distance: lane.distance,
        transitDays: lane.transitDays,
        activeVessels: lane.activeVessels,
        congestionIndex: lane.congestionIndex,
      })),
      ports: MAJOR_PORTS.map(port => ({
        code: port.code,
        name: port.name,
        throughput: port.throughput,
        waitDays: port.waitDays,
        congestionScore: port.congestionScore,
        vesselsAtBerth: port.vesselsAtBerth,
        vesselsWaiting: port.vesselsWaiting,
        status: port.status,
      })),
      vessels: LIVE_VESSELS_SEED.slice(0, 20).map(vessel => ({
        name: vessel.name,
        type: vessel.type,
        dwt: vessel.dwt,
        draft: vessel.draft,
        speed: vessel.speed,
        lane: vessel.lane,
        origin: vessel.origin,
        destination: vessel.destination,
        eta: vessel.eta,
        congestionWait: vessel.congestionWait,
        riskAlert: vessel.riskAlert,
      })),
    };

    try {
      const response = await fetch('/api/ai-analyst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: query, context }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
      const answer = typeof payload.answer === 'string' && payload.answer.trim()
        ? payload.answer.trim()
        : 'The analyst returned no usable response.';
      setAiHistory(prev => [...prev, { role: 'assistant', text: answer, time: new Date().toISOString().slice(11, 16) }]);
      terminalSound.playTradeFill();
    } catch (error) {
      console.error('AI analyst request failed', error);
      setAiHistory(prev => [...prev, {
        role: 'assistant',
        text: 'AI ENDPOINT UNAVAILABLE: Check that GEMINI_API_KEY is configured on the deployed server. The FCST, PORT and VSL modules remain available for deterministic prototype analysis.',
        time: new Date().toISOString().slice(11, 16),
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  return <div className="flex flex-col h-screen w-screen bg-black text-[#d1d1d1] font-mono text-[11px] overflow-hidden select-none">
    <TerminalHeader currentView={currentView} onViewChange={setCurrentView} theme={theme} onThemeChange={setTheme} assets={assets} onSelectTicker={setSelectedTicker} soundEnabled={soundEnabled} onToggleSound={()=>setSoundEnabled(v=>!v)} />
    <main className="flex-1 min-h-0 overflow-hidden relative">
      {currentView === 'WORKSPACE' && <DeskWorkspaceView assets={assets} freightLanes={FREIGHT_LANES} ports={MAJOR_PORTS} vessels={LIVE_VESSELS_SEED} onNavigateView={setCurrentView} onSelectTicker={setSelectedTicker} onOpenOrderTicket={openOrder} />}
      {currentView === 'FRGT' && <FreightTerminalView freightLanes={FREIGHT_LANES} ports={MAJOR_PORTS} vessels={LIVE_VESSELS_SEED} chokePoints={GLOBAL_CHOKEPOINTS} onSelectLane={lane=>setSelectedTicker(lane.code)} onAskAIAboutIncident={incident=>{setCurrentView('AI');askAI(`Explain the freight impact of ${incident.vesselName} / ${incident.title}`)}} />}
      {currentView === 'MARKET' && <MarketDataView assets={assets} selectedTicker={selectedTicker} onSelectTicker={setSelectedTicker} onOpenOrderTicket={openOrder} />}
      {currentView === 'FCST' && <FreightForecastView freightLanes={FREIGHT_LANES} />}
      {currentView === 'PORT' && <PortIntelligenceView ports={MAJOR_PORTS} />}
      {currentView === 'VSL' && <VesselIntelligenceView vessels={LIVE_VESSELS_SEED} freightLanes={FREIGHT_LANES} />}
      {currentView === 'NEWS' && <NewsEconomicView />}
      {currentView === 'OMS' && <OrderManagementView assets={assets} initialOrderParams={orderParams} />}
      {currentView === 'ANLY' && <AdvancedAnalyticsView assets={assets} selectedTicker={selectedTicker} onSelectTicker={setSelectedTicker} />}
      {currentView === 'CHAT' && <InstantMessagingView />}
      {currentView === 'XL' && <ExcelIntegrationView assets={assets} freightLanes={FREIGHT_LANES} ports={MAJOR_PORTS} />}
      {currentView === 'AI' && <div className="h-full flex flex-col p-3 bg-black"><div className="flex items-center justify-between border-b border-[#333] pb-2 mb-2"><div className="text-white font-bold text-sm"><Bot className="inline w-4 h-4 text-[#F27D26] mr-2"/>AI FREIGHT & CHARTERING ANALYST</div><span className="text-[9px] text-[#00FF41]">MODEL: GEMINI DECISION SUPPORT</span></div><div className="flex-1 overflow-y-auto space-y-2 bg-[#080808] border border-[#333] p-3">{aiHistory.map((m,i)=><div key={i} className={`p-2 border ${m.role==='user'?'ml-8 border-[#444] bg-[#141414]':'mr-8 border-[#222] bg-[#0d0d0d]'}`}><div className="text-[9px] text-[#F27D26] mb-1">{m.role==='user'?'DESK':'TERMINAL.AI'} <span className="text-gray-600 float-right">{m.time}</span></div><div className="whitespace-pre-line leading-relaxed">{m.text}</div></div>)}{aiLoading&&<div className="text-[#F27D26] p-2"><RefreshCw className="inline w-3 h-3 animate-spin mr-2"/>RUNNING GEMINI ANALYSIS...</div>}</div><div className="flex gap-2 mt-2"><input value={aiPrompt} onChange={e=>setAiPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')askAI(aiPrompt)}} placeholder="Ask: should we charter now? Which port is most congested?" className="flex-1 bg-[#111] border border-[#333] focus:border-[#F27D26] px-3 py-2 text-xs text-white outline-none"/><button onClick={()=>askAI(aiPrompt)} disabled={aiLoading} className="bg-[#F27D26] text-black font-bold px-4 disabled:opacity-50"><Send className="inline w-3 h-3 mr-1"/>ASK</button></div></div>}
    </main>
    <footer className="h-6 shrink-0 bg-[#121212] border-t border-[#333] px-3 flex items-center text-[9px] text-gray-500"><span className="text-[#00FF41] mr-2">[ONLINE]</span> SIH26006 • FREIGHT INTELLIGENCE TERMINAL • Prototype decision-support environment</footer>
  </div>;
}

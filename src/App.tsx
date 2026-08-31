import React, { useState, useEffect } from 'react';
import { TerminalHeader } from './components/TerminalHeader';
import { DeskWorkspaceView } from './components/DeskWorkspaceView';
import { FreightTerminalView } from './components/FreightMap/FreightTerminalView';
import { MarketDataView } from './components/MarketData/MarketDataView';
import { AdvancedAnalyticsView } from './components/Analytics/AdvancedAnalyticsView';
import { NewsEconomicView } from './components/News/NewsEconomicView';
import { InstantMessagingView } from './components/Chat/InstantMessagingView';
import { ExcelIntegrationView } from './components/Excel/ExcelIntegrationView';
import { OrderManagementView } from './components/Execution/OrderManagementView';
import {
  INITIAL_ASSETS
} from './data/marketData';
import {
  FREIGHT_LANES,
  MAJOR_PORTS,
  LIVE_VESSELS_SEED,
  GLOBAL_CHOKEPOINTS
} from './data/freightData';
import { RECENT_MARITIME_TRAGEDIES } from './data/incidentData';
import { AssetQuote, TerminalTheme, TerminalViewId, IncidentHotspot } from './types';
import { terminalSound } from './utils/terminalSound';
import {
  HelpCircle,
  X,
  Bot,
  Send,
  Zap,
  ShieldCheck,
  Globe,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<TerminalViewId>('WORKSPACE');
  const [theme, setTheme] = useState<TerminalTheme>('amber');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [assets, setAssets] = useState<AssetQuote[]>(INITIAL_ASSETS);
  const [selectedTicker, setSelectedTicker] = useState<string>(INITIAL_ASSETS[0].ticker);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [orderParams, setOrderParams] = useState<{ ticker: string; side: 'BUY' | 'SELL'; price: number } | null>(null);

  // AI Copilot State
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiHistory, setAiHistory] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      role: 'assistant',
      text: 'TERMINAL.EXE AI INTELLIGENCE ADVISOR ACTIVE. Ask about Red Sea vessel rerouting, Cape of Good Hope bunker arbitrage, Baltic Dry Index volatility, or FFA forward curve positioning.',
      time: new Date().toISOString().slice(11, 16)
    }
  ]);

  // Live real-time tick updates on assets
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev =>
        prev.map(asset => {
          // randomly tick some assets
          if (Math.random() > 0.6) {
            const pctChange = (Math.random() - 0.49) * 0.003;
            const newPrice = Number((asset.price * (1 + pctChange)).toFixed(asset.category === 'FX' ? 4 : 2));
            const newChg = Number((newPrice - asset.previousClose).toFixed(asset.category === 'FX' ? 4 : 2));
            const newChgPct = Number(((newChg / asset.previousClose) * 100).toFixed(2));
            return {
              ...asset,
              price: newPrice,
              change: newChg,
              changePct: newChgPct,
              lastUpdated: new Date().toISOString().slice(11, 19) + ' UTC'
            };
          }
          return asset;
        })
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleOpenOrderTicket = (ticker: string, side: 'BUY' | 'SELL', price: number) => {
    setOrderParams({ ticker, side, price });
    setSelectedTicker(ticker);
    setCurrentView('OMS');
    terminalSound.playTradeFill();
  };

  const triggerAIQuery = (queryText: string) => {
    const userQ = queryText.trim();
    if (!userQ) return;
    const nowTime = new Date().toISOString().slice(11, 16);
    setAiHistory(prev => [...prev, { role: 'user', text: userQ, time: nowTime }]);
    setAiLoading(true);
    terminalSound.playKeyClick();

    setTimeout(() => {
      let reply = '';
      const q = userQ.toLowerCase();

      // Check if user is asking about general recent maritime tragedies/accidents/casualties/sinkings
      if (
        q.includes('tragedy') ||
        q.includes('tragedies') ||
        q.includes('recent tragedy') ||
        q.includes('what recent') ||
        q.includes('casualty') ||
        q.includes('casualties') ||
        q.includes('disaster') ||
        q.includes('sinking') ||
        q.includes('houthi') ||
        q.includes('attacks') ||
        q.includes('incident') ||
        q.includes('strike')
      ) {
        reply = `🚨 CRITICAL MARITIME CASUALTY & TRAGEDY SITREP (LIVE IMO / GISIS FEED)

Here are the most significant recent maritime tragedies and high-impact casualties recorded across global shipping lanes:

1. 💥 M/V TUTOR (June 12-18, 2024 - Southern Red Sea) [SANK]
   • Vessel: 82,357 DWT Ultramax Bulk Carrier | IMO: 9942627 | Flag: Liberia
   • Casualty: 1 Filipino crew member fatally killed in engine room explosion; 21 crew rescued by Operation Aspides.
   • Incident: Struck by bomb-laden autonomous uncrewed surface vessel (USV) at waterline + airborne missile. Foundered & sank.
   • Supply Chain Impact: Triggered total dry bulk war-risk exclusion zone & rerouting via Cape of Good Hope.

2. ⚓ M/V RUBYMAR (March 2, 2024 - Bab-el-Mandeb Strait) [SANK]
   • Vessel: 32,211 DWT Handysize Bulker | IMO: 9138898 | Flag: Belize
   • Casualty: 24 crew evacuated before sinking; 0 fatalities.
   • Environmental Disaster: 21,000 MT ammonium phosphate fertilizer submerged on coral seabed; severed Red Sea subsea data cables (AAE-1, EIG).
   • Market Shock: 1st total vessel loss of Red Sea crisis; sparked +1.2% vessel hull war risk surcharges.

3. 🌉 M/V DALI - BALTIMORE FRANCIS SCOTT KEY BRIDGE (March 26, 2024 - Port of Baltimore, USA)
   • Vessel: 9,962 TEU Neo-Panamax Container Ship | IMO: 9697428 | Flag: Singapore
   • Casualty: 6 highway maintenance workers tragically killed; bridge span collapsed.
   • Economic Impact: Closed 9th largest US port for 11 weeks; estimated $2B-$4B in aggregate insured payouts (largest marine casualty claim in history).

4. 💥 M/V TRUE CONFIDENCE (March 6, 2024 - Gulf of Aden)
   • Casualty: 3 crew members killed (2 Filipino, 1 Vietnamese); 4 severely injured.
   • Struck by anti-ship ballistic missile; crew abandoned vessel in lifeboats.

5. 🛢️ MT SOUNION (August 21, 2024 - Red Sea) [ABANDONED ON FIRE]
   • Vessel: 150,000 DWT Crude Tanker | IMO: 9312145 | Carrying 1,000,000 bbls crude oil.
   • 25 crew rescued by French frigate Chevalier Paul; salvage teams prevented catastrophic 4x Exxon Valdez-scale oil spill.

6. 🛢️ PASIR PANJANG BUNKER SPILL (June 14, 2024 - Singapore Strait)
   • 400 MT low-sulfur fuel oil spilled across Singapore coastline after dredger Vox Maxima collided with bunker vessel Marine Honour.

7. 🌀 TYPHOON GAEMI MARITIME LOSSES (July 25, 2024 - Taiwan Strait / Philippines)
   • MT Terra Nova capsized off Bataan (1.4M liters industrial fuel oil, 1 crew fatality).
   • Freighter Fu-Shun capsized off Kaohsiung (Burmese captain missing).`;
      } else if (q.includes('rubymar')) {
        const inc = RECENT_MARITIME_TRAGEDIES.find(i => i.id === 'inc-rubymar')!;
        reply = `⚓ SITREP: M/V RUBYMAR SINKING & CASUALTY REPORT
• Location: ${inc.locationName} (${inc.lat}°N, ${inc.lon}°E) | Date: ${inc.date}
• Vessel: ${inc.vesselName} (${inc.vesselType}) | IMO: ${inc.imo}
• Casualties: ${inc.casualties.fatalities} Fatalities, ${inc.casualties.injured} Injured. ${inc.casualties.crewStatus}
• Environmental Threat: ${inc.environmentalImpact}
• Insurance & Liability: ${inc.insuranceImpact}
• Freight Disruption: ${inc.freightImpact}
• Summary: ${inc.detailedSitrep}`;
      } else if (q.includes('tutor')) {
        const inc = RECENT_MARITIME_TRAGEDIES.find(i => i.id === 'inc-tutor')!;
        reply = `💥 SITREP: M/V TUTOR FATAL MISSILE & USV STRIKE
• Location: ${inc.locationName} | Date: ${inc.date}
• Vessel: ${inc.vesselName} (${inc.vesselType}) | IMO: ${inc.imo}
• Casualties: ${inc.casualties.fatalities} Fatality, ${inc.casualties.injured} Injured. ${inc.casualties.crewStatus}
• Status: Sunk in Red Sea shipping lane. ${inc.detailedSitrep}
• Market Impact: ${inc.freightImpact}`;
      } else if (q.includes('baltimore') || q.includes('dali') || q.includes('key bridge')) {
        const inc = RECENT_MARITIME_TRAGEDIES.find(i => i.id === 'inc-dali-baltimore')!;
        reply = `🌉 SITREP: M/V DALI BALTIMORE BRIDGE COLLISION
• Location: ${inc.locationName} | Date: ${inc.date}
• Vessel: ${inc.vesselName} (${inc.vesselType}) | IMO: ${inc.imo}
• Casualties: ${inc.casualties.fatalities} Fatalities. ${inc.casualties.crewStatus}
• Insurance Claim: ${inc.insuranceImpact}
• Economic & Logistics Impact: ${inc.freightImpact}
• Incident Narrative: ${inc.detailedSitrep}`;
      } else if (q.includes('suez') || q.includes('red sea') || q.includes('cape')) {
        reply = 'ANALYSIS: Red Sea / Bab-el-Mandeb risk remains ELEVATED. ~64% of Asia-Europe container vessels are rerouted via Cape of Good Hope (+10-14 days transit, +3,500nm). Bunker consumption increased by 380 MT VLSFO per voyage ($238k added cost). Spot freight rates on SHA-RTM elevated at $7,230/FEU with FFA Q4 pricing in extended diversions.';
      } else if (q.includes('bdi') || q.includes('baltic') || q.includes('dry')) {
        reply = 'BALTIC DRY INDEX (BDI) REPORT: BDI standing at 1,845 (+2.96%). Capesize 5TC average TCE rates rebounded to $26,400/day driven by robust Brazilian iron ore loadings (Vale) and strong bauxite demand from Guinea. Panamax rates firming at $14,800/day on US Gulf grain export flows.';
      } else if (q.includes('brent') || q.includes('oil') || q.includes('bunker')) {
        reply = 'ENERGY & BUNKER OUTLOOK: Brent Crude testing $82.44/bbl (+0.15%). Singapore VLSFO bunker spread over Rotterdam widened to $30/MT ($628 vs $598). High-sulfur fuel oil (HSFO) scrubber spreads remain lucrative at $145/MT, boosting scrubber-fitted VLCC earnings.';
      } else {
        reply = `QUANT SYNTHESIS: Cross-referencing "${userQ}" across live AIS vessel telemetry, IMO tragedy databases, FFA forward curves, and port queue analytics. Key takeaway: Global supply chains remain constrained by geopolitical chokepoints and safety diversions with heightened spot freight volatility.`;
      }

      setAiHistory(prev => [...prev, { role: 'assistant', text: reply, time: new Date().toISOString().slice(11, 16) }]);
      setAiLoading(false);
      terminalSound.playTradeFill();
    }, 1000);
  };

  const handleAskAI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;
    const prompt = aiPrompt;
    setAiPrompt('');
    triggerAIQuery(prompt);
  };

  const handleAskAIAboutIncident = (incident: IncidentHotspot) => {
    setCurrentView('AI');
    triggerAIQuery(`Provide a full casualty sitrep, IMO details, environmental damage, and freight market impact for ${incident.vesselName} (${incident.title})`);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-[#d1d1d1] font-mono text-[11px] overflow-hidden select-none">
      {/* Top Bloomberg/Terminal Header */}
      <TerminalHeader
        currentView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          terminalSound.playCommandGo();
        }}
        theme={theme}
        onThemeChange={setTheme}
        assets={assets}
        onSelectTicker={(t) => {
          setSelectedTicker(t);
          terminalSound.playKeyClick();
        }}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Main Viewport Routing */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {currentView === 'WORKSPACE' && (
          <DeskWorkspaceView
            assets={assets}
            freightLanes={FREIGHT_LANES}
            ports={MAJOR_PORTS}
            vessels={LIVE_VESSELS_SEED}
            onNavigateView={setCurrentView}
            onSelectTicker={setSelectedTicker}
            onOpenOrderTicket={handleOpenOrderTicket}
          />
        )}

        {currentView === 'FRGT' && (
          <FreightTerminalView
            freightLanes={FREIGHT_LANES}
            ports={MAJOR_PORTS}
            vessels={LIVE_VESSELS_SEED}
            chokePoints={GLOBAL_CHOKEPOINTS}
            onSelectLane={(lane) => {
              setSelectedTicker(lane.code);
            }}
            onAskAIAboutIncident={handleAskAIAboutIncident}
          />
        )}

        {currentView === 'MARKET' && (
          <MarketDataView
            assets={assets}
            selectedTicker={selectedTicker}
            onSelectTicker={setSelectedTicker}
            onOpenOrderTicket={handleOpenOrderTicket}
          />
        )}

        {currentView === 'ANLY' && (
          <AdvancedAnalyticsView
            assets={assets}
            selectedTicker={selectedTicker}
            onSelectTicker={setSelectedTicker}
          />
        )}

        {currentView === 'NEWS' && (
          <NewsEconomicView />
        )}

        {currentView === 'CHAT' && (
          <InstantMessagingView />
        )}

        {currentView === 'XL' && (
          <ExcelIntegrationView
            assets={assets}
            freightLanes={FREIGHT_LANES}
            ports={MAJOR_PORTS}
          />
        )}

        {currentView === 'OMS' && (
          <OrderManagementView
            assets={assets}
            initialOrderParams={orderParams}
          />
        )}

        {currentView === 'AI' && (
          <div className="flex flex-col h-full bg-black text-[#d1d1d1] p-4">
            <div className="flex items-center justify-between border-b border-[#333] pb-2 mb-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-[#F27D26]" />
                <span className="font-bold text-white text-sm">
                  TERMINAL AI MARITIME & TRADE ANALYST &lt;ASK&gt;
                </span>
              </div>
              <span className="text-[10px] text-[#00FF41] bg-[#00FF41]/10 px-2 py-0.5 rounded border border-[#00FF41]/30">
                MODEL: GEMINI-PRO QUANT COPILOT
              </span>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto space-y-3 bg-[#080808] p-3 rounded border border-[#333]">
              {aiHistory.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded border ${
                    item.role === 'user'
                      ? 'bg-[#141414] border-[#444] text-white ml-8'
                      : 'bg-[#0e0e0e] border-[#262626] text-[#d1d1d1] mr-8'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1 text-[9px]">
                    <span className={item.role === 'user' ? 'text-[#F27D26] font-bold' : 'text-[#00FF41] font-bold'}>
                      {item.role === 'user' ? 'DESK TRADER' : 'TERMINAL.AI ENGINE'}
                    </span>
                    <span className="text-gray-500">{item.time}</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{item.text}</p>
                </div>
              ))}
              {aiLoading && (
                <div className="p-3 bg-[#0e0e0e] border border-[#262626] rounded text-[#F27D26] flex items-center space-x-2 animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing live AIS telemetry, order books & derivatives data...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips for Maritime Tragedies & Intelligence */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
              <span className="text-gray-500 font-bold flex items-center">
                <Sparkles className="w-3 h-3 text-[#F27D26] mr-1" />
                SUGGESTED QUERIES:
              </span>
              <button
                type="button"
                onClick={() => triggerAIQuery('What recent maritime tragedies and casualties happened across shipping lanes?')}
                className="bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-300 px-2 py-0.5 rounded transition-colors font-bold flex items-center"
              >
                🚨 Recent Maritime Tragedies &amp; Sinkings
              </button>
              <button
                type="button"
                onClick={() => triggerAIQuery('Tell me about the M/V Tutor sinking, casualties, and missile strike in the Red Sea')}
                className="bg-[#181818] hover:bg-[#282828] border border-[#444] text-[#F27D26] px-2 py-0.5 rounded transition-colors"
              >
                💥 M/V Tutor Strike
              </button>
              <button
                type="button"
                onClick={() => triggerAIQuery('Give me a full sitrep on the M/V Rubymar fertilizer bulk carrier sinking in Bab-el-Mandeb')}
                className="bg-[#181818] hover:bg-[#282828] border border-[#444] text-amber-300 px-2 py-0.5 rounded transition-colors"
              >
                ⚓ M/V Rubymar Sinking
              </button>
              <button
                type="button"
                onClick={() => triggerAIQuery('What was the impact of the M/V Dali Baltimore Key Bridge collision?')}
                className="bg-[#181818] hover:bg-[#282828] border border-[#444] text-cyan-300 px-2 py-0.5 rounded transition-colors"
              >
                🌉 Dali Baltimore Collision
              </button>
              <button
                type="button"
                onClick={() => triggerAIQuery('Explain Red Sea rerouting around Cape of Good Hope and bunker fuel costs')}
                className="bg-[#181818] hover:bg-[#282828] border border-[#444] text-emerald-300 px-2 py-0.5 rounded transition-colors"
              >
                🌐 Cape vs Suez Diversion
              </button>
            </div>

            {/* AI Prompt Input */}
            <form onSubmit={handleAskAI} className="mt-2 flex space-x-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ask about Suez rerouting, BDI forecasts, bunker costs, container port delays, or derivatives..."
                className="flex-1 bg-[#121212] border border-[#333] focus:border-[#F27D26] text-white px-3 py-2 rounded text-xs outline-none"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="bg-[#F27D26] hover:bg-[#ff8e36] text-black font-extrabold px-4 py-2 rounded text-xs flex items-center space-x-1 transition-colors"
              >
                <span>QUERY</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Terminal Footer Bar (Matching the Elegant Dark Design Theme) */}
      <footer className="bg-[#121212] border-t border-[#333] px-3 py-1 flex items-center space-x-4 select-none shrink-0">
        <div className="text-[#00FF41] font-bold">&gt;</div>
        <div className="flex-1 text-white truncate text-[11px]">
          ENTER COMMAND OR TICKER (e.g. SHA-LAX &lt;Go&gt;, FRGT &lt;Go&gt;, NEWS &lt;Go&gt;, XL &lt;Go&gt;)
        </div>
        <div className="flex items-center space-x-4 text-gray-500 text-[10px]">
          <button
            onClick={() => setShowHelpModal(true)}
            className="hover:text-[#F27D26] transition-colors"
          >
            HELP &lt;F1&gt;
          </button>
          <span className="text-gray-700">|</span>
          <button
            onClick={() => {
              setCurrentView('WORKSPACE');
              terminalSound.playCommandGo();
            }}
            className="hover:text-white transition-colors"
          >
            DESK &lt;F1&gt;
          </button>
          <span className="text-gray-700">|</span>
          <span className="text-[#00FF41] font-bold">[ONLINE]</span>
        </div>
      </footer>

      {/* Function Keys & Command Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#333] rounded shadow-2xl max-w-lg w-full p-4 font-mono text-xs text-[#d1d1d1]">
            <div className="flex justify-between items-center border-b border-[#333] pb-2 mb-3">
              <span className="text-[#F27D26] font-bold text-sm flex items-center">
                <HelpCircle className="w-4 h-4 mr-1.5 text-[#F27D26]" />
                TERMINAL.EXE KEYBOARD & FUNCTION HELP
              </span>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-white font-bold block mb-1">FUNCTION KEYS</span>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F1]</span> WORKSPACE DESK
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F2]</span> FRGT (Global AIS Map)
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F3]</span> MKT (Live Tape & Depth)
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F4]</span> ANLY (Derivatives & Curves)
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F5]</span> NEWS (Newswire & Eco)
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F6]</span> IB (Instant Trader Chat)
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F7]</span> XL (Spreadsheet BDP)
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F8]</span> OMS (Order Management)
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#F27D26] font-bold mr-1">[F9]</span> ASK (AI Maritime Analyst)
                  </div>
                  <div className="bg-[#1a1a1a] p-1.5 rounded border border-[#262626]">
                    <span className="text-[#00FF41] font-bold mr-1">[Ctrl + /]</span> Focus Command Bar
                  </div>
                </div>
              </div>

              <div>
                <span className="text-white font-bold block mb-1">COMMAND SYNTAX</span>
                <p className="text-gray-400 text-[10px] leading-relaxed">
                  Type any function followed by <strong className="text-white">&lt;GO&gt;</strong> (or press Enter) in the top search bar. Examples: <code className="text-[#F27D26]">FRGT &lt;GO&gt;</code>, <code className="text-[#F27D26]">BDI.INDEX &lt;GO&gt;</code>, <code className="text-[#F27D26]">NEWS &lt;GO&gt;</code>, <code className="text-[#F27D26]">CO1:COM &lt;GO&gt;</code>.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-[#333] text-right">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-[#F27D26] text-black font-bold px-3 py-1 rounded text-[11px]"
              >
                CLOSE &lt;ESC&gt;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

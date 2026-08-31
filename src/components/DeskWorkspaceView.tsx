import React, { useState } from 'react';
import {
  Ship,
  TrendingUp,
  TrendingDown,
  Globe,
  Radio,
  Send,
  MessageSquare,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Calendar,
  Layers
} from 'lucide-react';
import { AssetQuote, FreightLane, Port, Vessel, NewsArticle, EconomicEvent, TerminalViewId } from '../types';
import { terminalSound } from '../utils/terminalSound';

interface DeskWorkspaceViewProps {
  assets: AssetQuote[];
  freightLanes: FreightLane[];
  ports: Port[];
  vessels: Vessel[];
  onNavigateView: (view: TerminalViewId) => void;
  onSelectTicker: (ticker: string) => void;
  onOpenOrderTicket: (ticker: string, side: 'BUY' | 'SELL', price: number) => void;
}

export const DeskWorkspaceView: React.FC<DeskWorkspaceViewProps> = ({
  assets,
  freightLanes,
  ports,
  vessels,
  onNavigateView,
  onSelectTicker,
  onOpenOrderTicket
}) => {
  const [timeframe, setTimeframe] = useState<'2H' | '1D' | '1W'>('1W');
  const [chatInput, setChatInput] = useState('');
  const [deskMessages, setDeskMessages] = useState([
    {
      id: 'm1',
      sender: 'D. MILLER [GS_FREIGHT]',
      senderColor: 'text-cyan-400',
      text: 'Anyone seeing the bid lift for July SHA-NYC? Seeing volume spike.'
    },
    {
      id: 'm2',
      sender: 'S. CHEN [MAERSK_DESK]',
      senderColor: 'text-pink-400',
      text: 'Hearing same. Capacity tight on the 2nd loop. Port congestion starting to bite.'
    },
    {
      id: 'm3',
      sender: 'D. MILLER [GS_FREIGHT]',
      senderColor: 'text-cyan-400',
      text: 'Thanks. Sending you the Excel pull for those quotes now.'
    }
  ]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setDeskMessages(prev => [
      ...prev,
      {
        id: 'm-' + Date.now(),
        sender: 'ME [DESK_TRADER]',
        senderColor: 'text-[#00FF41]',
        text: chatInput.trim()
      }
    ]);
    terminalSound.playKeyClick();
    setChatInput('');
  };

  const bdiHistoricalBars = [40, 35, 45, 60, 55, 70, 65, 80, 90, 85];

  return (
    <main className="flex-1 grid grid-cols-12 gap-px bg-[#333] select-none text-[11px] font-mono min-h-0">
      {/* SECTION 1 (Col 1-3): BREAKING NEWS & ECONOMIC CALENDAR */}
      <section className="col-span-12 lg:col-span-3 bg-black flex flex-col min-h-0 border-b lg:border-b-0 border-[#333]">
        <div className="p-2 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between font-bold text-[#F27D26]">
          <span className="flex items-center">
            <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse text-[#00FF41]" />
            BREAKING NEWS WIRE
          </span>
          <button
            onClick={() => onNavigateView('NEWS')}
            className="text-[10px] text-gray-400 hover:text-white flex items-center"
          >
            MORE <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {/* Live News Feed List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          <div
            onClick={() => onNavigateView('NEWS')}
            className="space-y-0.5 group cursor-pointer border-b border-[#222] pb-2 hover:bg-[#111] p-1 rounded transition-colors"
          >
            <span className="text-gray-500 block text-[9px]">12:40 UTC</span>
            <p className="leading-tight text-white group-hover:text-[#F27D26] font-semibold">
              SUEZ CANAL: AUTHORITY REPORTS 12% DROP IN REVENUE FOR Q1 AMID RED SEA DISRUPTIONS
            </p>
          </div>

          <div
            onClick={() => onNavigateView('NEWS')}
            className="space-y-0.5 group cursor-pointer border-b border-[#222] pb-2 hover:bg-[#111] p-1 rounded transition-colors"
          >
            <span className="text-gray-500 block text-[9px]">12:34 UTC</span>
            <p className="leading-tight text-[#00FF41] group-hover:underline font-semibold">
              MAERSK ADJUSTS TRANS-PACIFIC SERVICE FREQUENCY CITING PORT CONGESTION IN SINGAPORE
            </p>
          </div>

          <div
            onClick={() => onNavigateView('NEWS')}
            className="space-y-0.5 group cursor-pointer border-b border-[#222] pb-2 hover:bg-[#111] p-1 rounded transition-colors"
          >
            <span className="text-gray-500 block text-[9px]">12:28 UTC</span>
            <p className="leading-tight text-gray-300 group-hover:text-white">
              HAPAG-LLOYD REVISES 2024 EBITDA OUTLOOK UPWARD ON STRONGER VOLUMES & ASIA EXPORTS
            </p>
          </div>

          <div
            onClick={() => onNavigateView('NEWS')}
            className="space-y-0.5 group cursor-pointer border-b border-[#222] pb-2 hover:bg-[#111] p-1 rounded transition-colors"
          >
            <span className="text-gray-500 block text-[9px]">12:15 UTC</span>
            <p className="leading-tight text-red-400 group-hover:text-red-300">
              PANAMA CANAL DRAFTS TO BE MAINTAINED AT 44FT DESPITE EARLY RAINS; QUEUES REMAIN 18 SHIPS
            </p>
          </div>

          <div
            onClick={() => onNavigateView('NEWS')}
            className="space-y-0.5 group cursor-pointer hover:bg-[#111] p-1 rounded transition-colors"
          >
            <span className="text-gray-500 block text-[9px]">12:02 UTC</span>
            <p className="leading-tight text-gray-400 group-hover:text-white">
              BALTIC DRY INDEX REVERSES EARLY LOSSES AS CAPESIZE RATES FIRM ON PACIFIC ROUND VOYAGES
            </p>
          </div>
        </div>

        {/* Economic Calendar Mini Panel */}
        <div className="h-44 bg-black border-t border-[#333] p-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-[9px] uppercase tracking-widest mb-1.5">
            <span className="flex items-center font-bold text-gray-400">
              <Calendar className="w-3 h-3 mr-1 text-[#F27D26]" />
              Economic Calendar (Key Events)
            </span>
            <span className="text-emerald-400">LIVE</span>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between border-b border-[#222] pb-1">
              <span className="text-gray-300">US Non-Farm Payrolls</span>
              <span className="text-white font-bold">FRI 13:30</span>
            </div>
            <div className="flex justify-between text-gray-500 text-[9px]">
              <span>Forecast: 200K</span>
              <span>Prev: 275K</span>
            </div>
            <div className="flex justify-between border-b border-[#222] pb-1 pt-0.5">
              <span className="text-gray-300">ECB Rate Decision</span>
              <span className="text-white font-bold">THU 12:45</span>
            </div>
            <div className="flex justify-between text-gray-500 text-[9px]">
              <span>Forecast: 3.75%</span>
              <span>Prev: 4.00%</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateView('NEWS')}
            className="w-full bg-[#161616] hover:bg-[#222] text-gray-300 text-[9px] py-1 rounded text-center border border-[#333] transition-colors mt-1"
          >
            VIEW FULL CALENDAR & RATINGS &lt;GO&gt;
          </button>
        </div>
      </section>

      {/* SECTION 2 (Col 4-9): GLOBAL FREIGHT HEATMAP, BDI 5Y CHART & DEPTH */}
      <section className="col-span-12 lg:col-span-6 bg-black flex flex-col min-h-0 border-b lg:border-b-0 border-[#333]">
        <div className="p-2 bg-[#1a1a1a] border-b border-[#333] flex justify-between items-center">
          <span className="font-bold text-white flex items-center">
            <Globe className="w-3.5 h-3.5 mr-1.5 text-[#F27D26]" />
            GLOBAL FREIGHT HEATMAP (LIVE AIS TAPE)
          </span>
          <div className="flex items-center space-x-1.5">
            <div className="flex space-x-1">
              {(['2H', '1D', '1W'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => {
                    setTimeframe(tf);
                    terminalSound.playKeyClick();
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    timeframe === tf
                      ? 'bg-[#F27D26] text-black'
                      : 'bg-[#222] text-gray-400 border border-[#444] hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <button
              onClick={() => onNavigateView('FRGT')}
              title="Expand Full Freight Terminal"
              className="bg-[#222] hover:bg-[#333] text-gray-300 p-1 rounded border border-[#444]"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Heatmap & Tactical Situation Display */}
        <div
          onClick={() => onNavigateView('FRGT')}
          className="flex-1 relative bg-[#050505] p-3 flex items-center justify-center cursor-pointer group min-h-[220px]"
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:20px_20px]" />
          
          <div className="w-full h-full border border-[#222] relative flex flex-col justify-between p-2">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-6 opacity-60 pointer-events-none">
              <div className="border border-[#111]" />
              <div className="border border-[#111]" />
              <div className="border border-[#111]" />
              <div className="border border-[#111] bg-blue-900/20" />
              <div className="border border-[#111] bg-blue-900/10" />
              <div className="border border-[#111]" />
              <div className="border border-[#111]" />
              <div className="border border-[#111]" />
              <div className="border border-[#111]" />
              <div className="border border-[#111] bg-blue-900/30" />
              <div className="border border-[#111]" />
              <div className="border border-[#111]" />
              <div className="border border-[#111]" />
              <div className="border border-[#111]" />
              <div className="border border-[#111] bg-blue-900/10" />
              <div className="border border-[#111]" />
            </div>

            {/* Glowing Heatspots */}
            <div className="absolute top-1/4 left-1/4 w-32 h-16 bg-[#00FF41]/15 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-1/3 right-1/4 w-48 h-24 bg-red-600/15 rounded-full blur-2xl pointer-events-none" />

            {/* Live Tactical Labels */}
            <div className="relative z-10 flex justify-between items-start">
              <span className="text-[#00FF41] text-[10px] bg-black/80 px-2 py-0.5 rounded border border-[#00FF41]/30 flex items-center font-bold">
                ● SHA: PORT CONGESTION (HIGH DENSITY)
              </span>
              <span className="text-red-500 text-[10px] bg-black/80 px-2 py-0.5 rounded border border-red-500/30 flex items-center font-bold">
                ● RTM: BERTH DELAY (+48H QUEUE)
              </span>
            </div>

            {/* Middle routes indicator */}
            <div className="relative z-10 text-center py-4">
              <span className="text-xs font-bold text-white bg-black/90 px-3 py-1 rounded border border-[#333] shadow-lg">
                CLICK TO LAUNCH INTERACTIVE AIS AIS-RADAR & ROUTE CALCULATOR &lt;FRGT&gt;
              </span>
            </div>

            <div className="relative z-10 flex justify-between items-end text-[10px]">
              <span className="text-cyan-400 bg-black/80 px-2 py-0.5 rounded border border-cyan-400/30">
                Suez Canal / Red Sea: Diversions Active (Cape Route)
              </span>
              <span className="text-[#F27D26] bg-black/80 px-2 py-0.5 rounded border border-[#F27D26]/30">
                Panama Canal: 24 Transits/Day
              </span>
            </div>
          </div>
        </div>

        {/* BDI HISTORICAL CHART & MARKET DEPTH ROW */}
        <div className="h-44 border-t border-[#333] flex divide-x divide-[#333]">
          {/* BDI HISTORICAL */}
          <div className="flex-1 p-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-gray-500 text-[9px] mb-1">
              <span className="font-bold text-[#d1d1d1]">BDI INDEX 5Y HISTORICAL COMPOSITE</span>
              <span className="text-[#00FF41] font-bold">1,845.0 ▲ +2.96%</span>
            </div>
            
            {/* Bar Chart Visual */}
            <div className="w-full h-24 flex items-end space-x-1 pt-2">
              {bdiHistoricalBars.map((height, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                  <div
                    className="bg-[#F27D26] hover:bg-[#ffaa5a] w-full transition-all rounded-xs"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[8px] text-gray-600 mt-1">Q{idx + 1}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between text-[9px] text-gray-500 pt-1 border-t border-[#222]">
              <span>Capesize 40%</span>
              <span>Panamax 30%</span>
              <span>Supramax 30%</span>
            </div>
          </div>

          {/* MARKET DEPTH: SHA-LAX */}
          <div className="w-48 p-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-gray-500 text-[9px] mb-1">
              <span className="font-bold text-[#d1d1d1]">MARKET DEPTH: SHA-LAX</span>
              <button
                onClick={() => onOpenOrderTicket('FE-US-01', 'BUY', 5150)}
                className="text-[9px] text-[#F27D26] hover:underline"
              >
                TRADE
              </button>
            </div>

            <div className="space-y-0.5 text-[10px] font-mono">
              <div className="flex justify-between text-red-500">
                <span>5,200</span>
                <span>450 TEU</span>
              </div>
              <div className="flex justify-between text-red-400 opacity-80">
                <span>5,180</span>
                <span>220 TEU</span>
              </div>
              <div className="flex justify-between text-white bg-[#1a1a1a] px-1 border-y border-[#444] py-0.5 font-bold">
                <span>5,150</span>
                <span>MID-MKT</span>
              </div>
              <div className="flex justify-between text-[#00FF41] opacity-80">
                <span>5,120</span>
                <span>180 TEU</span>
              </div>
              <div className="flex justify-between text-[#00FF41]">
                <span>5,100</span>
                <span>900 TEU</span>
              </div>
            </div>

            <div className="text-[9px] text-gray-500 text-center pt-0.5">
              <span>Spread: $30/FEU (0.58%)</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 (Col 10-12): INSTANT BLOOM (IB) CHAT & ASSET ALLOCATION */}
      <section className="col-span-12 lg:col-span-3 bg-black flex flex-col min-h-0">
        <div className="p-2 bg-[#1a1a1a] border-b border-[#333] flex justify-between items-center font-bold text-cyan-400">
          <span className="flex items-center">
            <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            INSTANT BLOOM (IB) NETWORK
          </span>
          <button
            onClick={() => onNavigateView('CHAT')}
            className="text-[10px] text-gray-400 hover:text-white flex items-center"
          >
            EXPAND <ArrowUpRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {/* Live Trader Chat Messages */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {deskMessages.map(msg => (
            <div key={msg.id} className="text-[10px] border-b border-[#181818] pb-1.5">
              <span className={`font-bold block ${msg.senderColor}`}>{msg.sender}:</span>
              <p className="text-gray-300 mt-0.5 leading-snug">{msg.text}</p>
            </div>
          ))}
        </div>

        {/* Quick Chat Send Form */}
        <form onSubmit={handleSendChat} className="p-2 bg-[#0d0d0d] border-t border-[#333]">
          <div className="flex items-center bg-[#181818] border border-[#333] rounded px-2 py-1 focus-within:border-cyan-400">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message to Desk..."
              className="w-full bg-transparent text-white placeholder-gray-600 text-[10px] outline-none"
            />
            <button
              type="submit"
              className="text-cyan-400 hover:text-cyan-300 ml-1"
            >
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>

        {/* Portfolio Asset Allocation Bars */}
        <div className="h-44 bg-black border-t border-[#333] p-2 flex flex-col justify-between">
          <div className="flex justify-between items-center text-gray-500 text-[9px] uppercase tracking-widest mb-1">
            <span className="font-bold text-gray-400">Asset Allocation ($12.4M Desk)</span>
            <button
              onClick={() => onNavigateView('OMS')}
              className="text-[#F27D26] hover:underline"
            >
              EMSX &gt;
            </button>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-[#222] rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full w-[65%]" />
              </div>
              <span className="flex-1 text-gray-300">Equities / Shipping</span>
              <span className="text-white font-bold">65%</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-[#222] rounded-full overflow-hidden">
                <div className="bg-[#00FF41] h-full w-[20%]" />
              </div>
              <span className="flex-1 text-gray-300">Freight FFAs</span>
              <span className="text-white font-bold">20%</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-[#222] rounded-full overflow-hidden">
                <div className="bg-[#F27D26] h-full w-[10%]" />
              </div>
              <span className="flex-1 text-gray-300">Commodities (Oil/Gas)</span>
              <span className="text-white font-bold">10%</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-24 h-2 bg-[#222] rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[5%]" />
              </div>
              <span className="flex-1 text-gray-300">Cash / Margin</span>
              <span className="text-white font-bold">5%</span>
            </div>
          </div>

          <div className="pt-1 text-[9px] text-gray-500 flex justify-between border-t border-[#222]">
            <span>Net Unrealized P&L:</span>
            <span className="text-[#00FF41] font-bold">+$148,250 (+1.21%)</span>
          </div>
        </div>
      </section>
    </main>
  );
};

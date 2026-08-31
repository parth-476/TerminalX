import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Filter,
  BarChart3,
  DollarSign,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { AssetCategory, AssetQuote, TradeTick } from '../../types';
import { terminalSound } from '../../utils/terminalSound';

interface MarketDataViewProps {
  assets: AssetQuote[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  onOpenOrderTicket?: (ticker: string, side: 'BUY' | 'SELL', price: number) => void;
}

export const MarketDataView: React.FC<MarketDataViewProps> = ({
  assets,
  selectedTicker,
  onSelectTicker,
  onOpenOrderTicket
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [liveTicks, setLiveTicks] = useState<TradeTick[]>([]);
  const [tickSpeed, setTickSpeed] = useState<number>(1); // 1x, 2x, 5x

  const currentAsset = assets.find(a => a.ticker === selectedTicker) || assets[0];

  // Generate simulated streaming trade ticks
  useEffect(() => {
    const venues = ['SGX', 'ICE', 'CME', 'LSE', 'CFETS', 'BATS', 'DIRECT'];
    const interval = setInterval(() => {
      const isBuy = Math.random() > 0.48;
      const spreadDelta = (Math.random() - 0.5) * (currentAsset.price * 0.001);
      const tickPrice = Number((currentAsset.price + spreadDelta).toFixed(currentAsset.category === 'FX' ? 4 : 2));
      const tickSize = Math.floor(Math.random() * 25) + 1;

      const newTick: TradeTick = {
        id: 'tick-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        timestamp: new Date().toISOString().slice(11, 19) + '.' + Math.floor(Math.random() * 900 + 100),
        price: tickPrice,
        size: tickSize,
        side: isBuy ? 'BUY' : 'SELL',
        venue: venues[Math.floor(Math.random() * venues.length)]
      };

      setLiveTicks(prev => [newTick, ...prev.slice(0, 35)]);
    }, 1200 / tickSpeed);

    return () => clearInterval(interval);
  }, [currentAsset, tickSpeed]);

  const filteredAssets = assets.filter(a => {
    if (activeCategory === 'ALL') return true;
    return a.category === activeCategory;
  });

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: 'ALL ASSETS' },
    { id: 'FREIGHT_FFA', label: 'FREIGHT FFAs' },
    { id: 'COMMODITY', label: 'COMMODITIES' },
    { id: 'EQUITY', label: 'SHIPPING & EQUITIES' },
    { id: 'FX', label: 'CURRENCIES (FX)' },
    { id: 'RATES', label: 'RATES & YIELDS' }
  ];

  // Calculate orderbook max total for visual depth bar scaling
  const maxBidTotal = Math.max(...currentAsset.depth.bids.map(b => b.total), 1);
  const maxAskTotal = Math.max(...currentAsset.depth.asks.map(a => a.total), 1);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-115px)] bg-[#090b11] text-[#ff9f1c] font-mono border-t border-[#1e2338]">
      {/* LEFT: Multi-Asset Streaming Watchlist Matrix */}
      <div className="w-full lg:w-96 flex flex-col border-r border-[#1e2338] bg-[#0d0f18] shrink-0">
        {/* Category Selector Tabs */}
        <div className="p-2 bg-[#121524] border-b border-[#1e2338] flex flex-wrap gap-1">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setActiveCategory(c.id);
                terminalSound.playKeyClick();
              }}
              className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${
                activeCategory === c.id
                  ? 'bg-[#ff9f1c] text-black font-extrabold'
                  : 'bg-[#181d2f] text-[#cbd5e1] hover:text-[#ff9f1c] hover:bg-[#20273f]'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Streaming Asset Quotes List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#171b2b]">
          {filteredAssets.map(asset => {
            const isSelected = asset.ticker === currentAsset.ticker;
            const isPos = asset.change >= 0;

            return (
              <div
                key={asset.ticker}
                onClick={() => {
                  onSelectTicker(asset.ticker);
                  terminalSound.playKeyClick();
                }}
                className={`p-2.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#1b2238] border-l-4 border-[#ff9f1c]'
                    : 'hover:bg-[#131726]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-white text-xs block">{asset.ticker}</span>
                    <span className="text-[11px] text-[#94a3b8] truncate block max-w-[170px]">
                      {asset.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-white text-xs block font-mono">
                      {asset.price.toLocaleString()}
                    </span>
                    <span
                      className={`text-[11px] font-bold inline-flex items-center ${
                        isPos ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPos ? '+' : ''}
                      {asset.changePct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-[#64748b] mt-1 pt-1 border-t border-[#1a1f33]">
                  <span>Vol: {asset.volume.toLocaleString()}</span>
                  <span>Spread: {asset.spread} {asset.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CENTER: Selected Quote Banner, Depth Ladder & Trade Tape */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0b12]">
        {/* Top Asset Detailed Banner */}
        <div className="p-3 bg-[#111422] border-b border-[#1e2338] flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black text-white">{currentAsset.ticker}</h2>
              <span className="bg-[#1e253c] text-[#ff9f1c] text-[10px] px-1.5 py-0.5 rounded font-bold">
                {currentAsset.category}
              </span>
              <span className="text-xs text-[#94a3b8]">{currentAsset.name}</span>
            </div>
            <div className="text-[11px] text-[#64748b] mt-0.5">
              {currentAsset.details.description} | {currentAsset.details.marketCapOrOi}
            </div>
          </div>

          {/* Live Price & Fast Order Ticket Buttons */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-2xl font-black text-white font-mono">
                {currentAsset.price.toLocaleString()} <span className="text-xs text-[#ff9f1c] font-normal">{currentAsset.unit}</span>
              </div>
              <div
                className={`text-xs font-bold flex items-center justify-end ${
                  currentAsset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentAsset.change >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                {currentAsset.change >= 0 ? '+' : ''}{currentAsset.change.toFixed(2)} ({currentAsset.changePct.toFixed(2)}%)
              </div>
            </div>

            {/* Quick 1-Click Order Placement */}
            <div className="flex space-x-1.5">
              <button
                onClick={() => {
                  if (onOpenOrderTicket) onOpenOrderTicket(currentAsset.ticker, 'BUY', currentAsset.ask);
                  terminalSound.playTradeFill();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-3 py-1.5 rounded text-xs transition-all shadow-md"
              >
                BUY @ {currentAsset.ask}
              </button>
              <button
                onClick={() => {
                  if (onOpenOrderTicket) onOpenOrderTicket(currentAsset.ticker, 'SELL', currentAsset.bid);
                  terminalSound.playTradeFill();
                }}
                className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold px-3 py-1.5 rounded text-xs transition-all shadow-md"
              >
                SELL @ {currentAsset.bid}
              </button>
            </div>
          </div>
        </div>

        {/* Mid Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 p-2.5 bg-[#0e101b] border-b border-[#1c2033] text-xs">
          <div className="bg-[#080910] p-1.5 rounded border border-[#1a1e30]">
            <span className="text-[10px] text-[#64748b]">24H HIGH</span>
            <p className="font-bold text-white">{currentAsset.high.toLocaleString()}</p>
          </div>
          <div className="bg-[#080910] p-1.5 rounded border border-[#1a1e30]">
            <span className="text-[10px] text-[#64748b]">24H LOW</span>
            <p className="font-bold text-white">{currentAsset.low.toLocaleString()}</p>
          </div>
          <div className="bg-[#080910] p-1.5 rounded border border-[#1a1e30]">
            <span className="text-[10px] text-[#64748b]">PREV CLOSE</span>
            <p className="font-bold text-white">{currentAsset.previousClose.toLocaleString()}</p>
          </div>
          <div className="bg-[#080910] p-1.5 rounded border border-[#1a1e30]">
            <span className="text-[10px] text-[#64748b]">BID / ASK</span>
            <p className="font-bold text-white">{currentAsset.bid} / {currentAsset.ask}</p>
          </div>
          <div className="bg-[#080910] p-1.5 rounded border border-[#1a1e30]">
            <span className="text-[10px] text-[#64748b]">TOTAL VOLUME</span>
            <p className="font-bold text-white">{currentAsset.volume.toLocaleString()}</p>
          </div>
          <div className="bg-[#080910] p-1.5 rounded border border-[#1a1e30]">
            <span className="text-[10px] text-[#64748b]">SPREAD</span>
            <p className="font-bold text-[#ff9f1c]">{currentAsset.spread} {currentAsset.unit}</p>
          </div>
        </div>

        {/* Bottom Split: Level 2 Depth Book Ladder & Live Time/Sales Tape */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 p-3 min-h-0">
          {/* LEVEL 2 ORDER BOOK DEPTH LADDER */}
          <div className="bg-[#0e111c] border border-[#1e2338] rounded flex flex-col min-h-0">
            <div className="p-2 bg-[#141828] border-b border-[#1e2338] flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1.5 text-[#ff9f1c]" />
                LEVEL 2 MARKET DEPTH (LADDER)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">LIVE FEED</span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-2 flex-1 overflow-y-auto text-[11px] font-mono">
              {/* BIDS COLUMN */}
              <div>
                <div className="flex justify-between text-[10px] text-[#64748b] font-bold border-b border-[#1e2338] pb-1 mb-1">
                  <span>ORDERS</span>
                  <span>SIZE</span>
                  <span className="text-emerald-400">BID PRICE</span>
                </div>
                <div className="space-y-1">
                  {currentAsset.depth.bids.map((b, idx) => {
                    const depthPct = Math.min((b.total / maxBidTotal) * 100, 100);
                    return (
                      <div
                        key={`bid-${idx}`}
                        className="relative flex justify-between items-center px-1.5 py-0.5 rounded overflow-hidden hover:bg-[#192238] cursor-pointer"
                        onClick={() => {
                          if (onOpenOrderTicket) onOpenOrderTicket(currentAsset.ticker, 'SELL', b.price);
                          terminalSound.playKeyClick();
                        }}
                      >
                        {/* Background Depth Bar */}
                        <div
                          className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none"
                          style={{ width: `${depthPct}%` }}
                        />
                        <span className="text-[#64748b] z-10">{b.orders}</span>
                        <span className="text-white z-10">{b.size.toLocaleString()}</span>
                        <span className="text-emerald-400 font-bold z-10">{b.price.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ASKS COLUMN */}
              <div>
                <div className="flex justify-between text-[10px] text-[#64748b] font-bold border-b border-[#1e2338] pb-1 mb-1">
                  <span className="text-rose-400">ASK PRICE</span>
                  <span>SIZE</span>
                  <span>ORDERS</span>
                </div>
                <div className="space-y-1">
                  {currentAsset.depth.asks.map((a, idx) => {
                    const depthPct = Math.min((a.total / maxAskTotal) * 100, 100);
                    return (
                      <div
                        key={`ask-${idx}`}
                        className="relative flex justify-between items-center px-1.5 py-0.5 rounded overflow-hidden hover:bg-[#281b22] cursor-pointer"
                        onClick={() => {
                          if (onOpenOrderTicket) onOpenOrderTicket(currentAsset.ticker, 'BUY', a.price);
                          terminalSound.playKeyClick();
                        }}
                      >
                        {/* Background Depth Bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none"
                          style={{ width: `${depthPct}%` }}
                        />
                        <span className="text-rose-400 font-bold z-10">{a.price.toLocaleString()}</span>
                        <span className="text-white z-10">{a.size.toLocaleString()}</span>
                        <span className="text-[#64748b] z-10">{a.orders}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME TRADE TAPE / TIME & SALES */}
          <div className="bg-[#0e111c] border border-[#1e2338] rounded flex flex-col min-h-0">
            <div className="p-2 bg-[#141828] border-b border-[#1e2338] flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1.5 text-[#ff9f1c]" />
                TIME & SALES (STREAMING TAPE)
              </span>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-[#64748b]">SPEED:</span>
                {[1, 2, 5].map(s => (
                  <button
                    key={s}
                    onClick={() => setTickSpeed(s)}
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                      tickSpeed === s ? 'bg-[#ff9f1c] text-black' : 'bg-[#1f2538] text-[#cbd5e1]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 flex-1 overflow-y-auto text-[11px] font-mono">
              <div className="grid grid-cols-4 text-[10px] text-[#64748b] font-bold border-b border-[#1e2338] pb-1 mb-1">
                <span>TIME</span>
                <span>PRICE</span>
                <span className="text-right">QTY</span>
                <span className="text-right">VENUE</span>
              </div>

              <div className="divide-y divide-[#151928] space-y-0.5">
                {liveTicks.map(t => (
                  <div key={t.id} className="grid grid-cols-4 py-1 hover:bg-[#171c2e] transition-colors items-center">
                    <span className="text-[#64748b] text-[10px]">{t.timestamp}</span>
                    <span className={t.side === 'BUY' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {t.price.toLocaleString()}
                    </span>
                    <span className="text-right text-white font-semibold">{t.size}</span>
                    <span className="text-right text-[10px] text-[#94a3b8]">{t.venue}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

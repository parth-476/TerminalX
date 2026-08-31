import React, { useState } from 'react';
import {
  LineChart,
  Sliders,
  TrendingUp,
  Activity,
  Zap,
  BarChart2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { AssetQuote, YieldCurvePoint, OptionContract } from '../../types';
import { blackScholes, analyzeYieldCurve } from '../../utils/derivativesEngine';
import { YIELD_CURVE_DATA, SAMPLE_OPTIONS_CHAIN } from '../../data/marketData';
import { terminalSound } from '../../utils/terminalSound';

interface AdvancedAnalyticsViewProps {
  assets: AssetQuote[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
}

export type AnalyticsTab = 'CHART' | 'DERIVATIVES' | 'YIELD_CURVE' | 'FFA_FORWARD';

export const AdvancedAnalyticsView: React.FC<AdvancedAnalyticsViewProps> = ({
  assets,
  selectedTicker,
  onSelectTicker
}) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('CHART');
  const currentAsset = assets.find(a => a.ticker === selectedTicker) || assets[0];

  // Technical Chart Settings
  const [timeframe, setTimeframe] = useState<string>('1D');
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(true);

  // Black-Scholes Options Pricer Custom Inputs
  const [bsSpot, setBsSpot] = useState<number>(currentAsset.price);
  const [bsStrike, setBsStrike] = useState<number>(Math.round(currentAsset.price * 1.02));
  const [bsDteDays, setBsDteDays] = useState<number>(45);
  const [bsVol, setBsVol] = useState<number>(0.28);
  const [bsRate, setBsRate] = useState<number>(0.045);
  const [bsType, setBsType] = useState<'CALL' | 'PUT'>('CALL');

  // Compute live Black-Scholes result
  const bsResult = blackScholes(bsSpot, bsStrike, bsDteDays / 365, bsRate, bsVol, bsType);

  // Yield Curve Analysis
  const yieldCurveAnalysis = analyzeYieldCurve(YIELD_CURVE_DATA);

  // Candlestick Synthetic History Generation
  const generateCandles = () => {
    const base = currentAsset.price;
    const count = 30;
    const candles = [];
    let prevClose = base * 0.96;

    for (let i = 0; i < count; i++) {
      const open = prevClose;
      const delta = (Math.random() - 0.48) * (base * 0.015);
      const close = Number((open + delta).toFixed(2));
      const high = Number((Math.max(open, close) + Math.random() * (base * 0.008)).toFixed(2));
      const low = Number((Math.min(open, close) - Math.random() * (base * 0.008)).toFixed(2));
      const volume = Math.floor(Math.random() * 5000) + 500;
      candles.push({ time: `T-${count - i}`, open, high, low, close, volume });
      prevClose = close;
    }
    return candles;
  };

  const [candles] = useState(generateCandles());

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-115px)] bg-[#090b11] text-[#ff9f1c] font-mono border-t border-[#1e2338]">
      {/* Top Analytics Nav Tabs */}
      <div className="bg-[#121524] px-3 py-2 border-b border-[#1e2338] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setActiveTab('CHART');
              terminalSound.playKeyClick();
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              activeTab === 'CHART' ? 'bg-[#ff9f1c] text-black' : 'text-[#cbd5e1] hover:bg-[#1a1f33]'
            }`}
          >
            TECHNICAL CANDLESTICK & RSI
          </button>
          <button
            onClick={() => {
              setActiveTab('DERIVATIVES');
              terminalSound.playKeyClick();
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              activeTab === 'DERIVATIVES' ? 'bg-[#ff9f1c] text-black' : 'text-[#cbd5e1] hover:bg-[#1a1f33]'
            }`}
          >
            BLACK-SCHOLES OPTIONS PRICER (GREEKS)
          </button>
          <button
            onClick={() => {
              setActiveTab('YIELD_CURVE');
              terminalSound.playKeyClick();
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              activeTab === 'YIELD_CURVE' ? 'bg-[#ff9f1c] text-black' : 'text-[#cbd5e1] hover:bg-[#1a1f33]'
            }`}
          >
            TREASURY YIELD CURVE & SPREADS
          </button>
          <button
            onClick={() => {
              setActiveTab('FFA_FORWARD');
              terminalSound.playKeyClick();
            }}
            className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
              activeTab === 'FFA_FORWARD' ? 'bg-[#ff9f1c] text-black' : 'text-[#cbd5e1] hover:bg-[#1a1f33]'
            }`}
          >
            FREIGHT FFA FORWARD CURVE
          </button>
        </div>

        {/* Selected Underlying Dropdown */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#64748b]">TICKER:</span>
          <select
            value={currentAsset.ticker}
            onChange={(e) => {
              onSelectTicker(e.target.value);
              const found = assets.find(a => a.ticker === e.target.value);
              if (found) {
                setBsSpot(found.price);
                setBsStrike(Math.round(found.price * 1.02));
              }
              terminalSound.playKeyClick();
            }}
            className="bg-[#181d2f] text-white border border-[#2b334d] rounded px-2 py-1 outline-none font-bold"
          >
            {assets.map(a => (
              <option key={a.ticker} value={a.ticker}>
                {a.ticker} - {a.name} ({a.price})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN VIEW CONTENT */}
      <div className="flex-1 p-3 overflow-y-auto">
        {/* 1. TECHNICAL CANDLESTICK & INDICATORS CHART */}
        {activeTab === 'CHART' && (
          <div className="flex flex-col h-full space-y-3">
            {/* Chart Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#101320] p-2 rounded border border-[#1e2338] text-xs">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-white text-sm">{currentAsset.ticker}</span>
                <span className="text-[#64748b]">|</span>
                {['15M', '1H', '4H', '1D', '1W', '1M'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      timeframe === tf ? 'bg-[#ff9f1c] text-black' : 'bg-[#181d2f] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-3 text-[11px]">
                <label className="flex items-center space-x-1 text-[#cbd5e1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSMA}
                    onChange={(e) => setShowSMA(e.target.checked)}
                    className="accent-[#ff9f1c]"
                  />
                  <span>SMA (20)</span>
                </label>
                <label className="flex items-center space-x-1 text-[#cbd5e1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBollinger}
                    onChange={(e) => setShowBollinger(e.target.checked)}
                    className="accent-[#00e5ff]"
                  />
                  <span>Bollinger Bands</span>
                </label>
                <label className="flex items-center space-x-1 text-[#cbd5e1] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showRSI}
                    onChange={(e) => setShowRSI(e.target.checked)}
                    className="accent-purple-400"
                  />
                  <span>RSI (14)</span>
                </label>
              </div>
            </div>

            {/* Custom High-Precision SVG Candlestick Canvas */}
            <div className="flex-1 bg-[#06080e] rounded border border-[#1e2338] p-3 relative min-h-[320px] flex flex-col justify-between">
              <svg viewBox="0 0 900 320" className="w-full h-full">
                {/* Horizontal Grid lines */}
                {[0, 80, 160, 240, 320].map(y => (
                  <line key={y} x1="0" y1={y} x2="900" y2={y} stroke="#131728" strokeWidth="1" strokeDasharray="3 3" />
                ))}

                {/* Candlesticks */}
                {(() => {
                  const minPrice = Math.min(...candles.map(c => c.low)) * 0.995;
                  const maxPrice = Math.max(...candles.map(c => c.high)) * 1.005;
                  const priceRange = maxPrice - minPrice;

                  const candleWidth = 900 / candles.length;

                  return candles.map((c, idx) => {
                    const x = idx * candleWidth + candleWidth * 0.2;
                    const w = candleWidth * 0.6;

                    const yHigh = 280 - ((c.high - minPrice) / priceRange) * 240;
                    const yLow = 280 - ((c.low - minPrice) / priceRange) * 240;
                    const yOpen = 280 - ((c.open - minPrice) / priceRange) * 240;
                    const yClose = 280 - ((c.close - minPrice) / priceRange) * 240;

                    const isGreen = c.close >= c.open;
                    const color = isGreen ? '#00e676' : '#ff1744';

                    const rectY = Math.min(yOpen, yClose);
                    const rectH = Math.max(Math.abs(yClose - yOpen), 2);

                    return (
                      <g key={idx}>
                        {/* Wick */}
                        <line x1={x + w / 2} y1={yHigh} x2={x + w / 2} y2={yLow} stroke={color} strokeWidth="1.5" />
                        {/* Body */}
                        <rect x={x} y={rectY} width={w} height={rectH} fill={color} stroke={color} strokeWidth="0.5" />
                      </g>
                    );
                  });
                })()}
              </svg>

              {/* Chart Meta Footer */}
              <div className="flex justify-between text-[11px] text-[#64748b] pt-2 border-t border-[#161a29]">
                <span>OHLC: Open {candles[candles.length - 1].open} | High {candles[candles.length - 1].high} | Low {candles[candles.length - 1].low} | Close {candles[candles.length - 1].close}</span>
                <span>RSI(14): 58.4 (NEUTRAL-BULLISH)</span>
              </div>
            </div>
          </div>
        )}

        {/* 2. BLACK-SCHOLES OPTIONS DERIVATIVES PRICER */}
        {activeTab === 'DERIVATIVES' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Input Controls */}
            <div className="bg-[#101320] p-3 rounded border border-[#1e2338] space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center">
                <Sliders className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
                BLACK-SCHOLES PARAMETERS
              </h3>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between text-[#64748b]">
                    <span>OPTION TYPE:</span>
                    <span className="font-bold text-white">{bsType}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      onClick={() => setBsType('CALL')}
                      className={`py-1 rounded font-bold ${bsType === 'CALL' ? 'bg-emerald-500 text-black' : 'bg-[#1a2034] text-white'}`}
                    >
                      CALL OPTION
                    </button>
                    <button
                      onClick={() => setBsType('PUT')}
                      className={`py-1 rounded font-bold ${bsType === 'PUT' ? 'bg-rose-500 text-black' : 'bg-[#1a2034] text-white'}`}
                    >
                      PUT OPTION
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#64748b]">
                    <span>UNDERLYING SPOT PRICE (S):</span>
                    <span className="text-white font-bold">{bsSpot}</span>
                  </div>
                  <input
                    type="number"
                    value={bsSpot}
                    onChange={(e) => setBsSpot(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#080a10] border border-[#232a40] rounded px-2 py-1 text-white font-bold"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#64748b]">
                    <span>STRIKE PRICE (K):</span>
                    <span className="text-white font-bold">{bsStrike}</span>
                  </div>
                  <input
                    type="number"
                    value={bsStrike}
                    onChange={(e) => setBsStrike(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#080a10] border border-[#232a40] rounded px-2 py-1 text-white font-bold"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#64748b]">
                    <span>DAYS TO EXPIRY (DTE):</span>
                    <span className="text-white font-bold">{bsDteDays} days</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="365"
                    value={bsDteDays}
                    onChange={(e) => setBsDteDays(parseInt(e.target.value))}
                    className="w-full accent-[#ff9f1c] bg-[#1a1f33] h-1.5 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#64748b]">
                    <span>IMPLIED VOLATILITY (σ):</span>
                    <span className="text-white font-bold">{(bsVol * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.0"
                    step="0.01"
                    value={bsVol}
                    onChange={(e) => setBsVol(parseFloat(e.target.value))}
                    className="w-full accent-[#ff9f1c] bg-[#1a1f33] h-1.5 rounded"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[#64748b]">
                    <span>RISK-FREE SOFR RATE (r):</span>
                    <span className="text-white font-bold">{(bsRate * 100).toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.10"
                    step="0.0025"
                    value={bsRate}
                    onChange={(e) => setBsRate(parseFloat(e.target.value))}
                    className="w-full accent-[#ff9f1c] bg-[#1a1f33] h-1.5 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Calculated Greeks & Value */}
            <div className="bg-[#101320] p-3 rounded border border-[#1e2338] space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center">
                <Zap className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
                THEORETICAL PRICING & GREEKS
              </h3>

              <div className="bg-[#070910] p-3 rounded border border-[#1f263d] text-center">
                <span className="text-[10px] text-[#64748b] block font-bold">THEORETICAL OPTION FAIR VALUE</span>
                <span className="text-3xl font-black text-[#ff9f1c] block mt-1">${bsResult.price}</span>
                <span className="text-[11px] text-[#94a3b8]">Moneyness: {((bsSpot / bsStrike - 1) * 100).toFixed(2)}%</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#080910] p-2 rounded border border-[#1c2236]">
                  <span className="text-[10px] text-[#64748b]">DELTA (Δ)</span>
                  <p className="text-sm font-bold text-white">{bsResult.delta}</p>
                </div>
                <div className="bg-[#080910] p-2 rounded border border-[#1c2236]">
                  <span className="text-[10px] text-[#64748b]">GAMMA (Γ)</span>
                  <p className="text-sm font-bold text-white">{bsResult.gamma}</p>
                </div>
                <div className="bg-[#080910] p-2 rounded border border-[#1c2236]">
                  <span className="text-[10px] text-[#64748b]">VEGA (ν per 1% vol)</span>
                  <p className="text-sm font-bold text-white">{bsResult.vega}</p>
                </div>
                <div className="bg-[#080910] p-2 rounded border border-[#1c2236]">
                  <span className="text-[10px] text-[#64748b]">THETA (θ 1-day decay)</span>
                  <p className="text-sm font-bold text-rose-400">{bsResult.theta}</p>
                </div>
                <div className="bg-[#080910] p-2 rounded border border-[#1c2236] col-span-2">
                  <span className="text-[10px] text-[#64748b]">RHO (ρ per 1% rate)</span>
                  <p className="text-sm font-bold text-white">{bsResult.rho}</p>
                </div>
              </div>
            </div>

            {/* Active Market Options Chain Table */}
            <div className="bg-[#101320] p-3 rounded border border-[#1e2338] space-y-2 flex flex-col">
              <h3 className="text-sm font-bold text-white flex items-center">
                <Layers className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
                LIVE BRENT OIL OPTION CHAIN (OCT 2026)
              </h3>

              <div className="flex-1 overflow-y-auto text-[11px] font-mono">
                <table className="w-full text-left">
                  <thead className="text-[10px] text-[#64748b] border-b border-[#1e2338]">
                    <tr>
                      <th className="py-1">TYPE</th>
                      <th>STRIKE</th>
                      <th>BID</th>
                      <th>ASK</th>
                      <th>IV</th>
                      <th>DELTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#171c2e]">
                    {SAMPLE_OPTIONS_CHAIN.map(opt => (
                      <tr key={opt.ticker} className="hover:bg-[#161a29]">
                        <td className={`py-1 font-bold ${opt.type === 'CALL' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {opt.type}
                        </td>
                        <td className="text-white font-bold">${opt.strike}</td>
                        <td className="text-[#cbd5e1]">{opt.bid}</td>
                        <td className="text-[#cbd5e1]">{opt.ask}</td>
                        <td className="text-cyan-400">{(opt.iv * 100).toFixed(0)}%</td>
                        <td className="text-[#94a3b8]">{opt.delta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. TREASURY YIELD CURVE & INVERSION ANALYSIS */}
        {activeTab === 'YIELD_CURVE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2 bg-[#101320] p-3 rounded border border-[#1e2338] flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center">
                  <Activity className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
                  US BENCHMARK TREASURY CONSTANT MATURITY YIELD CURVE
                </h3>
                <span className="text-[10px] text-[#ff9f1c] bg-[#1a2034] px-2 py-0.5 rounded font-bold">
                  CURVE STATUS: {yieldCurveAnalysis.status}
                </span>
              </div>

              {/* Yield Curve SVG Spline */}
              <div className="flex-1 min-h-[260px] bg-[#07080e] p-3 rounded border border-[#191f33] relative">
                <svg viewBox="0 0 600 240" className="w-full h-full">
                  {/* Grid Lines */}
                  {[0, 60, 120, 180, 240].map(y => (
                    <line key={y} x1="0" y1={y} x2="600" y2={y} stroke="#151b2c" strokeWidth="1" strokeDasharray="3 3" />
                  ))}

                  {/* Current Yield Curve Path */}
                  {(() => {
                    const points = YIELD_CURVE_DATA.map((pt, idx) => {
                      const x = (idx / (YIELD_CURVE_DATA.length - 1)) * 560 + 20;
                      // yield from 3.5% to 5.5% mapped to height
                      const y = 220 - ((pt.yieldCurrent - 3.5) / 2.0) * 180;
                      return { x, y, pt };
                    });

                    const d = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

                    return (
                      <>
                        <path d={d} fill="none" stroke="#ff9f1c" strokeWidth="3" />
                        {points.map((p, idx) => (
                          <g key={idx}>
                            <circle cx={p.x} cy={p.y} r="4" fill="#ff9f1c" stroke="#000" strokeWidth="1.5" />
                            <text x={p.x} y={p.y - 8} fill="#fff" fontSize="8" textAnchor="middle" fontWeight="bold">
                              {p.pt.yieldCurrent}%
                            </text>
                            <text x={p.x} y="235" fill="#64748b" fontSize="7.5" textAnchor="middle">
                              {p.pt.tenor}
                            </text>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Yield Spreads Monitor */}
            <div className="bg-[#101320] p-3 rounded border border-[#1e2338] space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center">
                <BarChart2 className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
                KEY SPREAD MONITORS & INVERSION
              </h3>

              <div className="space-y-2 text-xs">
                <div className="bg-[#080a10] p-2.5 rounded border border-[#1c2236]">
                  <div className="flex justify-between text-[#64748b]">
                    <span>2Y / 10Y SPREAD (STEEPNESS):</span>
                    <span className="text-white font-bold">{yieldCurveAnalysis.spread2_10} bps</span>
                  </div>
                  <div className="w-full bg-[#171c2e] h-2 rounded mt-1 overflow-hidden">
                    <div
                      className={`h-full ${yieldCurveAnalysis.spread2_10 >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                      style={{ width: `${Math.min(Math.abs(yieldCurveAnalysis.spread2_10), 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-[#080a10] p-2.5 rounded border border-[#1c2236]">
                  <div className="flex justify-between text-[#64748b]">
                    <span>3M / 10Y RECESSION SPREAD:</span>
                    <span className="text-white font-bold">{yieldCurveAnalysis.spread3m_10y} bps</span>
                  </div>
                </div>

                <div className="bg-[#080a10] p-2.5 rounded border border-[#1c2236]">
                  <div className="flex justify-between text-[#64748b]">
                    <span>10Y / 30Y TERM PREMIUM:</span>
                    <span className="text-white font-bold">{yieldCurveAnalysis.spread10_30} bps</span>
                  </div>
                </div>

                <div className="bg-[#121626] p-2 rounded text-[11px] text-[#cbd5e1] border border-[#20273f]">
                  💡 The 2Y/10Y curve is in un-inverting territory as short-term policy rates anticipate Fed monetary easing.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. FREIGHT FFA FORWARD CURVE */}
        {activeTab === 'FFA_FORWARD' && (
          <div className="bg-[#101320] p-3 rounded border border-[#1e2338] space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center">
              <TrendingUp className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
              BALTIC FORWARD FREIGHT AGREEMENTS (FFA) TERM STRUCTURE MATRIX
            </h3>

            <div className="overflow-x-auto text-xs font-mono">
              <table className="w-full text-left">
                <thead className="text-[10px] text-[#64748b] border-b border-[#1e2338] bg-[#0c0e18]">
                  <tr>
                    <th className="p-2">VESSEL SEGMENT</th>
                    <th>PROMPT SPOT</th>
                    <th>Q3 2026</th>
                    <th>Q4 2026</th>
                    <th>CAL 2027</th>
                    <th>CAL 2028</th>
                    <th>CHANGE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171c2e]">
                  <tr className="hover:bg-[#161a29]">
                    <td className="p-2 font-bold text-[#ff9f1c]">Capesize 5TC ($/day)</td>
                    <td className="text-white font-bold">$27,450</td>
                    <td>$28,100</td>
                    <td className="text-emerald-400 font-bold">$28,450</td>
                    <td>$24,200</td>
                    <td>$22,500</td>
                    <td className="text-emerald-400">+4.2%</td>
                  </tr>
                  <tr className="hover:bg-[#161a29]">
                    <td className="p-2 font-bold text-[#ff9f1c]">Panamax 4TC ($/day)</td>
                    <td className="text-white font-bold">$15,800</td>
                    <td>$16,250</td>
                    <td className="text-emerald-400 font-bold">$16,900</td>
                    <td>$14,500</td>
                    <td>$13,800</td>
                    <td className="text-emerald-400">+2.8%</td>
                  </tr>
                  <tr className="hover:bg-[#161a29]">
                    <td className="p-2 font-bold text-[#ff9f1c]">Supramax 10TC ($/day)</td>
                    <td className="text-white font-bold">$14,200</td>
                    <td>$14,600</td>
                    <td className="text-emerald-400 font-bold">$15,100</td>
                    <td>$13,400</td>
                    <td>$12,900</td>
                    <td className="text-emerald-400">+1.9%</td>
                  </tr>
                  <tr className="hover:bg-[#161a29]">
                    <td className="p-2 font-bold text-[#ff3d00]">VLCC TD3C Middle East-China</td>
                    <td className="text-white font-bold">$44,500</td>
                    <td>$45,200</td>
                    <td className="text-emerald-400 font-bold">$46,800</td>
                    <td>$41,000</td>
                    <td>$39,500</td>
                    <td className="text-emerald-400">+4.8%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

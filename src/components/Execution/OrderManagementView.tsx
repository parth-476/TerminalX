import React, { useState } from 'react';
import {
  Zap,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  XCircle,
  PlusCircle,
  Play,
  RotateCcw,
  BarChart,
  DollarSign
} from 'lucide-react';
import { AssetQuote, OrderTicket, Position } from '../../types';
import { INITIAL_ORDERS, INITIAL_POSITIONS } from '../../data/marketData';
import { terminalSound } from '../../utils/terminalSound';

interface OrderManagementViewProps {
  assets: AssetQuote[];
  initialOrderParams?: { ticker: string; side: 'BUY' | 'SELL'; price: number } | null;
}

export const OrderManagementView: React.FC<OrderManagementViewProps> = ({
  assets,
  initialOrderParams
}) => {
  const [orders, setOrders] = useState<OrderTicket[]>(INITIAL_ORDERS);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);

  // Ticket Form States
  const [ticketTicker, setTicketTicker] = useState<string>(initialOrderParams?.ticker || assets[0].ticker);
  const [ticketSide, setTicketSide] = useState<'BUY' | 'SELL'>(initialOrderParams?.side || 'BUY');
  const [ticketType, setTicketType] = useState<'LIMIT' | 'MARKET' | 'STOP' | 'ICEBERG' | 'TWAP'>('LIMIT');
  const [ticketQuantity, setTicketQuantity] = useState<number>(10);
  const [ticketPrice, setTicketPrice] = useState<number>(initialOrderParams?.price || assets[0].price);
  const [ticketTif, setTicketTif] = useState<'DAY' | 'GTC' | 'IOC' | 'FOK'>('DAY');
  const [ticketAlgoSlices, setTicketAlgoSlices] = useState<number>(5);

  const selectedAsset = assets.find(a => a.ticker === ticketTicker) || assets[0];

  // Pre-Trade Risk Analytics calculations
  const notionalValue = ticketQuantity * (ticketType === 'MARKET' ? selectedAsset.price : ticketPrice);
  const initialMarginReq = notionalValue * 0.12; // 12% margin requirement
  const estSlippageBps = ticketQuantity > 50 ? 4.5 : 1.2;
  const marketImpactUsd = notionalValue * (estSlippageBps / 10000);

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newOrderId = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
    const newOrder: OrderTicket = {
      id: newOrderId,
      timestamp: new Date().toISOString().slice(11, 19),
      ticker: ticketTicker,
      side: ticketSide,
      type: ticketType,
      quantity: ticketQuantity,
      limitPrice: ticketType === 'MARKET' ? undefined : ticketPrice,
      status: 'WORKING',
      filledQty: 0,
      avgFillPrice: 0,
      timeInForce: ticketTif,
      notes: `${ticketType} execution via EMSX Algorithmic Router`
    };

    setOrders(prev => [newOrder, ...prev]);
    terminalSound.playTradeFill();

    // Simulate market fill after 1.5 seconds
    setTimeout(() => {
      setOrders(prev =>
        prev.map(ord => {
          if (ord.id === newOrderId) {
            const fillPx = ord.limitPrice || selectedAsset.price;
            return {
              ...ord,
              status: 'FILLED',
              filledQty: ord.quantity,
              avgFillPrice: fillPx
            };
          }
          return ord;
        })
      );

      // Add to positions
      setPositions(prev => {
        const existing = prev.find(p => p.ticker === ticketTicker);
        if (existing) {
          const newQty = ticketSide === 'BUY' ? existing.quantity + ticketQuantity : existing.quantity - ticketQuantity;
          return prev.map(p => p.ticker === ticketTicker ? { ...p, quantity: newQty } : p);
        } else {
          return [
            ...prev,
            {
              id: 'pos-' + Date.now(),
              ticker: ticketTicker,
              name: selectedAsset.name,
              category: selectedAsset.category,
              quantity: ticketSide === 'BUY' ? ticketQuantity : -ticketQuantity,
              entryPrice: ticketPrice,
              currentPrice: selectedAsset.price,
              unrealizedPnl: 0,
              unrealizedPnlPct: 0,
              exposureNotional: notionalValue
            }
          ];
        }
      });
      terminalSound.playTradeFill();
    }, 1500);
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev =>
      prev.map(ord => (ord.id === orderId ? { ...ord, status: 'CANCELLED' } : ord))
    );
    terminalSound.playKeyClick();
  };

  // Calculate Total Portfolio P&L
  const totalUnrealizedPnl = positions.reduce((sum, p) => sum + p.unrealizedPnl, 0);
  const totalExposure = positions.reduce((sum, p) => sum + p.exposureNotional, 0);

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-115px)] bg-[#090b11] text-[#ff9f1c] font-mono border-t border-[#1e2338]">
      {/* LEFT: Order Placement Ticket & Pre-Trade Risk Guard */}
      <div className="w-full lg:w-96 flex flex-col border-r border-[#1e2338] bg-[#0d0f18] shrink-0 p-3 space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e2338] pb-2">
          <span className="text-xs font-bold text-white flex items-center">
            <Zap className="w-4 h-4 mr-1.5 text-[#ff9f1c]" />
            EMSX MULTI-ASSET ORDER TICKET
          </span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
            DIRECT FIX 4.4
          </span>
        </div>

        <form onSubmit={handlePlaceOrder} className="space-y-2.5 text-xs">
          {/* Ticker Selector */}
          <div>
            <label className="text-[10px] text-[#64748b] block mb-1">SELECT SECURITY / TICKER</label>
            <select
              value={ticketTicker}
              onChange={(e) => {
                setTicketTicker(e.target.value);
                const found = assets.find(a => a.ticker === e.target.value);
                if (found) setTicketPrice(found.price);
                terminalSound.playKeyClick();
              }}
              className="w-full bg-[#141827] text-white border border-[#262e45] rounded p-1.5 font-bold outline-none"
            >
              {assets.map(a => (
                <option key={a.ticker} value={a.ticker}>
                  {a.ticker} - {a.name} ({a.price} {a.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Buy / Sell Switch */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setTicketSide('BUY');
                terminalSound.playKeyClick();
              }}
              className={`py-2 rounded font-black text-xs transition-all ${
                ticketSide === 'BUY'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-[#181d2f] text-[#cbd5e1] hover:bg-[#20273f]'
              }`}
            >
              BUY (LONG)
            </button>
            <button
              type="button"
              onClick={() => {
                setTicketSide('SELL');
                terminalSound.playKeyClick();
              }}
              className={`py-2 rounded font-black text-xs transition-all ${
                ticketSide === 'SELL'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                  : 'bg-[#181d2f] text-[#cbd5e1] hover:bg-[#20273f]'
              }`}
            >
              SELL (SHORT)
            </button>
          </div>

          {/* Order Type & TIF */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#64748b] block mb-0.5">ORDER TYPE</label>
              <select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value as any)}
                className="w-full bg-[#141827] text-white border border-[#262e45] rounded p-1.5 font-bold outline-none"
              >
                <option value="LIMIT">LIMIT</option>
                <option value="MARKET">MARKET</option>
                <option value="STOP">STOP</option>
                <option value="ICEBERG">ICEBERG ALGO</option>
                <option value="TWAP">TWAP ROUTE</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#64748b] block mb-0.5">TIME IN FORCE</label>
              <select
                value={ticketTif}
                onChange={(e) => setTicketTif(e.target.value as any)}
                className="w-full bg-[#141827] text-white border border-[#262e45] rounded p-1.5 font-bold outline-none"
              >
                <option value="DAY">DAY</option>
                <option value="GTC">GTC</option>
                <option value="IOC">IOC (Imm/Cancel)</option>
                <option value="FOK">FOK (Fill or Kill)</option>
              </select>
            </div>
          </div>

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[#64748b] block mb-0.5">QUANTITY (LOTS)</label>
              <input
                type="number"
                min="1"
                value={ticketQuantity}
                onChange={(e) => setTicketQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#080910] text-white border border-[#262e45] rounded p-1.5 font-bold outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#64748b] block mb-0.5">LIMIT PRICE</label>
              <input
                type="number"
                step="any"
                disabled={ticketType === 'MARKET'}
                value={ticketPrice}
                onChange={(e) => setTicketPrice(parseFloat(e.target.value) || 0)}
                className={`w-full text-white border border-[#262e45] rounded p-1.5 font-bold outline-none ${
                  ticketType === 'MARKET' ? 'bg-[#181d2f] text-[#64748b]' : 'bg-[#080910]'
                }`}
              />
            </div>
          </div>

          {/* Pre-Trade Risk Analytics Box */}
          <div className="bg-[#080a10] p-2.5 rounded border border-[#1e2338] space-y-1 text-[11px]">
            <span className="text-[10px] text-[#94a3b8] font-bold block mb-1">PRE-TRADE RISK AUDIT</span>
            <div className="flex justify-between text-[#cbd5e1]">
              <span>Gross Notional:</span>
              <span className="font-bold text-white">${notionalValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#cbd5e1]">
              <span>Initial Margin Req (12%):</span>
              <span className="font-bold text-[#ff9f1c]">${initialMarginReq.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[#64748b]">
              <span>Est. Market Impact / Slippage:</span>
              <span>${marketImpactUsd.toFixed(2)} ({estSlippageBps} bps)</span>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 rounded font-black text-xs transition-all shadow-lg active:scale-95 flex items-center justify-center space-x-1.5 ${
              ticketSide === 'BUY'
                ? 'bg-emerald-500 hover:bg-emerald-400 text-black'
                : 'bg-rose-500 hover:bg-rose-400 text-black'
            }`}
          >
            <span>SUBMIT {ticketSide} ORDER &lt;EXECUTE&gt;</span>
          </button>
        </form>
      </div>

      {/* RIGHT: Active Order Blotter & Live Positions Matrix */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0b12] divide-y divide-[#1e2338]">
        {/* ACTIVE PORTFOLIO POSITIONS TABLE */}
        <div className="p-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center">
              <DollarSign className="w-4 h-4 mr-1 text-[#ff9f1c]" />
              LIVE PORTFOLIO EXPOSURE & UNREALIZED P&L
            </span>
            <div className="flex items-center space-x-3 text-xs">
              <span>Total Notional: <strong className="text-white">${totalExposure.toLocaleString()}</strong></span>
              <span>
                Net P&L:{' '}
                <strong className={totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toLocaleString()}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead className="text-[10px] text-[#64748b] border-b border-[#1e2338] bg-[#0e111c]">
                <tr>
                  <th className="p-2">TICKER</th>
                  <th>NAME</th>
                  <th>QTY</th>
                  <th>ENTRY PX</th>
                  <th>MARKET PX</th>
                  <th>NOTIONAL</th>
                  <th>UNREALIZED P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171c2e]">
                {positions.map(pos => {
                  const isPos = pos.unrealizedPnl >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-[#151928]">
                      <td className="p-2 font-bold text-[#ff9f1c]">{pos.ticker}</td>
                      <td className="text-white text-[11px]">{pos.name}</td>
                      <td className={`font-bold ${pos.quantity >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {pos.quantity > 0 ? `+${pos.quantity}` : pos.quantity}
                      </td>
                      <td className="text-[#cbd5e1]">{pos.entryPrice.toLocaleString()}</td>
                      <td className="text-white font-bold">{pos.currentPrice.toLocaleString()}</td>
                      <td className="text-[#94a3b8]">${pos.exposureNotional.toLocaleString()}</td>
                      <td className={`font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? '+' : ''}${pos.unrealizedPnl.toLocaleString()} ({isPos ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTIVE ORDERS BLOTTER */}
        <div className="p-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-[#ff9f1c]" />
              EMSX ORDER BLOTTER (ACTIVE & EXECUTED ORDERS)
            </span>
            <span className="text-[10px] text-[#64748b]">{orders.length} TOTAL ORDERS LOGGED</span>
          </div>

          <div className="flex-1 overflow-y-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead className="text-[10px] text-[#64748b] border-b border-[#1e2338] bg-[#0e111c]">
                <tr>
                  <th className="p-2">ORDER ID</th>
                  <th>TIME</th>
                  <th>TICKER</th>
                  <th>SIDE</th>
                  <th>TYPE</th>
                  <th>QTY</th>
                  <th>LIMIT PX</th>
                  <th>FILLED</th>
                  <th>AVG PX</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171c2e]">
                {orders.map(ord => (
                  <tr key={ord.id} className="hover:bg-[#151928]">
                    <td className="p-2 text-[#64748b] text-[11px]">{ord.id}</td>
                    <td className="text-[#94a3b8] text-[11px]">{ord.timestamp}</td>
                    <td className="font-bold text-white">{ord.ticker}</td>
                    <td className={`font-bold ${ord.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {ord.side}
                    </td>
                    <td className="text-[#cbd5e1]">{ord.type}</td>
                    <td className="text-white font-bold">{ord.quantity}</td>
                    <td className="text-[#cbd5e1]">{ord.limitPrice ? ord.limitPrice.toLocaleString() : 'MKT'}</td>
                    <td className="text-white font-semibold">{ord.filledQty} / {ord.quantity}</td>
                    <td className="text-white">{ord.avgFillPrice ? ord.avgFillPrice.toLocaleString() : '-'}</td>
                    <td>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          ord.status === 'FILLED'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : ord.status === 'WORKING'
                            ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td>
                      {ord.status === 'WORKING' && (
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          className="text-rose-400 hover:text-rose-300 text-[10px] font-bold flex items-center"
                        >
                          <XCircle className="w-3 h-3 mr-0.5" />
                          CANCEL
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

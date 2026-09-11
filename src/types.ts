export type AssetCategory = 'EQUITY' | 'COMMODITY' | 'FX' | 'RATES' | 'FREIGHT_FFA';

export interface OrderBookEntry { price: number; size: number; total: number; orders: number; isMyOrder?: boolean; }
export interface TradeTick { id: string; timestamp: string; price: number; size: number; side: 'BUY' | 'SELL'; venue: string; }
export interface AssetQuote {
  ticker: string; name: string; category: AssetCategory; price: number; previousClose: number; change: number; changePct: number; high: number; low: number; volume: number; bid: number; bidSize: number; ask: number; askSize: number; spread: number; unit: string; lastUpdated: string;
  history: { time: string; price: number; volume?: number }[];
  depth: { bids: OrderBookEntry[]; asks: OrderBookEntry[] };
  details: { marketCapOrOi?: string; peOrDuration?: string; iv?: number; description: string };
}
export type VesselType = 'CONTAINER' | 'CRUDE_TANKER' | 'DRY_BULK' | 'LNG_CARRIER' | 'CAR_CARRIER';
export type CargoStatus = 'LADEN' | 'BALLAST' | 'WAITING' | 'MOORED';
export interface Vessel {
  id: string; mmsi: string; name: string; imo: string; type: VesselType; flag: string; lat: number; lon: number; heading: number; speedKnots: number; draftM: number; maxDraftM: number; dwt: number; teuCapacity?: number; barrelCapacity?: number; currentLaneId: string; originPort: string; destinationPort: string; eta: string; cargoStatus: CargoStatus; operator: string; congestionWaitHours: number; co2PerTonNm: number; riskAlert?: string;
}
export interface Port {
  id: string; name: string; code: string; country: string; lat: number; lon: number; throughputTeuM: number; avgWaitDays: number; congestionScore: number; vesselsAtBerth: number; vesselsWaiting: number; bunkerPriceVLSFO: number; status: 'NORMAL' | 'MODERATE' | 'CONGESTED' | 'CRITICAL';
}
export interface IncidentHotspot {
  id: string; title: string; category: 'SINKING' | 'MISSILE_ATTACK' | 'COLLISION' | 'OIL_SPILL' | 'PIRACY' | 'DROUGHT' | 'SEA_MINE' | 'SEVERE_WEATHER'; vesselName: string; vesselType?: string; flag?: string; imo?: string; locationName: string; lat: number; lon: number; date: string;
  casualties: { fatalities: number; injured: number; missing: number; crewStatus: string };
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'; status: 'ACTIVE_HAZARD' | 'SALVAGE_IN_PROGRESS' | 'RESTRICTED_ZONE' | 'RESOLVED_MONITORING'; environmentalImpact: string; insuranceImpact: string; freightImpact: string; detailedSitrep: string; relatedTickers: string[];
}
export interface ChokePoint { id: string; name: string; lat: number; lon: number; dailyTransits: number; avgDelayHours: number; riskLevel: 'LOW' | 'MEDIUM' | 'ELEVATED' | 'HIGH'; statusDescription: string; }
export interface FreightLane {
  id: string; code: string; name: string; type: 'CONTAINER' | 'DRY_BULK' | 'CRUDE' | 'LNG'; originPort: string; destinationPort: string; originCoords: [number, number]; destCoords: [number, number]; waypoints: [number, number][]; currentRateUsd: number; rateUnit: string; change24h: number; changePct: number; historicalRates: { date: string; rate: number }[]; distanceNm: number; transitDays: number; activeVessels: number; congestionIndex: number; carbonEtsCostEst: number; chokePointsCrossed: string[];
}
export interface NewsArticle { id: string; timestamp: string; headline: string; source: string; priority: 'FLASH' | 'URGENT' | 'ROUTINE'; category: string; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; summary: string; tickers: string[]; }
export interface EconomicEvent { id: string; timestamp: string; country: string; event: string; period: string; actual: string; consensus: string; previous: string; impact: 'HIGH' | 'MEDIUM' | 'LOW'; }
export interface EarningsEstimate { company: string; ticker: string; period: string; reportDate: string; epsEstimate: string; epsActual: string; revEstimate: string; revActual: string; }
export interface CreditRatingUpdate { entity: string; ticker: string; agency: string; rating: string; action: string; outlook: string; date: string; }
export interface NewsStory { id: string; timestamp: string; headline: string; source: string; urgency: 'FLASH' | 'URGENT' | 'ROUTINE'; category: 'FREIGHT' | 'MACRO' | 'COMMODITIES' | 'CENTRAL_BANKS' | 'GEOPOLITICAL'; sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; summary: string; impactTickers: string[]; readTime: string; }
export interface EconomicRelease { id: string; time: string; country: string; event: string; actual: string | null; forecast: string; previous: string; impact: 'HIGH' | 'MEDIUM' | 'LOW'; surprise?: 'POSITIVE' | 'NEGATIVE' | 'INLINE'; category: string; }
export interface QuoteRun { runId: string; assetCode: string; side: 'BID' | 'OFFER' | 'TWO_WAY'; bidPrice?: number; askPrice?: number; price?: number; size: number; unit: string; terms: string; validMinutes: number; }
export interface DealProposal { dealId: string; assetCode: string; qty: number; unit: string; price: number; buyer: string; seller: string; status: 'PROPOSED' | 'COUNTERED' | 'CONFIRMED' | 'SETTLED' | 'CANCELLED'; complianceHash: string; timestamp: string; }
export interface ChatMessage { id: string; senderId?: string; senderName: string; senderFirm: string; channelId?: string; timestamp: string; text: string; isMe?: boolean; isCurrentUser?: boolean; complianceArchived?: boolean; isComplianceArchived?: boolean; quoteRun?: QuoteRun; dealProposal?: DealProposal; }
export interface ChatChannel { id: string; name: string; type: 'DIRECT' | 'DESK_GROUP' | 'MARKET_CHAT'; firm: string; status: 'ONLINE' | 'AWAY' | 'BUSY'; unreadCount: number; messages: ChatMessage[]; }
export interface OrderTicket { id: string; timestamp: string; ticker: string; side: 'BUY' | 'SELL'; type: 'LIMIT' | 'MARKET' | 'STOP' | 'ICEBERG' | 'TWAP'; quantity: number; limitPrice?: number; status: 'WORKING' | 'FILLED' | 'CANCELLED' | 'REJECTED'; filledQty: number; avgFillPrice: number; timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK'; notes?: string; }
export interface Position { id: string; ticker: string; name: string; category: string; quantity: number; entryPrice: number; currentPrice: number; unrealizedPnl: number; unrealizedPnlPct: number; exposureNotional: number; }
export interface Order { id: string; clientOrderId: string; ticker: string; name: string; side: 'BUY' | 'SELL'; type: 'MARKET' | 'LIMIT' | 'STOP' | 'TWAP' | 'VWAP' | 'ICEBERG'; qty: number; limitPrice?: number; filledQty: number; avgFillPrice: number; status: 'NEW' | 'WORKING' | 'FILLED' | 'CANCELLED' | 'REJECTED'; placedTime: string; filledTime?: string; algoParams?: string; venue: string; slippageBps: number; }
export interface OptionContract { ticker: string; type: 'CALL' | 'PUT'; strike: number; expiry: string; bid: number; ask: number; last: number; iv: number; delta: number; gamma: number; theta: number; vega: number; rho: number; volume: number; openInterest: number; }
export interface YieldCurvePoint { tenor: string; maturityYears: number; yieldCurrent: number; yield1M: number; yield1Y: number; }
export type TerminalTheme = 'amber' | 'green' | 'cyan' | 'bloomberg-classic';
export type TerminalViewId = 'WORKSPACE' | 'FRGT' | 'MARKET' | 'FCST' | 'PORT' | 'VSL' | 'NEWS' | 'OMS' | 'AI' | 'ANLY' | 'CHAT' | 'XL';

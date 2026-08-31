import { NewsStory, EconomicRelease, NewsArticle, EconomicEvent, EarningsEstimate, CreditRatingUpdate, ChatChannel } from '../types';

export const MOCK_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: 'news-01',
    timestamp: '15:12:44 UTC',
    headline: 'RED SEA MARITIME DISRUPTION: SUEZ DIVERSIONS REACH 68% OF GLOBAL ASIA-EUROPE CONTAINER TONNAGE',
    source: 'BBG FREIGHT WIRE',
    priority: 'FLASH',
    category: 'FREIGHT',
    sentiment: 'BULLISH',
    summary: 'Major container liner alliances extend Cape of Good Hope transit schedules into Q4 2026. Spot Shanghai-to-Rotterdam rates jump +3.9% as effective global fleet capacity tightens by 9.4%. Bunker fuel replenishment at Port Louis and Durban reaches maximum capacity.',
    tickers: ['SCFI.INDEX', 'MAERSK.DC', 'ZIM:US', 'VLSFO.SGP']
  },
  {
    id: 'news-02',
    timestamp: '15:08:12 UTC',
    headline: 'OPEC+ EXTENDS VOLUNTARY CRUDE EXPORT CUTS THROUGH Q3; VLCC CHARTER RATES FIRM IN ARABIAN GULF',
    source: 'BLOOMBERG COMMODITIES',
    priority: 'URGENT',
    category: 'COMMODITIES',
    sentiment: 'BULLISH',
    summary: 'Saudi Arabia and UAE confirm maintenance of 1.65M bpd voluntary cuts. Frontline VLCC day-rates surge past $46,800/day on tight tonnage supply in the Persian Gulf as Asian refiners secure Middle Eastern sour crude.',
    tickers: ['CO1:COM', 'FRO:US', 'FFA.CAPE.5TC']
  },
  {
    id: 'news-03',
    timestamp: '14:55:30 UTC',
    headline: 'US TREASURY YIELDS DROP AS CORE PCE DISINFLATION BEATS CONSENSUS; 2Y/10Y CURVE STEEPENS +6.5 BPS',
    source: 'BBG RATES & MACRO',
    priority: 'URGENT',
    category: 'MACRO',
    sentiment: 'BULLISH',
    summary: 'Benchmark 10-Year yield slips to 4.285% while short-end SOFR expectations price in a 25 bps rate cut in September. Dollar index eases against major Asian export currencies, supporting emerging market trade flows.',
    tickers: ['USGG10YR:IND', 'US2Y10Y:IND', 'EURUSD:CUR', 'USDCNY:CUR']
  },
  {
    id: 'news-04',
    timestamp: '14:32:19 UTC',
    headline: 'CHINA STEEL MILLS REPLENISH IRON ORE INVENTORIES: PORT HEDLAND SHIPMENTS TO NINGBO SURGE',
    source: 'BBG DRY BULK DESK',
    priority: 'ROUTINE',
    category: 'FREIGHT',
    sentiment: 'BULLISH',
    summary: 'Capesize C5 Western Australia to Qingdao benchmark jumps to $11.45/ton. Baltic Dry Index advances for the 5th consecutive session on strong Brazilian and Australian dry bulk fixtures.',
    tickers: ['BDI.INDEX', 'FE62.SGX', 'FFA.CAPE.5TC']
  },
  {
    id: 'news-05',
    timestamp: '13:45:00 UTC',
    headline: 'PANAMA CANAL DRAFT RESTRICTIONS EASE TO 45 FEET AFTER LATE SUMMER RAINFALL AT GATUN LAKE',
    source: 'MARITIME TELEMETRY',
    priority: 'ROUTINE',
    category: 'FREIGHT',
    sentiment: 'NEUTRAL',
    summary: 'Panama Canal Authority increases daily booked transit slots to 38 vessels. US Gulf to Asia LNG carrier wait-times reduce from 14 days to 4.5 days.',
    tickers: ['SCFI.INDEX', 'TA-WB-04']
  },
  {
    id: 'news-06',
    timestamp: '12:10:45 UTC',
    headline: 'EU ETS MARITIME CARBON COMPLIANCE COSTS ADD UP TO $140,000 PER VOYAGE ON ASIA-ROTTERDAM ROUTE',
    source: 'CARBON & ESG DESK',
    priority: 'ROUTINE',
    category: 'MACRO',
    sentiment: 'BEARISH',
    summary: 'With EU ETS EUA carbon allowance trading near €72/ton, carriers pass through green surcharges of $35-$65 per TEU across European import corridors.',
    tickers: ['FE-EUR-01', 'MAERSK.DC']
  }
];

export const INITIAL_NEWS_STORIES: NewsStory[] = MOCK_NEWS_ARTICLES.map(n => ({
  id: n.id,
  timestamp: n.timestamp,
  headline: n.headline,
  source: n.source,
  urgency: n.priority,
  category: (n.category as any) || 'FREIGHT',
  sentiment: n.sentiment,
  summary: n.summary,
  impactTickers: n.tickers,
  readTime: '2m'
}));

export const MOCK_ECONOMIC_EVENTS: EconomicEvent[] = [
  {
    id: 'eco-01',
    timestamp: '12:30 UTC',
    country: 'US',
    event: 'Core PCE Price Index (MoM)',
    period: 'Jul',
    actual: '0.2%',
    consensus: '0.2%',
    previous: '0.3%',
    impact: 'HIGH'
  },
  {
    id: 'eco-02',
    timestamp: '12:30 UTC',
    country: 'US',
    event: 'Personal Spending (MoM)',
    period: 'Jul',
    actual: '0.5%',
    consensus: '0.3%',
    previous: '0.4%',
    impact: 'MEDIUM'
  },
  {
    id: 'eco-03',
    timestamp: '14:00 UTC',
    country: 'US',
    event: 'Univ. of Michigan Consumer Sentiment',
    period: 'Aug F',
    actual: '67.9',
    consensus: '68.0',
    previous: '66.4',
    impact: 'MEDIUM'
  },
  {
    id: 'eco-04',
    timestamp: '14:30 UTC',
    country: 'US',
    event: 'EIA Crude Oil Weekly Inventory Change',
    period: 'Aug 23',
    actual: '-3.85M bbl',
    consensus: '-1.50M bbl',
    previous: '-4.65M bbl',
    impact: 'HIGH'
  },
  {
    id: 'eco-05',
    timestamp: '01:30 UTC (Tom)',
    country: 'CN',
    event: 'NBS Manufacturing PMI',
    period: 'Aug',
    actual: '49.8 (Exp)',
    consensus: '49.8',
    previous: '49.4',
    impact: 'HIGH'
  },
  {
    id: 'eco-06',
    timestamp: '09:00 UTC (Tom)',
    country: 'EU',
    event: 'Eurozone Harmonised CPI (YoY)',
    period: 'Aug P',
    actual: '2.2% (Exp)',
    consensus: '2.2%',
    previous: '2.6%',
    impact: 'HIGH'
  }
];

export const ECONOMIC_CALENDAR: EconomicRelease[] = [
  {
    id: 'eco-01',
    time: '12:30 UTC',
    country: '🇺🇸 US',
    event: 'Core PCE Price Index (MoM)',
    actual: '0.2%',
    forecast: '0.2%',
    previous: '0.3%',
    impact: 'HIGH',
    surprise: 'INLINE',
    category: 'Inflation'
  },
  {
    id: 'eco-02',
    time: '12:30 UTC',
    country: '🇺🇸 US',
    event: 'Personal Spending (MoM)',
    actual: '0.5%',
    forecast: '0.3%',
    previous: '0.4%',
    impact: 'MEDIUM',
    surprise: 'POSITIVE',
    category: 'Consumer'
  },
  {
    id: 'eco-03',
    time: '14:00 UTC',
    country: '🇺🇸 US',
    event: 'Univ. of Michigan Consumer Sentiment',
    actual: '67.9',
    forecast: '68.0',
    previous: '66.4',
    impact: 'MEDIUM',
    surprise: 'INLINE',
    category: 'Sentiment'
  },
  {
    id: 'eco-04',
    time: '14:30 UTC',
    country: '🇺🇸 US',
    event: 'EIA Crude Oil Weekly Inventory Change',
    actual: '-3.85M bbl',
    forecast: '-1.50M bbl',
    previous: '-4.65M bbl',
    impact: 'HIGH',
    surprise: 'POSITIVE',
    category: 'Energy'
  },
  {
    id: 'eco-05',
    time: '01:30 UTC (Tomorrow)',
    country: '🇨🇳 CN',
    event: 'NBS Manufacturing PMI',
    actual: null,
    forecast: '49.8',
    previous: '49.4',
    impact: 'HIGH',
    category: 'Manufacturing'
  },
  {
    id: 'eco-06',
    time: '09:00 UTC (Tomorrow)',
    country: '🇪🇺 EU',
    event: 'Eurozone Harmonised CPI (YoY)',
    actual: null,
    forecast: '2.2%',
    previous: '2.6%',
    impact: 'HIGH',
    category: 'Inflation'
  }
];

export const MOCK_EARNINGS: EarningsEstimate[] = [
  {
    company: 'A.P. Møller – Mærsk A/S',
    ticker: 'MAERSK.DC',
    period: 'Q2 2026',
    reportDate: '07 Aug 2026',
    epsEstimate: '$14.20',
    epsActual: '$18.85',
    revEstimate: '$12.8B',
    revActual: '$13.6B'
  },
  {
    company: 'Hapag-Lloyd AG',
    ticker: 'HLAG.GY',
    period: 'Q2 2026',
    reportDate: '14 Aug 2026',
    epsEstimate: '€8.40',
    epsActual: '€11.20',
    revEstimate: '€4.5B',
    revActual: '€4.9B'
  },
  {
    company: 'ZIM Integrated Shipping',
    ticker: 'ZIM:US',
    period: 'Q2 2026',
    reportDate: '19 Aug 2026',
    epsEstimate: '$2.15',
    epsActual: '$3.08',
    revEstimate: '$1.75B',
    revActual: '$1.93B'
  },
  {
    company: 'Frontline Ltd (VLCC Tankers)',
    ticker: 'FRO:US',
    period: 'Q2 2026',
    reportDate: '28 Aug 2026',
    epsEstimate: '$0.78',
    epsActual: '$0.89',
    revEstimate: '$490M',
    revActual: '$532M'
  },
  {
    company: 'Golden Ocean Group (Dry Bulk)',
    ticker: 'GOGL:US',
    period: 'Q2 2026',
    reportDate: '22 Aug 2026',
    epsEstimate: '$0.34',
    epsActual: '$0.41',
    revEstimate: '$235M',
    revActual: '$251M'
  }
];

export const MOCK_CREDIT_RATINGS: CreditRatingUpdate[] = [
  {
    entity: 'A.P. Møller - Mærsk A/S',
    ticker: 'MAERSK.DC',
    agency: "Moody's",
    rating: 'Baa1',
    action: 'AFFIRMED',
    outlook: 'POSITIVE',
    date: '2026-08-18'
  },
  {
    entity: 'Hapag-Lloyd AG',
    ticker: 'HLAG.GY',
    agency: 'S&P Global',
    rating: 'BBB+',
    action: 'UPGRADED',
    outlook: 'STABLE',
    date: '2026-08-12'
  },
  {
    entity: 'COSCO SHIPPING Holdings',
    ticker: '1919.HK',
    agency: 'Fitch',
    rating: 'A-',
    action: 'AFFIRMED',
    outlook: 'STABLE',
    date: '2026-07-29'
  },
  {
    entity: 'Frontline plc',
    ticker: 'FRO:US',
    agency: 'S&P Global',
    rating: 'BB+',
    action: 'AFFIRMED',
    outlook: 'POSITIVE',
    date: '2026-08-05'
  },
  {
    entity: 'ZIM Integrated Shipping',
    ticker: 'ZIM:US',
    agency: "Moody's",
    rating: 'Ba3',
    action: 'UPGRADED',
    outlook: 'STABLE',
    date: '2026-08-20'
  }
];

export const INITIAL_CHAT_CHANNELS: ChatChannel[] = [
  {
    id: 'ch-gunvor',
    name: 'GUNVOR SA (GENEVA DESK)',
    type: 'DIRECT',
    firm: 'Gunvor International BV',
    status: 'ONLINE',
    unreadCount: 0,
    messages: [
      {
        id: 'm1',
        senderName: 'MARCUS VOGEL',
        senderFirm: 'GUNVOR SA GENEVA',
        timestamp: '14:22',
        text: 'Checking your firm bid on Shanghai-Rotterdam July FEU forward contract. We have 10 lots available at $7,200.',
        isCurrentUser: false,
        complianceArchived: true
      },
      {
        id: 'm2',
        senderName: 'DESK TRADER (ME)',
        senderFirm: 'GLENCORE MARITIME LTD',
        timestamp: '14:25',
        text: 'We are bidding $7,150 for 10 lots index linked. Capacity tighter than expected with Cape rerouting.',
        isCurrentUser: true,
        complianceArchived: true
      },
      {
        id: 'm3',
        senderName: 'MARCUS VOGEL',
        senderFirm: 'GUNVOR SA GENEVA',
        timestamp: '14:28',
        text: 'Agreed on $7,180 mid. Please book into EMSX blotter.',
        isCurrentUser: false,
        complianceArchived: true
      }
    ]
  },
  {
    id: 'ch-trafigura',
    name: 'TRAFIGURA FREIGHT & BUNKER',
    type: 'DIRECT',
    firm: 'Trafigura Maritime Pte',
    status: 'ONLINE',
    unreadCount: 1,
    messages: [
      {
        id: 't1',
        senderName: 'SARAH LI',
        senderFirm: 'TRAFIGURA SINGAPORE',
        timestamp: '13:50',
        text: 'Singapore 0.5% VLSFO prompt stems tight until Thursday. Offering $628/MT delivered.',
        isCurrentUser: false,
        complianceArchived: true
      }
    ]
  },
  {
    id: 'ch-ffa-desk',
    name: 'GLOBAL MARITIME FFA SYNDICATE',
    type: 'DESK_GROUP',
    firm: 'Multi-Broker Syndicate',
    status: 'ONLINE',
    unreadCount: 2,
    messages: [
      {
        id: 'g1',
        senderName: 'D. CHEN [CLARKSONS]',
        senderFirm: 'CLARKSONS PLATOU',
        timestamp: '14:40',
        text: 'Capesize 5TC Q4 paper trades up +$650/day. Vale confirmed 3 additional stems out of Tubarao.',
        isCurrentUser: false,
        complianceArchived: true
      },
      {
        id: 'g2',
        senderName: 'ALEX R. [BRAEMAR]',
        senderFirm: 'BRAEMAR ACM',
        timestamp: '14:45',
        text: 'Panamax P4TC Atlantic round voyage fixing at $15,200/day. Grain demand supporting Gulf fixtures.',
        isCurrentUser: false,
        complianceArchived: true
      }
    ]
  }
];


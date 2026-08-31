import { AssetQuote, OptionContract, YieldCurvePoint, OrderTicket, Position } from '../types';

export const INITIAL_ASSETS: AssetQuote[] = [
  // FREIGHT FFA & MARITIME INDICES
  {
    ticker: 'BDI.INDEX',
    name: 'Baltic Dry Index (BDI)',
    category: 'FREIGHT_FFA',
    price: 1845.0,
    previousClose: 1792.0,
    change: 53.0,
    changePct: 2.96,
    high: 1860.0,
    low: 1788.0,
    volume: 12450,
    bid: 1842.0,
    bidSize: 45,
    ask: 1848.0,
    askSize: 60,
    spread: 6.0,
    unit: 'pts',
    lastUpdated: '15:14:02.891 UTC',
    history: [
      { time: '09:00', price: 1792 },
      { time: '10:30', price: 1810 },
      { time: '12:00', price: 1825 },
      { time: '13:30', price: 1838 },
      { time: '15:00', price: 1845 }
    ],
    depth: {
      bids: [
        { price: 1842, size: 45, total: 45, orders: 4 },
        { price: 1840, size: 80, total: 125, orders: 7 },
        { price: 1838, size: 110, total: 235, orders: 11 },
        { price: 1835, size: 240, total: 475, orders: 18 },
        { price: 1830, size: 500, total: 975, orders: 29 }
      ],
      asks: [
        { price: 1848, size: 60, total: 60, orders: 5 },
        { price: 1850, size: 95, total: 155, orders: 8 },
        { price: 1852, size: 140, total: 295, orders: 12 },
        { price: 1855, size: 310, total: 605, orders: 22 },
        { price: 1860, size: 620, total: 1225, orders: 34 }
      ]
    },
    details: {
      marketCapOrOi: 'OI: 48,200 lots',
      description: 'Composite dry bulk shipping rate index (Capesize 40%, Panamax 30%, Supramax 30%).'
    }
  },
  {
    ticker: 'SCFI.INDEX',
    name: 'Shanghai Containerized Freight Index',
    category: 'FREIGHT_FFA',
    price: 3740.5,
    previousClose: 3620.0,
    change: 120.5,
    changePct: 3.33,
    high: 3765.0,
    low: 3615.0,
    volume: 8900,
    bid: 3738.0,
    bidSize: 30,
    ask: 3743.0,
    askSize: 40,
    spread: 5.0,
    unit: '$/TEU',
    lastUpdated: '15:14:03.112 UTC',
    history: [
      { time: '09:00', price: 3620 },
      { time: '10:30', price: 3660 },
      { time: '12:00', price: 3710 },
      { time: '13:30', price: 3735 },
      { time: '15:00', price: 3740.5 }
    ],
    depth: {
      bids: [
        { price: 3738, size: 30, total: 30, orders: 3 },
        { price: 3735, size: 75, total: 105, orders: 6 },
        { price: 3730, size: 120, total: 225, orders: 10 },
        { price: 3725, size: 190, total: 415, orders: 15 },
        { price: 3720, size: 350, total: 765, orders: 24 }
      ],
      asks: [
        { price: 3743, size: 40, total: 40, orders: 4 },
        { price: 3745, size: 85, total: 125, orders: 7 },
        { price: 3750, size: 150, total: 275, orders: 13 },
        { price: 3755, size: 280, total: 555, orders: 20 },
        { price: 3760, size: 490, total: 1045, orders: 31 }
      ]
    },
    details: {
      marketCapOrOi: 'Weekly benchmark',
      description: 'Shanghai spot export container transport market freight rate benchmark.'
    }
  },
  {
    ticker: 'FFA.CAPE.5TC',
    name: 'Capesize 5TC Forward Q4',
    category: 'FREIGHT_FFA',
    price: 28450.0,
    previousClose: 27300.0,
    change: 1150.0,
    changePct: 4.21,
    high: 28600.0,
    low: 27250.0,
    volume: 3400,
    bid: 28400.0,
    bidSize: 15,
    ask: 28500.0,
    askSize: 20,
    spread: 100.0,
    unit: '$/day',
    lastUpdated: '15:14:01.045 UTC',
    history: [
      { time: '09:00', price: 27300 },
      { time: '10:30', price: 27750 },
      { time: '12:00', price: 28100 },
      { time: '13:30', price: 28350 },
      { time: '15:00', price: 28450 }
    ],
    depth: {
      bids: [
        { price: 28400, size: 15, total: 15, orders: 2 },
        { price: 28350, size: 30, total: 45, orders: 5 },
        { price: 28300, size: 60, total: 105, orders: 8 },
        { price: 28200, size: 90, total: 195, orders: 12 },
        { price: 28000, size: 180, total: 375, orders: 19 }
      ],
      asks: [
        { price: 28500, size: 20, total: 20, orders: 3 },
        { price: 28550, size: 40, total: 60, orders: 6 },
        { price: 28600, size: 75, total: 135, orders: 9 },
        { price: 28700, size: 110, total: 245, orders: 14 },
        { price: 28900, size: 220, total: 465, orders: 22 }
      ]
    },
    details: {
      marketCapOrOi: 'Cleared: SGX / EEX',
      description: 'Forward Freight Agreement for Capesize 180k DWT standard 5-route timecharter average.'
    }
  },

  // COMMODITIES
  {
    ticker: 'CO1:COM',
    name: 'Brent Crude Oil Spot/Active',
    category: 'COMMODITY',
    price: 84.62,
    previousClose: 83.25,
    change: 1.37,
    changePct: 1.65,
    high: 85.10,
    low: 83.15,
    volume: 384500,
    bid: 84.60,
    bidSize: 250,
    ask: 84.64,
    askSize: 310,
    spread: 0.04,
    unit: '$/bbl',
    lastUpdated: '15:14:04.220 UTC',
    history: [
      { time: '09:00', price: 83.25 },
      { time: '10:30', price: 83.80 },
      { time: '12:00', price: 84.15 },
      { time: '13:30', price: 84.45 },
      { time: '15:00', price: 84.62 }
    ],
    depth: {
      bids: [
        { price: 84.60, size: 250, total: 250, orders: 14 },
        { price: 84.58, size: 410, total: 660, orders: 23 },
        { price: 84.55, size: 820, total: 1480, orders: 38 },
        { price: 84.50, size: 1540, total: 3020, orders: 62 },
        { price: 84.40, size: 2900, total: 5920, orders: 95 }
      ],
      asks: [
        { price: 84.64, size: 310, total: 310, orders: 17 },
        { price: 84.66, size: 520, total: 830, orders: 28 },
        { price: 84.70, size: 940, total: 1770, orders: 44 },
        { price: 84.75, size: 1680, total: 3450, orders: 71 },
        { price: 84.85, size: 3100, total: 6550, orders: 110 }
      ]
    },
    details: {
      marketCapOrOi: 'OI: 1.14M contracts',
      description: 'ICE Brent Crude futures contract - global petroleum pricing benchmark.'
    }
  },
  {
    ticker: 'VLSFO.SGP',
    name: 'Singapore 0.5% VLSFO Bunker Fuel',
    category: 'COMMODITY',
    price: 628.00,
    previousClose: 621.50,
    change: 6.50,
    changePct: 1.05,
    high: 631.00,
    low: 620.00,
    volume: 18200,
    bid: 627.50,
    bidSize: 50,
    ask: 628.50,
    askSize: 65,
    spread: 1.00,
    unit: '$/mt',
    lastUpdated: '15:14:02.500 UTC',
    history: [
      { time: '09:00', price: 621.5 },
      { time: '10:30', price: 624.0 },
      { time: '12:00', price: 626.5 },
      { time: '13:30', price: 627.0 },
      { time: '15:00', price: 628.0 }
    ],
    depth: {
      bids: [
        { price: 627.5, size: 50, total: 50, orders: 4 },
        { price: 627.0, size: 120, total: 170, orders: 8 },
        { price: 626.0, size: 210, total: 380, orders: 12 },
        { price: 625.0, size: 450, total: 830, orders: 20 },
        { price: 623.0, size: 800, total: 1630, orders: 35 }
      ],
      asks: [
        { price: 628.5, size: 65, total: 65, orders: 5 },
        { price: 629.0, size: 140, total: 205, orders: 9 },
        { price: 630.0, size: 240, total: 445, orders: 15 },
        { price: 631.0, size: 510, total: 955, orders: 24 },
        { price: 633.0, size: 920, total: 1875, orders: 40 }
      ]
    },
    details: {
      marketCapOrOi: 'Physical & Swap',
      description: 'IMO 2020 compliant Very Low Sulphur Fuel Oil FOB Singapore cargo benchmark.'
    }
  },
  {
    ticker: 'FE62.SGX',
    name: 'Iron Ore 62% Fe CFR China',
    category: 'COMMODITY',
    price: 114.80,
    previousClose: 111.90,
    change: 2.90,
    changePct: 2.59,
    high: 115.40,
    low: 111.50,
    volume: 142000,
    bid: 114.75,
    bidSize: 180,
    ask: 114.85,
    askSize: 220,
    spread: 0.10,
    unit: '$/mt',
    lastUpdated: '15:14:03.450 UTC',
    history: [
      { time: '09:00', price: 111.9 },
      { time: '10:30', price: 112.8 },
      { time: '12:00', price: 113.6 },
      { time: '13:30', price: 114.2 },
      { time: '15:00', price: 114.8 }
    ],
    depth: {
      bids: [
        { price: 114.75, size: 180, total: 180, orders: 11 },
        { price: 114.65, size: 340, total: 520, orders: 18 },
        { price: 114.50, size: 680, total: 1200, orders: 29 },
        { price: 114.20, size: 1150, total: 2350, orders: 45 },
        { price: 113.80, size: 2400, total: 4750, orders: 74 }
      ],
      asks: [
        { price: 114.85, size: 220, total: 220, orders: 13 },
        { price: 114.95, size: 390, total: 610, orders: 21 },
        { price: 115.10, size: 750, total: 1360, orders: 33 },
        { price: 115.40, size: 1280, total: 2640, orders: 51 },
        { price: 115.80, size: 2600, total: 5240, orders: 82 }
      ]
    },
    details: {
      marketCapOrOi: 'SGX Cleared',
      description: 'Benchmark spot price for 62% Iron fine ore delivered into Qingdao.'
    }
  },

  // EQUITIES (SHIPPING & GLOBAL TRADE TITANS)
  {
    ticker: 'MAERSK.DC',
    name: 'A.P. Møller - Mærsk A/S',
    category: 'EQUITY',
    price: 11840.0,
    previousClose: 11490.0,
    change: 350.0,
    changePct: 3.05,
    high: 11920.0,
    low: 11450.0,
    volume: 184000,
    bid: 11830.0,
    bidSize: 40,
    ask: 11850.0,
    askSize: 55,
    spread: 20.0,
    unit: 'DKK',
    lastUpdated: '15:14:04.010 UTC',
    history: [
      { time: '09:00', price: 11490 },
      { time: '10:30', price: 11620 },
      { time: '12:00', price: 11750 },
      { time: '13:30', price: 11810 },
      { time: '15:00', price: 11840 }
    ],
    depth: {
      bids: [
        { price: 11830, size: 40, total: 40, orders: 5 },
        { price: 11810, size: 85, total: 125, orders: 9 },
        { price: 11780, size: 140, total: 265, orders: 16 },
        { price: 11740, size: 280, total: 545, orders: 28 },
        { price: 11680, size: 520, total: 1065, orders: 44 }
      ],
      asks: [
        { price: 11850, size: 55, total: 55, orders: 6 },
        { price: 11870, size: 95, total: 150, orders: 11 },
        { price: 11900, size: 160, total: 310, orders: 19 },
        { price: 11940, size: 310, total: 620, orders: 31 },
        { price: 12000, size: 600, total: 1220, orders: 50 }
      ]
    },
    details: {
      marketCapOrOi: 'DKK 198.4B',
      peOrDuration: 'P/E: 6.4x',
      description: 'World integrated container logistics, ocean shipping & terminal operator.'
    }
  },
  {
    ticker: 'ZIM:US',
    name: 'ZIM Integrated Shipping Services',
    category: 'EQUITY',
    price: 24.85,
    previousClose: 23.40,
    change: 1.45,
    changePct: 6.20,
    high: 25.10,
    low: 23.25,
    volume: 5890000,
    bid: 24.84,
    bidSize: 1200,
    ask: 24.86,
    askSize: 1500,
    spread: 0.02,
    unit: 'USD',
    lastUpdated: '15:14:04.560 UTC',
    history: [
      { time: '09:00', price: 23.40 },
      { time: '10:30', price: 23.95 },
      { time: '12:00', price: 24.40 },
      { time: '13:30', price: 24.70 },
      { time: '15:00', price: 24.85 }
    ],
    depth: {
      bids: [
        { price: 24.84, size: 1200, total: 1200, orders: 25 },
        { price: 24.82, size: 2400, total: 3600, orders: 42 },
        { price: 24.80, size: 4800, total: 8400, orders: 68 },
        { price: 24.75, size: 9200, total: 17600, orders: 110 },
        { price: 24.65, size: 18000, total: 35600, orders: 180 }
      ],
      asks: [
        { price: 24.86, size: 1500, total: 1500, orders: 30 },
        { price: 24.88, size: 2800, total: 4300, orders: 49 },
        { price: 24.90, size: 5400, total: 9700, orders: 75 },
        { price: 24.95, size: 10500, total: 20200, orders: 125 },
        { price: 25.05, size: 21000, total: 41200, orders: 210 }
      ]
    },
    details: {
      marketCapOrOi: 'USD 2.98B',
      peOrDuration: 'P/E: 4.8x | Div: 14.2%',
      description: 'Asset-light global container liner operating transpacific & Atlantic lanes.'
    }
  },
  {
    ticker: 'FRO:US',
    name: 'Frontline PLC (Crude VLCC)',
    category: 'EQUITY',
    price: 28.30,
    previousClose: 26.90,
    change: 1.40,
    changePct: 5.20,
    high: 28.55,
    low: 26.85,
    volume: 3240000,
    bid: 28.28,
    bidSize: 800,
    ask: 28.32,
    askSize: 950,
    spread: 0.04,
    unit: 'USD',
    lastUpdated: '15:14:03.900 UTC',
    history: [
      { time: '09:00', price: 26.90 },
      { time: '10:30', price: 27.40 },
      { time: '12:00', price: 27.90 },
      { time: '13:30', price: 28.15 },
      { time: '15:00', price: 28.30 }
    ],
    depth: {
      bids: [
        { price: 28.28, size: 800, total: 800, orders: 18 },
        { price: 28.25, size: 1600, total: 2400, orders: 32 },
        { price: 28.20, size: 3100, total: 5500, orders: 54 },
        { price: 28.10, size: 6200, total: 11700, orders: 88 },
        { price: 28.00, size: 12500, total: 24200, orders: 140 }
      ],
      asks: [
        { price: 28.32, size: 950, total: 950, orders: 21 },
        { price: 28.35, size: 1850, total: 2800, orders: 37 },
        { price: 28.40, size: 3600, total: 6400, orders: 61 },
        { price: 28.50, size: 7100, total: 13500, orders: 98 },
        { price: 28.60, size: 14000, total: 27500, orders: 160 }
      ]
    },
    details: {
      marketCapOrOi: 'USD 6.31B',
      peOrDuration: 'P/E: 7.1x',
      description: 'Major international crude oil tanker shipping company (VLCC & Suezmax fleet).'
    }
  },

  // FOREIGN EXCHANGE
  {
    ticker: 'EURUSD:CUR',
    name: 'EUR / USD Spot',
    category: 'FX',
    price: 1.0842,
    previousClose: 1.0815,
    change: 0.0027,
    changePct: 0.25,
    high: 1.0860,
    low: 1.0805,
    volume: 12500000,
    bid: 1.08415,
    bidSize: 5000000,
    ask: 1.08425,
    askSize: 5000000,
    spread: 0.0001,
    unit: 'USD',
    lastUpdated: '15:14:04.890 UTC',
    history: [
      { time: '09:00', price: 1.0815 },
      { time: '10:30', price: 1.0825 },
      { time: '12:00', price: 1.0838 },
      { time: '13:30', price: 1.0840 },
      { time: '15:00', price: 1.0842 }
    ],
    depth: {
      bids: [
        { price: 1.08415, size: 5000, total: 5000, orders: 50 },
        { price: 1.0841, size: 8500, total: 13500, orders: 75 },
        { price: 1.0840, size: 14000, total: 27500, orders: 120 },
        { price: 1.0838, size: 25000, total: 52500, orders: 190 },
        { price: 1.0835, size: 50000, total: 102500, orders: 310 }
      ],
      asks: [
        { price: 1.08425, size: 5000, total: 5000, orders: 52 },
        { price: 1.0843, size: 9000, total: 14000, orders: 78 },
        { price: 1.0844, size: 15000, total: 29000, orders: 125 },
        { price: 1.0846, size: 26000, total: 55000, orders: 195 },
        { price: 1.0850, size: 52000, total: 107000, orders: 320 }
      ]
    },
    details: {
      marketCapOrOi: 'Interbank CLS',
      description: 'Euro spot exchange rate vs US Dollar.'
    }
  },
  {
    ticker: 'USDCNY:CUR',
    name: 'USD / CNY Onshore',
    category: 'FX',
    price: 7.2340,
    previousClose: 7.2410,
    change: -0.0070,
    changePct: -0.10,
    high: 7.2450,
    low: 7.2310,
    volume: 8400000,
    bid: 7.2335,
    bidSize: 3000000,
    ask: 7.2345,
    askSize: 3000000,
    spread: 0.0010,
    unit: 'CNY',
    lastUpdated: '15:14:03.650 UTC',
    history: [
      { time: '09:00', price: 7.2410 },
      { time: '10:30', price: 7.2385 },
      { time: '12:00', price: 7.2360 },
      { time: '13:30', price: 7.2345 },
      { time: '15:00', price: 7.2340 }
    ],
    depth: {
      bids: [
        { price: 7.2335, size: 3000, total: 3000, orders: 30 },
        { price: 7.2330, size: 6000, total: 9000, orders: 50 },
        { price: 7.2320, size: 11000, total: 20000, orders: 85 },
        { price: 7.2300, size: 22000, total: 42000, orders: 140 },
        { price: 7.2280, size: 45000, total: 87000, orders: 230 }
      ],
      asks: [
        { price: 7.2345, size: 3000, total: 3000, orders: 32 },
        { price: 7.2350, size: 6500, total: 9500, orders: 54 },
        { price: 7.2360, size: 12000, total: 21500, orders: 90 },
        { price: 7.2380, size: 24000, total: 45500, orders: 145 },
        { price: 7.2400, size: 48000, total: 93500, orders: 240 }
      ]
    },
    details: {
      marketCapOrOi: 'CFETS Fixing: 7.2180',
      description: 'US Dollar to Chinese Yuan Renminbi onshore foreign exchange rate.'
    }
  },

  // FIXED INCOME & RATES
  {
    ticker: 'USGG10YR:IND',
    name: 'US Generic Govt 10Y Yield',
    category: 'RATES',
    price: 4.285,
    previousClose: 4.340,
    change: -0.055,
    changePct: -1.27,
    high: 4.345,
    low: 4.270,
    volume: 980000,
    bid: 4.283,
    bidSize: 500,
    ask: 4.287,
    askSize: 500,
    spread: 0.004,
    unit: '%',
    lastUpdated: '15:14:04.100 UTC',
    history: [
      { time: '09:00', price: 4.340 },
      { time: '10:30', price: 4.315 },
      { time: '12:00', price: 4.298 },
      { time: '13:30', price: 4.290 },
      { time: '15:00', price: 4.285 }
    ],
    depth: {
      bids: [
        { price: 4.283, size: 500, total: 500, orders: 40 },
        { price: 4.281, size: 1100, total: 1600, orders: 65 },
        { price: 4.278, size: 2400, total: 4000, orders: 110 },
        { price: 4.275, size: 4800, total: 8800, orders: 175 },
        { price: 4.270, size: 9500, total: 18300, orders: 280 }
      ],
      asks: [
        { price: 4.287, size: 500, total: 500, orders: 42 },
        { price: 4.289, size: 1200, total: 1700, orders: 70 },
        { price: 4.292, size: 2500, total: 4200, orders: 115 },
        { price: 4.295, size: 5100, total: 9300, orders: 185 },
        { price: 4.300, size: 10200, total: 19500, orders: 295 }
      ]
    },
    details: {
      marketCapOrOi: 'Treasury Benchmark',
      peOrDuration: 'Mod Duration: 8.35 yrs',
      description: 'US Treasury 10-Year Benchmark Constant Maturity Yield.'
    }
  },
  {
    ticker: 'US2Y10Y:IND',
    name: 'US 2Y/10Y Treasury Yield Spread',
    category: 'RATES',
    price: 0.185,
    previousClose: 0.120,
    change: 0.065,
    changePct: 54.17,
    high: 0.195,
    low: 0.115,
    volume: 450000,
    bid: 0.180,
    bidSize: 200,
    ask: 0.190,
    askSize: 200,
    spread: 0.010,
    unit: 'bps / %',
    lastUpdated: '15:14:02.120 UTC',
    history: [
      { time: '09:00', price: 0.120 },
      { time: '10:30', price: 0.145 },
      { time: '12:00', price: 0.165 },
      { time: '13:30', price: 0.178 },
      { time: '15:00', price: 0.185 }
    ],
    depth: {
      bids: [
        { price: 0.180, size: 200, total: 200, orders: 15 },
        { price: 0.175, size: 450, total: 650, orders: 28 },
        { price: 0.170, size: 850, total: 1500, orders: 48 },
        { price: 0.160, size: 1600, total: 3100, orders: 82 },
        { price: 0.150, size: 3200, total: 6300, orders: 135 }
      ],
      asks: [
        { price: 0.190, size: 200, total: 200, orders: 16 },
        { price: 0.195, size: 480, total: 680, orders: 30 },
        { price: 0.200, size: 920, total: 1600, orders: 52 },
        { price: 0.210, size: 1750, total: 3350, orders: 88 },
        { price: 0.220, size: 3500, total: 6850, orders: 142 }
      ]
    },
    details: {
      marketCapOrOi: 'Steepening Trend',
      description: 'Curve steepener: 10Y Yield minus 2Y Yield (economic expansion / disinflation indicator).'
    }
  }
];

export const YIELD_CURVE_DATA: YieldCurvePoint[] = [
  { tenor: '1M', maturityYears: 0.083, yieldCurrent: 5.31, yield1M: 5.33, yield1Y: 5.48 },
  { tenor: '3M', maturityYears: 0.25, yieldCurrent: 5.22, yield1M: 5.25, yield1Y: 5.42 },
  { tenor: '6M', maturityYears: 0.5, yieldCurrent: 5.08, yield1M: 5.12, yield1Y: 5.35 },
  { tenor: '1Y', maturityYears: 1.0, yieldCurrent: 4.75, yield1M: 4.82, yield1Y: 5.10 },
  { tenor: '2Y', maturityYears: 2.0, yieldCurrent: 4.10, yield1M: 4.22, yield1Y: 4.88 },
  { tenor: '3Y', maturityYears: 3.0, yieldCurrent: 3.98, yield1M: 4.08, yield1Y: 4.65 },
  { tenor: '5Y', maturityYears: 5.0, yieldCurrent: 4.02, yield1M: 4.12, yield1Y: 4.45 },
  { tenor: '7Y', maturityYears: 7.0, yieldCurrent: 4.15, yield1M: 4.24, yield1Y: 4.40 },
  { tenor: '10Y', maturityYears: 10.0, yieldCurrent: 4.285, yield1M: 4.34, yield1Y: 4.38 },
  { tenor: '20Y', maturityYears: 20.0, yieldCurrent: 4.58, yield1M: 4.62, yield1Y: 4.60 },
  { tenor: '30Y', maturityYears: 30.0, yieldCurrent: 4.52, yield1M: 4.55, yield1Y: 4.50 }
];

export const SAMPLE_OPTIONS_CHAIN: OptionContract[] = [
  // BRENT CRUDE OPTIONS ($84.62 Spot)
  { ticker: 'CO1_C80_OCT', type: 'CALL', strike: 80.0, expiry: '2026-10-15', bid: 5.45, ask: 5.60, last: 5.52, iv: 0.265, delta: 0.78, gamma: 0.042, theta: -0.045, vega: 0.142, rho: 0.052, volume: 4500, openInterest: 28400 },
  { ticker: 'CO1_C85_OCT', type: 'CALL', strike: 85.0, expiry: '2026-10-15', bid: 2.25, ask: 2.35, last: 2.30, iv: 0.280, delta: 0.51, gamma: 0.065, theta: -0.058, vega: 0.185, rho: 0.041, volume: 18200, openInterest: 54100 },
  { ticker: 'CO1_C90_OCT', type: 'CALL', strike: 90.0, expiry: '2026-10-15', bid: 0.85, ask: 0.95, last: 0.90, iv: 0.310, delta: 0.26, gamma: 0.048, theta: -0.042, vega: 0.138, rho: 0.024, volume: 9800, openInterest: 41200 },
  { ticker: 'CO1_P80_OCT', type: 'PUT', strike: 80.0, expiry: '2026-10-15', bid: 0.80, ask: 0.90, last: 0.85, iv: 0.275, delta: -0.22, gamma: 0.042, theta: -0.038, vega: 0.142, rho: -0.022, volume: 8400, openInterest: 39500 },
  { ticker: 'CO1_P85_OCT', type: 'PUT', strike: 85.0, expiry: '2026-10-15', bid: 2.50, ask: 2.65, last: 2.58, iv: 0.280, delta: -0.49, gamma: 0.065, theta: -0.052, vega: 0.185, rho: -0.042, volume: 14600, openInterest: 48900 },
  { ticker: 'CO1_P90_OCT', type: 'PUT', strike: 90.0, expiry: '2026-10-15', bid: 6.10, ask: 6.30, last: 6.20, iv: 0.305, delta: -0.74, gamma: 0.048, theta: -0.041, vega: 0.138, rho: -0.056, volume: 3200, openInterest: 21500 }
];

export const INITIAL_ORDERS: OrderTicket[] = [
  {
    id: 'ORD-98421',
    timestamp: '14:52:10',
    ticker: 'BDI.INDEX',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 20,
    limitPrice: 1840.0,
    status: 'FILLED',
    filledQty: 20,
    avgFillPrice: 1839.5,
    timeInForce: 'DAY',
    notes: 'TWAP Execution Algo'
  },
  {
    id: 'ORD-98422',
    timestamp: '14:58:33',
    ticker: 'CO1:COM',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 50,
    limitPrice: 84.40,
    status: 'WORKING',
    filledQty: 15,
    avgFillPrice: 84.38,
    timeInForce: 'DAY',
    notes: 'Bunker hedge prompt barrel allocation'
  },
  {
    id: 'ORD-98423',
    timestamp: '15:02:18',
    ticker: 'FE-US-01',
    side: 'BUY',
    type: 'LIMIT',
    quantity: 10,
    limitPrice: 5120.0,
    status: 'WORKING',
    filledQty: 0,
    avgFillPrice: 0,
    timeInForce: 'GTC',
    notes: 'Transpacific Eastbound hedge'
  },
  {
    id: 'ORD-98420',
    timestamp: '14:15:00',
    ticker: 'MAERSK.DC',
    side: 'SELL',
    type: 'LIMIT',
    quantity: 150,
    limitPrice: 11450.0,
    status: 'FILLED',
    filledQty: 150,
    avgFillPrice: 11455.0,
    timeInForce: 'DAY',
    notes: 'Equity portfolio rebalance'
  }
];

export const INITIAL_POSITIONS: Position[] = [
  {
    id: 'pos-01',
    ticker: 'BDI.INDEX',
    name: 'Baltic Dry Index (BDI)',
    category: 'FREIGHT_FFA',
    quantity: 40,
    entryPrice: 1795.0,
    currentPrice: 1845.0,
    unrealizedPnl: 2000.0,
    unrealizedPnlPct: 2.79,
    exposureNotional: 73800.0
  },
  {
    id: 'pos-02',
    ticker: 'CO1:COM',
    name: 'Brent Crude Oil Front Month',
    category: 'COMMODITIES',
    quantity: 150,
    entryPrice: 82.10,
    currentPrice: 84.62,
    unrealizedPnl: 378.0,
    unrealizedPnlPct: 3.07,
    exposureNotional: 12693.0
  },
  {
    id: 'pos-03',
    ticker: 'FE-EUR-01',
    name: 'Shanghai to Rotterdam (FE-EUR-01)',
    category: 'FREIGHT_FFA',
    quantity: 25,
    entryPrice: 6950.0,
    currentPrice: 7230.0,
    unrealizedPnl: 7000.0,
    unrealizedPnlPct: 4.03,
    exposureNotional: 180750.0
  },
  {
    id: 'pos-04',
    ticker: 'MAERSK.DC',
    name: 'A.P. Møller - Mærsk A/S',
    category: 'EQUITIES',
    quantity: 350,
    entryPrice: 10850.0,
    currentPrice: 11420.0,
    unrealizedPnl: 199500.0,
    unrealizedPnlPct: 5.25,
    exposureNotional: 3997000.0
  },
  {
    id: 'pos-05',
    ticker: 'VLSFO.SGP',
    name: 'Singapore VLSFO 0.5% Marine Fuel',
    category: 'COMMODITIES',
    quantity: 80,
    entryPrice: 615.0,
    currentPrice: 628.5,
    unrealizedPnl: 1080.0,
    unrealizedPnlPct: 2.20,
    exposureNotional: 50280.0
  }
];


# 🚢 TERMINALX — Maritime & Freight Intelligence Terminal

> **"Bloomberg Terminal for Freight, Global Shipping & Trade Logistics."**

TerminalX is a high-performance financial and freight intelligence platform designed to monitor global shipping routes, real-time vessel telemetry, freight rate volatility, port congestion bottlenecks, voyage cost economics, and procurement timing decision-support.

---

## 🌐 Live Deployment

- **Live Public URL**: [https://terminalx-global-freight-maritime-intelligence-uay75mc6bw.openbot.site](https://terminalx-global-freight-maritime-intelligence-uay75mc6bw.openbot.site)
- **Local Full-Stack Server**: `http://localhost:5000` (Monolith Express serving API & frontend)
- **Vite Dev Server**: `http://localhost:3000` (hot-reload development)
- **System Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🏛️ System Architecture

TerminalX is organized as a clean, understandable, and production-ready monolithic full-stack application:

```
terminalX/
├── server/                    # Monolithic Node.js / Express Backend
│   ├── index.js               # Server entry point, middleware, static SPA serving
│   ├── database/
│   │   ├── db.js              # Resilient DB layer (In-memory JSON + Postgres support)
│   │   └── seedData.json      # Structured maritime seed dataset (ports, vessels, rates)
│   ├── routes/
│   │   ├── market.js          # /api/market (spot rates, assets, order execution)
│   │   ├── ports.js           # /api/ports (congestion scores, wait times, berth queues)
│   │   ├── vessels.js         # /api/vessels (AIS search, telemetries, route matching)
│   │   ├── analytics.js       # /api/analytics (voyage cost engine, route comparisons)
│   │   └── ai.js              # /api/ai (Gemini integration + maritime quant fallback)
│   ├── services/
│   │   ├── dataService.js     # Clean business logic and query orchestration
│   │   └── aiService.js       # Google Gemini API integration with offline fallback
│   ├── utils/
│   │   └── calculations.js    # Haversine distance, bunker burn, voyage economics
│   └── tests/
│       ├── runTests.js        # Core math & calculation test suite (11 passing tests)
│       └── httpIntegration.test.js # Real HTTP endpoint integration verification
├── src/                       # React 19 + TypeScript + Tailwind CSS Frontend
│   ├── components/            # Visual Bloomberg dark-theme UI components
│   │   ├── TerminalHeader.tsx # Top ticker tape, world clocks, command bar & F-keys
│   │   ├── CommandCenter/     # F1: Command center overview
│   │   ├── FreightMap/        # F2: Global AIS radar, chokepoints & route calculator
│   │   ├── MarketData/        # F3: Live tape, market depth & order blotter
│   │   ├── Forecast/          # F4: Freight forecast, validation & backtest curves
│   │   ├── Ports/             # F5: Port intelligence + congestion forecast
│   │   ├── Vessels/           # F6: Vessel intelligence, screening & draft alerts
│   │   ├── News/              # F7: Breaking wire & economic calendar
│   │   ├── Procurement/       # F8: Overseas cargo procurement comparison
│   │   ├── Charter/           # F9: Integrated charter optimizer (FIX NOW / WAIT / WATCH)
│   │   ├── Data/              # F10: World Bank macro + weather connectivity
│   │   ├── Execution/         # OMS execution blotter
│   │   ├── Analytics/         # Forward curves, derivatives & yield models
│   │   ├── Chat/              # Instant Bloomberg (IB) chat network
│   │   ├── Excel/             # Spreadsheet BDP modeling
│   │   └── AI/                # Gemini AI analyst decision support
│   └── App.tsx                # Master container with live API synchronization
├── Dockerfile                 # Production multi-stage Docker container
├── render.yaml                # 1-click Render web service deployment
└── Procfile                   # Heroku / Railway process specification
```

---

## 🚀 Key Features

### 1. Freight & Market Intelligence
- **Live Spot Rates**: Real-time tracking of critical lanes (`FE-EUR-01` Shanghai-Rotterdam, `TP-EB-02` Transpacific, `ME-CN-VLCC` Arabian Gulf-China).
- **Statistical Trends**: Moving averages (7d, 30d), volatility calculations, and 30-day forward projections.
- **Order Blotter (OMS)**: Execution of simulated container freight hedging tickets and forward freight agreements (FFAs).

### 2. Port Intelligence & Congestion Tracking
- **Bottleneck Identification**: Real-time congestion scoring for 27+ top world ports (Shanghai, Singapore, Rotterdam, Ningbo, Los Angeles, Visakhapatnam, Paradip, Haldia).
- **Berth Queues**: Average wait days, vessels at berth, and local VLSFO bunker pricing.

### 3. Vessel Intelligence & Route Matching
- **Telemetry**: IMO registry numbers, MMSI, heading, speed (knots), current draft, DWT, and operator alliances.
- **Algorithmic Vessel Matching**: Matches candidate ships to cargo origins based on Haversine nautical mile proximity and laycan dates.

### 4. Voyage Analytics & Route Comparison
- **Parametric Economics**: Calculates sea days, total fuel burn (MT), charter cost, canal transit tolls, port dues, and EU ETS carbon compliance costs.
- **Suez vs. Cape of Good Hope**: Direct side-by-side cost comparison demonstrating the financial trade-off between canal tolls ($350k-$450k) and extra fuel/charter costs (+10 days, +3,400 nm).

### 5. Gemini AI Maritime Analyst (`<ASK>`)
- Integrated with **Google Gemini API** (`gemini-2.5-flash`).
- **Resilient Fallback**: If `GEMINI_API_KEY` is not provided or rate-limited, an intelligent rule-based quant engine answers queries regarding recent maritime casualties (M/V Tutor, M/V Rubymar, M/V Dali), bunker spreads, and geopolitical chokepoints.

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service status, uptime, database mode, and AI configuration |
| `GET` | `/api/market/assets` | All monitored assets, FX, and freight indices |
| `GET` | `/api/market/rates` | Active freight lane spot rates and 24h change |
| `GET` | `/api/market/compare` | Compare multiple freight corridors |
| `GET` | `/api/market/trends/:code` | Historical statistics, moving averages, and 30d forecast |
| `POST` | `/api/market/orders` | Submit an order ticket |
| `GET` | `/api/ports` | Directory of global commercial ports |
| `GET` | `/api/ports/congestion` | Ranked top congested ports |
| `GET` | `/api/ports/:id` | Detailed port statistics |
| `GET` | `/api/vessels` | Filter vessels by type, status, or search term |
| `POST` | `/api/vessels/match` | Match vessels within radius of origin port |
| `POST` | `/api/analytics/voyage-cost` | Calculate fuel, transit days, and total voyage cost |
| `POST` | `/api/analytics/route-compare` | Side-by-side standard route vs diversion comparison |
| `POST` | `/api/ai/chat` | AI Copilot query endpoint |

---

## 💻 Local Development

### Prerequisites
- Node.js 18+ (tested on Node.js 22)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Create `.env` in the root directory:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
# Optional PostgreSQL (falls back to built-in JSON database if omitted)
# DATABASE_URL=postgresql://user:password@localhost:5432/terminalx
```

### 3. Run Tests
```bash
npm test
```

### 4. Run Application
```bash
# Production mode: Build frontend and start monolith server on port 5000
npm run build
npm start

# Development mode: Start Vite dev server on port 3000 (proxies /api to port 5000)
npm run dev
```

---

## 🎓 Placement Interview Talking Points

1. **Why Monolith over Microservices?**
   - For an enterprise-style dashboard with unified data access, a well-structured Express monolith avoids network hop latency, distributed transaction complexity, and container orchestration overhead while staying easy to maintain, test, and deploy.

2. **How does Voyage Cost calculation work?**
   - Transit hours = `Distance (nm) / Speed (knots)`.
   - Fuel burn = `Sea Days × Daily Fuel Consumption (MT)`.
   - Total Cost = `Fuel Cost + Time Charter Hire + Canal Tolls + Port Dues + EU ETS Carbon Surcharges`.

3. **How is Resiliency Handled?**
   - **Database**: Zero-dependency in-memory store initialized with rich seed data; smoothly connects to PostgreSQL if `DATABASE_URL` is set without crashing if the connection drops.
   - **AI Service**: Graceful degradation to domain-expert rule synthesis if the Gemini API key is missing or offline.
   - **Frontend**: Full client-side fallback ensures UI remains 100% interactive even if the backend is temporarily disconnected.

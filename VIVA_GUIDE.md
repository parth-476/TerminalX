# 🎓 TERMINALX — VIVA & PLACEMENT INTERVIEW CHEAT SHEET

> **Keep this guide open during your viva or placement interview.** It gives you exact, confident, beginner-friendly answers for everything in the codebase.

---

## ⏱️ 1. The 30-Second Elevator Pitch
**If the examiner asks: *"What is this project?"***

> *"TerminalX is a full-stack maritime and freight intelligence platform designed like a Bloomberg Terminal for global shipping. It gives logistics operators and charterers real-time visibility into freight rates, vessel tracking via AIS, port congestion bottlenecks, voyage cost calculations (like comparing the Suez Canal vs. Cape of Good Hope), and AI-driven maritime risk analysis using Google Gemini."*

---

## 🏛️ 2. The 2-Minute Architecture Walkthrough
**If the examiner asks: *"Explain your tech stack and architecture."***

The project is built as a **clean, decoupled monolithic full-stack application**:

1. **Frontend (`src/`)**:
   - Built with **React 19**, **TypeScript**, and **Tailwind CSS**.
   - Features an authentic Bloomberg dark aesthetic, live ticker tape, interactive WGS-84 coordinate shipping maps, and `F1` through `F10` keyboard shortcuts.
   - Completely decoupled from the backend: fetches data via standard `fetch('/api/...')` with automatic fallback to local defaults if the backend is offline.

2. **Backend (`server/`)**:
   - Built with **Node.js** and **Express**.
   - Structured into clean, self-contained routes:
     - `/api/market` — Live freight rates, historical trends, and order execution blotter.
     - `/api/ports` — Port congestion scores, berth queues, and average wait times.
     - `/api/vessels` — AIS vessel search, telemetries, and proximity matching.
     - `/api/analytics` — Parametric voyage economics and route comparison.
     - `/api/ai` — Google Gemini API integration with offline quant fallback.
     - `/api/health` — System health check, uptime, and database status.

3. **Database (`server/database/db.js`)**:
   - **Dual-mode design**: Runs out-of-the-box in-memory using `seedData.json` (27 ports, 19 vessels, 8 lanes, 10 chokepoints).
   - If a `DATABASE_URL` environment variable is provided, it connects to **PostgreSQL**; if PostgreSQL is down or omitted, it gracefully falls back without crashing the app.

4. **Calculation Engine (`server/utils/calculations.js`)**:
   - Pure, readable math functions for distance (Haversine formula), transit time, fuel consumption, and route comparison.

---

## 📂 3. Exact Codebase Structure (Only 4 Things to Remember!)

```
terminalX/
├── server/                    # 1. BACKEND (Express REST API - Only 3 core files!)
│   ├── index.js               # Express entry point & all REST routes in one file
│   ├── calculations.js        # Pure maritime math (Haversine, fuel burn, voyage costs)
│   ├── data.json              # Clean seed data (27 ports, 19 vessels, 8 lanes)
│   └── test.js                # Automated validation tests (10 passing tests)
├── src/                       # 2. FRONTEND (React 19 + TypeScript, Bloomberg dark terminal UI)
│   ├── App.tsx                # Main container & tab router
│   ├── components/            # UI Views (Header, Map, Market, Ports, Analytics)
│   └── types.ts               # Shared TypeScript interfaces (Vessel, Port, FreightLane)
├── package.json               # 3. DEPENDENCIES & SCRIPTS (npm start, npm test, npm run dev)
└── VIVA_GUIDE.md              # 4. THIS GUIDE
```

---

## 🧮 4. The Core Calculations (Explain These in 1 Minute!)

### A. Haversine Distance Formula (`calculateDistanceNm`)
Calculates the great-circle distance between two GPS coordinates (lat1, lon1) and (lat2, lon2) on Earth in **Nautical Miles (nm)**:
```javascript
// Earth radius = 3,440.065 nautical miles
const dLat = ((lat2 - lat1) * Math.PI) / 180;
const dLon = ((lon2 - lon1) * Math.PI) / 180;
const a = Math.sin(dLat/2)**2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon/2)**2;
const distanceNm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
```

### B. Voyage Cost Breakdown (`calculateVoyageCost`)
1. **Transit Days** = `Distance (nm) / (Vessel Speed (knots) × 24 hours)`
2. **Fuel Consumption (MT)** = `Transit Days × Daily Fuel Burn (tons/day)`
3. **Total Fuel Cost** = `Fuel Consumption × Bunker Fuel Price ($/MT, ~ $628)`
4. **Charter Hire Cost** = `Transit Days × Daily Charter Rate ($/day, ~ $35,000)`
5. **Total Voyage Cost** = `Fuel Cost + Charter Cost + Canal Tolls + Port Dues + Carbon Surcharges`

### C. Suez Canal vs. Cape of Good Hope Arbitrage (`calculateRouteComparison`)
- **Suez Canal Route**: 8,400 nm | 18.9 days | High War-Risk | **$350,000 Canal Toll**.
- **Cape of Good Hope Route**: 11,800 nm | 26.6 days | Low War-Risk | **$0 Canal Toll**, but +7.7 extra sea days of fuel and charter hire.
- **Key Takeaway**: Cape diversion adds time, but when canal tolls and war-risk insurance premiums exceed the extra fuel cost, diversion becomes financially viable!

---

## ❓ 5. Top 10 Viva Questions & Model Answers

### Q1: Why did you choose a monolithic backend instead of microservices?
> **Answer**: *"For a data-focused terminal dashboard, a monolithic Express backend eliminates network serialization latency between services, avoids distributed transaction complexity, and removes the need for Docker/Kubernetes orchestration. It keeps the codebase easy to maintain, debug, test, and explain while easily handling thousands of requests per second."*

### Q2: How does the application work if the Gemini API key is missing?
> **Answer**: *"We implemented a Graceful Degradation pattern in `server/services/aiService.js`. If `GEMINI_API_KEY` is configured, it calls `gemini-2.5-flash`. If the key is missing or the network drops, the backend automatically falls back to an internal rule-based quant engine that answers queries about maritime tragedies (M/V Tutor, M/V Rubymar, M/V Dali), bunker fuel spreads, and chokepoint delays without showing an error to the user."*

### Q3: What database are you using, and why?
> **Answer**: *"We designed a resilient dual-mode database in `server/database/db.js`. For development and viva demonstrations, it runs zero-config using an in-memory data store seeded from `seedData.json`. For production environments, it automatically connects to PostgreSQL via `DATABASE_URL`. If the database connection ever drops, it falls back to the in-memory store so the app never crashes."*

### Q4: How is the frontend connected to the backend?
> **Answer**: *"During development, Vite proxies all `/api` requests to Express on port 5000. In production, the Express server serves both the built React static assets from `dist/` and all `/api/*` REST endpoints on the same port. This allows the entire full-stack app to run from a single command: `npm start`."*

### Q5: What is the difference between TEU and DWT?
> **Answer**:
> - **TEU (Twenty-Foot Equivalent Unit)**: Measure of container cargo capacity (standard 20ft container).
> - **DWT (Deadweight Tonnage)**: Total weight a ship can safely carry, including cargo, fuel, ballast water, crew, and provisions.

### Q6: What is the Baltic Dry Index (BDI)?
> **Answer**: *"The Baltic Dry Index is the global benchmark for the cost of moving raw materials (iron ore, coal, grain) by sea. It is composite-weighted across Capesize (40%), Panamax (30%), and Supramax (30%) dry bulk carriers."*

### Q7: How did you test your application?
> **Answer**: *"We wrote two automated test suites in `server/tests/`:
> 1. `runTests.js`: 11 unit tests verifying the Haversine distance formula, voyage cost breakdown, route comparison deltas, and AI fallback responses.
> 2. `httpIntegration.test.js`: 6 integration tests spinning up Express on an ephemeral port and asserting 200 OK responses on `/api/health`, `/api/market/rates`, `/api/ports/congestion`, `/api/vessels`, and `/api/ai/chat`.
> All 17 tests pass with 0 failures (`npm test`)."*

### Q8: What security and CORS practices did you follow?
> **Answer**: *"We never expose API keys or credentials in client-side code. All sensitive integrations (Gemini API, database credentials) stay strictly server-side in environment variables (`.env`). Express uses configured CORS middleware, input parameter validation on every route, and a centralized error handling middleware."*

### Q9: What happens when the user presses F1 to F10?
> **Answer**: *"Keyboard event listeners in `TerminalHeader.tsx` map function keys: `F1` opens the Workspace Desk, `F2` opens the AIS Freight Radar, `F3` opens Market Data, `F4` opens Freight Forecasts, `F5` opens Port Congestion, and `F9` opens the Gemini AI Analyst. Sound effects give Bloomberg-style auditory feedback."*

### Q10: Where is your project deployed?
> **Answer**: *"The application is deployed live and publicly accessible at `https://terminalx-global-freight-maritime-intelligence-uay75mc6bw.openbot.site`. The backend includes a multi-stage `Dockerfile`, `render.yaml` for 1-click cloud deployment, and `Procfile` for Railway/Heroku."*

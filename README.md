# TERMINAL.X — SIH Freight & Trade Intelligence

An AI-assisted freight, chartering, vessel and bulk-cargo procurement decision-support terminal for **SIH26006**: optimizing overseas bulk cargo procurement and vessel chartering for India's East Coast.

## What the terminal does

The SIH workflow connects:

**Freight forecast → Port congestion forecast → Vessel matching → Route optimization → Procurement timing → Integrated charter decision → Explainable action**

### Main terminal modules

- **Command Center** — single-screen procurement/chartering decision view
- **FRGT** — global and India bulk-freight lanes
- **MKT** — commodity/market data
- **FCST** — freight forecasting, validation and published Python backtests
- **PORT** — East Coast India port intelligence + 7D/14D congestion forecast
- **VSL** — vessel capacity, ETA, route, draft and risk screening
- **PROC** — overseas cargo procurement comparison
- **CHART** — integrated charter/procurement optimizer, vessel screening and route optimization
- **DATA** — World Bank macro + Open-Meteo live/historical weather connectivity
- **ASK** — Gemini AI analyst decision support

## SIH decision engine

The CHART workflow accepts cargo quantity and laycan, then evaluates:

1. ML freight direction and 30-day rate movement
2. Destination port congestion and indicative delay
3. Vessel cargo compatibility, DWT capacity, ETA/laycan, draft and risk
4. Procurement timing and landed-freight proxy
5. Route transit, congestion, carbon and choke-point risk
6. A transparent integrated score producing **FIX NOW / SPLIT / WAIT / WATCH**

Every recommendation includes human-readable factors and assumptions. No module executes a charter, purchase or trade.

## Forecasting architecture

The browser prototype uses a deterministic regularized regression engine over repository freight history and engineered route/port/vessel features. The separate Python ML pipeline provides reproducible scikit-learn model training and chronological rolling-origin evaluation.

Python candidates:

- Ridge Regression
- Gradient Boosting Regressor
- Random Forest Regressor

Metrics include MAE, RMSE and MAPE. CI publishes the latest backtest to `public/model/backtest_results.json` for display in FCST.

**Important:** the current freight history and vessel/port fixtures are demo/synthetic data. They are not SAIL, AIS, broker, Baltic Exchange or port-authority observations. Demo metrics must not be presented as real-world accuracy.

## Vessel data architecture

The terminal has a provider boundary at `/api/vessel-data`.

- If `AIS_PROVIDER_URL` is configured, the endpoint fetches JSON, normalizes common AIS fields and labels the feed **LIVE**.
- If no provider is configured or the provider is unavailable, the browser falls back to repository fixtures and labels the feed **DEMO**.
- `AIS_PROVIDER_KEY` is sent server-side as a bearer token and is never required in browser code.
- The internal screening engine is provider-agnostic, so an approved AIS source can be connected without rewriting the decision logic.

The generic adapter expects normalized fields such as IMO/MMSI, type, DWT, position, speed, heading, draft, destination and ETA. Provider-specific mapping should be tightened to the licensed source's schema before production use.

## Port congestion forecasting

The congestion module is a transparent operational pressure model using current congestion, berth/queue pressure, average wait and optional weather-history signals. It produces 7D and 14D scores plus an indicative delay and action. It is a prototype decision-support forecast, not an official port forecast.

## External data

Server-side adapters connect:

- World Bank Indicators API for India GDP growth, CPI inflation and trade/GDP indicators.
- Open-Meteo forecast API for port weather.
- Open-Meteo historical archive for daily port weather history.

External signals are displayed as connected inputs and are not silently injected into freight training. Historical feature alignment and validation are required before using weather/macro observations as trained predictors.

## Demo ML pipeline

```bash
python ml/generate_demo_dataset.py
python ml/train_freight_model.py data/freight_history_demo.csv
python ml/backtest_freight_model.py data/freight_history_demo.csv
```

For production, replace the demo CSV with licensed/approved historical freight observations and rerun training/backtesting before publishing model accuracy.

## Local development

Prerequisites: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Configure `GEMINI_API_KEY` for the AI analyst. Configure `AIS_PROVIDER_URL` and `AIS_PROVIDER_KEY` only when an approved vessel provider is available. Never commit secrets.

## Validation

GitHub Actions runs TypeScript/build checks on pushes and pull requests. A separate ML workflow regenerates the deterministic demo dataset, runs the chronological backtest and publishes the terminal metrics artifact. The SIH implementation is developed on `sih-freight-v1`; `main` remains separate until final review.

## Data provenance

See `data/README.md` for the freight-model data contract and demo-data limitations.

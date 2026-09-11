# TERMINAL.X — SIH Freight & Trade Intelligence

An AI-assisted freight, chartering, vessel and bulk-cargo procurement decision-support terminal for **SIH26006**: optimizing overseas bulk cargo procurement and vessel chartering for India's East Coast.

## What the terminal does

The SIH workflow connects:

**Freight forecast → Port risk → Vessel matching → Route optimization → Procurement decision → Charter decision**

### Main terminal modules

- **Command Center** — single-screen procurement/chartering decision view
- **FRGT** — global and India bulk-freight lanes
- **MKT** — commodity/market data
- **FCST** — freight forecasting and model explainability
- **PORT** — East Coast India port intelligence
- **VSL** — vessel capacity, timing and risk screening
- **PROC** — overseas cargo procurement comparison
- **CHART** — charter recommendation and route optimization
- **DATA** — external macro/weather connectivity
- **ASK** — AI analyst decision support

## Forecasting architecture

The browser prototype uses a deterministic regularized regression engine over the repository's historical freight series and engineered features. The separate Python ML pipeline provides reproducible model training and chronological evaluation using scikit-learn.

Current Python training candidates:

- Gradient Boosting Regressor
- Random Forest Regressor

The rolling backtest evaluates historical windows chronologically to reduce look-ahead leakage. Metrics include MAE, RMSE and MAPE.

**Important:** the repository's current freight history is demo/synthetic data. It is not SAIL, AIS, broker, Baltic Exchange or port-authority observations. No real-world accuracy claim should be made from the demo metrics.

## Demo ML pipeline

Generate the reproducible demo dataset:

```bash
python ml/generate_demo_dataset.py
```

Train the candidate models:

```bash
python ml/train_freight_model.py data/freight_history_demo.csv
```

Run chronological backtesting:

```bash
python ml/backtest_freight_model.py data/freight_history_demo.csv
```

For production, replace the demo CSV with licensed/approved historical freight observations and rerun training/backtesting before publishing model accuracy.

## External data

The terminal has server-side adapters for external macro/weather feeds. Current external signals are displayed as connected inputs; they are not silently treated as historical training observations. Historical alignment is required before they become trained model features.

## Local development

Prerequisites: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

For the AI analyst endpoint, configure `GEMINI_API_KEY` in the deployment environment. Never commit API keys.

## Validation

GitHub Actions runs the frontend lint/build checks on pushes and pull requests. The SIH implementation is being developed on `sih-freight-v1`; `main` is kept separate until final review.

## Data provenance

See [`data/README.md`](data/README.md) for the freight-model data contract and demo-data limitations.

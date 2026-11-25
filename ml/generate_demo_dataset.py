"""Generate a reproducible synthetic freight-history dataset for local demos.

This file deliberately generates DEMO data. It must not be presented as SAIL,
AIS, Baltic Exchange, broker, or other observed market data. Replace the output
with licensed/approved historical data before making real accuracy claims.

Usage:
  python ml/generate_demo_dataset.py
  python ml/train_freight_model.py data/freight_history_demo.csv
  python ml/backtest_freight_model.py data/freight_history_demo.csv
"""
from pathlib import Path
import math
import numpy as np
import pandas as pd

RNG = np.random.default_rng(26006)
START = "2025-09-01"
END = "2026-08-31"

LANES = [
    ("sih-aus-prd", 12.20, 3280, 10, 46, 42, 39000),
    ("sih-aus-vtz", 12.70, 3480, 11, 41, 49, 42000),
    ("sih-aus-dma", 11.95, 3190, 10, 38, 35, 37000),
    ("sih-aus-gam", 12.05, 3320, 10, 35, 37, 38000),
    ("sih-za-vtz", 18.60, 6480, 19, 29, 58, 74000),
    ("sih-br-prd", 25.90, 10100, 31, 24, 67, 132000),
    ("sih-aus-coal-prd", 13.40, 3810, 12, 32, 45, 44000),
]


def main():
    dates = pd.date_range(START, END, freq="D")
    rows = []
    for lane_index, (lane_id, base, distance, transit, supply, congestion, carbon) in enumerate(LANES):
        raw_rates = []
        for i, date in enumerate(dates):
            seasonal = math.sin(2 * math.pi * date.dayofyear / 365 + lane_index * 0.3)
            medium_cycle = math.sin(2 * math.pi * i / 47 + lane_index) * 0.02
            noise = RNG.normal(0, 0.015)
            rate = base * (1 + 0.08 * seasonal + medium_cycle + noise)
            raw_rates.append(max(1.0, rate))

        rates = pd.Series(raw_rates)
        for i, date in enumerate(dates):
            lag1 = rates.iloc[i - 1] if i >= 1 else rates.iloc[i]
            lag7 = rates.iloc[i - 7] if i >= 7 else rates.iloc[i]
            lag30 = rates.iloc[i - 30] if i >= 30 else rates.iloc[i]
            ma7 = rates.iloc[max(0, i - 6): i + 1].mean()
            ma30 = rates.iloc[max(0, i - 29): i + 1].mean()
            returns = rates.iloc[max(0, i - 29): i + 1].pct_change().dropna()
            volatility = returns.std() * 100 if len(returns) > 1 else 0
            momentum7 = ((rates.iloc[i] - lag7) / lag7) * 100 if lag7 else 0
            route_congestion = max(5, min(95, congestion + 8 * math.sin(2 * math.pi * i / 60 + lane_index) + RNG.normal(0, 2)))
            vessel_supply = max(5, supply + 3 * math.sin(2 * math.pi * i / 45 + 0.4) + RNG.normal(0, 1.5))
            rows.append({
                "date": date.date().isoformat(),
                "lane_id": lane_id,
                "freight_rate": round(float(rates.iloc[i]), 4),
                "lag1": round(float(lag1), 4),
                "lag7": round(float(lag7), 4),
                "lag30": round(float(lag30), 4),
                "ma7": round(float(ma7), 4),
                "ma30": round(float(ma30), 4),
                "volatility": round(float(volatility), 4),
                "momentum7": round(float(momentum7), 4),
                "route_congestion": round(float(route_congestion), 3),
                "vessel_supply": round(float(vessel_supply), 3),
                "transit_days": transit,
                "distance_nm": distance,
                "carbon_cost": carbon,
                "month_sin": round(math.sin(2 * math.pi * date.month / 12), 5),
                "month_cos": round(math.cos(2 * math.pi * date.month / 12), 5),
            })

    output = Path("data/freight_history_demo.csv")
    output.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_csv(output, index=False)
    print(f"Wrote {len(rows)} rows to {output}")


if __name__ == "__main__":
    main()

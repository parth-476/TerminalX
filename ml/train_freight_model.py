"""Train a freight-rate regression model from a historical CSV.

Expected columns: date, lane_id, freight_rate and optional engineered inputs:
lag1, lag7, lag30, ma7, ma30, volatility, momentum7, route_congestion,
vessel_supply, transit_days, distance_nm, carbon_cost, month_sin, month_cos.

The split is chronological to avoid leakage. This script is intentionally
separate from the browser prototype so real SAIL/market data can replace the
repository demo series without changing the terminal UI.
"""
from pathlib import Path
import json
import sys
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

FEATURES = ['lag1','lag7','lag30','ma7','ma30','volatility','momentum7','route_congestion','vessel_supply','transit_days','distance_nm','carbon_cost','month_sin','month_cos']
TARGET = 'freight_rate'

def main():
    source = Path(sys.argv[1] if len(sys.argv) > 1 else 'data/freight_history.csv')
    if not source.exists():
        raise SystemExit(f'Missing training file: {source}')
    df = pd.read_csv(source).sort_values(['lane_id','date']).dropna(subset=[TARGET])
    missing = [c for c in FEATURES if c not in df.columns]
    if missing:
        raise SystemExit('Missing feature columns: ' + ', '.join(missing))
    X = df[FEATURES].fillna(0)
    y = df[TARGET].astype(float)
    split = max(1, int(len(df) * 0.8))
    X_train, X_test, y_train, y_test = X.iloc[:split], X.iloc[split:], y.iloc[:split], y.iloc[split:]
    models = {
        'gradient_boosting': GradientBoostingRegressor(random_state=42, n_estimators=150, max_depth=3, learning_rate=0.04),
        'random_forest': RandomForestRegressor(random_state=42, n_estimators=250, min_samples_leaf=2, n_jobs=-1),
    }
    results = {}
    best_name, best_model, best_mae = None, None, float('inf')
    for name, model in models.items():
        model.fit(X_train, y_train)
        pred = model.predict(X_test) if len(X_test) else model.predict(X_train)
        actual = y_test if len(X_test) else y_train
        mae = mean_absolute_error(actual, pred)
        rmse = mean_squared_error(actual, pred) ** 0.5
        mape = mean_absolute_percentage_error(actual, pred) * 100
        results[name] = {'mae': mae, 'rmse': rmse, 'mape_pct': mape}
        if mae < best_mae:
            best_name, best_model, best_mae = name, model, mae
    output = {'selected_model': best_name, 'features': FEATURES, 'target': TARGET, 'chronological_split': '80/20', 'metrics': results}
    Path('ml/model_metrics.json').write_text(json.dumps(output, indent=2), encoding='utf-8')
    print(json.dumps(output, indent=2))

if __name__ == '__main__':
    main()

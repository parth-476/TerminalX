"""Rolling-origin backtest for freight-rate models.

Usage: python ml/backtest_freight_model.py data/freight_history.csv

The evaluation is chronological: each fold trains only on observations before
its test window. This prevents future freight observations from leaking into
model evaluation. The script compares Gradient Boosting and Random Forest and
writes ml/backtest_results.json.
"""
from pathlib import Path
import json
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

FEATURES = ['lag1','lag7','lag30','ma7','ma30','volatility','momentum7','route_congestion','vessel_supply','transit_days','distance_nm','carbon_cost','month_sin','month_cos']
TARGET = 'freight_rate'


def metrics(actual, predicted):
    return {
        'mae': float(mean_absolute_error(actual, predicted)),
        'rmse': float(np.sqrt(mean_squared_error(actual, predicted))),
        'mape_pct': float(mean_absolute_percentage_error(actual, predicted) * 100),
    }


def main():
    source = Path(sys.argv[1] if len(sys.argv) > 1 else 'data/freight_history.csv')
    if not source.exists():
        raise SystemExit(f'Missing training file: {source}')
    df = pd.read_csv(source)
    missing = [c for c in FEATURES + [TARGET, 'date'] if c not in df.columns]
    if missing:
        raise SystemExit('Missing columns: ' + ', '.join(missing))
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['date', 'lane_id']).reset_index(drop=True)
    X = df[FEATURES].fillna(0)
    y = df[TARGET].astype(float)
    if len(df) < 30:
        raise SystemExit('Need at least 30 chronological observations for rolling backtest.')

    fold_starts = np.linspace(max(10, int(len(df) * 0.55)), len(df) - 5, num=4, dtype=int)
    models = {
        'gradient_boosting': lambda: GradientBoostingRegressor(random_state=42, n_estimators=180, max_depth=3, learning_rate=0.04),
        'random_forest': lambda: RandomForestRegressor(random_state=42, n_estimators=250, min_samples_leaf=2, n_jobs=-1),
    }
    output = {'folds': [], 'models': {name: {'mae': [], 'rmse': [], 'mape_pct': []} for name in models}}
    for fold, start in enumerate(sorted(set(fold_starts)), 1):
        train_end = max(10, start)
        test_end = min(len(df), train_end + max(3, len(df) // 10))
        if test_end <= train_end:
            continue
        fold_record = {'fold': fold, 'train_end': str(df.iloc[train_end - 1]['date'].date()), 'test_start': str(df.iloc[train_end]['date'].date()), 'test_end': str(df.iloc[test_end - 1]['date'].date()), 'test_samples': int(test_end - train_end)}
        for name, factory in models.items():
            model = factory()
            model.fit(X.iloc[:train_end], y.iloc[:train_end])
            pred = model.predict(X.iloc[train_end:test_end])
            m = metrics(y.iloc[train_end:test_end], pred)
            for key in m:
                output['models'][name][key].append(m[key])
            fold_record[name] = m
        output['folds'].append(fold_record)

    for name, values in output['models'].items():
        output['models'][name]['mean_mae'] = float(np.mean(values['mae'])) if values['mae'] else None
        output['models'][name]['mean_rmse'] = float(np.mean(values['rmse'])) if values['rmse'] else None
        output['models'][name]['mean_mape_pct'] = float(np.mean(values['mape_pct'])) if values['mape_pct'] else None
    ranked = sorted(output['models'], key=lambda n: output['models'][n]['mean_mae'] if output['models'][n]['mean_mae'] is not None else float('inf'))
    output['selected_model'] = ranked[0] if ranked else None
    Path('ml/backtest_results.json').write_text(json.dumps(output, indent=2), encoding='utf-8')
    print(json.dumps(output, indent=2))


if __name__ == '__main__':
    main()

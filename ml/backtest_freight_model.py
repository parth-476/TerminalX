"""Leakage-safe rolling-origin backtest for freight-rate models.

Folds are split by DATE, not row position. Therefore all lanes from a test
date stay out of training, preventing same-day cross-lane leakage.
"""
from pathlib import Path
import json
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

FEATURES = ['lag1','lag7','lag30','ma7','ma30','volatility','momentum7','route_congestion','vessel_supply','transit_days','distance_nm','carbon_cost','month_sin','month_cos']
TARGET = 'freight_rate'


def metrics(actual, predicted):
    return {'mae': float(mean_absolute_error(actual, predicted)), 'rmse': float(np.sqrt(mean_squared_error(actual, predicted))), 'mape_pct': float(mean_absolute_percentage_error(actual, predicted) * 100)}


def main():
    source = Path(sys.argv[1] if len(sys.argv) > 1 else 'data/freight_history.csv')
    if not source.exists(): raise SystemExit(f'Missing training file: {source}')
    df = pd.read_csv(source)
    missing = [c for c in FEATURES + [TARGET, 'date', 'lane_id'] if c not in df.columns]
    if missing: raise SystemExit('Missing columns: ' + ', '.join(missing))
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values(['date', 'lane_id']).reset_index(drop=True)
    X, y = df[FEATURES].fillna(0), df[TARGET].astype(float)
    dates = pd.Series(df['date'].sort_values().unique())
    if len(dates) < 60: raise SystemExit('Need at least 60 distinct dates for rolling backtest.')

    candidate_dates = np.linspace(int(len(dates) * 0.55), len(dates) - 8, num=4, dtype=int)
    models = {
        'ridge_regression': lambda: Ridge(alpha=1.0),
        'gradient_boosting': lambda: GradientBoostingRegressor(random_state=42, n_estimators=180, max_depth=3, learning_rate=0.04),
        'random_forest': lambda: RandomForestRegressor(random_state=42, n_estimators=250, min_samples_leaf=2, n_jobs=-1),
    }
    output = {'source': str(source), 'folds': [], 'models': {name: {'mae': [], 'rmse': [], 'mape_pct': []} for name in models}}
    for fold, index in enumerate(sorted(set(candidate_dates)), 1):
        train_end = dates.iloc[index - 1]
        test_end = dates.iloc[min(index + max(3, len(dates) // 10) - 1, len(dates) - 1)]
        train_mask, test_mask = df['date'] <= train_end, (df['date'] > train_end) & (df['date'] <= test_end)
        if test_mask.sum() == 0: continue
        fold_record = {'fold': fold, 'train_end': str(train_end.date()), 'test_start': str(df.loc[test_mask, 'date'].min().date()), 'test_end': str(df.loc[test_mask, 'date'].max().date()), 'test_samples': int(test_mask.sum())}
        for name, factory in models.items():
            model = factory(); model.fit(X.loc[train_mask], y.loc[train_mask]); pred = model.predict(X.loc[test_mask])
            m = metrics(y.loc[test_mask], pred)
            for key in m: output['models'][name][key].append(m[key])
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


if __name__ == '__main__': main()

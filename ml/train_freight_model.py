"""Train freight-rate regressors from an aligned historical feature table.

The evaluation uses a chronological date split so future observations never
enter training. Demo/synthetic data must not be presented as observed market
data or as production accuracy.
"""
from pathlib import Path
import json
import sys
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, mean_absolute_percentage_error

FEATURES = ['lag1','lag7','lag30','ma7','ma30','volatility','momentum7','route_congestion','vessel_supply','transit_days','distance_nm','carbon_cost','month_sin','month_cos','wind_speed_kmh','wind_gust_kmh','precipitation_mm','visibility_m','weather_missing']
TARGET = 'freight_rate'


def metrics(actual, predicted):
    return {
        'mae': float(mean_absolute_error(actual, predicted)),
        'rmse': float(np.sqrt(mean_squared_error(actual, predicted))),
        'mape_pct': float(mean_absolute_percentage_error(actual, predicted) * 100),
    }


def main():
    source = Path(sys.argv[1] if len(sys.argv) > 1 else 'data/freight_features_aligned.csv')
    if not source.exists():
        raise SystemExit(f'Missing training file: {source}')
    df = pd.read_csv(source).sort_values(['date', 'lane_id']).reset_index(drop=True)
    missing = [c for c in FEATURES + [TARGET, 'date', 'lane_id'] if c not in df.columns]
    if missing:
        raise SystemExit('Missing columns: ' + ', '.join(missing))
    X = df[FEATURES].replace([np.inf, -np.inf], np.nan).fillna(0)
    y = df[TARGET].astype(float)
    dates = pd.to_datetime(df['date'])
    unique_dates = pd.Series(dates.sort_values().unique())
    cutoff = unique_dates.iloc[max(1, int(len(unique_dates) * 0.8) - 1)]
    train_mask, test_mask = dates <= cutoff, dates > cutoff
    if train_mask.sum() < 30 or test_mask.sum() < 10:
        raise SystemExit('Insufficient chronological data for train/test evaluation.')

    models = {
        'ridge_regression': Ridge(alpha=1.0),
        'gradient_boosting': GradientBoostingRegressor(random_state=42, n_estimators=180, max_depth=3, learning_rate=0.04),
        'random_forest': RandomForestRegressor(random_state=42, n_estimators=250, min_samples_leaf=2, n_jobs=-1),
    }
    results = {'source': str(source), 'demo_data_warning': 'Metrics are demonstration-only when the source contains synthetic data.', 'split': {'train_end': str(dates[train_mask].max().date()), 'test_start': str(dates[test_mask].min().date()), 'train_samples': int(train_mask.sum()), 'test_samples': int(test_mask.sum())}, 'models': {}}
    for name, model in models.items():
        model.fit(X.loc[train_mask], y.loc[train_mask])
        pred = model.predict(X.loc[test_mask])
        record = metrics(y.loc[test_mask], pred)
        if hasattr(model, 'feature_importances_'):
            record['feature_importance'] = {f: float(v) for f, v in zip(FEATURES, model.feature_importances_)}
        elif hasattr(model, 'coef_'):
            record['feature_importance'] = {f: float(abs(v)) for f, v in zip(FEATURES, model.coef_)}
        results['models'][name] = record
    ranked = sorted(results['models'], key=lambda name: results['models'][name]['mae'])
    results['selected_model'] = ranked[0]
    results['model_order'] = ranked
    Path('ml/trained_model_results.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    main()

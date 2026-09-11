"""Build a leakage-safe ML feature table from freight, port and weather history.

This builder intentionally accepts local/approved source files rather than
silently downloading market data. It aligns observations by date and port,
forward-fills only slowly changing macro-style fields, and leaves missing
operational observations explicit.

Expected inputs:
  --freight data/freight_history_demo.csv
  --weather data/port_weather_history.csv   (optional)
  --output data/freight_features_aligned.csv

Weather CSV columns: date, port_id, wind_speed_kmh, wind_gust_kmh,
precipitation_mm, visibility_m.

The output keeps the original model features and adds operational weather
features. Synthetic freight remains DEMO data until replaced by approved
observations.
"""
from pathlib import Path
import argparse
import pandas as pd
import numpy as np

BASE_FEATURES = [
    'lag1','lag7','lag30','ma7','ma30','volatility','momentum7',
    'route_congestion','vessel_supply','transit_days','distance_nm',
    'carbon_cost','month_sin','month_cos'
]
WEATHER_FEATURES = ['wind_speed_kmh','wind_gust_kmh','precipitation_mm','visibility_m']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--freight', default='data/freight_history_demo.csv')
    parser.add_argument('--weather', default='data/port_weather_history.csv')
    parser.add_argument('--output', default='data/freight_features_aligned.csv')
    args = parser.parse_args()

    freight = pd.read_csv(args.freight)
    required = BASE_FEATURES + ['date', 'lane_id', 'freight_rate']
    missing = [c for c in required if c not in freight.columns]
    if missing:
        raise SystemExit('Missing freight columns: ' + ', '.join(missing))
    freight['date'] = pd.to_datetime(freight['date'])

    if Path(args.weather).exists():
        weather = pd.read_csv(args.weather)
        weather_required = ['date', 'port_id'] + WEATHER_FEATURES
        missing_weather = [c for c in weather_required if c not in weather.columns]
        if missing_weather:
            raise SystemExit('Missing weather columns: ' + ', '.join(missing_weather))
        weather['date'] = pd.to_datetime(weather['date'])
        weather = weather.sort_values(['port_id', 'date'])
        # Keep one daily observation per port; upstream adapters can aggregate hourly data.
        weather = weather.groupby(['date', 'port_id'], as_index=False)[WEATHER_FEATURES].mean()
    else:
        weather = pd.DataFrame(columns=['date', 'port_id'] + WEATHER_FEATURES)

    # Map SIH lanes to their destination port IDs. Unknown lanes stay null rather than guessed.
    lane_ports = {
        'sih-aus-prd': 'INPRD',
        'sih-aus-vtz': 'INVTZ',
        'sih-aus-dma': 'INDMA',
        'sih-aus-gam': 'INGAM',
        'sih-za-vtz': 'INVTZ',
        'sih-br-prd': 'INPRD',
        'sih-aus-coal-prd': 'INPRD',
    }
    freight['port_id'] = freight['lane_id'].map(lane_ports)
    aligned = freight.merge(weather, on=['date', 'port_id'], how='left')

    # Never invent observations. Missing weather is represented by a flag and zero-filled
    # only after preserving that missingness indicator for the model.
    aligned['weather_missing'] = aligned[WEATHER_FEATURES].isna().any(axis=1).astype(int)
    for column in WEATHER_FEATURES:
        aligned[column] = aligned[column].fillna(0.0)

    aligned = aligned.sort_values(['date', 'lane_id']).reset_index(drop=True)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    aligned.to_csv(output, index=False)
    print(f'Wrote {len(aligned)} aligned rows to {output}')
    print(f'Weather coverage: {(1 - aligned.weather_missing.mean()) * 100:.1f}%')


if __name__ == '__main__':
    main()

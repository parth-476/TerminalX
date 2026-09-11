export interface PublishedModelMetrics {
  mean_mae: number | null;
  mean_rmse: number | null;
  mean_mape_pct: number | null;
}

export interface PublishedBacktestResults {
  selected_model: string | null;
  models: Record<string, PublishedModelMetrics>;
  folds: Array<Record<string, unknown>>;
  generated_at?: string;
  dataset?: {
    source?: string;
    observations?: number;
    lanes?: number;
    start_date?: string;
    end_date?: string;
  };
}

export async function fetchPublishedBacktest(): Promise<PublishedBacktestResults | null> {
  try {
    const response = await fetch('/model/backtest_results.json', { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as PublishedBacktestResults;
  } catch {
    return null;
  }
}

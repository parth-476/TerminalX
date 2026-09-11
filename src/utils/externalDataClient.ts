export interface MacroIndicator {
  code: string;
  label: string;
  observations: { year: string; value: number }[];
}

export interface MacroSnapshot {
  source: string;
  country: string;
  fetchedAt: string;
  indicators: MacroIndicator[];
}

export interface WeatherSnapshot {
  source: string;
  fetchedAt: string;
  coordinates: { latitude: number; longitude: number };
  summary: { maxWindKmh: number; maxGustKmh: number; maxHourlyPrecipMm: number };
  hourly: {
    time: string[];
    windSpeed10m: number[];
    windGusts10m: number[];
    precipitation: number[];
    visibility: number[];
    weatherCode: number[];
  };
}

export interface HistoricalWeatherSnapshot {
  source: string;
  fetchedAt: string;
  coordinates: { latitude: number; longitude: number };
  startDate: string;
  endDate: string;
  days: number;
  summary: {
    avgPrecipitationMm: number;
    avgMaxWindKmh: number;
    maxWindKmh: number;
    maxGustKmh: number;
    highWindDays: number;
    heavyRainDays: number;
  };
  daily: {
    date: string;
    weatherCode: number;
    precipitationMm: number;
    maxWindKmh: number;
    maxGustKmh: number;
  }[];
}

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
  return payload as T;
}

export const fetchIndiaMacro = () => get<MacroSnapshot>('/api/external-data?type=macro&country=ind');

export const fetchPortWeather = (latitude: number, longitude: number) =>
  get<WeatherSnapshot>(`/api/external-data?type=weather&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);

export const fetchHistoricalPortWeather = (latitude: number, longitude: number, days = 90) =>
  get<HistoricalWeatherSnapshot>(`/api/external-data?type=weather-history&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&days=${days}`);

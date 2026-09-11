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

async function get<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || `HTTP ${response.status}`);
  return payload as T;
}

export const fetchIndiaMacro = () => get<MacroSnapshot>('/api/external-data?type=macro&country=ind');

export const fetchPortWeather = (latitude: number, longitude: number) =>
  get<WeatherSnapshot>(`/api/external-data?type=weather&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`);

const WORLD_BANK_BASE = 'https://api.worldbank.org/v2';
const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

async function fetchJson(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`upstream ${response.status}`);
  return response.json();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  const type = String(req.query?.type ?? '').toLowerCase();

  try {
    if (type === 'macro') {
      const country = String(req.query?.country ?? 'ind').toLowerCase();
      const indicators = [
        ['NY.GDP.MKTP.KD.ZG', 'GDP GROWTH %'],
        ['FP.CPI.TOTL.ZG', 'CPI INFLATION %'],
        ['NE.TRD.GNFS.ZS', 'TRADE % GDP']
      ] as const;
      const payloads = await Promise.all(indicators.map(async ([code, label]) => {
        const data = await fetchJson(`${WORLD_BANK_BASE}/country/${encodeURIComponent(country)}/indicator/${code}?format=json&per_page=8`);
        const rows = Array.isArray(data?.[1]) ? data[1] : [];
        const observations = rows.filter((row: any) => row?.value !== null).slice(0, 5).map((row: any) => ({
          year: String(row.date),
          value: Number(row.value)
        }));
        return { code, label, observations };
      }));
      return json(res, 200, { source: 'WORLD BANK INDICATORS API', country, fetchedAt: new Date().toISOString(), indicators: payloads });
    }

    if (type === 'weather') {
      const latitude = Number(req.query?.lat);
      const longitude = Number(req.query?.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return json(res, 400, { error: 'lat and lon are required' });
      const url = new URL(OPEN_METEO_BASE);
      url.searchParams.set('latitude', String(latitude));
      url.searchParams.set('longitude', String(longitude));
      url.searchParams.set('forecast_days', '5');
      url.searchParams.set('timezone', 'UTC');
      url.searchParams.set('hourly', 'wind_speed_10m,wind_gusts_10m,precipitation,visibility,weather_code');
      const data = await fetchJson(url.toString());
      const hourly = data?.hourly ?? {};
      const wind = (hourly.wind_speed_10m ?? []).map(Number).filter(Number.isFinite);
      const gusts = (hourly.wind_gusts_10m ?? []).map(Number).filter(Number.isFinite);
      const precipitation = (hourly.precipitation ?? []).map(Number).filter(Number.isFinite);
      const max = (xs: number[]) => xs.length ? Math.max(...xs) : 0;
      return json(res, 200, {
        source: 'OPEN-METEO FORECAST API',
        fetchedAt: new Date().toISOString(),
        coordinates: { latitude, longitude },
        summary: { maxWindKmh: max(wind), maxGustKmh: max(gusts), maxHourlyPrecipMm: max(precipitation) },
        hourly: { time: hourly.time ?? [], windSpeed10m: hourly.wind_speed_10m ?? [], windGusts10m: hourly.wind_gusts_10m ?? [], precipitation: hourly.precipitation ?? [], visibility: hourly.visibility ?? [], weatherCode: hourly.weather_code ?? [] }
      });
    }

    return json(res, 400, { error: 'type must be macro or weather' });
  } catch (error) {
    console.error('External data error', error);
    return json(res, 502, { error: 'External data source unavailable' });
  }
}

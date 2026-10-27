const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  const providerUrl = String(process.env.FREIGHT_PROVIDER_URL ?? '').trim();
  if (!providerUrl) return json(res, 503, { error: 'Freight provider not configured', mode: 'DEMO', provider: 'REPOSITORY FIXTURES', message: 'Set FREIGHT_PROVIDER_URL and optionally FREIGHT_PROVIDER_KEY to enable a live freight-rate feed.' });

  let url: URL;
  try {
    url = new URL(providerUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Provider URL must use HTTPS and must not embed credentials.');
  } catch {
    return json(res, 500, { error: 'Invalid FREIGHT_PROVIDER_URL', message: 'Use an HTTPS endpoint URL; keep credentials in FREIGHT_PROVIDER_KEY.' });
  }

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (process.env.FREIGHT_PROVIDER_KEY) headers.Authorization = `Bearer ${process.env.FREIGHT_PROVIDER_KEY}`;
    const upstream = await fetch(url.toString(), { headers, signal: AbortSignal.timeout(8000) });
    if (!upstream.ok) throw new Error(`upstream returned ${upstream.status}`);
    const payload: any = await upstream.json();
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload.lanes) ? payload.lanes : Array.isArray(payload.rates) ? payload.rates : Array.isArray(payload.data) ? payload.data : [];
    const records = rows.map((row: any) => ({
      code: String(row?.code ?? row?.laneCode ?? row?.lane ?? '').trim().toUpperCase(),
      currentRateUsd: Number(row?.currentRateUsd ?? row?.currentRate ?? row?.rate),
      rateUnit: row?.rateUnit == null && row?.unit == null ? undefined : String(row.rateUnit ?? row.unit),
      change24h: row?.change24h == null ? undefined : Number(row.change24h),
      changePct: row?.changePct == null && row?.changePct24h == null ? undefined : Number(row.changePct ?? row.changePct24h),
      updatedAt: row?.updatedAt == null && row?.timestamp == null ? undefined : String(row.updatedAt ?? row.timestamp)
    })).filter((row: any) => row.code && Number.isFinite(row.currentRateUsd) && row.currentRateUsd > 0);
    if (!records.length) throw new Error('Provider response contained no valid positive freight rates with lane codes.');
    return json(res, 200, {
      lanes: records,
      status: {
        mode: 'LIVE',
        provider: url.hostname,
        updatedAt: new Date().toISOString(),
        laneCount: records.length,
        message: 'Rates received from configured external provider. Confirm its license, units and lane-code mapping before use.'
      }
    });
  } catch (error) {
    return json(res, 502, { error: 'Freight provider unavailable', mode: 'DEMO', message: error instanceof Error ? error.message : 'Provider request failed.' });
  }
}

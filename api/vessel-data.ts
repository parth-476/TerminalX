const json = (res: any, status: number, body: unknown) => res.status(status).json(body);

function safeUrl(value: string) {
  try { return new URL(value); } catch { return null; }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  const providerUrl = String(process.env.AIS_PROVIDER_URL ?? '').trim();

  if (!providerUrl) {
    return json(res, 503, {
      error: 'AIS provider not configured',
      mode: 'DEMO',
      provider: 'REPOSITORY FIXTURES',
      message: 'Set AIS_PROVIDER_URL and optionally AIS_PROVIDER_KEY to enable a normalized live vessel feed.'
    });
  }

  const url = safeUrl(providerUrl);
  if (!url) return json(res, 500, { error: 'Invalid AIS_PROVIDER_URL' });

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (process.env.AIS_PROVIDER_KEY) headers.Authorization = `Bearer ${process.env.AIS_PROVIDER_KEY}`;
    const upstream = await fetch(url.toString(), { headers });
    if (!upstream.ok) throw new Error(`upstream ${upstream.status}`);
    const payload = await upstream.json();
    const rows = Array.isArray(payload) ? payload : Array.isArray(payload.vessels) ? payload.vessels : Array.isArray(payload.data) ? payload.data : [];
    const vessels = rows.map((row: any, index: number) => ({
      id: String(row.id ?? row.imo ?? row.mmsi ?? `ais-${index}`),
      mmsi: String(row.mmsi ?? ''),
      name: String(row.name ?? row.vesselName ?? 'UNKNOWN VESSEL'),
      imo: String(row.imo ?? ''),
      type: String(row.type ?? row.vesselType ?? 'DRY_BULK').toUpperCase(),
      flag: String(row.flag ?? ''),
      lat: Number(row.lat ?? row.latitude),
      lon: Number(row.lon ?? row.longitude),
      heading: Number(row.heading ?? 0),
      speedKnots: Number(row.speedKnots ?? row.speed ?? 0),
      draftM: Number(row.draftM ?? row.draft ?? 0),
      maxDraftM: Number(row.maxDraftM ?? row.maxDraft ?? 18),
      dwt: Number(row.dwt ?? row.deadweight ?? 0),
      teuCapacity: row.teuCapacity == null ? undefined : Number(row.teuCapacity),
      barrelCapacity: row.barrelCapacity == null ? undefined : Number(row.barrelCapacity),
      currentLaneId: String(row.currentLaneId ?? row.laneId ?? ''),
      originPort: String(row.originPort ?? row.origin ?? ''),
      destinationPort: String(row.destinationPort ?? row.destination ?? ''),
      eta: String(row.eta ?? ''),
      cargoStatus: String(row.cargoStatus ?? 'BALLAST').toUpperCase(),
      operator: String(row.operator ?? row.owner ?? ''),
      congestionWaitHours: Number(row.congestionWaitHours ?? row.waitHours ?? 0),
      co2PerTonNm: Number(row.co2PerTonNm ?? row.co2Intensity ?? 0),
      riskAlert: row.riskAlert ? String(row.riskAlert) : undefined
    })).filter((row: any) => Number.isFinite(row.lat) && Number.isFinite(row.lon) && Number.isFinite(row.dwt));

    return json(res, 200, {
      vessels,
      status: {
        mode: 'LIVE',
        provider: new URL(providerUrl).hostname,
        updatedAt: new Date().toISOString(),
        vesselCount: vessels.length,
        message: 'External AIS payload normalized by Terminal.X.'
      }
    });
  } catch (error) {
    console.error('AIS provider error', error);
    return json(res, 502, { error: 'AIS provider unavailable' });
  }
}

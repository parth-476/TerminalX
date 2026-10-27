import type { FreightLane } from '../types';

export type FreightDataMode = 'LIVE' | 'DEMO' | 'STALE';
export interface FreightDataStatus {
  mode: FreightDataMode;
  provider: string;
  updatedAt: string;
  laneCount: number;
  message: string;
}
export interface FreightRateRecord {
  code: string;
  currentRateUsd: number;
  rateUnit?: string;
  change24h?: number;
  changePct?: number;
  updatedAt?: string;
}
export interface FreightRateFeed {
  lanes: FreightLane[];
  status: FreightDataStatus;
}

export function normalizeFreightRateFeed(payload: unknown): { records: FreightRateRecord[]; provider?: string; updatedAt?: string } | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as { lanes?: unknown; rates?: unknown; data?: unknown; status?: { provider?: unknown; updatedAt?: unknown } };
  const rows = Array.isArray(body.lanes) ? body.lanes : Array.isArray(body.rates) ? body.rates : Array.isArray(body.data) ? body.data : [];
  const records = rows.map((raw): FreightRateRecord | null => {
    if (!raw || typeof raw !== 'object') return null;
    const row = raw as Record<string, unknown>;
    const code = String(row.code ?? row.laneCode ?? row.lane ?? '').trim().toUpperCase();
    const currentRateUsd = Number(row.currentRateUsd ?? row.currentRate ?? row.rate);
    if (!code || !Number.isFinite(currentRateUsd) || currentRateUsd <= 0) return null;
    const change24hRaw = row.change24h;
    const changePctRaw = row.changePct ?? row.changePct24h;
    const change24h = change24hRaw == null ? undefined : Number(change24hRaw);
    const changePct = changePctRaw == null ? undefined : Number(changePctRaw);
    return {
      code,
      currentRateUsd,
      rateUnit: row.rateUnit == null && row.unit == null ? undefined : String(row.rateUnit ?? row.unit),
      change24h: change24h !== undefined && Number.isFinite(change24h) ? change24h : undefined,
      changePct: changePct !== undefined && Number.isFinite(changePct) ? changePct : undefined,
      updatedAt: row.updatedAt == null && row.timestamp == null ? undefined : String(row.updatedAt ?? row.timestamp)
    };
  }).filter((row): row is FreightRateRecord => row !== null);
  if (!records.length) return null;
  return {
    records,
    provider: typeof body.status?.provider === 'string' ? body.status.provider : undefined,
    updatedAt: typeof body.status?.updatedAt === 'string' ? body.status.updatedAt : undefined
  };
}

export function mergeFreightRateFeed(demoLanes: FreightLane[], payload: unknown): FreightRateFeed | null {
  const normalized = normalizeFreightRateFeed(payload);
  if (!normalized) return null;
  const byCode = new Map(normalized.records.map(record => [record.code, record]));
  const lanes = demoLanes.map(lane => {
    const rate = byCode.get(lane.code.toUpperCase());
    if (!rate) return lane;
    return {
      ...lane,
      currentRateUsd: rate.currentRateUsd,
      rateUnit: rate.rateUnit || lane.rateUnit,
      change24h: rate.change24h ?? lane.change24h,
      changePct: rate.changePct ?? lane.changePct
    };
  });
  const matchedCount = lanes.filter(lane => byCode.has(lane.code.toUpperCase())).length;
  if (!matchedCount) return null;
  return {
    lanes,
    status: {
      mode: 'LIVE',
      provider: normalized.provider || 'CONFIGURED FREIGHT PROVIDER',
      updatedAt: normalized.updatedAt || normalized.records.map(record => record.updatedAt).filter(Boolean).sort().at(-1) || new Date().toISOString(),
      laneCount: matchedCount,
      message: `${matchedCount} lane rate(s) matched to configured provider records; unmatched lanes retain demo fixtures.`
    }
  };
}

export function demoFreightFeed(lanes: FreightLane[]): FreightRateFeed {
  return {
    lanes,
    status: {
      mode: 'DEMO',
      provider: 'REPOSITORY FIXTURES',
      updatedAt: new Date().toISOString(),
      laneCount: 0,
      message: 'Synthetic freight fixtures in use. Configure a licensed provider to supply live lane rates.'
    }
  };
}

export async function fetchFreightRateFeed(demoLanes: FreightLane[]): Promise<FreightRateFeed> {
  try {
    const response = await fetch('/api/freight-data', { cache: 'no-store' });
    if (!response.ok) return demoFreightFeed(demoLanes);
    return mergeFreightRateFeed(demoLanes, await response.json()) ?? demoFreightFeed(demoLanes);
  } catch {
    return demoFreightFeed(demoLanes);
  }
}

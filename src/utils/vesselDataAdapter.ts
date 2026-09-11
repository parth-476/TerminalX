import { Vessel } from '../types';

export type VesselDataMode = 'LIVE' | 'DEMO' | 'STALE';

export interface VesselDataStatus {
  mode: VesselDataMode;
  provider: string;
  updatedAt: string;
  vesselCount: number;
  message: string;
}

export interface VesselFeed {
  vessels: Vessel[];
  status: VesselDataStatus;
}

const isVessel = (value: unknown): value is Vessel => {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<Vessel>;
  return typeof row.id === 'string' && typeof row.name === 'string' && typeof row.lat === 'number' && typeof row.lon === 'number' && typeof row.dwt === 'number' && typeof row.type === 'string';
};

export function demoVesselFeed(vessels: Vessel[]): VesselFeed {
  return {
    vessels,
    status: {
      mode: 'DEMO',
      provider: 'REPOSITORY FIXTURES',
      updatedAt: new Date().toISOString(),
      vesselCount: vessels.length,
      message: 'Synthetic AIS-like fixtures. No live vessel position is claimed.'
    }
  };
}

export function normalizeVesselFeed(payload: unknown): VesselFeed | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as { vessels?: unknown; status?: Partial<VesselDataStatus>; data?: unknown[] };
  const rows = Array.isArray(body.vessels) ? body.vessels : Array.isArray(body.data) ? body.data : [];
  const vessels = rows.filter(isVessel);
  if (!vessels.length) return null;
  return {
    vessels,
    status: {
      mode: body.status?.mode === 'STALE' ? 'STALE' : 'LIVE',
      provider: String(body.status?.provider ?? 'EXTERNAL AIS PROVIDER'),
      updatedAt: String(body.status?.updatedAt ?? new Date().toISOString()),
      vesselCount: vessels.length,
      message: String(body.status?.message ?? 'Normalized external vessel feed.')
    }
  };
}

export async function fetchVesselFeed(demoVessels: Vessel[]): Promise<VesselFeed> {
  try {
    const response = await fetch('/api/vessel-data', { cache: 'no-store' });
    if (!response.ok) return demoVesselFeed(demoVessels);
    const live = normalizeVesselFeed(await response.json());
    return live ?? demoVesselFeed(demoVessels);
  } catch {
    return demoVesselFeed(demoVessels);
  }
}

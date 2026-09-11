import { CargoStatus, Vessel, VesselType } from '../types';

export type VesselDataMode = 'LIVE' | 'DEMO' | 'STALE';
export interface VesselDataStatus { mode: VesselDataMode; provider: string; updatedAt: string; vesselCount: number; message: string; }
export interface VesselFeed { vessels: Vessel[]; status: VesselDataStatus; }

const vesselTypes: VesselType[] = ['CONTAINER', 'CRUDE_TANKER', 'DRY_BULK', 'LNG_CARRIER', 'CAR_CARRIER'];
const cargoStatuses: CargoStatus[] = ['LADEN', 'BALLAST', 'WAITING', 'MOORED'];
const isVessel = (value: unknown): value is Vessel => {
  if (!value || typeof value !== 'object') return false;
  const row = value as Partial<Vessel>;
  return typeof row.id === 'string' && typeof row.name === 'string' && typeof row.lat === 'number' && typeof row.lon === 'number' && typeof row.dwt === 'number' && vesselTypes.includes(row.type as VesselType);
};

export function demoVesselFeed(vessels: Vessel[]): VesselFeed { return { vessels, status: { mode: 'DEMO', provider: 'REPOSITORY FIXTURES', updatedAt: new Date().toISOString(), vesselCount: vessels.length, message: 'Synthetic AIS-like fixtures. No live vessel position is claimed.' } }; }

export function normalizeVesselFeed(payload: unknown): VesselFeed | null {
  if (!payload || typeof payload !== 'object') return null;
  const body = payload as { vessels?: unknown; status?: Partial<VesselDataStatus>; data?: unknown[] };
  const rows = Array.isArray(body.vessels) ? body.vessels : Array.isArray(body.data) ? body.data : [];
  const vessels = rows.map((row: any, index) => {
    const type = String(row?.type ?? 'DRY_BULK').toUpperCase() as VesselType;
    const cargoStatus = String(row?.cargoStatus ?? 'BALLAST').toUpperCase() as CargoStatus;
    return { id: String(row?.id ?? `vessel-${index}`), mmsi: String(row?.mmsi ?? ''), name: String(row?.name ?? 'UNKNOWN VESSEL'), imo: String(row?.imo ?? ''), type: vesselTypes.includes(type) ? type : 'DRY_BULK', flag: String(row?.flag ?? ''), lat: Number(row?.lat), lon: Number(row?.lon), heading: Number(row?.heading ?? 0), speedKnots: Number(row?.speedKnots ?? 0), draftM: Number(row?.draftM ?? 0), maxDraftM: Number(row?.maxDraftM ?? 18), dwt: Number(row?.dwt ?? 0), teuCapacity: row?.teuCapacity == null ? undefined : Number(row.teuCapacity), barrelCapacity: row?.barrelCapacity == null ? undefined : Number(row.barrelCapacity), currentLaneId: String(row?.currentLaneId ?? ''), originPort: String(row?.originPort ?? ''), destinationPort: String(row?.destinationPort ?? ''), eta: String(row?.eta ?? ''), cargoStatus: cargoStatuses.includes(cargoStatus) ? cargoStatus : 'BALLAST', operator: String(row?.operator ?? ''), congestionWaitHours: Number(row?.congestionWaitHours ?? 0), co2PerTonNm: Number(row?.co2PerTonNm ?? 0), riskAlert: row?.riskAlert ? String(row.riskAlert) : undefined } as Vessel;
  }).filter(isVessel);
  if (!vessels.length) return null;
  return { vessels, status: { mode: body.status?.mode === 'STALE' ? 'STALE' : 'LIVE', provider: String(body.status?.provider ?? 'EXTERNAL AIS PROVIDER'), updatedAt: String(body.status?.updatedAt ?? new Date().toISOString()), vesselCount: vessels.length, message: String(body.status?.message ?? 'Normalized external vessel feed.') } };
}

export async function fetchVesselFeed(demoVessels: Vessel[]): Promise<VesselFeed> {
  try { const response = await fetch('/api/vessel-data', { cache: 'no-store' }); if (!response.ok) return demoVesselFeed(demoVessels); return normalizeVesselFeed(await response.json()) ?? demoVesselFeed(demoVessels); } catch { return demoVesselFeed(demoVessels); }
}

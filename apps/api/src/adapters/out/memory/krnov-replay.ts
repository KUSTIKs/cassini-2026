import type { LonLat, MultiPolygon } from "../../../domain/geo.js";
import type { HazardSignal } from "../../../domain/hazard-signal.js";
import type { Task } from "../../../domain/task.js";
import zones from "./fixtures/krnov-flood-zones.json" with { type: "json" };

/**
 * Krnov, September 2024 replay data for crew routing (TECH.md §4).
 *
 * [real]      crew start: fire station, OSM node 13992937430 (JPO 811011), Krnov.
 * [real]      river centrelines the zones are built from (OSM, ODbL), see scripts/build-krnov-fixture.ts.
 * [synthetic] the two flood areas are STAND-INS until the efas and gfm signal plugins land:
 *             "forecast" ≈ Q100-like corridor; "observed" ≈ corridor + west-bank water at the substation.
 * [synthetic] people and tasks (rules §8.8).
 */
export const KRNOV_CREW_START: LonLat = [17.7038698, 50.0915357];

export const REPLAY = {
  normalDay: new Date("2024-09-11T12:00:00Z"),
  efasNotification: new Date("2024-09-12T00:00:00Z"),
  crewsDispatched: new Date("2024-09-13T10:00:00Z"),
  satelliteUpdate: new Date("2024-09-15T12:00:00Z"),
} as const;

export const KRNOV_FORECAST_SIGNAL_ID = "krnov-replay:efas-opava-2024-09-12";
export const KRNOV_OBSERVED_SIGNAL_ID = "krnov-replay:s1-krnov-2024-09-15";

export function krnovSignals(): HazardSignal[] {
  return [
    {
      id: KRNOV_FORECAST_SIGNAL_ID,
      sourceId: "krnov-replay",
      kind: "flood",
      stage: "forecast",
      area: zones.forecast as MultiPolygon,
      issuedAt: REPLAY.efasNotification,
      expectedAt: new Date("2024-09-14T00:00:00Z"), // forecast 11 Sept 12 UTC + 60 h lead (EFAS bulletin, Table 1)
      expiresAt: null,
      confidence: "medium",
      provenance: {
        label: "EFAS Opava forecast, 12 Sept 2024 (stand-in zone)",
        url: "https://european-flood.emergency.copernicus.eu/sites/default/files/bulletins-documents/2024/EFAS_Bimonthly_Bulletin_Aug_Sep2024.pdf",
        euSpace: "copernicus",
      },
    },
    {
      id: KRNOV_OBSERVED_SIGNAL_ID,
      sourceId: "krnov-replay",
      kind: "flood",
      stage: "observed",
      area: zones.observed as MultiPolygon,
      issuedAt: new Date("2024-09-15T10:00:00Z"),
      expectedAt: null,
      expiresAt: null,
      confidence: "high",
      provenance: { label: "Sentinel-1 observed flood, 15 Sept 2024 (stand-in extent)", euSpace: "copernicus" },
    },
  ];
}

/** [synthetic] where each person lives. */
export function krnovPersonLocations(): Record<string, LonLat> {
  return {
    "P-101": [17.7105, 50.0945], // dry in both stages
    "P-102": [17.6740, 50.0870], // dry in the forecast, under the observed water: last dry point
    "P-103": [17.6760, 50.0880], // dry in both, but the observed street flooding forces a detour
    "P-104": [17.7100, 50.0930],
  };
}

export function krnovTasks(): Task[] {
  const base = { alertId: "alert-krnov-2024-09", crewId: "crew-krnov-1", route: null };
  return [
    { ...base, id: "T-KRN-1", personId: "P-101", bring: ["generator"], state: "assigned" },
    { ...base, id: "T-KRN-2", personId: "P-102", bring: ["transport"], state: "assigned" },
    { ...base, id: "T-KRN-3", personId: "P-103", bring: ["oxygen"], state: "en_route" },
    { ...base, id: "T-KRN-4", personId: "P-104", bring: ["generator"], state: "done" },
  ];
}

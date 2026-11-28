import type { LonLat, MultiPolygon } from "../../../domain/geo.js";
import type { HazardSignal } from "../../../domain/hazard-signal.js";
import type { Task } from "../../../domain/task.js";
import zones from "./fixtures/krnov-flood-zones.json" with { type: "json" };

/**
 * Krnov, September 2024 replay data for crew routing (TECH.md §4). Built by scripts/fetch-real-flood-zones.ts.
 *
 * [real] forecast area: DIBAVOD D03 Q100 flood zone (VÚV TGM, indicative outlines), the zone the
 *        efas plugin maps the 12 Sept 2024 EFAS Opava notification onto.
 * [real] observed area: Copernicus GFM ensemble flood extent, Sentinel-1, 15 Sept 2024 05:01:49 UTC
 *        (EODC STAC). It found only ~0.03 km² of water here, because 74 % of the Krnov window is in
 *        GFM's exclusion mask (`unobserved`), mostly built-up area where radar can't classify water.
 * [real] crew start: fire station, OSM node 13992959691 (JPO 811804). The central station
 *        (node 13992937430) sits on a dry island fully enclosed by the Q100 zone, so it can't reach anyone.
 * [synthetic] people and tasks (rules §8.8).
 */
export const KRNOV_CREW_START: LonLat = [17.6807149, 50.0944742];

export const REPLAY = {
  normalDay: new Date("2024-09-11T12:00:00Z"),
  efasNotification: new Date("2024-09-12T00:00:00Z"),
  crewsDispatched: new Date("2024-09-13T10:00:00Z"),
  satelliteUpdate: new Date("2024-09-15T12:00:00Z"),
} as const;

export const KRNOV_FORECAST_SIGNAL_ID = "krnov-replay:efas-opava-2024-09-12";
export const KRNOV_OBSERVED_SIGNAL_ID = "krnov-replay:gfm-20240915T050149";

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
        label: "EFAS Opava notification, 12 Sept 2024 → DIBAVOD Q100 zone",
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
      unobserved: zones.observedUnobserved as MultiPolygon,
      issuedAt: new Date("2024-09-15T05:01:49Z"),
      expectedAt: null,
      expiresAt: null,
      confidence: "high",
      provenance: {
        label: "Copernicus GFM (Sentinel-1), 15 Sept 2024 05:01 UTC",
        url: "https://stac.eodc.eu/api/v1/collections/GFM/items/ENSEMBLE_FLOOD_20240915T050149_VV_EU020M_E051N018T3",
        euSpace: "copernicus",
      },
    },
  ];
}

/** [synthetic] where each person lives, picked against the real zones. */
export function krnovPersonLocations(): Record<string, LonLat> {
  return {
    "P-101": [17.6900, 50.1000], // dry, ≥ 80 m from the zone; the route detours north around it
    "P-102": [17.6750, 50.0840], // inside the Q100 zone near the substation: last dry point, ~190 m on foot
    "P-103": [17.7050, 50.0980], // dry; longest detour
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

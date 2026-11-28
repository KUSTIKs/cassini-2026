import type { LonLat } from "../../../domain/geo.js";
import type { Task } from "../../../domain/task.js";

/**
 * Krnov, September 2024 replay data for crew routing (TECH.md §4). The hazard signals come from the real
 * `efas` and `gfm` plugins (data/flood/, see adapters/out/signals/krnov-replay-signals.ts).
 *
 * [real] crew start: fire station, OSM node 13992959691 (JPO 811804), Krnov.
 * [synthetic] people and tasks (rules §8.8); locations picked against the real Opava Q100 zone.
 */
export const KRNOV_CREW_START: LonLat = [17.6807149, 50.0944742];

export const REPLAY = {
  normalDay: new Date("2024-09-11T12:00:00Z"),
  efasNotification: new Date("2024-09-12T06:00:00Z"), // issue time assumed in the efas fixture
  crewsDispatched: new Date("2024-09-13T10:00:00Z"),
  satelliteUpdate: new Date("2024-09-15T12:00:00Z"),
} as const;

/** [synthetic] where each person lives, picked against the real zones. */
export function krnovPersonLocations(): Record<string, LonLat> {
  return {
    "P-101": [17.7050, 50.0990], // dry; the route detours around the Opava zone
    "P-102": [17.6950, 50.0930], // inside the Opava Q100 zone: last dry point, ~185 m on foot
    "P-103": [17.7150, 50.0990], // dry; longer detour
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

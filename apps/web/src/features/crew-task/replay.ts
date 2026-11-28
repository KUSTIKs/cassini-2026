/** Replay stops the crew view can jump between (TECH.md §4). Times are UTC. */
export const CREW_REPLAY_STOPS = [
  { now: "2024-09-13T10:00:00.000Z", label: "13 Sep", detail: "EFAS forecast" },
  { now: "2024-09-15T12:00:00.000Z", label: "15 Sep", detail: "Satellite map" },
] as const;

export const DEFAULT_CREW_ID = "crew-krnov-1";
export const DEFAULT_REPLAY_NOW = CREW_REPLAY_STOPS[0].now;

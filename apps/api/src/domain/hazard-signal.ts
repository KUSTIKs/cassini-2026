import type { MultiPolygon } from "./geo.js";

/**
 * DOMAIN: what every signal plugin produces (ARCHITECTURE.md §6).
 * The core never branches on `sourceId`; it uses kind, stage, area, expectedAt and confidence.
 */
export type HazardKind = "flood" | "power_outage" | "storm" | "fire";
export type SignalStage = "forecast" | "observed";

export type HazardSignal = {
  id: string; // `${sourceId}:${externalId}`, stable across polls
  sourceId: string;
  kind: HazardKind;
  stage: SignalStage;
  area: MultiPolygon; // GeoJSON, WGS84. Always an area.
  issuedAt: Date;
  expectedAt: Date | null; // when it hits (forecast); null = already happening
  expiresAt: Date | null;
  confidence: "low" | "medium" | "high";
  provenance: { label: string; url?: string; euSpace: "copernicus" | "galileo" | null };
};

/** Known at `now` (issued) and not yet expired. Uses the injected clock, never Date.now(). */
export function isActiveAt(signal: HazardSignal, now: Date): boolean {
  return signal.issuedAt <= now && (signal.expiresAt === null || signal.expiresAt > now);
}

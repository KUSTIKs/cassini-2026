import type { Area } from "./geo.js";

/**
 * What every signal plugin produces (ARCHITECTURE.md §6). The core reads only kind, stage, area,
 * expectedAt, expiresAt and confidence: it never branches on which source a signal came from.
 */
export type HazardKind = "flood" | "power_outage" | "storm" | "fire";
export type SignalStage = "forecast" | "observed";
export type EuSpace = "copernicus" | "galileo" | null;

export type HazardSignal = {
  /** `${sourceId}:${externalId}`, stable across polls: the same id again means an update. */
  readonly id: string;
  readonly sourceId: string;
  readonly kind: HazardKind;
  readonly stage: SignalStage;
  /** Always an area, WGS84. The plugin turns "river Opava" or a raster into polygons. */
  readonly area: Area;
  readonly issuedAt: Date;
  /** When it hits (forecast). Null: already happening. */
  readonly expectedAt: Date | null;
  readonly expiresAt: Date | null;
  readonly confidence: "low" | "medium" | "high";
  readonly provenance: { readonly label: string; readonly url?: string; readonly euSpace: EuSpace };
};

/** Signals that are in force at `now`: already issued and not yet expired. */
export const activeAt = (signals: readonly HazardSignal[], now: Date) =>
  signals.filter((s) => s.issuedAt <= now && (s.expiresAt === null || s.expiresAt > now));

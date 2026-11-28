import type { MultiPolygon } from "./geo.js";
import { isActiveAt, type HazardKind, type HazardSignal } from "./hazard-signal.js";
import type { RouteBasis, TaskRoute } from "./task.js";

/** Hazard kinds that make roads impassable. Power outages and storms don't close roads by themselves. */
export const ROAD_BLOCKING_KINDS: readonly HazardKind[] = ["flood"];

export type RouteHazardSelection = {
  basis: RouteBasis;
  signals: HazardSignal[];
};

/**
 * Which signals a route must avoid at `now`.
 * Observed water is ground truth, so once any observed signal is active it replaces the forecast
 * (TECH.md Flow 4/5: before the satellite map, avoid the predicted zone; after it, the observed extent).
 */
export function selectRouteHazards(signals: readonly HazardSignal[], now: Date): RouteHazardSelection {
  const active = signals.filter((s) => ROAD_BLOCKING_KINDS.includes(s.kind) && isActiveAt(s, now));
  const observed = active.filter((s) => s.stage === "observed");
  if (observed.length > 0) return { basis: "observed", signals: byId(observed) };
  const forecast = active.filter((s) => s.stage === "forecast");
  if (forecast.length > 0) return { basis: "forecast", signals: byId(forecast) };
  return { basis: "none", signals: [] };
}

/** All selected areas as one MultiPolygon (parts may overlap; adapters union them). */
export function combinedArea(selection: RouteHazardSelection): MultiPolygon | null {
  if (selection.signals.length === 0) return null;
  return { type: "MultiPolygon", coordinates: selection.signals.flatMap((s) => s.area.coordinates) };
}

/** Why an existing route must be replaced, or null if it already avoids exactly these signals. */
export function rerouteReason(route: TaskRoute, selection: RouteHazardSelection): string | null {
  const before = [...route.avoidedSignalIds].sort().join("|");
  const after = selection.signals.map((s) => s.id).join("|");
  if (before === after) return null;

  const labels = [...new Set(selection.signals.map((s) => s.provenance.label))].join("; ");
  if (selection.basis === "none") return "Hazard area no longer active; route no longer avoids it";
  if (route.basis !== selection.basis) {
    return `Now avoids ${selection.basis} flood area instead of ${route.basis}: ${labels}`;
  }
  return `Flood area updated: ${labels}`;
}

function byId(signals: HazardSignal[]): HazardSignal[] {
  return [...signals].sort((a, b) => a.id.localeCompare(b.id));
}

import type { Area, MultiPolygon } from "./geo.js";
import { activeAt, type HazardKind, type HazardSignal } from "./hazard-signal.js";
import type { RouteBasis, TaskRoute } from "./task.js";

/** Hazard kinds that make roads impassable. Power outages and storms don't close roads by themselves. */
export const ROAD_BLOCKING_KINDS: readonly HazardKind[] = ["flood"];

export type RouteHazardSelection = {
  basis: RouteBasis;
  signals: HazardSignal[];
};

/**
 * Which signals a route must avoid at `now`.
 * Observed water ADDS to the forecast zone; it never removes it. Satellites don't see everywhere:
 * on 15 Sept 2024 Copernicus GFM could not classify ~80 % of Krnov's centre (built-up area in its
 * exclusion mask, data/flood/README.md), so "no water observed" there means "unknown", not "dry".
 * Until signals can say where they saw dry ground, the forecast zone stays avoided.
 */
export function selectRouteHazards(signals: readonly HazardSignal[], now: Date): RouteHazardSelection {
  const active = activeAt(signals, now).filter((s) => ROAD_BLOCKING_KINDS.includes(s.kind));
  const observed = active.filter((s) => s.stage === "observed");
  const forecast = active.filter((s) => s.stage === "forecast");
  if (observed.length > 0) return { basis: "observed", signals: byId([...observed, ...forecast]) };
  if (forecast.length > 0) return { basis: "forecast", signals: byId(forecast) };
  return { basis: "none", signals: [] };
}

/** All selected areas as one MultiPolygon (parts may overlap; adapters union them). */
export function combinedArea(selection: RouteHazardSelection): MultiPolygon | null {
  if (selection.signals.length === 0) return null;
  return { type: "MultiPolygon", coordinates: selection.signals.flatMap((s) => polygonsOf(s.area)) };
}

const polygonsOf = (area: Area) => (area.type === "Polygon" ? [area.coordinates] : area.coordinates);

/** Why an existing route must be replaced, or null if it already avoids exactly these signals. */
export function rerouteReason(route: TaskRoute, selection: RouteHazardSelection): string | null {
  const before = new Set(route.avoidedSignalIds);
  const added = selection.signals.filter((s) => !before.has(s.id));
  const removed = route.avoidedSignalIds.filter((id) => !selection.signals.some((s) => s.id === id));
  if (added.length === 0 && removed.length === 0) return null;

  const labels = (list: HazardSignal[]) => [...new Set(list.map((s) => s.provenance.label))].join("; ");
  if (selection.signals.length === 0) return "Flood areas no longer active; route no longer avoids them";
  if (removed.length === 0) return `Now also avoids ${labels(added)}`;
  return `Flood areas updated; now avoids ${labels(selection.signals)}`;
}

function byId(signals: HazardSignal[]): HazardSignal[] {
  return [...signals].sort((a, b) => a.id.localeCompare(b.id));
}

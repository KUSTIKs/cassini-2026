import * as turf from "@turf/turf";
import type { Feature, MultiPolygon as GeoMultiPolygon, Polygon } from "geojson";
import type { BBox, LonLat, MultiPolygon } from "../../../domain/geo.js";

/** OpenRouteService refuses avoid_polygons larger than this (area, and bounding-box extent). */
export const ORS_AVOID_LIMITS = { maxAreaKm2: 200, maxExtentKm: 20 } as const;

export type PrepareAvoidOptions = {
  /** Margin around the trip's bounding box that still matters for a detour. */
  padKm: number;
  /** Simplification starts here (degrees, ~5 m) and doubles until under `maxVertices`. */
  toleranceDeg: number;
  maxVertices: number;
  /** Stay this far under the provider limits. */
  safety: number;
};

const DEFAULTS: PrepareAvoidOptions = { padKm: 3, toleranceDeg: 0.00005, maxVertices: 400, safety: 0.95 };

type Area = Feature<Polygon | GeoMultiPolygon>;

/**
 * Makes a hazard area safe to send as ORS `avoid_polygons`:
 * union overlapping parts → clip to a window around the trip (≤ 20 km per side) →
 * simplify while staying valid → shrink the window until the area is under 200 km².
 * Returns null when no water is near the trip.
 */
export function prepareAvoidArea(
  area: MultiPolygon,
  from: LonLat,
  to: LonLat,
  options: Partial<PrepareAvoidOptions> = {},
): MultiPolygon | null {
  const o = { ...DEFAULTS, ...options };
  const merged = unionAll(area);
  if (!merged) return null;

  const maxSideKm = ORS_AVOID_LIMITS.maxExtentKm * o.safety;
  const maxAreaKm2 = ORS_AVOID_LIMITS.maxAreaKm2 * o.safety;
  let window = windowAround(from, to, o.padKm, maxSideKm);

  for (let attempt = 0; attempt < 12; attempt++) {
    const clipped = turf.intersect(turf.featureCollection([merged, turf.bboxPolygon(window)]));
    if (!clipped) return null;
    const simple = simplifyValid(clipped, o);
    if (turf.area(simple) / 1e6 <= maxAreaKm2) return toMulti(simple);
    window = shrink(window, 0.8);
  }
  throw new Error("Avoid area still exceeds the provider's size limit after clipping");
}

/** Width and height of a geometry's bounding box in km (measured at its middle). */
export function extentKm(geometry: MultiPolygon): { widthKm: number; heightKm: number } {
  const [w, s, e, n] = turf.bbox(geometry);
  const midLat = (s + n) / 2;
  const midLon = (w + e) / 2;
  return {
    widthKm: turf.distance([w, midLat], [e, midLat], { units: "kilometers" }),
    heightKm: turf.distance([midLon, s], [midLon, n], { units: "kilometers" }),
  };
}

function unionAll(area: MultiPolygon): Area | null {
  const parts = area.coordinates.filter((rings) => rings[0] && rings[0].length >= 4).map((rings) => turf.polygon(rings));
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0]!;
  return turf.union(turf.featureCollection(parts));
}

/** A box centred on the trip, padded, and no wider or taller than `maxSideKm`. */
function windowAround(from: LonLat, to: LonLat, padKm: number, maxSideKm: number): BBox {
  const midLat = (from[1] + to[1]) / 2;
  const midLon = (from[0] + to[0]) / 2;
  const kmPerLon = 111.32 * Math.cos((midLat * Math.PI) / 180);
  const kmPerLat = 110.54;
  const halfW = Math.min((Math.abs(from[0] - to[0]) * kmPerLon) / 2 + padKm, maxSideKm / 2);
  const halfH = Math.min((Math.abs(from[1] - to[1]) * kmPerLat) / 2 + padKm, maxSideKm / 2);
  return [midLon - halfW / kmPerLon, midLat - halfH / kmPerLat, midLon + halfW / kmPerLon, midLat + halfH / kmPerLat];
}

function shrink([w, s, e, n]: BBox, factor: number): BBox {
  const cx = (w + e) / 2;
  const cy = (s + n) / 2;
  const hw = ((e - w) / 2) * factor;
  const hh = ((n - s) / 2) * factor;
  return [cx - hw, cy - hh, cx + hw, cy + hh];
}

/** Fewer vertices keep the request small; never send an invalid (self-intersecting) polygon. */
function simplifyValid(area: Area, o: PrepareAvoidOptions): Area {
  let best: Area = area;
  for (let tol = o.toleranceDeg; tol < 0.01; tol *= 2) {
    const candidate = turf.simplify(area, { tolerance: tol, highQuality: true, mutate: false });
    if (!piecesValid(candidate)) break;
    best = candidate;
    if (turf.coordAll(candidate).length <= o.maxVertices) break;
  }
  return best;
}

/** Each polygon valid on its own; separate polygons may touch at points (OGC-valid, accepted by ORS/JTS). */
function piecesValid(area: Area): boolean {
  return turf.flatten(area).features.every((p) => turf.booleanValid(p));
}

function toMulti(area: Area): MultiPolygon {
  return area.geometry.type === "Polygon"
    ? { type: "MultiPolygon", coordinates: [area.geometry.coordinates] }
    : { type: "MultiPolygon", coordinates: area.geometry.coordinates };
}

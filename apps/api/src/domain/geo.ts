/**
 * Minimal geometry for the domain (GeoJSON-compatible, WGS84, [lng, lat]).
 * Pure functions only — good enough for town-sized areas.
 */
export type LngLat = { readonly lng: number; readonly lat: number };
export type Position = [number, number];
export type Area =
  | { readonly type: "Polygon"; readonly coordinates: Position[][] }
  | { readonly type: "MultiPolygon"; readonly coordinates: Position[][][] };
export type BBox = { readonly west: number; readonly south: number; readonly east: number; readonly north: number };

const polygonsOf = (area: Area): Position[][][] =>
  area.type === "Polygon" ? [area.coordinates] : area.coordinates;

export const bboxOf = (area: Area): BBox => {
  let west = Infinity, south = Infinity, east = -Infinity, north = -Infinity;
  for (const polygon of polygonsOf(area))
    for (const [lng, lat] of polygon[0] ?? []) {
      west = Math.min(west, lng); east = Math.max(east, lng);
      south = Math.min(south, lat); north = Math.max(north, lat);
    }
  return { west, south, east, north };
};

/** Ray casting on one ring. */
const ringContains = (ring: Position[], { lng, lat }: LngLat): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    const crosses = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
};

/** Inside the outer ring and outside every hole, for any polygon of the area. */
export const areaContains = (area: Area, point: LngLat): boolean =>
  polygonsOf(area).some(
    ([outer, ...holes]) =>
      outer !== undefined && ringContains(outer, point) && !holes.some((hole) => ringContains(hole, point)),
  );

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export const distanceMeters = (a: LngLat, b: LngLat): number => {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
};

// ---------- crew routing (Flow 4/5) ----------
// Routes and hazard areas use plain GeoJSON types; their geometry maths lives in the routing adapters (turf).
export type { LineString, MultiPolygon } from "geojson";

/** [longitude, latitude] in WGS84, GeoJSON order. Same as `Position`; named for routing code. */
export type LonLat = Position;

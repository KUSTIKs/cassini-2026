/**
 * DOMAIN: geometry vocabulary. Type-only re-exports of GeoJSON (RFC 7946, WGS84).
 * No geometry maths lives in the domain; adapters do that with turf.
 */
export type { BBox, LineString, MultiPolygon, Polygon } from "geojson";

/** [longitude, latitude] in WGS84, same order as GeoJSON. */
export type LonLat = [lon: number, lat: number];

import type { Area, BBox, Position } from "../../../domain/geo.js";
import { bboxOf } from "../../../domain/geo.js";

/** Helpers shared by signal plugins. Plugins own the translation from their data to an area. */

type Geometry = { type: "Polygon"; coordinates: Position[][] } | { type: "MultiPolygon"; coordinates: Position[][][] };

/** Merges polygon geometries into one MultiPolygon (no dissolving: overlaps are fine for point-in-area tests). */
export const toMultiPolygon = (geometries: readonly Geometry[]): Area => ({
  type: "MultiPolygon",
  coordinates: geometries.flatMap((g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates)),
});

export const bboxesOverlap = (a: BBox, b: BBox) => a.west <= b.east && b.west <= a.east && a.south <= b.north && b.south <= a.north;

export const intersectsBBox = (area: Area, bbox: BBox) => bboxesOverlap(bboxOf(area), bbox);

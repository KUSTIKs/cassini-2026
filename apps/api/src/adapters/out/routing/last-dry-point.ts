import * as turf from "@turf/turf";
import type { LineString, LonLat, MultiPolygon } from "../../../domain/geo.js";

export type LastDryPoint = {
  /** Just outside the water, on the approach, nudged back toward dry land. */
  point: LonLat;
  /** Metres from `point` along the approach into the water, plus the gap to the destination. */
  walkRemainingM: number;
};

/**
 * The last dry point on the way to a destination that lies inside `water`.
 * `approach` is a route that ignores the water (e.g. the router's normal route, or a straight line);
 * we walk it backwards from the end until we're on dry land again.
 * Returns null if the whole approach is under water.
 */
export function findLastDryPoint(
  approach: LineString,
  water: MultiPolygon,
  destination: LonLat,
  nudgeM = 25,
): LastDryPoint | null {
  const coords = approach.coordinates as LonLat[];
  const wet = (p: LonLat) => turf.booleanPointInPolygon(p, water);

  let i = coords.length - 1;
  while (i >= 0 && wet(coords[i]!)) i--;
  if (i < 0) return null;

  const dry = coords[i]!;
  const end = coords.at(-1)!;
  const tailGapM = turf.distance(end, destination, { units: "meters" });
  if (i === coords.length - 1) return { point: dry, walkRemainingM: tailGapM };

  // The segment may leave and re-enter water several times; the final entry is the crossing nearest `next`.
  const next = coords[i + 1]!;
  const crossings = turf.lineIntersect(turf.lineString([dry, next]), turf.polygonToLine(turf.multiPolygon(water.coordinates)));
  const crossing =
    (crossings.features
      .map((f) => f.geometry.coordinates as LonLat)
      .sort((a, b) => turf.distance(next, a) - turf.distance(next, b))[0] as LonLat | undefined) ?? dry;

  const point = nudgeBack(crossing, dry, nudgeM, wet);

  const inWater = turf.length(turf.lineString([crossing, ...coords.slice(i + 1)]), { units: "meters" });
  const walkRemainingM = turf.distance(point, crossing, { units: "meters" }) + inWater + tailGapM;
  return { point, walkRemainingM };
}

/** Step from the crossing back toward dry land; try shorter steps if a nearby inlet is also wet. */
function nudgeBack(crossing: LonLat, dry: LonLat, nudgeM: number, wet: (p: LonLat) => boolean): LonLat {
  const spanM = turf.distance(crossing, dry, { units: "meters" });
  for (const m of [nudgeM, nudgeM / 5, 1]) {
    const back = Math.min(m, spanM / 2);
    if (back <= 0) break;
    const p = turf.along(turf.lineString([crossing, dry]), back, { units: "meters" }).geometry.coordinates as LonLat;
    if (!wet(p)) return p;
  }
  return dry;
}

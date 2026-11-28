import type { Area } from "@firstreach/contracts";
import type { MapBounds } from "@/components/map/MapView";

/** Bounding box of an area, for fitting the map. */
export const boundsOf = (area: Area): MapBounds => {
  const polygons = area.type === "Polygon" ? [area.coordinates] : area.coordinates;
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  for (const polygon of polygons)
    for (const [lng, lat] of polygon[0] ?? []) {
      w = Math.min(w, lng); e = Math.max(e, lng); s = Math.min(s, lat); n = Math.max(n, lat);
    }
  return [w, s, e, n];
};

import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";
import type { LonLat, MultiPolygon } from "../../../domain/geo.js";
import { extentKm, ORS_AVOID_LIMITS, prepareAvoidArea } from "./avoid-area.js";

const rect = (w: number, s: number, e: number, n: number): MultiPolygon => ({
  type: "MultiPolygon",
  coordinates: [[[[w, s], [e, s], [e, n], [w, n], [w, s]]]],
});
const km2 = (m: MultiPolygon) => turf.area(m) / 1e6;

const KRNOV: LonLat = [17.7039, 50.0915];
const NEAR: LonLat = [17.676, 50.088];
const OPAVA_CITY: LonLat = [17.9, 49.94]; // ~20 km away: the corridor alone exceeds the extent limit

describe("prepareAvoidArea (OpenRouteService limits)", () => {
  it("clips a huge area to under 200 km² and 20 km extent around the trip", () => {
    const huge = rect(17.3, 49.85, 18.2, 50.07); // ~65 km × 24 km, ~1,500 km², south of both points
    expect(km2(huge)).toBeGreaterThan(1000);
    const out = prepareAvoidArea(huge, KRNOV, NEAR)!;
    expect(km2(out)).toBeLessThan(ORS_AVOID_LIMITS.maxAreaKm2);
    const { widthKm, heightKm } = extentKm(out);
    expect(Math.max(widthKm, heightKm)).toBeLessThan(ORS_AVOID_LIMITS.maxExtentKm);
  });

  it("caps the extent at 20 km even when the trip itself is longer", () => {
    const huge = rect(17.3, 49.85, 18.2, 50.2);
    const out = prepareAvoidArea(huge, [17.95, 50.15], OPAVA_CITY)!;
    const { widthKm, heightKm } = extentKm(out);
    expect(Math.max(widthKm, heightKm)).toBeLessThan(ORS_AVOID_LIMITS.maxExtentKm);
    expect(km2(out)).toBeLessThan(ORS_AVOID_LIMITS.maxAreaKm2);
  });

  it("unions overlapping parts into valid polygons", () => {
    const overlapping: MultiPolygon = {
      type: "MultiPolygon",
      coordinates: [...rect(17.68, 50.07, 17.70, 50.08).coordinates, ...rect(17.69, 50.075, 17.71, 50.085).coordinates],
    };
    const out = prepareAvoidArea(overlapping, KRNOV, NEAR)!;
    expect(turf.booleanValid(out)).toBe(true);
    expect(out.coordinates).toHaveLength(1);
  });

  it("simplifies very detailed outlines", () => {
    const detailed = turf.circle([17.69, 50.075], 0.6, { steps: 4000, units: "kilometers" }).geometry;
    const out = prepareAvoidArea({ type: "MultiPolygon", coordinates: [detailed.coordinates] }, KRNOV, NEAR)!;
    expect(turf.coordAll(out).length).toBeLessThan(500);
    expect(turf.booleanValid(out)).toBe(true);
  });

  it("returns null when nothing is near the trip", () => {
    expect(prepareAvoidArea(rect(16.0, 49.0, 16.1, 49.1), KRNOV, NEAR)).toBeNull();
  });
});

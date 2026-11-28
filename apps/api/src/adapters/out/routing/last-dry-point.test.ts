import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";
import type { LineString, LonLat, MultiPolygon } from "../../../domain/geo.js";
import { findLastDryPoint } from "./last-dry-point.js";

const water: MultiPolygon = { type: "MultiPolygon", coordinates: [[[[0.01, -0.01], [0.03, -0.01], [0.03, 0.01], [0.01, 0.01], [0.01, -0.01]]]] };
const line = (...c: LonLat[]): LineString => ({ type: "LineString", coordinates: c });

describe("findLastDryPoint", () => {
  it("stops just before the water on the approach and measures the rest", () => {
    const res = findLastDryPoint(line([0, 0], [0.005, 0], [0.02, 0]), water, [0.02, 0])!;
    expect(turf.booleanPointInPolygon(res.point, water)).toBe(false);
    expect(res.point[0]).toBeGreaterThan(0.009); // ~25 m before the shore at lon 0.01
    expect(res.point[0]).toBeLessThan(0.01);
    expect(res.walkRemainingM).toBeGreaterThan(1100);
    expect(res.walkRemainingM).toBeLessThan(1150); // ~1,113 m wet + ~25 m nudge
  });

  it("uses the final entry when the approach crosses water earlier too", () => {
    const twoPools: MultiPolygon = {
      type: "MultiPolygon",
      coordinates: [...water.coordinates, [[[0.002, -0.01], [0.004, -0.01], [0.004, 0.01], [0.002, 0.01], [0.002, -0.01]]]],
    };
    const res = findLastDryPoint(line([0, 0], [0.02, 0]), twoPools, [0.02, 0])!;
    expect(res.point[0]).toBeGreaterThan(0.009);
  });

  it("adds the gap when the router's line ends short of the destination", () => {
    const res = findLastDryPoint(line([0, 0], [0.008, 0]), water, [0.02, 0])!;
    expect(res.point).toEqual([0.008, 0]);
    expect(res.walkRemainingM).toBeCloseTo(turf.distance([0.008, 0], [0.02, 0], { units: "meters" }), 0);
  });

  it("is null when the whole approach is under water", () => {
    expect(findLastDryPoint(line([0.015, 0], [0.02, 0]), water, [0.02, 0])).toBeNull();
  });
});

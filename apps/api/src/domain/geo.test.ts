import { describe, expect, it } from "vitest";
import { areaContains, bboxOf, distanceMeters, type Area } from "./geo.js";

const square: Area = { type: "Polygon", coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] };
const withHole: Area = {
  type: "Polygon",
  coordinates: [square.coordinates[0] as [number, number][], [[4, 4], [6, 4], [6, 6], [4, 6], [4, 4]]],
};

describe("geo", () => {
  it("finds points inside and outside an area", () => {
    expect(areaContains(square, { lng: 5, lat: 5 })).toBe(true);
    expect(areaContains(square, { lng: 11, lat: 5 })).toBe(false);
  });

  it("treats holes as outside", () => {
    expect(areaContains(withHole, { lng: 5, lat: 5 })).toBe(false);
    expect(areaContains(withHole, { lng: 2, lat: 2 })).toBe(true);
  });

  it("computes the bounding box", () => {
    expect(bboxOf(square)).toEqual({ west: 0, south: 0, east: 10, north: 10 });
  });

  it("measures distance in metres", () => {
    // Krnov centre to the Krnov 110/22 kV substation: roughly 1.7 km
    const d = distanceMeters({ lng: 17.7039, lat: 50.0897 }, { lng: 17.6811, lat: 50.0821 });
    expect(d).toBeGreaterThan(1500);
    expect(d).toBeLessThan(2000);
  });
});

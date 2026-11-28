import { describe, expect, it } from "vitest";
import { areaContains } from "../../../domain/geo.js";
import { testSignalSourceContract } from "./contract.test-kit.js";
import { createEfasSource } from "./efas/index.js";
import fixture from "./efas/fixtures/notifications-2024-09.json" with { type: "json" };
import { createGfmSource } from "./gfm/index.js";

const data = (path: string) => new URL(`../../../../../../data/${path}`, import.meta.url).pathname;
const krnov = { west: 17.58, south: 50.04, east: 17.78, north: 50.15 };
const efas = () => createEfasSource({
  zoneFiles: [data("flood/krnov-q100.geojson")],
  notifications: { url: fixture.url, items: fixture.notifications as never },
});
const gfm = () => createGfmSource({ files: [data("flood/opava-gfm-2024-09-15.geojson")] });

testSignalSourceContract("efas", efas, { bbox: krnov, now: new Date("2024-09-12T12:00:00Z"), before: new Date("2024-09-11T00:00:00Z") });
testSignalSourceContract("gfm", gfm, { bbox: krnov, now: new Date("2024-09-15T12:00:00Z"), before: new Date("2024-09-14T00:00:00Z") });

describe("efas plugin", () => {
  it("turns the Opava notification into the Opava's Q100 zone, which covers the Krnov substation, 60 h after the forecast run", async () => {
    const [signal] = await efas().poll({ bbox: krnov, since: new Date(0), now: new Date("2024-09-12T12:00:00Z") });
    expect(signal).toMatchObject({ id: "efas:2024-09-opava", stage: "forecast", confidence: "high" });
    expect(signal!.expectedAt).toEqual(new Date("2024-09-14T00:00:00Z"));
    expect(areaContains(signal!.area, { lng: 17.6811, lat: 50.0821 })).toBe(true); // Krnov 110/22 kV
  });

  it("returns nothing for an area the river doesn't reach", async () => {
    const jesenik = { west: 17.1, south: 50.18, east: 17.3, north: 50.26 };
    expect(await efas().poll({ bbox: jesenik, since: new Date(0), now: new Date("2024-09-12T12:00:00Z") })).toEqual([]);
  });
});

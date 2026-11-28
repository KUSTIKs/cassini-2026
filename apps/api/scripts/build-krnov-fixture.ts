/**
 * One-off: builds the Krnov replay flood zones used by the routing fixtures.
 *
 * Input:  an Overpass JSON export of the Opava/Opavice river centrelines (OpenStreetMap, ODbL).
 * Output: src/adapters/out/memory/fixtures/krnov-flood-zones.json
 *
 * These are STAND-INS, not real Copernicus products:
 *  - "forecast" ≈ a Q100-like corridor (220 m buffer of the river centreline), until the
 *    efas plugin delivers the DIBAVOD Q100 zone.
 *  - "observed" ≈ a slightly wider corridor, plus water around the Krnov 110/22 kV substation
 *    (which flooded in Sept 2024) and a patch of street flooding west of the centre placed so a
 *    crew route visibly changes in the replay. Until the gfm plugin delivers the real Sentinel-1 extent.
 *
 * Usage: pnpm tsx scripts/build-krnov-fixture.ts <overpass.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import * as turf from "@turf/turf";
import type { Feature, LineString, MultiPolygon, Polygon } from "geojson";

const WINDOW: [number, number, number, number] = [17.645, 50.07, 17.735, 50.105];
const input = process.argv[2];
if (!input) throw new Error("usage: build-krnov-fixture.ts <overpass.json>");

type OverpassWay = { type: "way"; id: number; tags?: Record<string, string>; geometry?: { lat: number; lon: number }[] };
const raw = JSON.parse(readFileSync(input, "utf8")) as { elements: OverpassWay[] };

const rivers = raw.elements
  .filter((e) => e.type === "way" && e.tags?.waterway === "river" && e.geometry)
  .map((e) => turf.lineString(e.geometry!.map((p) => [p.lon, p.lat]), { osmWay: e.id, name: e.tags?.name }))
  .map((l) => turf.bboxClip(l, WINDOW) as Feature<LineString | turf.MultiLineString>)
  .filter((l) => turf.length(l) > 0);

const corridor = (km: number) =>
  turf.union(turf.featureCollection(rivers.map((r) => turf.buffer(r, km, { units: "kilometers" })!)))!;

const forecast = turf.simplify(corridor(0.22), { tolerance: 0.00008, highQuality: true });

// Wider observed water on the west bank around the substation (stand-in for the GFM extent).
const substation = turf.point([17.6821, 50.0823]);
const westBlob = turf.buffer(substation, 0.45, { units: "kilometers" })!;
const streetFlooding = turf.buffer(turf.point([17.692, 50.0895]), 0.33, { units: "kilometers" })!;
const observed = turf.simplify(turf.union(turf.featureCollection([corridor(0.26), westBlob, streetFlooding]))!, {
  tolerance: 0.00008,
  highQuality: true,
});

const asMulti = (f: Feature<Polygon | MultiPolygon>): MultiPolygon =>
  f.geometry.type === "Polygon" ? { type: "MultiPolygon", coordinates: [f.geometry.coordinates] } : f.geometry;

const out = {
  attribution: "River centrelines © OpenStreetMap contributors (ODbL). Zones are hand-built stand-ins, not Copernicus products.",
  window: WINDOW,
  forecast: asMulti(forecast),
  observed: asMulti(observed),
};
writeFileSync(new URL("../src/adapters/out/memory/fixtures/krnov-flood-zones.json", import.meta.url), JSON.stringify(out));
console.log(
  "forecast km²", (turf.area(forecast) / 1e6).toFixed(2),
  "observed km²", (turf.area(observed) / 1e6).toFixed(2),
  "vertices", turf.coordAll(forecast).length, turf.coordAll(observed).length,
);

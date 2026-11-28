/**
 * Builds the REAL Krnov flood areas for the replay (replaces the earlier hand-made stand-ins).
 *
 * forecast  ← DIBAVOD D03 "záplavová území stoleté vody" (Q100 flood zones), VÚV TGM, S-JTSK/Krovak.
 *             Free download, nationwide, ~214 MB: https://www.dibavod.cz/data/download/dib_D03_ZaplUzemi100Vody.zip
 *             Pass the unzipped .shp path. DIBAVOD notes the outlines are indicative, not legally binding.
 * observed  ← Copernicus GFM ensemble flood extent (Sentinel-1, 20 m), 15 Sept 2024 05:01 UTC pass,
 *             read straight from the public EODC STAC catalogue (cloud-optimised GeoTIFF, range requests).
 *
 * Output: src/adapters/out/memory/fixtures/krnov-flood-zones.json
 * Usage:  pnpm tsx scripts/fetch-real-flood-zones.ts <path/to/D03_NavrhZaplUzemi100Vody.shp>
 */
import { writeFileSync } from "node:fs";
import * as turf from "@turf/turf";
import { contours } from "d3-contour";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { fromUrl } from "geotiff";
import proj4 from "proj4";
import * as shapefile from "shapefile";

const WINDOW: [number, number, number, number] = [17.645, 50.07, 17.735, 50.105];
const GFM_STAC = "https://stac.eodc.eu/api/v1/collections/GFM/items";
const GFM_DAY = "2024-09-15T00:00:00Z/2024-09-15T23:59:59Z";

// EPSG:5514 (S-JTSK / Krovak East North) and the Equi7 Europe grid used by GFM (from the files' own metadata).
proj4.defs("KROVAK", "+proj=krovak +lat_0=49.5 +lon_0=24.8333333333333 +alpha=30.2881397527778 +k=0.9999 +x_0=0 +y_0=0 +ellps=bessel +towgs84=589,76,480,0,0,0,0 +units=m +no_defs");
proj4.defs("EQUI7_EU", "+proj=aeqd +lat_0=53 +lon_0=24 +x_0=5837287.81977 +y_0=2121415.69617 +datum=WGS84 +units=m +no_defs");

type Area = Feature<Polygon | MultiPolygon>;
const windowPoly = turf.bboxPolygon(WINDOW);

async function forecastFromDibavod(shpPath: string): Promise<{ area: MultiPolygon; features: number }> {
  const toWgs = proj4("KROVAK", "WGS84");
  const corners = [[WINDOW[0], WINDOW[1]], [WINDOW[2], WINDOW[1]], [WINDOW[2], WINDOW[3]], [WINDOW[0], WINDOW[3]]].map((c) => toWgs.inverse(c));
  const pad = 500; // metres, covers the window's curvature in Krovak
  const native: [number, number, number, number] = [
    Math.min(...corners.map((c) => c[0]!)) - pad, Math.min(...corners.map((c) => c[1]!)) - pad,
    Math.max(...corners.map((c) => c[0]!)) + pad, Math.max(...corners.map((c) => c[1]!)) + pad,
  ];
  const source = await shapefile.open(shpPath);
  const hits: Area[] = [];
  for (;;) {
    const { done, value } = await source.read();
    if (done) break;
    const g = value.geometry;
    if (g.type !== "Polygon" && g.type !== "MultiPolygon") continue;
    // Cheap reject in the native grid before reprojecting every vertex (records carry no bbox).
    const [minX, minY, maxX, maxY] = turf.bbox(g);
    if (maxX < native[0] || minX > native[2] || maxY < native[1] || minY > native[3]) continue;
    const reproject = (ring: Position[]) => ring.map((p) => toWgs.forward([p[0]!, p[1]!]));
    const geom: Polygon | MultiPolygon =
      g.type === "Polygon"
        ? { type: "Polygon", coordinates: g.coordinates.map(reproject) }
        : { type: "MultiPolygon", coordinates: g.coordinates.map((poly) => poly.map(reproject)) };
    const clipped = turf.intersect(turf.featureCollection([turf.feature(geom), windowPoly]));
    if (clipped) hits.push(clipped);
  }
  return { area: finish(hits, "forecast"), features: hits.length };
}

async function observedFromGfm(): Promise<{ area: MultiPolygon; unobserved: MultiPolygon; items: string[]; blindShare: number }> {
  const url = `${GFM_STAC}?bbox=${WINDOW.join(",")}&datetime=${GFM_DAY}&limit=50`;
  const items = ((await (await fetch(url)).json()) as { features: { id: string; assets: Record<string, { href: string }> }[] }).features;
  if (items.length === 0) throw new Error("No GFM items for Krnov on 15 Sept 2024");

  const toEqui = proj4("WGS84", "EQUI7_EU");
  const corners = [
    [WINDOW[0], WINDOW[1]], [WINDOW[2], WINDOW[1]], [WINDOW[2], WINDOW[3]], [WINDOW[0], WINDOW[3]],
  ].map((p) => toEqui.forward(p));
  const xs = corners.map((c) => c[0]!);
  const ys = corners.map((c) => c[1]!);

  let flood: Uint8Array | null = null;
  let blind: Uint8Array | null = null;
  let frame: { x0: number; y0: number; w: number; h: number; res: number } | null = null;
  const covering: string[] = [];
  for (const item of items) {
    const [floodBand, maskBand, f] = await Promise.all([
      readWindow(item.assets.ensemble_flood_extent!.href, xs, ys),
      readWindow(item.assets.exclusion_mask!.href, xs, ys),
    ]).then(([a, b]) => [a.band, b.band, a.frame] as const);
    frame ??= f;
    flood ??= new Uint8Array(f.w * f.h);
    blind ??= new Uint8Array(f.w * f.h);
    // Slices of one pass overlap; 255 = outside this slice. Flood: 1 = water. Exclusion mask: 1 = can't observe.
    let seen = 0;
    for (let i = 0; i < f.w * f.h; i++) {
      if (floodBand[i] === 1) flood[i] = 1;
      if (maskBand[i] === 1) blind[i] = 1;
      if (floodBand[i] !== 255) seen++;
    }
    if (seen > 0) covering.push(item.id);
  }
  const f = frame!;
  const blindShare = blind!.reduce((n, v) => n + v, 0) / blind!.length;
  return {
    area: finish(trace(flood!, f, 2), "observed"),
    unobserved: finish(trace(blind!, f, 50), "unobserved", 0.0001),
    items: covering,
    blindShare,
  };
}

async function readWindow(href: string, xs: number[], ys: number[]) {
  const img = await (await fromUrl(href)).getImage();
  const [ox, oy] = img.getOrigin();
  const [res] = img.getResolution();
  const col0 = Math.floor((Math.min(...xs) - ox!) / res!);
  const col1 = Math.ceil((Math.max(...xs) - ox!) / res!);
  const row0 = Math.floor((oy! - Math.max(...ys)) / res!);
  const row1 = Math.ceil((oy! - Math.min(...ys)) / res!);
  const [band] = (await img.readRasters({ window: [col0, row0, col1, row1] })) as unknown as Uint8Array[];
  return { band: band!, frame: { x0: ox! + col0 * res!, y0: oy! - row0 * res!, w: col1 - col0, h: row1 - row0, res: res! } };
}

/** Binary grid (1 = in) → WGS84 polygons clipped to the window; parts under `minPixels` are dropped. */
function trace(grid: Uint8Array, f: { x0: number; y0: number; w: number; h: number; res: number }, minPixels: number): Area[] {
  const fromEqui = proj4("EQUI7_EU", "WGS84");
  // d3-contour traces the 0.5 isoline in pixel space (x right, y down).
  const [shape] = contours().size([f.w, f.h]).thresholds([0.5]).smooth(false)(Array.from(grid));
  const toLonLat = ([px, py]: number[]) => fromEqui.forward([f.x0 + px! * f.res, f.y0 - py! * f.res]);
  return shape!.coordinates
    .map((poly) => turf.rewind(turf.polygon(poly.map((ring) => ring.map(toLonLat)))) as Feature<Polygon>)
    .map((p) => turf.intersect(turf.featureCollection([p, windowPoly])))
    .filter((p): p is Area => p !== null && turf.area(p) > minPixels * f.res * f.res);
}

function finish(parts: Area[], name: string, minTolerance = 0.00004): MultiPolygon {
  if (parts.length === 0) throw new Error(`No ${name} area inside the Krnov window`);
  const merged = parts.length === 1 ? parts[0]! : turf.union(turf.featureCollection(parts))!;
  // Source outlines are very detailed (~1 m); ~4–8 m tolerance keeps the shape. Validity is checked
  // per polygon: pieces may touch at single points, which OGC (and ORS's JTS) allow.
  let area: Area = merged;
  for (const tolerance of [minTolerance, minTolerance * 1.5, minTolerance * 2]) {
    const simple = turf.simplify(merged, { tolerance, highQuality: true });
    if (!piecesValid(simple)) continue;
    area = simple;
    if (turf.coordAll(simple).length <= 2500) break;
  }
  return area.geometry.type === "Polygon" ? { type: "MultiPolygon", coordinates: [area.geometry.coordinates] } : area.geometry;
}

function piecesValid(area: Area): boolean {
  return turf.flatten(area).features.every((p) => turf.booleanValid(p));
}

const shp = process.argv[2];
if (!shp) throw new Error("usage: fetch-real-flood-zones.ts <D03_NavrhZaplUzemi100Vody.shp>");
const [forecast, observed] = await Promise.all([forecastFromDibavod(shp), observedFromGfm()]);
const out = {
  attribution:
    "Forecast: DIBAVOD D03 Q100 flood zones, VÚV TGM (indicative outlines). Observed: Copernicus EMS Global Flood Monitoring (GFM), Sentinel-1, 15 Sept 2024 05:01 UTC, via EODC.",
  window: WINDOW,
  sources: { forecastFeatures: forecast.features, gfmItems: observed.items, gfmUnobservedShare: +observed.blindShare.toFixed(3) },
  forecast: forecast.area,
  observed: observed.area,
  /** GFM exclusion mask: where Sentinel-1 could not classify water (mostly built-up area). */
  observedUnobserved: observed.unobserved,
};
writeFileSync(new URL("../src/adapters/out/memory/fixtures/krnov-flood-zones.json", import.meta.url), JSON.stringify(out));
const km2 = (m: MultiPolygon) => (turf.area(m) / 1e6).toFixed(2);
console.log(`forecast (Q100): ${km2(forecast.area)} km² from ${forecast.features} DIBAVOD polygons, ${turf.coordAll(forecast.area).length} vertices`);
console.log(`observed (GFM):  ${km2(observed.area)} km² water from ${observed.items.join(", ")}, ${turf.coordAll(observed.area).length} vertices`);
console.log(`unobserved:      ${km2(observed.unobserved)} km² (${(observed.blindShare * 100).toFixed(0)}% of the window) in the GFM exclusion mask, ${turf.coordAll(observed.unobserved).length} vertices`);

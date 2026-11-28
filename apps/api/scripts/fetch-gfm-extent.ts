/**
 * Turns the Copernicus Global Flood Monitoring (GFM) flood extent for one day, Krnov to Opava, into GeoJSON.
 *
 *   pnpm --filter @firstreach/api data:gfm 2024-09-15
 *
 * GFM maps flooding from Sentinel-1 radar (20 m pixels) automatically for every acquisition. EODC
 * publishes the products in a public STAC catalogue as cloud-optimised GeoTIFFs, so only the window
 * over Krnov is read (HTTP range requests), not the 15 000 × 15 000 pixel tile.
 *
 * Steps: find the day's scenes → per Equi7 tile, read the area's window of each `ensemble_flood_extent`
 * raster → flooded = 1 in any scene → trace the flooded pixels into polygons → project to WGS84.
 *
 * Limitation (checked 28 Nov): GFM excludes built-up areas, because radar can't see water between
 * buildings. About 80% of Krnov's centre is excluded on 15 Sept 2024, so this shows water in the open
 * floodplain and on roads between towns, not inside the town. Inside towns, use the Q100 zone.
 */
import { writeFileSync } from "node:fs";
import { contours } from "d3-contour";
import { fromUrl } from "geotiff";
import proj4 from "proj4";

const day = process.argv[2] ?? "2024-09-15";
if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error("Pass a date as YYYY-MM-DD");

const STAC = "https://stac.eodc.eu/api/v1/search";
/** Krnov and the Opava downstream to the city of Opava: where the demo's crews drive. */
const AREA = { west: 17.55, south: 49.9, east: 17.98, north: 50.16 };
/** Equi7Grid Europe: the projection GFM's EU020M tiles use (from the STAC item's proj:wkt2). */
const EQUI7_EU = "+proj=aeqd +lat_0=53 +lon_0=24 +x_0=5837287.81977 +y_0=2121415.69617 +datum=WGS84 +units=m +no_defs";
const toLngLat = proj4(EQUI7_EU, "WGS84");
const FLOOD = 1;
/** Drop specks smaller than this (in 20 m pixels: 5 px = 2 000 m²); radar noise, not floods. */
const MIN_PIXELS = 5;

type StacItem = { id: string; properties: { datetime: string }; assets: Record<string, { href: string }> };

const search = await fetch(STAC, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    collections: ["GFM"],
    bbox: [AREA.west, AREA.south, AREA.east, AREA.north],
    datetime: `${day}T00:00:00Z/${day}T23:59:59Z`,
    limit: 50,
  }),
  signal: AbortSignal.timeout(60_000),
});
if (!search.ok) throw new Error(`STAC search failed: HTTP ${search.status}`);
const items = ((await search.json()) as { features: StacItem[] }).features.filter((f) => f.assets.ensemble_flood_extent);
if (items.length === 0) throw new Error(`No GFM scenes over the area on ${day}`);

type Window = { tile: string; originX: number; originY: number; resX: number; resY: number; col0: number; row0: number; width: number; height: number };

/** The area's window inside one tile, clipped to the tile; null when the area misses the tile. */
const windowFor = async (tile: string, href: string): Promise<Window | null> => {
  const image = await (await fromUrl(href)).getImage();
  const [originX, originY] = image.getOrigin() as [number, number];
  const [resX, resY] = image.getResolution() as [number, number]; // resY is negative (north-up)
  const corners = [[AREA.west, AREA.south], [AREA.west, AREA.north], [AREA.east, AREA.south], [AREA.east, AREA.north]]
    .map((c) => fromLngLat.forward(c as [number, number]));
  const col0 = Math.max(0, Math.floor((Math.min(...corners.map((c) => c[0]!)) - originX) / resX));
  const col1 = Math.min(image.getWidth(), Math.ceil((Math.max(...corners.map((c) => c[0]!)) - originX) / resX));
  const row0 = Math.max(0, Math.floor((Math.max(...corners.map((c) => c[1]!)) - originY) / resY));
  const row1 = Math.min(image.getHeight(), Math.ceil((Math.min(...corners.map((c) => c[1]!)) - originY) / resY));
  if (col1 <= col0 || row1 <= row0) return null;
  return { tile, originX, originY, resX, resY, col0, row0, width: col1 - col0, height: row1 - row0 };
};

const ringArea = (ring: number[][]) =>
  Math.abs(ring.reduce((sum, [x, y], i) => { const [nx, ny] = ring[(i + 1) % ring.length]!; return sum + x! * ny! - nx! * y!; }, 0)) / 2;

const fromLngLat = proj4("WGS84", EQUI7_EU);
const polygons: number[][][][] = [];
let floodedPixels = 0;
let observedPixels = 0;
let totalPixels = 0;
let pixelArea = 400;

// Scenes are grouped by Equi7 tile; within a tile, a pixel is flooded if any of the day's scenes says so.
const byTile = new Map<string, StacItem[]>();
for (const item of items) {
  const tile = item.id.split("_").pop()!;
  byTile.set(tile, [...(byTile.get(tile) ?? []), item]);
}
for (const [tile, scenes] of byTile) {
  const win = await windowFor(tile, scenes[0]!.assets.ensemble_flood_extent!.href);
  if (!win) continue;
  pixelArea = Math.abs(win.resX * win.resY);
  const flooded = new Float32Array(win.width * win.height);
  const observed = new Uint8Array(win.width * win.height);
  for (const scene of scenes) {
    const image = await (await fromUrl(scene.assets.ensemble_flood_extent!.href)).getImage();
    const window = [win.col0, win.row0, win.col0 + win.width, win.row0 + win.height];
    const [band] = (await image.readRasters({ window })) as unknown as [ArrayLike<number>];
    for (let i = 0; i < band.length; i++) {
      if (band[i] === FLOOD) flooded[i] = 1;
      if (band[i] === 0 || band[i] === FLOOD) observed[i] = 1;
    }
  }
  totalPixels += flooded.length;
  floodedPixels += flooded.reduce((sum, v) => sum + v, 0);
  observedPixels += observed.reduce((sum, v) => sum + v, 0);

  // Trace the 0/1 grid into polygons (grid units: x = column, y = row), then project to WGS84.
  const toWgs84 = ([x, y]: [number, number]) => {
    const [lng, lat] = toLngLat.forward([win.originX + (win.col0 + x) * win.resX, win.originY + (win.row0 + y) * win.resY]);
    return [Number(lng!.toFixed(6)), Number(lat!.toFixed(6))];
  };
  const [shape] = contours().size([win.width, win.height]).thresholds([0.5])(Array.from(flooded));
  for (const polygon of shape?.coordinates ?? []) {
    if (ringArea(polygon[0]!) >= MIN_PIXELS) polygons.push(polygon.map((ring) => ring.map((p) => toWgs84(p as [number, number]))));
  }
}


const out = {
  type: "FeatureCollection",
  metadata: {
    title: `Observed flood extent, Krnov to Opava, ${day} (Sentinel-1, Copernicus GFM)`,
    area: AREA,
    source: "Copernicus Emergency Management Service, Global Flood Monitoring (GFM), ensemble flood extent",
    catalogue: "https://stac.eodc.eu/api/v1 (collection GFM)",
    scenes: items.map((i) => ({ id: i.id, sensed: i.properties.datetime })),
    licence: "Copernicus data: free, full and open. Attribution: © European Union, Copernicus Emergency Management Service",
    retrieved: new Date().toISOString().slice(0, 10),
    method: `Area window read from each scene and tile; flooded if any scene says flood; polygons traced at the 20 m pixel grid; specks under ${MIN_PIXELS} pixels dropped`,
    floodedAreaKm2: Number(((floodedPixels * pixelArea) / 1e6).toFixed(2)),
    observedShare: totalPixels ? Number((observedPixels / totalPixels).toFixed(2)) : 0,
  },
  features: [
    {
      type: "Feature",
      properties: { source: "gfm", stage: "observed", sensed: items.map((i) => i.properties.datetime).sort()[0] },
      geometry: { type: "MultiPolygon", coordinates: polygons },
    },
  ],
};

const file = new URL(`../../../data/flood/opava-gfm-${day}.geojson`, import.meta.url);
writeFileSync(file, `${JSON.stringify(out)}\n`);
console.log(
  `${day}: ${items.length} scenes, ${polygons.length} flood polygons, ${out.metadata.floodedAreaKm2} km² flooded, ` +
    `${Math.round(out.metadata.observedShare * 100)}% of the window observed`,
);

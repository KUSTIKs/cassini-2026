/**
 * Downloads the official Q100 (100-year) flood zones around Krnov and saves them as GeoJSON.
 *
 *   pnpm --filter @firstreach/api data:flood-zones
 *
 * Source: VÚV TGM, ISVS-Voda "Záplavová území" (designated flood zones), layer ZaplavUzemi_Q100,
 * ArcGIS REST service. Open data of the Czech Republic, CC BY 4.0
 * (catalogue record CZ-VUV-MD-ZaplavUzemi). Each feature is a whole river reach (e.g. the Opava),
 * which is what the EFAS plugin needs: EFAS warns per river, and the zone says where that river floods.
 */
import { writeFileSync } from "node:fs";

const SERVICE = "https://ags.vuv.cz/arcgis/rest/services/isvs_voda/isvs_voda/MapServer/13/query";
const KRNOV = { west: 17.58, south: 50.04, east: 17.78, north: 50.15 };

const params = new URLSearchParams({
  geometry: `${KRNOV.west},${KRNOV.south},${KRNOV.east},${KRNOV.north}`,
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
  outFields: "TOK_ID,NAZ_TOK,IDVT",
  outSR: "4326",
  maxAllowableOffset: "0.00002", // ~2 m simplification: keeps the file small, far below map precision
  geometryPrecision: "6",
  f: "geojson",
});

const res = await fetch(`${SERVICE}?${params}`, { signal: AbortSignal.timeout(60_000) });
if (!res.ok) throw new Error(`VÚV service answered HTTP ${res.status}`);
const body = (await res.json()) as { features?: Array<{ properties: Record<string, unknown> }> };
if (!body.features?.length) throw new Error("No flood zones returned; the service may have changed.");

const out = {
  type: "FeatureCollection",
  metadata: {
    title: "Designated flood zones, Q100 (100-year flood), around Krnov",
    source: "VÚV TGM, ISVS-Voda, Záplavová území (layer ZaplavUzemi_Q100)",
    service: SERVICE,
    licence: "CC BY 4.0, Open Data of the Czech Republic (catalogue record CZ-VUV-MD-ZaplavUzemi)",
    retrieved: new Date().toISOString().slice(0, 10),
    simplification: "maxAllowableOffset 0.00002° (~2 m)",
  },
  features: body.features.map((f) => ({
    ...f,
    properties: { river: f.properties.NAZ_TOK, riverId: f.properties.TOK_ID, waterbodyId: f.properties.IDVT, returnPeriod: "Q100" },
  })),
};

const file = new URL("../../../data/flood/krnov-q100.geojson", import.meta.url);
writeFileSync(file, `${JSON.stringify(out)}\n`);
console.log(`Saved ${out.features.length} flood zones: ${out.features.map((f) => f.properties.river).join(", ")}`);

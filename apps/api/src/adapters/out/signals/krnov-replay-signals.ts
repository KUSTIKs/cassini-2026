import { fileURLToPath } from "node:url";
import type { HazardSignal } from "../../../domain/hazard-signal.js";
import { createEfasSource } from "./efas/index.js";
import efasFixture from "./efas/fixtures/notifications-2024-09.json" with { type: "json" };
import { createGfmSource } from "./gfm/index.js";

/**
 * The Krnov Sept 2024 signals, produced by the real `efas` and `gfm` plugins from data/flood/
 * (same files and fixture as composition/signals.ts). For crew-routing tests and scripts/record-routes.ts;
 * the running app gets the same signals through POST /signals/run.
 */
export const KRNOV_FORECAST_SIGNAL_ID = "efas:2024-09-opava";
export const KRNOV_OBSERVED_SIGNAL_ID = "gfm:opava-gfm-2024-09-15";

const KRNOV_BBOX = { west: 17.6, south: 50.04, east: 17.78, north: 50.13 };
const defaultFloodDir = fileURLToPath(new URL("../../../../../../data/flood/", import.meta.url));

/** Every Krnov signal issued by `at` (default: after the 15 Sept satellite pass, so both stages). */
export const krnovReplaySignals = async (at = new Date("2024-09-15T12:00:00Z"), floodDir = defaultFloodDir): Promise<HazardSignal[]> => {
  const sources = [
    createEfasSource({
      zoneFiles: [`${floodDir}krnov-q100.geojson`],
      notifications: { url: efasFixture.url, items: efasFixture.notifications as never },
    }),
    createGfmSource({ files: [`${floodDir}opava-gfm-2024-09-15.geojson`] }),
  ];
  const polled = await Promise.all(sources.map((s) => s.poll({ bbox: KRNOV_BBOX, since: new Date(0), now: at })));
  return polled.flat();
};

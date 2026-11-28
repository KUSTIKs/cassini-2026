import { readFile } from "node:fs/promises";
import type { SignalSource } from "../../../../application/ports/out/signal-source.js";
import type { Area } from "../../../../domain/geo.js";
import type { HazardSignal } from "../../../../domain/hazard-signal.js";
import { intersectsBBox } from "../geometry.js";

/**
 * SIGNAL PLUGIN `gfm`: Copernicus Global Flood Monitoring, water observed by Sentinel-1.
 *
 * Reads flood extents already traced into polygons by scripts/fetch-gfm-extent.ts
 * (data/flood/*-gfm-YYYY-MM-DD.geojson). An observation is in force from its sensing time.
 * Limit: radar can't see water inside towns (GFM's exclusion mask); see data/flood/README.md.
 */
type ExtentFile = {
  metadata: { title: string; scenes: Array<{ sensed: string }>; catalogue: string };
  features: Array<{ geometry: Area }>;
};

export type GfmConfig = {
  files: readonly string[];
  /** How long an observation stays in force before it's considered stale. */
  validForHours?: number;
};

export const createGfmSource = (config: GfmConfig): SignalSource => {
  let extents: Promise<Array<{ file: string; data: ExtentFile }>> | null = null;
  const load = () =>
    (extents ??= Promise.all(config.files.map(async (file) => ({ file, data: JSON.parse(await readFile(file, "utf8")) as ExtentFile }))));

  const descriptor = {
    id: "gfm",
    label: "Copernicus GFM flood extent (Sentinel-1)",
    kinds: ["flood"],
    stages: ["observed"],
    euSpace: "copernicus",
  } as const;

  return {
    descriptor,
    async poll({ bbox, now }) {
      const signals: HazardSignal[] = [];
      for (const { file, data } of await load()) {
        const sensed = new Date(data.metadata.scenes.map((s) => s.sensed).sort()[0]!);
        const area = data.features[0]?.geometry;
        if (!area || sensed > now || !intersectsBBox(area, bbox)) continue;
        const day = sensed.toISOString().slice(0, 10);
        signals.push({
          id: `gfm:${file.split("/").pop()!.replace(/\.geojson$/, "")}`,
          sourceId: descriptor.id,
          kind: "flood",
          stage: "observed",
          area,
          issuedAt: sensed,
          expectedAt: null,
          expiresAt: new Date(sensed.getTime() + (config.validForHours ?? 72) * 3_600_000),
          confidence: "medium", // radar misses water inside towns
          provenance: { label: `Sentinel-1 flood extent, ${day} (Copernicus GFM)`, url: data.metadata.catalogue, euSpace: "copernicus" },
        });
      }
      return signals;
    },
  };
};

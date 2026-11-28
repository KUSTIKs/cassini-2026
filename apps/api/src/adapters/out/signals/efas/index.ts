import { readFile } from "node:fs/promises";
import type { SignalSource } from "../../../../application/ports/out/signal-source.js";
import type { Area, Position } from "../../../../domain/geo.js";
import type { HazardSignal } from "../../../../domain/hazard-signal.js";
import { intersectsBBox, toMultiPolygon } from "../geometry.js";

/**
 * SIGNAL PLUGIN `efas`: Copernicus EFAS formal flood notifications.
 *
 * EFAS warns per river ("Opava, lead time 60 h"), not per street. The plugin turns the river into an
 * area: that river's official Q100 flood zone (VÚV TGM). The core only ever sees the polygon.
 *
 * Demo: notifications come from a recorded fixture (the EFAS bulletin's table). Live use needs EFAS
 * partner access, which national authorities have [verify]; only this adapter would change.
 */
export type EfasNotification = {
  id: string;
  river: string;
  type: "formal" | "informal";
  forecastRun: string;
  issued: string;
  leadTimeHours: number;
};

type ZoneFeature = { properties: { river: string }; geometry: { type: "Polygon"; coordinates: Position[][] } | { type: "MultiPolygon"; coordinates: Position[][][] } };

export type EfasConfig = {
  /** GeoJSON of Q100 zones with a `river` property per feature (data/flood/*-q100.geojson). */
  zoneFiles: readonly string[];
  notifications: { url: string; items: readonly EfasNotification[] };
  /** How long after the expected arrival the warning stays in force. */
  validForHours?: number;
};

export const createEfasSource = (config: EfasConfig): SignalSource => {
  let zones: Promise<ZoneFeature[]> | null = null;
  const loadZones = () =>
    (zones ??= Promise.all(config.zoneFiles.map(async (f) => (JSON.parse(await readFile(f, "utf8")) as { features: ZoneFeature[] }).features))
      .then((all) => all.flat()));

  const descriptor = {
    id: "efas",
    label: "Copernicus EFAS flood forecast",
    kinds: ["flood"],
    stages: ["forecast"],
    euSpace: "copernicus",
  } as const;

  return {
    descriptor,
    async poll({ bbox, now }) {
      const features = await loadZones();
      const signals: HazardSignal[] = [];
      for (const n of config.notifications.items) {
        const issuedAt = new Date(n.issued);
        if (issuedAt > now) continue;
        const reach = features.filter((f) => f.properties.river === n.river);
        if (reach.length === 0) continue; // no official zone for this river: nothing to place on a map
        const area: Area = toMultiPolygon(reach.map((f) => f.geometry));
        if (!intersectsBBox(area, bbox)) continue;
        const expectedAt = new Date(new Date(n.forecastRun).getTime() + n.leadTimeHours * 3_600_000);
        signals.push({
          id: `efas:${n.id}`,
          sourceId: descriptor.id,
          kind: "flood",
          stage: "forecast",
          area,
          issuedAt,
          expectedAt,
          expiresAt: new Date(expectedAt.getTime() + (config.validForHours ?? 96) * 3_600_000),
          confidence: n.type === "formal" ? "high" : "medium",
          provenance: {
            label: `EFAS ${n.type} flood notification, ${n.river}, lead time ${n.leadTimeHours} h (area: official Q100 zone)`,
            url: config.notifications.url,
            euSpace: "copernicus",
          },
        });
      }
      return signals;
    },
  };
};

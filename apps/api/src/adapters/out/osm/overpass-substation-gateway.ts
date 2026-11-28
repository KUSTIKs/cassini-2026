import { z } from "zod";
import type { SubstationGateway } from "../../../application/ports/out/substation-gateway.js";
import type { BBox } from "../../../domain/geo.js";
import type { Substation } from "../../../domain/substation.js";
import { UpstreamError } from "../../../application/errors.js";
import { fetchJson } from "./http.js";

const Element = z.object({
  type: z.enum(["node", "way", "relation"]),
  id: z.number(),
  lat: z.number().optional(),
  lon: z.number().optional(),
  center: z.object({ lat: z.number(), lon: z.number() }).optional(),
  tags: z.record(z.string(), z.string()).default({}),
});
const Response = z.object({ elements: z.array(Element) });

/** "110000;22000" → [110, 22] */
const parseVoltages = (value: string | undefined): number[] =>
  (value ?? "")
    .split(";")
    .map((v) => Number(v.trim()) / 1000)
    .filter((kv) => Number.isFinite(kv) && kv > 0)
    .sort((a, b) => b - a);

/** Overpass JSON → domain substations. Shared by the live and the snapshot adapter. */
export const parseOverpassSubstations = (body: unknown): Substation[] =>
  Response.parse(body).elements.flatMap((el): Substation[] => {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat === undefined || lng === undefined) return [];
    return [
      {
        osmRef: `${el.type[0]}${el.id}`,
        name: el.tags.name ?? null,
        voltagesKv: parseVoltages(el.tags.voltage),
        operator: el.tags.operator ?? null,
        location: { lng, lat },
      },
    ];
  });

/** DRIVEN ADAPTER: power substations from OpenStreetMap via the Overpass API. */
export class OverpassSubstationGateway implements SubstationGateway {
  /**
   * Public Overpass servers are often overloaded (429/502/504) or stall, so ask every mirror
   * at once: the first good answer wins and the other requests are cancelled.
   */
  constructor(private readonly options: { urls: readonly string[]; timeoutMs?: number }) {}

  private async query(data: string): Promise<unknown> {
    if (this.options.urls.length === 0) throw new UpstreamError("OpenStreetMap substations");
    const losers = new AbortController();
    try {
      return await Promise.any(
        this.options.urls.map((url) =>
          fetchJson("OpenStreetMap substations", url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ data }),
            signal: losers.signal,
          }, this.options.timeoutMs ?? 20_000),
        ),
      );
    } catch (error) {
      throw error instanceof AggregateError ? error.errors[0] : error;
    } finally {
      losers.abort();
    }
  }

  async findInBBox({ south, west, north, east }: BBox) {
    const body = await this.query(
      `[out:json][timeout:25];nwr["power"="substation"](${south},${west},${north},${east});out center tags;`,
    );
    return parseOverpassSubstations(body);
  }
}

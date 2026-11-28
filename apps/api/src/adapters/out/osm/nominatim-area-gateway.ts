import { z } from "zod";
import type { AreaCandidate, AreaGateway } from "../../../application/ports/out/area-gateway.js";
import type { Area } from "../../../domain/geo.js";
import { createThrottle, fetchJson } from "./http.js";

const Position = z.tuple([z.number(), z.number()]);
const Geometry = z.discriminatedUnion("type", [
  z.object({ type: z.literal("Polygon"), coordinates: z.array(z.array(Position)) }),
  z.object({ type: z.literal("MultiPolygon"), coordinates: z.array(z.array(z.array(Position))) }),
]);
const Place = z.object({
  osm_type: z.enum(["node", "way", "relation"]),
  osm_id: z.number(),
  display_name: z.string(),
  addresstype: z.string().optional(),
  type: z.string(),
  geojson: z.unknown(),
});

const toCandidate = (place: z.infer<typeof Place>): AreaCandidate | null => {
  const geometry = Geometry.safeParse(place.geojson);
  if (!geometry.success) return null; // points and lines are not areas
  return {
    ref: `${place.osm_type[0]!.toUpperCase()}${place.osm_id}`,
    label: place.display_name.split(",").slice(0, 3).join(",").trim(),
    kind: place.addresstype ?? place.type,
    geometry: geometry.data as Area,
  };
};

type Options = { baseUrl: string; countryCodes: string };

/** DRIVEN ADAPTER: administrative boundaries from OpenStreetMap Nominatim. */
export class NominatimAreaGateway implements AreaGateway {
  private readonly throttle = createThrottle(1_100);
  private readonly cache = new Map<string, AreaCandidate[]>();

  constructor(private readonly options: Options) {}

  private request(path: string, params: Record<string, string>) {
    const query = new URLSearchParams({
      format: "jsonv2",
      polygon_geojson: "1",
      polygon_threshold: "0.0002", // simplify outlines: smaller payload, same shape at town scale
      ...params,
    });
    return this.throttle(() => fetchJson("OpenStreetMap search", `${this.options.baseUrl}/${path}?${query}`));
  }

  async search(q: string) {
    const key = q.toLowerCase();
    const cached = this.cache.get(key);
    if (cached) return cached;

    const body = await this.request("search", { q, countrycodes: this.options.countryCodes, limit: "8" });
    const candidates = z.array(Place).parse(body).map(toCandidate).filter((c) => c !== null);
    this.cache.set(key, candidates);
    return candidates;
  }

  async getByRef(ref: string) {
    if (!/^[NWR]\d+$/.test(ref)) return null;
    const body = await this.request("lookup", { osm_ids: ref });
    const [place] = z.array(Place).parse(body);
    return place ? toCandidate(place) : null;
  }
}

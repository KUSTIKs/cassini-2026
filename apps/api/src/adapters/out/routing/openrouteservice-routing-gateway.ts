import * as turf from "@turf/turf";
import type { RouteRequest, RouteResult, RoutingGateway } from "../../../application/ports/out/routing-gateway.js";
import type { LineString, LonLat, MultiPolygon } from "../../../domain/geo.js";
import { RouteNotFoundError, RoutingUnavailableError, StartInHazardError } from "../../../domain/task.js";
import { prepareAvoidArea } from "./avoid-area.js";
import { findLastDryPoint } from "./last-dry-point.js";

export type OpenRouteServiceOptions = {
  apiKey: string;
  baseUrl?: string;
  profile?: string;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
};

type Directions = { line: LineString; distanceM: number; durationS: number };

/** ORS error codes that mean "no route", not "service broken" (general knowledge of the ORS API). */
const NO_ROUTE_CODES = new Set([2009, 2010]);

/**
 * DRIVEN ADAPTER (ROUTING=ors): OpenRouteService directions with `avoid_polygons`.
 * - The flood area is unioned, clipped and simplified to stay under ORS's 200 km² / 20 km limits.
 * - If the person is inside the water, we take the normal route (ignoring water), find the last dry
 *   point on it, and route there around the water instead.
 */
export class OpenRouteServiceRoutingGateway implements RoutingGateway {
  private readonly baseUrl: string;
  private readonly profile: string;
  private readonly timeoutMs: number;
  private readonly fetch: typeof globalThis.fetch;

  constructor(private readonly options: OpenRouteServiceOptions) {
    this.baseUrl = (options.baseUrl ?? "https://api.openrouteservice.org").replace(/\/$/, "");
    this.profile = options.profile ?? "driving-car";
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async route({ from, to, avoid }: RouteRequest): Promise<RouteResult> {
    if (!avoid) return this.result(await this.directions(from, to, null), to, null);

    const wet = (p: LonLat) => turf.booleanPointInPolygon(p, avoid);
    if (wet(from)) throw new StartInHazardError("Crew start is inside the flood area");

    let endPoint = to;
    let walkRemainingM: number | null = null;
    if (wet(to)) {
      const approach = await this.directions(from, to, null);
      const dry = findLastDryPoint(approach.line, avoid, to);
      if (!dry) throw new RouteNotFoundError("No dry approach to the destination");
      endPoint = dry.point;
      walkRemainingM = dry.walkRemainingM;
    }

    return this.result(await this.directions(from, endPoint, prepareAvoidArea(avoid, from, endPoint)), endPoint, walkRemainingM);
  }

  private result(d: Directions, endPoint: LonLat, walkRemainingM: number | null): RouteResult {
    return { ...d, endPoint, destinationInHazard: walkRemainingM !== null, walkRemainingM, provider: "openrouteservice" };
  }

  private async directions(from: LonLat, to: LonLat, avoid: MultiPolygon | null): Promise<Directions> {
    let res: Response;
    try {
      res = await this.fetch(`${this.baseUrl}/v2/directions/${this.profile}/geojson`, {
        method: "POST",
        headers: { Authorization: this.options.apiKey, "Content-Type": "application/json", Accept: "application/geo+json" },
        body: JSON.stringify({
          coordinates: [from, to],
          instructions: false,
          ...(avoid ? { options: { avoid_polygons: avoid } } : {}),
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error) {
      throw new RoutingUnavailableError(`OpenRouteService unreachable: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { code?: number; message?: string } } | null;
      const code = body?.error?.code;
      const message = body?.error?.message ?? `HTTP ${res.status}`;
      if (code !== undefined && NO_ROUTE_CODES.has(code)) throw new RouteNotFoundError(`OpenRouteService: ${message}`);
      throw new RoutingUnavailableError(`OpenRouteService ${res.status}${code ? ` (code ${code})` : ""}: ${message}`);
    }

    const json = (await res.json()) as {
      features?: { geometry?: LineString; properties?: { summary?: { distance?: number; duration?: number } } }[];
    };
    const feature = json.features?.[0];
    if (feature?.geometry?.type !== "LineString") throw new RoutingUnavailableError("OpenRouteService returned no route geometry");
    return {
      line: { type: "LineString", coordinates: feature.geometry.coordinates.map(([lon, lat]) => [lon!, lat!]) },
      distanceM: feature.properties?.summary?.distance ?? 0,
      durationS: feature.properties?.summary?.duration ?? 0,
    };
  }
}

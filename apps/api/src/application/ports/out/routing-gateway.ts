import type { LineString, LonLat, MultiPolygon } from "../../../domain/geo.js";

export type RouteRequest = {
  from: LonLat;
  to: LonLat;
  /** Areas the route must not enter (may overlap, may be large; the adapter makes them provider-safe). */
  avoid: MultiPolygon | null;
};

export type RouteResult = {
  line: LineString;
  distanceM: number;
  durationS: number;
  /** `to`, or the last dry point on the approach when `to` lies inside `avoid`. */
  endPoint: LonLat;
  destinationInHazard: boolean;
  walkRemainingM: number | null;
  provider: string;
};

/**
 * DRIVEN PORT: a road router. Implemented by adapters/out/routing (OpenRouteService, fixture).
 * Throws domain errors: RouteNotFoundError, StartInHazardError, RoutingUnavailableError.
 */
export interface RoutingGateway {
  route(request: RouteRequest): Promise<RouteResult>;
}

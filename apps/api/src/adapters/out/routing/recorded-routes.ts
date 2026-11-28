import { createHash } from "node:crypto";
import type { RouteRequest, RouteResult, RoutingGateway } from "../../../application/ports/out/routing-gateway.js";

/** One recorded answer from a real router, replayable offline. */
export type RecordedRoute = { key: string; request: RouteRequest; result: RouteResult };
export type RecordedRoutes = { recordedAt: string; provider: string; routes: RecordedRoute[] };

/** Stable key for a request: coordinates rounded to ~1 m plus a hash of the avoid area. */
export function routeKey({ from, to, avoid }: RouteRequest): string {
  const p = ([lon, lat]: readonly number[]) => `${lon!.toFixed(5)},${lat!.toFixed(5)}`;
  const area = avoid ? createHash("sha1").update(JSON.stringify(avoid.coordinates)).digest("hex").slice(0, 12) : "none";
  return `${p(from)}>${p(to)}|${area}`;
}

/**
 * DRIVEN ADAPTER (ROUTING=recorded): replays routes recorded from OpenRouteService, so the demo
 * shows real roads with no network and no API key. Anything not recorded goes to `fallback`.
 */
export class RecordedRoutingGateway implements RoutingGateway {
  private readonly byKey: Map<string, RouteResult>;

  constructor(
    recorded: RecordedRoutes | null,
    private readonly fallback: RoutingGateway,
  ) {
    this.byKey = new Map((recorded?.routes ?? []).map((r) => [r.key, r.result]));
  }

  get size() {
    return this.byKey.size;
  }

  async route(request: RouteRequest): Promise<RouteResult> {
    const hit = this.byKey.get(routeKey(request));
    return hit ? structuredClone(hit) : this.fallback.route(request);
  }
}

/** Decorator used by scripts/record-routes.ts: passes calls through and keeps every answer. */
export class RecordingRoutingGateway implements RoutingGateway {
  readonly recorded: RecordedRoute[] = [];

  constructor(private readonly inner: RoutingGateway) {}

  async route(request: RouteRequest): Promise<RouteResult> {
    const result = await this.inner.route(request);
    this.recorded.push({ key: routeKey(request), request, result });
    return result;
  }
}

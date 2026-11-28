import { describe, expect, it } from "vitest";
import type { RouteRequest, RouteResult, RoutingGateway } from "../../../application/ports/out/routing-gateway.js";
import { combinedArea } from "../../../domain/route-hazards.js";
import { KRNOV_CREW_START, krnovPersonLocations } from "../memory/krnov-replay.js";
import { krnovReplaySignals } from "../signals/krnov-replay-signals.js";
import { FixtureRoutingGateway } from "./fixture-routing-gateway.js";
import { RecordedRoutingGateway, RecordingRoutingGateway, routeKey } from "./recorded-routes.js";

const [first, second] = await krnovReplaySignals();
const areaOf = (signal: typeof first) => combinedArea({ basis: "forecast", signals: [signal!] })!;
const request: RouteRequest = { from: KRNOV_CREW_START, to: krnovPersonLocations()["P-101"]!, avoid: areaOf(first) };

describe("recorded routes", { timeout: 30_000 }, () => {
  it("records what the real router answered and replays it offline", async () => {
    const recorder = new RecordingRoutingGateway(new FixtureRoutingGateway());
    const live = await recorder.route(request);

    const replay = new RecordedRoutingGateway(
      { recordedAt: "2026-11-28T00:00:00Z", provider: "fixture", routes: recorder.recorded },
      { route: () => Promise.reject(new Error("should not be called")) },
    );
    expect(await replay.route(request)).toEqual(live);
  });

  it("falls back for requests that were never recorded", async () => {
    const fallbackResult = { provider: "fallback" } as RouteResult;
    const fallback: RoutingGateway = { route: async () => fallbackResult };
    expect(await new RecordedRoutingGateway(null, fallback).route(request)).toBe(fallbackResult);
  });

  it("keys on rounded points and on the exact avoid area", () => {
    const nudged = { ...request, from: [request.from[0] + 1e-9, request.from[1]] as [number, number] };
    expect(routeKey(nudged)).toBe(routeKey(request));
    expect(routeKey({ ...request, avoid: areaOf(second) })).not.toBe(routeKey(request));
    expect(routeKey({ ...request, avoid: null })).toMatch(/\|none$/);
  });
});

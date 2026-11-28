import * as turf from "@turf/turf";
import { describe, expect, it } from "vitest";
import type { LonLat, MultiPolygon } from "../../../domain/geo.js";
import { RouteNotFoundError, RoutingUnavailableError, StartInHazardError } from "../../../domain/task.js";
import { krnovSignals, KRNOV_CREW_START } from "../memory/krnov-replay.js";
import { extentKm, ORS_AVOID_LIMITS } from "./avoid-area.js";
import { OpenRouteServiceRoutingGateway } from "./openrouteservice-routing-gateway.js";

type Call = { url: string; headers: Record<string, string>; body: { coordinates: LonLat[]; options?: { avoid_polygons?: MultiPolygon } } };

/** Stub ORS: answers with a straight line between the requested coordinates. */
function stubOrs(respond?: (call: Call) => Response | undefined) {
  const calls: Call[] = [];
  const fetch = (async (url: string, init: RequestInit) => {
    const call: Call = { url, headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) };
    calls.push(call);
    const custom = respond?.(call);
    if (custom) return custom;
    const line = turf.lineString(call.body.coordinates);
    return Response.json({
      type: "FeatureCollection",
      features: [{ type: "Feature", geometry: line.geometry, properties: { summary: { distance: turf.length(line, { units: "meters" }), duration: 99 } } }],
    });
  }) as unknown as typeof globalThis.fetch;
  return { calls, gateway: new OpenRouteServiceRoutingGateway({ apiKey: "test-key", fetch }) };
}

const q100 = krnovSignals()[0]!.area; // real DIBAVOD Q100 zone
const DRY: LonLat = [17.696, 50.096];
const UNDER_WATER: LonLat = [17.676, 50.084];

describe("OpenRouteServiceRoutingGateway", () => {
  it("posts to the directions endpoint with the key and no avoid area when there is none", async () => {
    const { calls, gateway } = stubOrs();
    const res = await gateway.route({ from: KRNOV_CREW_START, to: DRY, avoid: null });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.openrouteservice.org/v2/directions/driving-car/geojson");
    expect(calls[0]!.headers.Authorization).toBe("test-key");
    expect(calls[0]!.body.options).toBeUndefined();
    expect(res).toMatchObject({ provider: "openrouteservice", durationS: 99, destinationInHazard: false, endPoint: DRY });
  });

  it("sends an avoid polygon that respects the 200 km² / 20 km limits, even for a huge flood area", async () => {
    const huge: MultiPolygon = { type: "MultiPolygon", coordinates: [[[[17.3, 49.85], [18.2, 49.85], [18.2, 50.07], [17.3, 50.07], [17.3, 49.85]]]] };
    const { calls, gateway } = stubOrs();
    await gateway.route({ from: KRNOV_CREW_START, to: DRY, avoid: huge });
    const sent = calls[0]!.body.options!.avoid_polygons!;
    expect(turf.area(sent) / 1e6).toBeLessThan(ORS_AVOID_LIMITS.maxAreaKm2);
    const { widthKm, heightKm } = extentKm(sent);
    expect(Math.max(widthKm, heightKm)).toBeLessThan(ORS_AVOID_LIMITS.maxExtentKm);
  });

  it("when the destination is under water, routes to the last dry point on the normal approach", async () => {
    const { calls, gateway } = stubOrs();
    const res = await gateway.route({ from: KRNOV_CREW_START, to: UNDER_WATER, avoid: q100 });

    expect(calls).toHaveLength(2);
    expect(calls[0]!.body.options).toBeUndefined(); // the approach, ignoring water
    const [, target] = calls[1]!.body.coordinates;
    expect(turf.booleanPointInPolygon(target!, q100)).toBe(false);
    expect(calls[1]!.body.options!.avoid_polygons).toBeDefined();
    expect(res).toMatchObject({ destinationInHazard: true, endPoint: target });
    expect(res.walkRemainingM).toBeGreaterThan(0);
  });

  it("refuses a start inside the water without calling the API", async () => {
    const { calls, gateway } = stubOrs();
    await expect(gateway.route({ from: UNDER_WATER, to: DRY, avoid: q100 })).rejects.toBeInstanceOf(StartInHazardError);
    expect(calls).toHaveLength(0);
  });

  it("maps ORS 'route not found' to RouteNotFoundError and rate limits to RoutingUnavailableError", async () => {
    const notFound = stubOrs(() => Response.json({ error: { code: 2009, message: "Route could not be found" } }, { status: 404 }));
    await expect(notFound.gateway.route({ from: KRNOV_CREW_START, to: DRY, avoid: null })).rejects.toBeInstanceOf(RouteNotFoundError);
    const limited = stubOrs(() => new Response("slow down", { status: 429 }));
    await expect(limited.gateway.route({ from: KRNOV_CREW_START, to: DRY, avoid: null })).rejects.toBeInstanceOf(RoutingUnavailableError);
  });
});

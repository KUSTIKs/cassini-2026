import { describe, expect, it } from "vitest";
import { FixtureRoutingGateway } from "../adapters/out/routing/fixture-routing-gateway.js";
import { OpenRouteServiceRoutingGateway } from "../adapters/out/routing/openrouteservice-routing-gateway.js";
import { RecordedRoutingGateway } from "../adapters/out/routing/recorded-routes.js";
import { routingFromEnv } from "./config.js";
import { createRoutingGateway } from "./container.js";

describe("ROUTING env selects the routing adapter", () => {
  it("defaults to the offline fixture", () => {
    expect(createRoutingGateway(routingFromEnv({}))).toBeInstanceOf(FixtureRoutingGateway);
  });

  it("uses OpenRouteService when ROUTING=ors and a key is set", () => {
    expect(createRoutingGateway(routingFromEnv({ ROUTING: "ors", ORS_API_KEY: "k" }))).toBeInstanceOf(OpenRouteServiceRoutingGateway);
  });

  it("replays recorded routes when ROUTING=recorded", () => {
    expect(createRoutingGateway(routingFromEnv({ ROUTING: "recorded" }))).toBeInstanceOf(RecordedRoutingGateway);
  });

  it("fails fast on a missing key or an unknown value", () => {
    expect(() => routingFromEnv({ ROUTING: "ors" })).toThrow(/ORS_API_KEY/);
    expect(() => routingFromEnv({ ROUTING: "osrm" })).toThrow(/fixture.*recorded.*ors/);
  });
});

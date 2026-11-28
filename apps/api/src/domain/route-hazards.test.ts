import { describe, expect, it } from "vitest";
import type { MultiPolygon } from "./geo.js";
import type { HazardSignal } from "./hazard-signal.js";
import { combinedArea, rerouteReason, selectRouteHazards } from "./route-hazards.js";
import type { TaskRoute } from "./task.js";

const square = (x: number, y: number, d = 0.01): MultiPolygon => ({
  type: "MultiPolygon",
  coordinates: [[[[x, y], [x + d, y], [x + d, y + d], [x, y + d], [x, y]]]],
});

const signal = (over: Partial<HazardSignal> & Pick<HazardSignal, "id" | "stage">): HazardSignal => ({
  sourceId: over.id.split(":")[0]!,
  kind: "flood",
  area: square(17.7, 50.08),
  issuedAt: new Date("2024-09-12T00:00:00Z"),
  expectedAt: null,
  expiresAt: null,
  confidence: "medium",
  provenance: { label: `label of ${over.id}`, euSpace: "copernicus" },
  ...over,
});

const forecast = signal({ id: "efas:opava", stage: "forecast" });
const observed = signal({ id: "gfm:s1-0915", stage: "observed", issuedAt: new Date("2024-09-15T06:00:00Z") });

describe("selectRouteHazards", () => {
  it("avoids nothing before any signal is issued", () => {
    expect(selectRouteHazards([forecast, observed], new Date("2024-09-11T00:00:00Z"))).toEqual({ basis: "none", signals: [] });
  });

  it("uses the forecast while nothing is observed", () => {
    const sel = selectRouteHazards([forecast, observed], new Date("2024-09-13T00:00:00Z"));
    expect(sel.basis).toBe("forecast");
    expect(sel.signals.map((s) => s.id)).toEqual(["efas:opava"]);
  });

  it("adds observed water to the forecast zone; it never removes it (satellites can be blind)", () => {
    const sel = selectRouteHazards([forecast, observed], new Date("2024-09-15T12:00:00Z"));
    expect(sel.basis).toBe("observed");
    expect(sel.signals.map((s) => s.id)).toEqual(["efas:opava", "gfm:s1-0915"]);
  });

  it("ignores expired signals and kinds that don't close roads", () => {
    const expired = signal({ id: "gfm:old", stage: "observed", expiresAt: new Date("2024-09-14T00:00:00Z") });
    const outage = signal({ id: "grid:krnov", stage: "observed", kind: "power_outage" });
    const sel = selectRouteHazards([forecast, expired, outage], new Date("2024-09-15T00:00:00Z"));
    expect(sel.basis).toBe("forecast");
  });

  it("never looks at sourceId: same stage, different sources are combined", () => {
    const a = signal({ id: "gfm:a", stage: "observed", area: square(17.7, 50.08) });
    const b = signal({ id: "manual:b", stage: "observed", area: square(17.8, 50.08) });
    const sel = selectRouteHazards([b, a], new Date("2024-09-13T00:00:00Z"));
    expect(sel.signals.map((s) => s.id)).toEqual(["gfm:a", "manual:b"]);
    expect(combinedArea(sel)?.coordinates).toHaveLength(2);
  });
});

describe("rerouteReason", () => {
  const route = (over: Partial<TaskRoute>): TaskRoute => ({
    basis: "forecast",
    avoidedSignalIds: ["efas:opava"],
    from: [17.7, 50.09],
    to: [17.69, 50.08],
    endPoint: [17.69, 50.08],
    destinationInHazard: false,
    walkRemainingM: null,
    line: { type: "LineString", coordinates: [[17.7, 50.09], [17.69, 50.08]] },
    distanceM: 1000,
    durationS: 120,
    provider: "fixture",
    computedAt: new Date("2024-09-13T00:00:00Z"),
    version: 1,
    rerouteReason: null,
    ...over,
  });

  it("is null when the route already avoids exactly the selected signals", () => {
    expect(rerouteReason(route({}), { basis: "forecast", signals: [forecast] })).toBeNull();
  });

  it("names only the newly added area, using the signal's own label", () => {
    const reason = rerouteReason(route({}), { basis: "observed", signals: [forecast, observed] });
    expect(reason).toBe("Now also avoids label of gfm:s1-0915");
  });

  it("explains a replaced area", () => {
    const newer = signal({ id: "efas:opava-v2", stage: "forecast" });
    expect(rerouteReason(route({}), { basis: "forecast", signals: [newer] })).toMatch(/updated/);
  });

  it("explains when nothing is avoided any more", () => {
    expect(rerouteReason(route({}), { basis: "none", signals: [] })).toMatch(/no longer active/);
  });
});

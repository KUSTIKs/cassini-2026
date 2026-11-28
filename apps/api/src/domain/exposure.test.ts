import { describe, expect, it } from "vitest";
import { evaluateExposure, type ExposureInput } from "./exposure.js";
import type { Area } from "./geo.js";
import type { HazardSignal } from "./hazard-signal.js";
import type { Substation } from "./substation.js";

const riverZone: Area = { type: "Polygon", coordinates: [[[17.6, 50.07], [17.7, 50.07], [17.7, 50.09], [17.6, 50.09], [17.6, 50.07]]] };
const now = new Date("2024-09-12T00:00:00Z");

const forecast = (over: Partial<HazardSignal> = {}): HazardSignal => ({
  id: "efas:opava", sourceId: "efas", kind: "flood", stage: "forecast", area: riverZone,
  issuedAt: now, expectedAt: new Date("2024-09-14T00:00:00Z"), expiresAt: null, confidence: "high",
  provenance: { label: "EFAS", euSpace: "copernicus" }, ...over,
});

const inZone: Substation = { osmRef: "w1", name: "Krnov", voltagesKv: [110, 22], operator: null, location: { lng: 17.68, lat: 50.08 } };
const dry: Substation = { osmRef: "w2", name: null, voltagesKv: [22], operator: null, location: { lng: 17.65, lat: 50.12 } };

const person = (id: string, over: Partial<ExposureInput> = {}): ExposureInput => ({
  id, location: { lng: 17.65, lat: 50.11 }, device: "oxygen_concentrator", backupHours: 4, livesAlone: false,
  floor: 1, mobility: "independent", substationRef: "w1", ...over,
});

describe("exposure engine", () => {
  it("lists only people behind substations inside the signal area", () => {
    const result = evaluateExposure({
      signals: [forecast()], substations: [inZone, dry], now,
      people: [person("a"), person("b", { substationRef: "w2" }), person("c", { substationRef: null })],
    });
    expect(result.substations).toEqual([{ osmRef: "w1", hoursUntilOutage: 48, signalIds: ["efas:opava"] }]);
    expect(result.people.map((p) => p.personId)).toEqual(["a"]);
  });

  it("ranks by hours left (time to outage + battery), then lives alone, mobility and floor", () => {
    const result = evaluateExposure({
      signals: [forecast()], substations: [inZone], now,
      people: [
        person("long-battery", { backupHours: 12 }),
        person("upstairs", { backupHours: 2, floor: 3 }),
        person("alone", { backupHours: 2, livesAlone: true, floor: 3 }),
        person("bedridden", { backupHours: 2, floor: 3, mobility: "bedridden" }),
        person("ground", { backupHours: 2, floor: 0 }),
      ],
    });
    expect(result.people.map((p) => [p.personId, p.hoursLeft, p.rank])).toEqual([
      ["alone", 50, 1], ["bedridden", 50, 2], ["ground", 50, 3], ["upstairs", 50, 4], ["long-battery", 60, 5],
    ]);
  });

  it("counts down as time passes, and an observed signal means the outage is now", () => {
    const later = evaluateExposure({ signals: [forecast()], substations: [inZone], people: [person("a")], now: new Date("2024-09-13T12:00:00Z") });
    expect(later.people[0]).toMatchObject({ hoursUntilOutage: 12, hoursLeft: 16 });
    const observed = evaluateExposure({ signals: [forecast({ id: "gfm:x", stage: "observed", expectedAt: null })], substations: [inZone], people: [person("a")], now });
    expect(observed.people[0]).toMatchObject({ hoursUntilOutage: 0, hoursLeft: 4 });
  });

  it("ignores signals not yet issued or already expired, and kinds that don't cut power", () => {
    const run = (s: HazardSignal) => evaluateExposure({ signals: [s], substations: [inZone], people: [person("a")], now }).people;
    expect(run(forecast({ issuedAt: new Date("2024-09-12T06:00:00Z") }))).toEqual([]);
    expect(run(forecast({ expiresAt: now }))).toEqual([]);
    expect(run(forecast({ kind: "fire" }))).toEqual([]);
    expect(run(forecast({ kind: "power_outage" }))).toHaveLength(1);
  });

  it("explains each rank in words, and flags a home inside the flood area", () => {
    const [p] = evaluateExposure({
      signals: [forecast()], substations: [inZone], now,
      people: [person("a", { device: "ventilator", backupHours: 3, livesAlone: true, floor: 0, mobility: "bedridden", location: { lng: 17.65, lat: 50.08 } })],
    }).people;
    expect(p).toMatchObject({ homeInZone: true, reason: "ventilator · ~3 h battery · lives alone · bedridden · ground floor · home in flood zone" });
  });
});

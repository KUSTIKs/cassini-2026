import { describe, expect, it } from "vitest";
import { canViewPersonDetails, officerGrant, type User } from "./access.js";
import { reconcileAlert, type Alert } from "./alert.js";
import type { Exposure, ExposedPerson } from "./exposure.js";

const now = new Date("2024-09-12T00:00:00Z");
const ctx = { municipalityId: "krnov", newId: () => "alert-1", now };
const person = (personId: string, hoursLeft: number): ExposedPerson => ({
  personId, substationRef: "w1", device: "ventilator", backupHours: 3, hoursUntilOutage: hoursLeft - 3, hoursLeft,
  livesAlone: false, mobility: "independent", floor: 0, homeInZone: false, reason: "", rank: 0,
});
const exposure = (...people: ExposedPerson[]): Exposure => ({
  substations: [{ osmRef: "w1", hoursUntilOutage: 48, signalIds: ["efas:opava"] }], people,
});

describe("alerts", () => {
  it("opens only when a substation is exposed", () => {
    expect(reconcileAlert(null, { substations: [], people: [] }, ctx)).toBeNull();
    expect(reconcileAlert(null, exposure(person("a", 51)), ctx)).toMatchObject({ id: "alert-1", status: "active", signalIds: ["efas:opava"] });
  });

  it("keeps people on the list when a later signal no longer covers them, and re-ranks", () => {
    const first = reconcileAlert(null, exposure(person("a", 51), person("b", 60)), ctx)!;
    const later = reconcileAlert(first, { substations: [{ osmRef: "w1", hoursUntilOutage: 0, signalIds: ["gfm:15"] }], people: [person("b", 3)] }, { ...ctx, now: new Date("2024-09-15T05:00:00Z") })!;
    expect(later.people.map((p) => [p.personId, p.rank])).toEqual([["b", 1], ["a", 2]]);
    expect(later.signalIds).toEqual(["efas:opava", "gfm:15"]);
    expect(later.openedAt).toEqual(now);
  });
});

describe("unsealing policy", () => {
  const alert = reconcileAlert(null, exposure(person("a", 51)), ctx)! as Alert;
  const user = (...grants: User["grants"]): User => ({ id: "u", name: "U", email: null, organisation: "", grants });

  it("shows names only to the municipality's officers, for listed people, while the alert is active", () => {
    const officer = user(officerGrant("krnov"));
    expect(canViewPersonDetails(officer, { alert, personId: "a" })).toBe(true);
    expect(canViewPersonDetails(officer, { alert, personId: "not-on-list" })).toBe(false);
    expect(canViewPersonDetails(officer, { alert: { ...alert, status: "closed" }, personId: "a" })).toBe(false);
  });

  it("keeps names sealed for other towns' officers, the regional admin and the grid operator", () => {
    expect(canViewPersonDetails(user(officerGrant("jesenik")), { alert, personId: "a" })).toBe(false);
    expect(canViewPersonDetails(user({ role: "regional_admin", municipalityId: null }), { alert, personId: "a" })).toBe(false);
    expect(canViewPersonDetails(user({ role: "grid_operator", municipalityId: null }), { alert, personId: "a" })).toBe(false);
  });
});

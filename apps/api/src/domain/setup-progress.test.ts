import { describe, expect, it } from "vitest";
import { setupProgress } from "./setup-progress.js";

const statuses = (facts: Parameters<typeof setupProgress>[0]) => setupProgress(facts).map((s) => s.status);

describe("setupProgress", () => {
  it("opens one step at a time", () => {
    expect(statuses({ hasArea: false, substations: 0, registeredPeople: 0 })).toEqual(["done", "ready", "blocked", "blocked"]);
    expect(statuses({ hasArea: true, substations: 0, registeredPeople: 0 })).toEqual(["done", "done", "ready", "blocked"]);
    expect(statuses({ hasArea: true, substations: 3, registeredPeople: 12 })).toEqual(["done", "done", "done", "done"]);
  });
});

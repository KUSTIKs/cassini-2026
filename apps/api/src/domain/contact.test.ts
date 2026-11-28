import { describe, expect, it } from "vitest";
import { currentState, decideContact, MAX_CALL_ATTEMPTS, type ContactRecord } from "./contact.js";
import { DomainValidationError } from "./errors.js";
import { openOrUpdateTask } from "./task.js";

const ctx = (minute: number) => ({ alertId: "a", personId: "p", by: "officer", at: new Date(Date.UTC(2024, 8, 12, 12, minute)) });

describe("contact outcomes", () => {
  it("needs help: requires what to bring, and asks for a task", () => {
    expect(() => decideContact([], { state: "needs_help" }, ctx(0))).toThrow(DomainValidationError);
    const d = decideContact([], { state: "needs_help", bring: ["oxygen", "oxygen", "door_check"] }, ctx(0));
    expect(d.record.bring).toEqual(["oxygen"]);
    expect(d.task).toEqual({ reason: "needs_help", bring: ["oxygen"] });
  });

  it("reached or away: no task, nothing to bring", () => {
    expect(decideContact([], { state: "reached_ok", bring: ["generator"] }, ctx(0))).toMatchObject({ task: null, record: { bring: [] } });
    expect(decideContact([], { state: "away" }, ctx(0)).task).toBeNull();
  });

  it(`escalates to a door check after ${MAX_CALL_ATTEMPTS} unanswered calls`, () => {
    const history: ContactRecord[] = [];
    for (let i = 1; i < MAX_CALL_ATTEMPTS; i++) {
      const d = decideContact(history, { state: "not_reached" }, ctx(i));
      expect(d.task).toBeNull();
      history.push(d.record);
    }
    expect(decideContact(history, { state: "not_reached" }, ctx(9)).task).toEqual({ reason: "door_check", bring: ["door_check"] });
  });

  it("the latest record is the current state", () => {
    const a = decideContact([], { state: "not_reached" }, ctx(1)).record;
    const b = decideContact([a], { state: "reached_ok" }, ctx(2)).record;
    expect(currentState([b, a])).toBe("reached_ok");
    expect(currentState([])).toBe("not_contacted");
  });
});

describe("tasks", () => {
  const base = { id: "t1", alertId: "a", municipalityId: "m", personId: "p", now: new Date("2024-09-12T12:00:00Z") };
  it("opens one task per person and merges later requests into it", () => {
    const first = openOrUpdateTask(null, { reason: "door_check", bring: ["door_check"] }, base);
    const second = openOrUpdateTask(first, { reason: "needs_help", bring: ["generator"] }, { ...base, id: "t2" });
    expect(second).toMatchObject({ id: "t1", reason: "needs_help", bring: ["door_check", "generator"], state: "open" });
    const third = openOrUpdateTask({ ...second, state: "done" }, { reason: "needs_help", bring: ["oxygen"] }, { ...base, id: "t3" });
    expect(third).toMatchObject({ id: "t3", bring: ["oxygen"] });
  });
});

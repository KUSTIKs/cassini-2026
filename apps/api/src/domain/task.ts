import type { Bring } from "./contact.js";

/**
 * A job for the fire service, created from the mayor's list (Flow 3) and driven to by a crew (Flow 4).
 * One open task per person per alert: a second "needs help" updates what to bring.
 */
export type Task = {
  readonly id: string;
  readonly alertId: string;
  readonly municipalityId: string;
  readonly personId: string;
  readonly reason: "needs_help" | "door_check";
  readonly bring: readonly Bring[];
  readonly state: "open" | "en_route" | "done";
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export const openOrUpdateTask = (
  existing: Task | null,
  wanted: { reason: Task["reason"]; bring: readonly Bring[] },
  ctx: { id: string; alertId: string; municipalityId: string; personId: string; now: Date },
): Task => {
  if (existing && existing.state !== "done") {
    const bring = [...new Set([...existing.bring, ...wanted.bring])];
    // "needs help" says more than "door check", so it wins once either has been asked for.
    const reason = existing.reason === "needs_help" || wanted.reason === "needs_help" ? "needs_help" : "door_check";
    return { ...existing, bring, reason, updatedAt: ctx.now };
  }
  return {
    id: ctx.id, alertId: ctx.alertId, municipalityId: ctx.municipalityId, personId: ctx.personId,
    reason: wanted.reason, bring: [...wanted.bring], state: "open", createdAt: ctx.now, updatedAt: ctx.now,
  };
};

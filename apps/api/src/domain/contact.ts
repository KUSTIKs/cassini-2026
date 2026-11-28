import { DomainValidationError } from "./errors.js";

/**
 * Flow 3: the mayor's office calls each person on the alert and records the outcome.
 * The log of outcomes is the evidence that the Water Act §78 duty was met (PROJECT.md §3.1).
 */
export const CONTACT_STATES = ["not_contacted", "reached_ok", "away", "needs_help", "not_reached"] as const;
export type ContactState = (typeof CONTACT_STATES)[number];

/** What the fire service should bring; `door_check` is added by escalation, not chosen. */
export const BRING = ["generator", "oxygen", "transport", "door_check"] as const;
export type Bring = (typeof BRING)[number];

/** After this many unanswered calls, a crew goes to the door. */
export const MAX_CALL_ATTEMPTS = 3;

export type ContactRecord = {
  readonly alertId: string;
  readonly personId: string;
  readonly state: Exclude<ContactState, "not_contacted">;
  readonly bring: readonly Bring[];
  readonly note: string | null;
  readonly by: string;
  readonly at: Date;
};

export type ContactInput = {
  state: Exclude<ContactState, "not_contacted">;
  bring?: readonly Bring[];
  note?: string | null;
};

/** The outcome and, when the fire service has to act, what the task needs. */
export type ContactDecision = {
  record: ContactRecord;
  task: { reason: "needs_help" | "door_check"; bring: Bring[] } | null;
};

export const decideContact = (
  history: readonly ContactRecord[],
  input: ContactInput,
  ctx: { alertId: string; personId: string; by: string; at: Date },
): ContactDecision => {
  const bring = [...new Set(input.bring ?? [])].filter((b) => b !== "door_check");
  if (input.state === "needs_help" && bring.length === 0)
    throw new DomainValidationError("Choose what the fire service should bring.", { bring: "Choose at least one." });
  const note = input.note?.trim() || null;
  if (note && note.length > 500) throw new DomainValidationError("Keep the note under 500 characters.", { note: "Too long." });

  const record: ContactRecord = { ...ctx, state: input.state, bring: input.state === "needs_help" ? bring : [], note };

  if (input.state === "needs_help") return { record, task: { reason: "needs_help", bring } };
  if (input.state === "not_reached") {
    const attempts = history.filter((r) => r.state === "not_reached").length + 1;
    if (attempts >= MAX_CALL_ATTEMPTS) return { record, task: { reason: "door_check", bring: ["door_check"] } };
  }
  return { record, task: null };
};

/** Latest record per person, or not_contacted. */
export const currentState = (history: readonly ContactRecord[]): ContactState =>
  history.reduce<ContactRecord | null>((latest, r) => (!latest || r.at >= latest.at ? r : latest), null)?.state ?? "not_contacted";

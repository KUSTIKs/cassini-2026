import { currentState, type ContactRecord } from "../domain/contact.js";
import type { Task } from "../domain/task.js";
import type { AlertCounters, ContactSummary } from "./ports/in/alerts.js";

/** Shared by the alert use cases: turn a person's call history into what the list shows. */
export const summarizeContact = (history: readonly ContactRecord[]): ContactSummary => {
  const latest = [...history].sort((a, b) => b.at.getTime() - a.at.getTime())[0];
  return {
    state: currentState(history),
    at: latest?.at ?? null,
    bring: latest?.bring ?? [],
    attempts: history.filter((r) => r.state === "not_reached").length,
  };
};

export const groupByPerson = <T extends { personId: string }>(items: readonly T[]) => {
  const map = new Map<string, T[]>();
  for (const item of items) map.set(item.personId, [...(map.get(item.personId) ?? []), item]);
  return map;
};

export const openTaskByPerson = (tasks: readonly Task[]) =>
  new Map(tasks.filter((t) => t.state !== "done").map((t) => [t.personId, t]));

export const countStates = (summaries: readonly ContactSummary[]): AlertCounters => {
  const counters: AlertCounters = { total: summaries.length, not_contacted: 0, reached_ok: 0, away: 0, needs_help: 0, not_reached: 0 };
  for (const s of summaries) counters[s.state] += 1;
  return counters;
};

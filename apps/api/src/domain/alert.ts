import type { Exposure, ExposedPerson, ExposedSubstation } from "./exposure.js";

/**
 * An alert opens when a hazard reaches a municipality's substations, and lists the people who will
 * lose power. Opening it is what unseals their names, for the municipality's officers only
 * (see domain/access.ts, canViewPersonDetails).
 */
export type Alert = {
  readonly id: string;
  readonly municipalityId: string;
  readonly status: "active" | "closed";
  readonly openedAt: Date;
  readonly updatedAt: Date;
  readonly signalIds: readonly string[];
  readonly substations: readonly ExposedSubstation[];
  readonly people: readonly ExposedPerson[];
};

const rerank = (people: ExposedPerson[]) =>
  [...people]
    .sort((a, b) => a.hoursLeft - b.hoursLeft || a.rank - b.rank)
    .map((p, i) => ({ ...p, rank: i + 1 }));

/**
 * Applies a new exposure to the municipality's active alert.
 * Nothing exposed and no alert: nothing to do (null). Otherwise open one, or update it. Once on the
 * list, a person stays on it until the alert closes: a later, smaller signal doesn't drop them.
 */
export const reconcileAlert = (
  current: Alert | null,
  exposure: Exposure,
  ctx: { municipalityId: string; newId: () => string; now: Date },
): Alert | null => {
  if (!current && exposure.substations.length === 0) return null;
  if (!current)
    return {
      id: ctx.newId(),
      municipalityId: ctx.municipalityId,
      status: "active",
      openedAt: ctx.now,
      updatedAt: ctx.now,
      signalIds: [...new Set(exposure.substations.flatMap((s) => s.signalIds))],
      substations: exposure.substations,
      people: exposure.people,
    };

  const people = new Map(current.people.map((p) => [p.personId, p]));
  for (const p of exposure.people) people.set(p.personId, p);
  const substations = new Map(current.substations.map((s) => [s.osmRef, s]));
  for (const s of exposure.substations) substations.set(s.osmRef, s);

  return {
    ...current,
    updatedAt: ctx.now,
    signalIds: [...new Set([...current.signalIds, ...exposure.substations.flatMap((s) => s.signalIds)])],
    substations: [...substations.values()],
    people: rerank([...people.values()]),
  };
};

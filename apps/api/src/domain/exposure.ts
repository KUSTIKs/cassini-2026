import { areaContains, type LngLat } from "./geo.js";
import { activeAt, type HazardSignal } from "./hazard-signal.js";
import type { Device, Mobility } from "./registered-person.js";
import type { Substation } from "./substation.js";

/**
 * The exposure engine: signal areas ∩ substations → the people they feed → a ranked list.
 * Pure and explainable (TECH.md, "Priority rule"). Works for any signal source.
 */

/** What ranking needs about a person. No names: the engine runs before anything is unsealed. */
export type ExposureInput = {
  readonly id: string;
  readonly location: LngLat;
  readonly device: Device;
  readonly backupHours: number;
  readonly livesAlone: boolean;
  readonly floor: number;
  readonly mobility: Mobility;
  readonly substationRef: string | null;
};

export type ExposedSubstation = {
  readonly osmRef: string;
  /** Hours from now until the hazard reaches it; 0 when it is already happening. */
  readonly hoursUntilOutage: number;
  readonly signalIds: readonly string[];
};

export type ExposedPerson = {
  readonly personId: string;
  readonly substationRef: string;
  readonly device: Device;
  readonly backupHours: number;
  readonly hoursUntilOutage: number;
  /** hoursUntilOutage + backupHours: how long until their device stops. Ranked on this first. */
  readonly hoursLeft: number;
  readonly livesAlone: boolean;
  readonly mobility: Mobility;
  readonly floor: number;
  /** Their home itself is inside a hazard area (evacuation, not only power). */
  readonly homeInZone: boolean;
  /** e.g. "ventilator · ~3 h battery · lives alone · ground floor" */
  readonly reason: string;
  readonly rank: number;
};

export type Exposure = { readonly substations: ExposedSubstation[]; readonly people: ExposedPerson[] };

/** Kinds that take a substation's power away. */
const CUTS_POWER = new Set<HazardSignal["kind"]>(["flood", "power_outage"]);
const MOBILITY_ORDER: Record<Mobility, number> = { bedridden: 0, limited: 1, independent: 2 };
const DEVICE_LABEL: Record<Device, string> = {
  ventilator: "ventilator",
  oxygen_concentrator: "oxygen concentrator",
  other: "powered medical device",
};

const hoursBetween = (from: Date, to: Date) => Math.max(0, (to.getTime() - from.getTime()) / 3_600_000);
const round1 = (n: number) => Math.round(n * 10) / 10;

const reasonFor = (p: ExposureInput, homeInZone: boolean) =>
  [
    DEVICE_LABEL[p.device],
    `~${round1(p.backupHours)} h battery`,
    p.livesAlone && "lives alone",
    p.mobility !== "independent" && p.mobility,
    p.floor === 0 ? "ground floor" : `floor ${p.floor}`,
    homeInZone && "home in flood zone",
  ]
    .filter(Boolean)
    .join(" · ");

export const evaluateExposure = (input: {
  signals: readonly HazardSignal[];
  substations: readonly Substation[];
  people: readonly ExposureInput[];
  now: Date;
}): Exposure => {
  const signals = activeAt(input.signals, input.now).filter((s) => CUTS_POWER.has(s.kind));

  const substations: ExposedSubstation[] = input.substations.flatMap((substation) => {
    const covering = signals.filter((s) => areaContains(s.area, substation.location));
    if (covering.length === 0) return [];
    const hoursUntilOutage = Math.min(
      ...covering.map((s) => (s.stage === "observed" || s.expectedAt === null ? 0 : hoursBetween(input.now, s.expectedAt))),
    );
    return [{ osmRef: substation.osmRef, hoursUntilOutage: round1(hoursUntilOutage), signalIds: covering.map((s) => s.id) }];
  });
  const bySubstation = new Map(substations.map((s) => [s.osmRef, s]));

  const people = input.people
    .flatMap((p) => {
      const substation = p.substationRef ? bySubstation.get(p.substationRef) : undefined;
      if (!substation) return [];
      const homeInZone = signals.some((s) => s.kind === "flood" && areaContains(s.area, p.location));
      return [{
        personId: p.id,
        substationRef: substation.osmRef,
        device: p.device,
        backupHours: p.backupHours,
        hoursUntilOutage: substation.hoursUntilOutage,
        hoursLeft: round1(substation.hoursUntilOutage + p.backupHours),
        livesAlone: p.livesAlone,
        mobility: p.mobility,
        floor: p.floor,
        homeInZone,
        reason: reasonFor(p, homeInZone),
      }];
    })
    .sort(
      (a, b) =>
        a.hoursLeft - b.hoursLeft ||
        Number(b.livesAlone) - Number(a.livesAlone) ||
        MOBILITY_ORDER[a.mobility] - MOBILITY_ORDER[b.mobility] ||
        a.floor - b.floor ||
        a.personId.localeCompare(b.personId),
    )
    .map((p, i) => ({ ...p, rank: i + 1 }));

  return { substations, people };
};

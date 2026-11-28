import type { User } from "../../../domain/access.js";
import type { Alert } from "../../../domain/alert.js";
import type { Bring, ContactRecord, ContactState } from "../../../domain/contact.js";
import type { ExposedPerson, ExposedSubstation } from "../../../domain/exposure.js";
import type { Substation } from "../../../domain/substation.js";
import type { HazardSignal } from "../../../domain/hazard-signal.js";
import type { RegisteredPerson } from "../../../domain/registered-person.js";
import type { Task } from "../../../domain/task.js";

/** Inbound ports for Flow 2 (early warning) and the read side of Flow 3. */

export type SignalRunReport = {
  at: Date;
  sources: Array<{ sourceId: string; signals: number; error: string | null }>;
  alerts: Array<{ municipalityId: string; alertId: string; people: number; substations: number; opened: boolean }>;
};
export interface RunSignals {
  /** Polls every enabled source as of `at`, stores the signals and opens or updates alerts. */
  execute(actor: User, input: { at: Date }): Promise<SignalRunReport>;
}

export interface ListAlerts {
  execute(actor: User, municipalityId: string): Promise<Alert[]>;
}

/** Contact details appear only where the unsealing policy allows; otherwise `details` is null. */
export type PersonDetails = Pick<
  RegisteredPerson,
  "fullName" | "address" | "phone" | "carerName" | "carerPhone" | "location" | "externalRef"
>;
export type ContactSummary = { state: ContactState; at: Date | null; bring: readonly Bring[]; attempts: number };
export type AlertPersonView = ExposedPerson & { details: PersonDetails | null; contact: ContactSummary; task: Task | null };
export type AlertCounters = Record<ContactState, number> & { total: number };

export type AlertView = {
  alert: Alert;
  municipalityName: string;
  signals: HazardSignal[];
  /** Exposed substations with their name and location, for the map. */
  substations: Array<ExposedSubstation & Pick<Substation, "name" | "location">>;
  people: AlertPersonView[];
  counters: AlertCounters;
  /** True when the actor sees no names at all. */
  sealed: boolean;
};
export interface GetAlert {
  execute(actor: User, alertId: string): Promise<AlertView>;
}

/** One person, opened from the list. Allowed only where the unsealing policy allows; every call is logged. */
export type AlertPersonDetail = AlertPersonView & { details: PersonDetails; history: ContactRecord[] };
export interface GetAlertPerson {
  execute(actor: User, input: { alertId: string; personId: string }): Promise<AlertPersonDetail>;
}

export interface SetContactStatus {
  execute(
    actor: User,
    input: { alertId: string; personId: string; state: ContactRecord["state"]; bring?: Bring[]; note?: string | null },
  ): Promise<{ contact: ContactSummary; task: Task | null }>;
}


import type { User } from "../../../domain/access.js";
import type { Alert } from "../../../domain/alert.js";
import type { ExposedPerson } from "../../../domain/exposure.js";
import type { HazardSignal } from "../../../domain/hazard-signal.js";
import type { RegisteredPerson } from "../../../domain/registered-person.js";

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
export type AlertView = {
  alert: Alert;
  municipalityName: string;
  signals: HazardSignal[];
  people: Array<ExposedPerson & { details: PersonDetails | null }>;
  /** True when the actor sees no names at all. */
  sealed: boolean;
};
export interface GetAlert {
  execute(actor: User, alertId: string): Promise<AlertView>;
}

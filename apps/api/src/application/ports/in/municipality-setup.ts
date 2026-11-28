import type { User } from "../../../domain/access.js";
import type { RawRegisterRow, RowProblem } from "../../../domain/register-row.js";
import type { Municipality, NewMunicipalityInput } from "../../../domain/municipality.js";
import type { SetupStep } from "../../../domain/setup-progress.js";
import type { Substation } from "../../../domain/substation.js";
import type { AreaCandidate } from "../out/area-gateway.js";
import type { RegisterStats } from "../out/register-repository.js";

/** Inbound ports for Flow 1 (setup). One interface per use case; each takes the signed-in user first. */

export interface CreateMunicipality {
  execute(actor: User, input: NewMunicipalityInput): Promise<{ id: string }>;
}

export type MunicipalityOverview = {
  municipality: Municipality;
  stepsDone: number;
  stepsTotal: number;
  registeredPeople: number;
};
export interface ListMunicipalities {
  /** Only the municipalities the actor may see. */
  execute(actor: User): Promise<MunicipalityOverview[]>;
}

export type MunicipalitySetupView = {
  municipality: Municipality;
  steps: SetupStep[];
  substations: Array<Substation & { dependentPeople: number }>;
  register: Omit<RegisterStats, "bySubstation">;
  /** What the actor may change here, so the UI shows only what will work. */
  permissions: { setup: boolean; uploadRegister: boolean };
};
export interface GetMunicipalitySetup {
  execute(actor: User, id: string): Promise<MunicipalitySetupView>;
}

export interface SearchAreas {
  execute(actor: User, query: string): Promise<AreaCandidate[]>;
}

export interface SetMunicipalityArea {
  execute(actor: User, input: { municipalityId: string; ref: string }): Promise<void>;
}

export interface ImportSubstations {
  execute(actor: User, municipalityId: string): Promise<{ found: number; linkedPeople: number }>;
}

export interface ImportRegister {
  execute(actor: User, input: { municipalityId: string; rows: RawRegisterRow[] }): Promise<{ imported: number; rejected: RowProblem[] }>;
}

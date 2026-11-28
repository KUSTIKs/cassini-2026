import type { Device, RegisteredPerson } from "../../../domain/registered-person.js";
import type { PersonLocation, SubstationLink } from "../../../domain/substation-assignment.js";

/** Aggregates only: setup never needs names. */
export type RegisterStats = {
  total: number;
  byDevice: Record<Device, number>;
  bySubstation: Record<string, number>;
  unlinked: number;
  importedAt: Date | null;
};

export interface RegisterRepository {
  /** Replaces the municipality's register (an export from the grid operator is a full snapshot). */
  replaceForMunicipality(municipalityId: string, people: readonly RegisteredPerson[], importedAt: Date): Promise<void>;
  listLocations(municipalityId: string): Promise<PersonLocation[]>;
  setSubstationLinks(municipalityId: string, links: readonly SubstationLink[]): Promise<void>;
  stats(municipalityId: string): Promise<RegisterStats>;
  countByMunicipality(): Promise<Record<string, number>>;
}

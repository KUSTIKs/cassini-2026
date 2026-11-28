import type { Substation } from "../../../domain/substation.js";

export interface SubstationRepository {
  /** Replaces every substation of the municipality (an import is a full snapshot). */
  replaceForMunicipality(municipalityId: string, substations: readonly Substation[]): Promise<void>;
  listByMunicipality(municipalityId: string): Promise<Substation[]>;
  countByMunicipality(): Promise<Record<string, number>>;
}

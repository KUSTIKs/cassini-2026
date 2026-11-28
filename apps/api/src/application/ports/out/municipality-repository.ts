import type { Municipality, MunicipalityArea } from "../../../domain/municipality.js";

export interface MunicipalityRepository {
  create(municipality: Municipality): Promise<void>;
  list(): Promise<Municipality[]>;
  get(id: string): Promise<Municipality | null>;
  setArea(id: string, area: MunicipalityArea): Promise<void>;
}

import type { Area } from "../../../domain/geo.js";

export type AreaCandidate = { ref: string; label: string; kind: string; geometry: Area };

/** Looks up administrative boundaries (implemented with OSM Nominatim). */
export interface AreaGateway {
  search(query: string): Promise<AreaCandidate[]>;
  getByRef(ref: string): Promise<AreaCandidate | null>;
}

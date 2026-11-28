import type { LonLat } from "../../../domain/geo.js";

/** Narrow read port: routing needs only where a person is, never their identity or health data. */
export interface PersonLocationRepository {
  findLocation(personId: string): Promise<LonLat | null>;
}

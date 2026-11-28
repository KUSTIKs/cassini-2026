import { distanceMeters, type LngLat } from "./geo.js";
import type { Substation } from "./substation.js";

/**
 * Links a supply point to the substation that feeds it.
 * DEMO SIMPLIFICATION: nearest substation. In reality the grid operator knows the exact link.
 */
export const nearestSubstation = (point: LngLat, substations: readonly Substation[]): Substation | null => {
  let best: Substation | null = null;
  let bestDistance = Infinity;
  for (const substation of substations) {
    const d = distanceMeters(point, substation.location);
    if (d < bestDistance) { best = substation; bestDistance = d; }
  }
  return best;
};

export type PersonLocation = { readonly id: string; readonly location: LngLat };
export type SubstationLink = { readonly personId: string; readonly substationRef: string | null };

export const assignSubstations = (
  people: readonly PersonLocation[],
  substations: readonly Substation[],
): SubstationLink[] =>
  people.map(({ id, location }) => ({
    personId: id,
    substationRef: nearestSubstation(location, substations)?.osmRef ?? null,
  }));

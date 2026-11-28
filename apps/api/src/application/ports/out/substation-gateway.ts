import type { BBox } from "../../../domain/geo.js";
import type { Substation } from "../../../domain/substation.js";

/** Finds power substations (implemented with OSM Overpass). */
export interface SubstationGateway {
  findInBBox(bbox: BBox): Promise<Substation[]>;
}

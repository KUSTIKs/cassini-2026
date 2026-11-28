import type { SubstationGateway } from "../../../application/ports/out/substation-gateway.js";
import type { BBox } from "../../../domain/geo.js";

/** Tries the primary source; if it fails, answers from the fallback (e.g. live OSM → saved snapshot). */
export class FallbackSubstationGateway implements SubstationGateway {
  constructor(
    private readonly primary: SubstationGateway,
    private readonly fallback: SubstationGateway,
    private readonly onFallback: (error: unknown) => void = () => {},
  ) {}

  async findInBBox(bbox: BBox) {
    try {
      return await this.primary.findInBBox(bbox);
    } catch (error) {
      this.onFallback(error);
      return this.fallback.findInBBox(bbox);
    }
  }
}

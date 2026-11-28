import { selectRouteHazards } from "../../domain/route-hazards.js";
import type { GetRouteHazards } from "../ports/in/get-route-hazards.js";
import type { HazardSignalRepository } from "../ports/out/hazard-signal-repository.js";

export class GetRouteHazardsUseCase implements GetRouteHazards {
  constructor(private readonly signals: HazardSignalRepository) {}

  async execute({ now }: { now: Date }) {
    return selectRouteHazards(await this.signals.findAll(), now);
  }
}

import { selectRouteHazards } from "../../domain/route-hazards.js";
import type { GetRouteHazards } from "../ports/in/get-route-hazards.js";
import type { SignalRepository } from "../ports/out/signal-repository.js";

export class GetRouteHazardsUseCase implements GetRouteHazards {
  constructor(private readonly signals: SignalRepository) {}

  async execute({ now }: { now: Date }) {
    return selectRouteHazards(await this.signals.list(), now);
  }
}

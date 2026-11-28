import type { RouteHazardSelection } from "../../../domain/route-hazards.js";

/** What routes avoid at `now`, so the crew map can draw it. */
export interface GetRouteHazards {
  execute(input: { now: Date }): Promise<RouteHazardSelection>;
}

import { rerouteReason, selectRouteHazards } from "../../domain/route-hazards.js";
import type { PlanTaskRoute } from "../ports/in/plan-task-route.js";
import type { RerouteOpenTasks, RerouteOpenTasksResult } from "../ports/in/reroute-open-tasks.js";
import type { HazardSignalRepository } from "../ports/out/hazard-signal-repository.js";
import type { TaskRepository } from "../ports/out/task-repository.js";

/**
 * Flow 5 step 3: re-route every open task whose route no longer matches the hazard picture
 * (typically: observed Sentinel-1 water replaces the forecast zone). Tasks never routed are left
 * for the crew to route; one failing task never stops the rest.
 */
export class RerouteOpenTasksUseCase implements RerouteOpenTasks {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly signals: HazardSignalRepository,
    private readonly planTaskRoute: PlanTaskRoute,
  ) {}

  async execute({ now }: { now: Date }): Promise<RerouteOpenTasksResult> {
    const selection = selectRouteHazards(await this.signals.findAll(), now);
    const result: RerouteOpenTasksResult = { basis: selection.basis, rerouted: [], unchanged: [], failed: [] };

    for (const task of await this.tasks.findOpen()) {
      const before = task.route;
      if (!before) continue;
      const reason = rerouteReason(before, selection);
      if (!reason) {
        result.unchanged.push(task.id);
        continue;
      }
      try {
        // Keep the crew's original start: in replay that's the fixed station, live it's the last phone fix.
        const after = (await this.planTaskRoute.execute({ taskId: task.id, now, from: before.from, reason })).route!;
        result.rerouted.push({
          taskId: task.id,
          previousBasis: before.basis,
          reason,
          distanceDeltaM: after.distanceM - before.distanceM,
          destinationInHazard: after.destinationInHazard,
        });
      } catch (error) {
        result.failed.push({ taskId: task.id, error: error instanceof Error ? error.message : String(error) });
      }
    }
    return result;
  }
}

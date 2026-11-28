import type { LonLat } from "../../domain/geo.js";
import { combinedArea, selectRouteHazards } from "../../domain/route-hazards.js";
import { isOpen, PersonLocationMissingError, TaskClosedError, TaskNotFoundError, type Task } from "../../domain/task.js";
import type { PlanTaskRoute, PlanTaskRouteInput } from "../ports/in/plan-task-route.js";
import type { HazardSignalRepository } from "../ports/out/hazard-signal-repository.js";
import type { PersonLocationRepository } from "../ports/out/person-location-repository.js";
import type { RoutingGateway } from "../ports/out/routing-gateway.js";
import type { TaskRepository } from "../ports/out/task-repository.js";

/**
 * Flow 4: route a crew to a task's person around the best-known flood area
 * (observed water if any, else the forecast zone), and store the route on the task.
 */
export class PlanTaskRouteUseCase implements PlanTaskRoute {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly people: PersonLocationRepository,
    private readonly signals: HazardSignalRepository,
    private readonly routing: RoutingGateway,
    /** Used when the caller has no phone position (replay: the fixed Krnov crew start). */
    private readonly defaultStart: LonLat,
  ) {}

  async execute({ taskId, now, from, reason }: PlanTaskRouteInput): Promise<Task> {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new TaskNotFoundError(taskId);
    if (!isOpen(task)) throw new TaskClosedError(taskId);

    const to = await this.people.findLocation(task.personId);
    if (!to) throw new PersonLocationMissingError(task.personId);

    const selection = selectRouteHazards(await this.signals.findAll(), now);
    const start = from ?? this.defaultStart;
    const result = await this.routing.route({ from: start, to, avoid: combinedArea(selection) });

    const routed: Task = {
      ...task,
      route: {
        ...result,
        basis: selection.basis,
        avoidedSignalIds: selection.signals.map((s) => s.id),
        from: start,
        to,
        computedAt: now,
        version: (task.route?.version ?? 0) + 1,
        rerouteReason: reason ?? null,
      },
    };
    await this.tasks.save(routed);
    return routed;
  }
}

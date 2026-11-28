import {
  type ApiError,
  OpenTasksResponse,
  PlanTaskRouteRequest,
  RerouteOpenTasksRequest,
  RerouteOpenTasksResponse,
  RouteHazardsResponse,
  TaskResponse,
} from "@firstreach/contracts";
import { type Context, Hono } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { GetRouteHazards } from "../../../../application/ports/in/get-route-hazards.js";
import type { ListOpenTasks } from "../../../../application/ports/in/list-open-tasks.js";
import type { PlanTaskRoute } from "../../../../application/ports/in/plan-task-route.js";
import type { RerouteOpenTasks } from "../../../../application/ports/in/reroute-open-tasks.js";
import type { RouteHazardSelection } from "../../../../domain/route-hazards.js";
import type { Task } from "../../../../domain/task.js";
import type { AppEnv } from "../auth.js";
import { BadRequestError, handleError } from "../errors.js";
import { parseWith } from "../validate.js";

export type CrewRoutingDeps = {
  planTaskRoute: PlanTaskRoute;
  rerouteOpenTasks: RerouteOpenTasks;
  listOpenTasks: ListOpenTasks;
  getRouteHazards: GetRouteHazards;
};

/** DRIVING ADAPTER for Flow 4 (crew routes) and the reroute in Flow 5. Maps domain ↔ wire DTOs. */
export const taskRoutes = (deps: CrewRoutingDeps) =>
  new Hono<AppEnv>()
    .onError(handleRoutingError)
    .get("/tasks/open", async (c) => {
      const crewId = c.req.query("crewId");
      const views = await deps.listOpenTasks.execute(crewId ? { crewId } : {});
      return c.json(OpenTasksResponse.parse({ tasks: views.map((v) => ({ task: toTaskDto(v.task), destination: v.destination })) }));
    })
    .post("/tasks/reroute", async (c) => {
      const { now } = parseWith(RerouteOpenTasksRequest, await readJson(c));
      return c.json(RerouteOpenTasksResponse.parse(await deps.rerouteOpenTasks.execute({ now: new Date(now) })));
    })
    .post("/tasks/:id/route", async (c) => {
      const body = parseWith(PlanTaskRouteRequest, await readJson(c));
      const task = await deps.planTaskRoute.execute({
        taskId: c.req.param("id"),
        now: new Date(body.now),
        ...(body.from ? { from: body.from } : {}),
      });
      return c.json(TaskResponse.parse(toTaskDto(task)));
    })
    .get("/route-hazards", async (c) => {
      const { now } = parseWith(RerouteOpenTasksRequest, { now: c.req.query("now") });
      return c.json(RouteHazardsResponse.parse(toHazardsDto(await deps.getRouteHazards.execute({ now: new Date(now) }))));
    });

const toTaskDto = (task: Task): TaskResponse => ({
  ...task,
  route: task.route && { ...task.route, computedAt: task.route.computedAt.toISOString() },
});

const toHazardsDto = (selection: RouteHazardSelection): RouteHazardsResponse => ({
  basis: selection.basis,
  signals: selection.signals.map((s) => ({
    id: s.id,
    kind: s.kind,
    stage: s.stage,
    area: s.area,
    issuedAt: s.issuedAt.toISOString(),
    expectedAt: s.expectedAt?.toISOString() ?? null,
    confidence: s.confidence,
    label: s.provenance.label,
    euSpace: s.provenance.euSpace,
  })),
});

const readJson = async (c: Context): Promise<unknown> => {
  try {
    return await c.req.json();
  } catch {
    throw new BadRequestError("The request body must be JSON.");
  }
};

/**
 * Routing's domain errors in the shared ApiError shape (matched by name, so this adapter never imports
 * use cases). Anything else goes to the app-wide handler.
 */
const ROUTING_ERRORS: Record<string, [ContentfulStatusCode, ApiError["error"]["code"]]> = {
  TaskNotFoundError: [404, "not_found"],
  TaskClosedError: [409, "validation_failed"],
  PersonLocationMissingError: [422, "validation_failed"],
  StartInHazardError: [422, "validation_failed"],
  RouteNotFoundError: [422, "validation_failed"],
  RoutingUnavailableError: [502, "upstream_failed"],
};

const handleRoutingError = (error: Error, c: Context) => {
  const known = ROUTING_ERRORS[error.name];
  if (!known) return handleError(error, c);
  const [status, code] = known;
  if (status === 502) console.error(error);
  return c.json({ error: { code, message: error.message } } satisfies ApiError, status);
};

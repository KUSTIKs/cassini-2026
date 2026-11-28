import {
  type ErrorResponse,
  OpenTasksResponse,
  PlanTaskRouteRequest,
  RerouteOpenTasksRequest,
  RerouteOpenTasksResponse,
  RouteHazardsResponse,
  TaskResponse,
} from "@lifeline/contracts";
import { Hono, type Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { z } from "zod";
import type { GetRouteHazards } from "../../../application/ports/in/get-route-hazards.js";
import type { ListOpenTasks } from "../../../application/ports/in/list-open-tasks.js";
import type { PlanTaskRoute } from "../../../application/ports/in/plan-task-route.js";
import type { RerouteOpenTasks } from "../../../application/ports/in/reroute-open-tasks.js";
import type { RouteHazardSelection } from "../../../domain/route-hazards.js";
import type { Task } from "../../../domain/task.js";

export type CrewRoutingDeps = {
  planTaskRoute: PlanTaskRoute;
  rerouteOpenTasks: RerouteOpenTasks;
  listOpenTasks: ListOpenTasks;
  getRouteHazards: GetRouteHazards;
};

/** DRIVING ADAPTER for Flow 4 (crew routes) and the reroute in Flow 5. Maps domain ↔ wire DTOs. */
export function createTaskRoutes(deps: CrewRoutingDeps) {
  return new Hono()
    .onError((error, c) => mapError(c, error))
    .get("/tasks/open", async (c) => {
      const crewId = c.req.query("crewId");
      const views = await deps.listOpenTasks.execute(crewId ? { crewId } : {});
      return c.json(OpenTasksResponse.parse({ tasks: views.map((v) => ({ task: toTaskDto(v.task), destination: v.destination })) }));
    })
    .post("/tasks/reroute", async (c) => {
      const { now } = RerouteOpenTasksRequest.parse(await readJson(c));
      const result = await deps.rerouteOpenTasks.execute({ now: new Date(now) });
      return c.json(RerouteOpenTasksResponse.parse(result));
    })
    .post("/tasks/:id/route", async (c) => {
      const body = PlanTaskRouteRequest.parse(await readJson(c));
      const task = await deps.planTaskRoute.execute({
        taskId: c.req.param("id"),
        now: new Date(body.now),
        ...(body.from ? { from: body.from } : {}),
      });
      return c.json(TaskResponse.parse(toTaskDto(task)));
    })
    .get("/route-hazards", async (c) => {
      const { now } = RerouteOpenTasksRequest.parse({ now: c.req.query("now") });
      return c.json(RouteHazardsResponse.parse(toHazardsDto(await deps.getRouteHazards.execute({ now: new Date(now) }))));
    });
}

function toTaskDto(task: Task): TaskResponse {
  return {
    ...task,
    route: task.route && { ...task.route, computedAt: task.route.computedAt.toISOString() },
  };
}

function toHazardsDto(selection: RouteHazardSelection): RouteHazardsResponse {
  return {
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
  };
}

async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    throw new BadRequest("Body must be JSON");
  }
}

class BadRequest extends Error {}

/** Domain errors are matched by name, so this adapter never imports concrete use cases. */
const STATUS_BY_ERROR: Record<string, ContentfulStatusCode> = {
  TaskNotFoundError: 404,
  TaskClosedError: 409,
  PersonLocationMissingError: 422,
  StartInHazardError: 422,
  RouteNotFoundError: 422,
  RoutingUnavailableError: 502,
};

function mapError(c: Context, error: Error) {
  if (error instanceof z.ZodError || error instanceof BadRequest) {
    const message = error instanceof z.ZodError ? z.prettifyError(error) : error.message;
    return c.json({ error: "BadRequest", message } satisfies ErrorResponse, 400);
  }
  const status = STATUS_BY_ERROR[error.name];
  if (status) return c.json({ error: error.name, message: error.message } satisfies ErrorResponse, status);
  console.error(error);
  return c.json({ error: "InternalError", message: "Unexpected error" } satisfies ErrorResponse, 500);
}

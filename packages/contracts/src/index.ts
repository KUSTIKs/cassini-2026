import { z } from "zod";

/**
 * Wire contracts shared by the API (producer) and the web app (consumer).
 * Only data shapes live here — no business rules.
 */
export const GreetingResponse = z.object({
  message: z.string(),
  source: z.enum(["postgres", "memory"]),
  servedAt: z.iso.datetime(),
});
export type GreetingResponse = z.infer<typeof GreetingResponse>;

// ─── Crew routing (TECH.md Flow 4 and the reroute in Flow 5) ───────────────────

/** [longitude, latitude], WGS84, GeoJSON order. */
export const LonLat = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
export type LonLat = z.infer<typeof LonLat>;

const Position = z.array(z.number()).min(2);

export const LineStringGeometry = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(Position).min(2),
});

export const MultiPolygonGeometry = z.object({
  type: z.literal("MultiPolygon"),
  coordinates: z.array(z.array(z.array(Position).min(4))),
});

export const TaskState = z.enum(["assigned", "en_route", "done"]);
export const Bring = z.enum(["generator", "oxygen", "transport"]);
/** Which hazard information a route avoided. `observed` always wins over `forecast`. */
export const RouteBasis = z.enum(["observed", "forecast", "none"]);

export const TaskRoute = z.object({
  basis: RouteBasis,
  avoidedSignalIds: z.array(z.string()),
  from: LonLat,
  to: LonLat,
  /** Where the drive ends: `to`, or the last dry point when the person is inside the water. */
  endPoint: LonLat,
  destinationInHazard: z.boolean(),
  /** Metres from endPoint to the person on foot or by boat; null when the drive reaches them. */
  walkRemainingM: z.number().nonnegative().nullable(),
  line: LineStringGeometry,
  distanceM: z.number().nonnegative(),
  durationS: z.number().nonnegative(),
  provider: z.string(),
  computedAt: z.iso.datetime(),
  version: z.number().int().positive(),
  rerouteReason: z.string().nullable(),
});
export type TaskRoute = z.infer<typeof TaskRoute>;

export const Task = z.object({
  id: z.string(),
  alertId: z.string(),
  personId: z.string(),
  crewId: z.string().nullable(),
  bring: z.array(Bring),
  state: TaskState,
  route: TaskRoute.nullable(),
});
export type Task = z.infer<typeof Task>;

/** POST /tasks/:id/route. Omit `from` in replay; the fixed crew start is used. */
export const PlanTaskRouteRequest = z.object({
  now: z.iso.datetime({ offset: true }),
  from: LonLat.optional(),
});
export type PlanTaskRouteRequest = z.infer<typeof PlanTaskRouteRequest>;

export const TaskResponse = Task;
export type TaskResponse = Task;

/** POST /tasks/reroute */
export const RerouteOpenTasksRequest = z.object({ now: z.iso.datetime({ offset: true }) });
export type RerouteOpenTasksRequest = z.infer<typeof RerouteOpenTasksRequest>;

export const RerouteOpenTasksResponse = z.object({
  basis: RouteBasis,
  rerouted: z.array(
    z.object({
      taskId: z.string(),
      previousBasis: RouteBasis,
      reason: z.string(),
      distanceDeltaM: z.number(),
      destinationInHazard: z.boolean(),
    }),
  ),
  unchanged: z.array(z.string()),
  failed: z.array(z.object({ taskId: z.string(), error: z.string() })),
});
export type RerouteOpenTasksResponse = z.infer<typeof RerouteOpenTasksResponse>;

/** GET /tasks/open?crewId= */
export const OpenTasksResponse = z.object({
  tasks: z.array(z.object({ task: Task, destination: LonLat.nullable() })),
});
export type OpenTasksResponse = z.infer<typeof OpenTasksResponse>;

/** GET /route-hazards?now= : what routes avoid right now, for the crew map. */
export const RouteHazardsResponse = z.object({
  basis: RouteBasis,
  signals: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(["flood", "power_outage", "storm", "fire"]),
      stage: z.enum(["forecast", "observed"]),
      area: MultiPolygonGeometry,
      issuedAt: z.iso.datetime(),
      expectedAt: z.iso.datetime().nullable(),
      confidence: z.enum(["low", "medium", "high"]),
      label: z.string(),
      euSpace: z.enum(["copernicus", "galileo"]).nullable(),
    }),
  ),
});
export type RouteHazardsResponse = z.infer<typeof RouteHazardsResponse>;

export const ErrorResponse = z.object({ error: z.string(), message: z.string() });
export type ErrorResponse = z.infer<typeof ErrorResponse>;

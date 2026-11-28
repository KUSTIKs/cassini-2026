import type { LineString, LonLat } from "./geo.js";

/**
 * DOMAIN: a job for a fire crew (TECH.md data model, Flow 3 creates it, Flow 4 drives it).
 * The route lives on the task; a reroute (Flow 5) replaces it and bumps `version`.
 */
export type TaskState = "assigned" | "en_route" | "done";
export type Bring = "generator" | "oxygen" | "transport";

/** Which hazard information the route avoided. `observed` always wins over `forecast`. */
export type RouteBasis = "observed" | "forecast" | "none";

export type TaskRoute = {
  basis: RouteBasis;
  avoidedSignalIds: string[];
  from: LonLat;
  /** The person's location. */
  to: LonLat;
  /** Where the drive ends: `to`, or the last dry point when `to` is under water. */
  endPoint: LonLat;
  destinationInHazard: boolean;
  /** Metres from `endPoint` to the person on foot or by boat; null when the drive reaches them. */
  walkRemainingM: number | null;
  line: LineString;
  distanceM: number;
  durationS: number;
  provider: string;
  computedAt: Date;
  version: number;
  /** Why this route replaced the previous one; null for the first route. */
  rerouteReason: string | null;
};

export type Task = {
  id: string;
  alertId: string;
  personId: string;
  crewId: string | null;
  bring: Bring[];
  state: TaskState;
  route: TaskRoute | null;
};

export function isOpen(task: Task): boolean {
  return task.state !== "done";
}

export class TaskNotFoundError extends Error {
  override readonly name = "TaskNotFoundError";
  constructor(readonly taskId: string) {
    super(`Task ${taskId} not found`);
  }
}

export class TaskClosedError extends Error {
  override readonly name = "TaskClosedError";
  constructor(readonly taskId: string) {
    super(`Task ${taskId} is done; it cannot be routed`);
  }
}

export class PersonLocationMissingError extends Error {
  override readonly name = "PersonLocationMissingError";
  constructor(readonly personId: string) {
    super(`No location for person ${personId}`);
  }
}

/** No drivable route exists (all ways blocked, or no road near the point). */
export class RouteNotFoundError extends Error {
  override readonly name = "RouteNotFoundError";
}

/** The crew's start point is itself inside the hazard area. */
export class StartInHazardError extends Error {
  override readonly name = "StartInHazardError";
}

/** The routing provider is down, rate-limited or misconfigured. */
export class RoutingUnavailableError extends Error {
  override readonly name = "RoutingUnavailableError";
}

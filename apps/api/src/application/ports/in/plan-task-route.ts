import type { LonLat } from "../../../domain/geo.js";
import type { Task } from "../../../domain/task.js";

export type PlanTaskRouteInput = {
  taskId: string;
  /** Injected clock (replay or wall time). */
  now: Date;
  /** Crew position from the phone (GNSS incl. Galileo). Omitted in replay: the fixed crew start is used. */
  from?: LonLat;
  /** Why this route replaces an earlier one (set by RerouteOpenTasks). */
  reason?: string;
};

/** Flow 4: route a crew to a task's person, avoiding the best-known flood area. */
export interface PlanTaskRoute {
  execute(input: PlanTaskRouteInput): Promise<Task>;
}

import type { RouteBasis } from "../../../domain/task.js";

export type RerouteOpenTasksResult = {
  basis: RouteBasis;
  rerouted: {
    taskId: string;
    previousBasis: RouteBasis;
    reason: string;
    distanceDeltaM: number;
    destinationInHazard: boolean;
  }[];
  unchanged: string[];
  failed: { taskId: string; error: string }[];
};

/** Flow 5 step 3: when the hazard picture changes (e.g. observed water arrives), re-route open tasks. */
export interface RerouteOpenTasks {
  execute(input: { now: Date }): Promise<RerouteOpenTasksResult>;
}

"use server";

import type { RerouteOpenTasksResponse, TaskResponse } from "@lifeline/contracts";
import { planTaskRoute, rerouteOpenTasks } from "@/lib/api-client";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

const wrap = async <T,>(fn: () => Promise<T>): Promise<ActionResult<T>> => {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
};

/** Replay: no `from`, so the API uses the fixed Krnov crew start. */
export async function routeTaskAction(taskId: string, now: string): Promise<ActionResult<TaskResponse>> {
  return wrap(() => planTaskRoute(taskId, now));
}

/** Flow 5: the satellite map arrived; re-route open tasks around observed water. */
export async function satelliteUpdateAction(now: string): Promise<ActionResult<RerouteOpenTasksResponse>> {
  return wrap(() => rerouteOpenTasks(now));
}

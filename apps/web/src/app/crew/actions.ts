"use server";

import { api } from "@/lib/api-client";

/** Replay: no `from`, so the API uses the fixed Krnov crew start. */
export const routeTaskAction = async (taskId: string, now: string) => api.planTaskRoute(taskId, now);

/** Flow 5: the satellite map arrived; re-route open tasks around observed water. */
export const satelliteUpdateAction = async (now: string) => api.rerouteOpenTasks(now);

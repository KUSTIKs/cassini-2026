import "server-only";
import {
  GreetingResponse,
  type LonLat,
  OpenTasksResponse,
  RerouteOpenTasksResponse,
  RouteHazardsResponse,
  TaskResponse,
} from "@lifeline/contracts";

/**
 * Web-side adapter for the API. Components never call fetch() directly;
 * they use these functions, which validate responses against the shared contract.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function getGreeting(): Promise<GreetingResponse> {
  const res = await fetch(`${API_URL}/greeting`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  return GreetingResponse.parse(await res.json());
}

// ─── Crew routing (Flow 4, reroute in Flow 5) ──────────────────────────────────

async function call<T>(path: string, schema: { parse(v: unknown): T }, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (body as { message?: string } | null)?.message ?? `API responded ${res.status}`;
    throw new Error(message);
  }
  return schema.parse(body);
}

export function getOpenTasks(crewId: string): Promise<OpenTasksResponse> {
  return call(`/tasks/open?crewId=${encodeURIComponent(crewId)}`, OpenTasksResponse);
}

export function getRouteHazards(now: string): Promise<RouteHazardsResponse> {
  return call(`/route-hazards?now=${encodeURIComponent(now)}`, RouteHazardsResponse);
}

export function planTaskRoute(taskId: string, now: string, from?: LonLat): Promise<TaskResponse> {
  return call(`/tasks/${encodeURIComponent(taskId)}/route`, TaskResponse, {
    method: "POST",
    body: JSON.stringify(from ? { now, from } : { now }),
  });
}

export function rerouteOpenTasks(now: string): Promise<RerouteOpenTasksResponse> {
  return call("/tasks/reroute", RerouteOpenTasksResponse, { method: "POST", body: JSON.stringify({ now }) });
}

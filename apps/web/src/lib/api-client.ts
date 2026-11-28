import "server-only";
import {
  ApiError, AreaCandidateList, CreatedMunicipality, Me, MunicipalityList, MunicipalitySetup, OpenTasksResponse,
  RegisterImportResult, RerouteOpenTasksResponse, RouteHazardsResponse, Session, SubstationImportResult, TaskResponse,
  UserList, type CreateMunicipalityRequest, type LonLat,
} from "@firstreach/contracts";
import type { z } from "zod";
import { readSessionToken } from "./session";

/**
 * Web-side adapter for the API. Components and actions never call fetch() directly.
 * Every response is validated against the shared contract. The signed-in user's session
 * (an httpOnly cookie) is forwarded as a bearer token; the API enforces what that user may do.
 */
const API_URL = process.env.API_URL ?? "http://localhost:4000";

export type ApiFailure = ApiError["error"];
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiFailure };

const unreachable: ApiFailure = {
  code: "upstream_failed",
  message: "FirstReach's server is not reachable. Check that the API is running.",
};

const request = async <T>(path: string, init: RequestInit, schema: z.ZodType<T> | null): Promise<ApiResult<T>> => {
  const token = await readSessionToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { cache: "no-store", ...init, headers });
  } catch {
    return { ok: false, error: unreachable };
  }
  if (!res.ok) {
    const body = ApiError.safeParse(await res.json().catch(() => null));
    return { ok: false, error: body.success ? body.data.error : { code: "internal", message: `Unexpected response (${res.status}).` } };
  }
  if (!schema) return { ok: true, data: undefined as T };
  return { ok: true, data: schema.parse(await res.json()) };
};

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  me: () => request("/me", {}, Me),
  demoUsers: () => request("/auth/demo-users", {}, UserList),
  demoSignIn: (userId: string) => request("/auth/demo-sign-in", json("POST", { userId }), Session),
  listMunicipalities: () => request("/municipalities", {}, MunicipalityList),
  getMunicipalitySetup: (id: string) => request(`/municipalities/${encodeURIComponent(id)}/setup`, {}, MunicipalitySetup),
  createMunicipality: (body: CreateMunicipalityRequest) => request("/municipalities", json("POST", body), CreatedMunicipality),
  searchAreas: (q: string) => request(`/areas/search?${new URLSearchParams({ q })}`, {}, AreaCandidateList),
  setArea: (id: string, ref: string) => request(`/municipalities/${encodeURIComponent(id)}/area`, json("PUT", { ref }), null),
  importSubstations: (id: string) =>
    request(`/municipalities/${encodeURIComponent(id)}/substations/import`, { method: "POST" }, SubstationImportResult),
  importRegister: (id: string, csv: string) =>
    request(
      `/municipalities/${encodeURIComponent(id)}/register`,
      { method: "PUT", headers: { "Content-Type": "text/csv" }, body: csv },
      RegisterImportResult,
    ),
  // crew routing (Flow 4, reroute in Flow 5)
  openTasks: (crewId: string) => request(`/tasks/open?${new URLSearchParams({ crewId })}`, {}, OpenTasksResponse),
  routeHazards: (now: string) => request(`/route-hazards?${new URLSearchParams({ now })}`, {}, RouteHazardsResponse),
  /** Omit `from` in replay; the API uses the fixed crew start. */
  planTaskRoute: (taskId: string, now: string, from?: LonLat) =>
    request(`/tasks/${encodeURIComponent(taskId)}/route`, json("POST", from ? { now, from } : { now }), TaskResponse),
  rerouteOpenTasks: (now: string) => request("/tasks/reroute", json("POST", { now }), RerouteOpenTasksResponse),
};

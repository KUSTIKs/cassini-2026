import {
  ApiError,
  OpenTasksResponse,
  RerouteOpenTasksResponse,
  RouteHazardsResponse,
  Session,
  TaskResponse,
} from "@firstreach/contracts";
import { describe, expect, it } from "vitest";
import { CreateMunicipalityUseCase } from "../../../../application/use-cases/create-municipality.js";
import { GetAlertUseCase } from "../../../../application/use-cases/get-alert.js";
import { GetCurrentUserUseCase } from "../../../../application/use-cases/get-current-user.js";
import { GetMunicipalitySetupUseCase } from "../../../../application/use-cases/get-municipality-setup.js";
import { GetRouteHazardsUseCase } from "../../../../application/use-cases/get-route-hazards.js";
import { ImportRegisterUseCase } from "../../../../application/use-cases/import-register.js";
import { ImportSubstationsUseCase } from "../../../../application/use-cases/import-substations.js";
import { ListAlertsUseCase } from "../../../../application/use-cases/list-alerts.js";
import { ListMunicipalitiesUseCase } from "../../../../application/use-cases/list-municipalities.js";
import { ListOpenTasksUseCase } from "../../../../application/use-cases/list-open-tasks.js";
import { ListUsersUseCase } from "../../../../application/use-cases/list-users.js";
import { PlanTaskRouteUseCase } from "../../../../application/use-cases/plan-task-route.js";
import { RerouteOpenTasksUseCase } from "../../../../application/use-cases/reroute-open-tasks.js";
import { RunSignalsUseCase } from "../../../../application/use-cases/run-signals.js";
import { SearchAreasUseCase } from "../../../../application/use-cases/search-areas.js";
import { SetMunicipalityAreaUseCase } from "../../../../application/use-cases/set-municipality-area.js";
import { InMemoryPersonLocationRepository, InMemoryTaskRepository } from "../../../out/memory/in-memory-routing-repositories.js";
import { KRNOV_CREW_START, krnovPersonLocations, krnovTasks, REPLAY } from "../../../out/memory/krnov-replay.js";
import {
  InMemoryAlertRepository, InMemoryMunicipalityRepository, InMemoryRegisterRepository, InMemorySignalRepository,
  InMemorySubstationRepository, InMemoryUserRepository,
} from "../../../out/memory/repositories.js";
import { krnovReplaySignals } from "../../../out/signals/krnov-replay-signals.js";
import { FixtureRoutingGateway } from "../../../out/routing/fixture-routing-gateway.js";
import { createHttpApp } from "../app.js";
import { createSessionCodec } from "../session.js";

const OFFICER_ID = "00000000-0000-4000-8000-000000000003";
const replaySignals = await krnovReplaySignals();

/**
 * The real app, as in app.test.ts, plus crew routing. Routes read the same signal repository that
 * POST /signals/run fills; here it's pre-filled with the efas and gfm plugins' Krnov signals.
 */
const build = () => {
  const repos = {
    municipalities: new InMemoryMunicipalityRepository(),
    substations: new InMemorySubstationRepository(),
    register: new InMemoryRegisterRepository(),
    users: new InMemoryUserRepository(),
  };
  repos.users.items.set(OFFICER_ID, {
    id: OFFICER_ID, name: "Officer", email: null, organisation: "Krnov",
    grants: [{ role: "municipality_officer", municipalityId: "krnov" }],
  });
  const clock = () => new Date("2024-09-13T10:00:00Z");
  const newId = () => crypto.randomUUID();
  const areas = { search: async () => [], getByRef: async () => null };
  const tasks = new InMemoryTaskRepository(krnovTasks());
  const people = new InMemoryPersonLocationRepository(krnovPersonLocations());
  const signals = new InMemorySignalRepository();
  const alerts = new InMemoryAlertRepository();
  for (const s of replaySignals) signals.items.set(s.id, s);
  const planTaskRoute = new PlanTaskRouteUseCase(tasks, people, signals, new FixtureRoutingGateway(), KRNOV_CREW_START);
  return createHttpApp({
    webOrigin: "http://localhost:3000",
    clock,
    sessions: createSessionCodec({ secret: "test-secret-at-least-16", ttlHours: 1 }),
    demoSignIn: true,
    getCurrentUser: new GetCurrentUserUseCase(repos),
    listUsers: new ListUsersUseCase(repos),
    createMunicipality: new CreateMunicipalityUseCase({ ...repos, clock, newId }),
    listMunicipalities: new ListMunicipalitiesUseCase(repos),
    getMunicipalitySetup: new GetMunicipalitySetupUseCase(repos),
    searchAreas: new SearchAreasUseCase(areas),
    setMunicipalityArea: new SetMunicipalityAreaUseCase({ ...repos, areas }),
    importSubstations: new ImportSubstationsUseCase({ ...repos, substationSource: { findInBBox: async () => [] } }),
    importRegister: new ImportRegisterUseCase({ ...repos, clock, newId }),
    runSignals: new RunSignalsUseCase({ ...repos, sources: [], signals, alerts, newId }),
    listAlerts: new ListAlertsUseCase({ alerts }),
    getAlert: new GetAlertUseCase({ ...repos, alerts, signals }),
    crew: {
      planTaskRoute,
      rerouteOpenTasks: new RerouteOpenTasksUseCase(tasks, signals, planTaskRoute),
      listOpenTasks: new ListOpenTasksUseCase(tasks, people),
      getRouteHazards: new GetRouteHazardsUseCase(signals),
    },
  });
};
type App = ReturnType<typeof build>;

const signedInApp = async () => {
  const app = build();
  const res = await app.request("/auth/demo-sign-in", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: OFFICER_ID }),
  });
  const { token } = Session.parse(await res.json());
  const call = (path: string, init: RequestInit = {}) =>
    app.request(path, { ...init, headers: { ...(init.headers as Record<string, string>), Authorization: `Bearer ${token}` } });
  return { app, call };
};

const post = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("crew routing HTTP adapter", { timeout: 30_000 }, () => {
  it("requires a session like every other route", async () => {
    const app: App = build();
    const res = await app.request("/tasks/open?crewId=crew-krnov-1");
    expect(res.status).toBe(401);
    expect(ApiError.parse(await res.json()).error.code).toBe("unauthenticated");
    expect((await app.request("/route-hazards?now=2024-09-15T12:00:00Z")).status).toBe(401);
  });

  it("POST /tasks/:id/route returns the task with a route that matches the contract", async () => {
    const { call } = await signedInApp();
    const res = await call("/tasks/T-KRN-1/route", post({ now: REPLAY.crewsDispatched.toISOString() }));
    expect(res.status).toBe(200);
    const task = TaskResponse.parse(await res.json());
    expect(task.route).toMatchObject({ basis: "forecast", from: KRNOV_CREW_START, provider: "fixture" });
  });

  it("answers in the shared ApiError shape: 400 bad body, 404 unknown task, 409 done task", async () => {
    const { call } = await signedInApp();
    const bad = await call("/tasks/T-KRN-1/route", post({ now: "yesterday" }));
    expect(bad.status).toBe(400);
    expect(ApiError.parse(await bad.json()).error.code).toBe("validation_failed");
    const missing = await call("/tasks/nope/route", post({ now: REPLAY.crewsDispatched.toISOString() }));
    expect(missing.status).toBe(404);
    expect(ApiError.parse(await missing.json()).error.code).toBe("not_found");
    expect((await call("/tasks/T-KRN-4/route", post({ now: REPLAY.crewsDispatched.toISOString() }))).status).toBe(409);
  });

  it("POST /tasks/reroute reports what changed after the satellite update", async () => {
    const { call } = await signedInApp();
    await call("/tasks/T-KRN-1/route", post({ now: REPLAY.crewsDispatched.toISOString() }));
    const res = await call("/tasks/reroute", post({ now: REPLAY.satelliteUpdate.toISOString() }));
    expect(res.status).toBe(200);
    const body = RerouteOpenTasksResponse.parse(await res.json());
    expect(body.basis).toBe("observed");
    expect(body.rerouted.map((r) => r.taskId)).toEqual(["T-KRN-1"]);
  });

  it("GET /tasks/open lists a crew's open tasks with destinations", async () => {
    const { call } = await signedInApp();
    const body = OpenTasksResponse.parse(await (await call("/tasks/open?crewId=crew-krnov-1")).json());
    expect(body.tasks.map((t) => t.task.id).sort()).toEqual(["T-KRN-1", "T-KRN-2", "T-KRN-3"]);
    expect(body.tasks.every((t) => t.destination !== null)).toBe(true);
  });

  it("GET /route-hazards shows what routes avoid at that moment: the forecast zone plus observed water", async () => {
    const { call } = await signedInApp();
    const res = await call(`/route-hazards?now=${encodeURIComponent(REPLAY.satelliteUpdate.toISOString())}`);
    const body = RouteHazardsResponse.parse(await res.json());
    expect(body.basis).toBe("observed");
    expect(body.signals.map((s) => s.stage).sort()).toEqual(["forecast", "observed"]);
    expect((await call("/route-hazards")).status).toBe(400);
  });
});

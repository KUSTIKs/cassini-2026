import {
  ErrorResponse,
  OpenTasksResponse,
  RerouteOpenTasksResponse,
  RouteHazardsResponse,
  TaskResponse,
} from "@lifeline/contracts";
import { describe, expect, it } from "vitest";
import { GetGreetingUseCase } from "../../../application/use-cases/get-greeting.js";
import { GetRouteHazardsUseCase } from "../../../application/use-cases/get-route-hazards.js";
import { ListOpenTasksUseCase } from "../../../application/use-cases/list-open-tasks.js";
import { PlanTaskRouteUseCase } from "../../../application/use-cases/plan-task-route.js";
import { RerouteOpenTasksUseCase } from "../../../application/use-cases/reroute-open-tasks.js";
import { InMemoryGreetingRepository } from "../../out/memory/in-memory-greeting-repository.js";
import {
  InMemoryHazardSignalRepository,
  InMemoryPersonLocationRepository,
  InMemoryTaskRepository,
} from "../../out/memory/in-memory-routing-repositories.js";
import { KRNOV_CREW_START, krnovPersonLocations, krnovSignals, krnovTasks, REPLAY } from "../../out/memory/krnov-replay.js";
import { FixtureRoutingGateway } from "../../out/routing/fixture-routing-gateway.js";
import { createHttpApp } from "./app.js";

function app() {
  const tasks = new InMemoryTaskRepository(krnovTasks());
  const people = new InMemoryPersonLocationRepository(krnovPersonLocations());
  const signals = new InMemoryHazardSignalRepository(krnovSignals());
  const planTaskRoute = new PlanTaskRouteUseCase(tasks, people, signals, new FixtureRoutingGateway(), KRNOV_CREW_START);
  return createHttpApp({
    getGreeting: new GetGreetingUseCase(new InMemoryGreetingRepository()),
    storage: "memory",
    webOrigin: "http://localhost:3000",
    crew: {
      planTaskRoute,
      rerouteOpenTasks: new RerouteOpenTasksUseCase(tasks, signals, planTaskRoute),
      listOpenTasks: new ListOpenTasksUseCase(tasks, people),
      getRouteHazards: new GetRouteHazardsUseCase(signals),
    },
  });
}

const post = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("crew routing HTTP adapter", () => {
  it("POST /tasks/:id/route returns the task with a route that matches the contract", async () => {
    const res = await app().request("/tasks/T-KRN-1/route", post({ now: REPLAY.crewsDispatched.toISOString() }));
    expect(res.status).toBe(200);
    const task = TaskResponse.parse(await res.json());
    expect(task.route).toMatchObject({ basis: "forecast", from: KRNOV_CREW_START, provider: "fixture" });
  });

  it("maps errors: 400 bad body, 404 unknown task, 409 done task", async () => {
    const a = app();
    const bad = await a.request("/tasks/T-KRN-1/route", post({ now: "yesterday" }));
    expect(bad.status).toBe(400);
    ErrorResponse.parse(await bad.json());
    expect((await a.request("/tasks/nope/route", post({ now: REPLAY.crewsDispatched.toISOString() }))).status).toBe(404);
    expect((await a.request("/tasks/T-KRN-4/route", post({ now: REPLAY.crewsDispatched.toISOString() }))).status).toBe(409);
  });

  it("POST /tasks/reroute reports what changed after the satellite update", async () => {
    const a = app();
    await a.request("/tasks/T-KRN-1/route", post({ now: REPLAY.crewsDispatched.toISOString() }));
    const res = await a.request("/tasks/reroute", post({ now: REPLAY.satelliteUpdate.toISOString() }));
    expect(res.status).toBe(200);
    const body = RerouteOpenTasksResponse.parse(await res.json());
    expect(body.basis).toBe("observed");
    expect(body.rerouted.map((r) => r.taskId)).toEqual(["T-KRN-1"]);
  });

  it("GET /tasks/open lists a crew's open tasks with destinations", async () => {
    const res = await app().request("/tasks/open?crewId=crew-krnov-1");
    const body = OpenTasksResponse.parse(await res.json());
    expect(body.tasks.map((t) => t.task.id).sort()).toEqual(["T-KRN-1", "T-KRN-2", "T-KRN-3"]);
    expect(body.tasks.every((t) => t.destination !== null)).toBe(true);
  });

  it("GET /route-hazards shows what routes avoid at that moment", async () => {
    const res = await app().request(`/route-hazards?now=${encodeURIComponent(REPLAY.satelliteUpdate.toISOString())}`);
    const body = RouteHazardsResponse.parse(await res.json());
    expect(body.basis).toBe("observed");
    expect(body.signals.map((s) => s.stage).sort()).toEqual(["forecast", "observed"]);
    expect(body.signals.find((s) => s.stage === "observed")!.unobserved).not.toBeNull();
    expect((await app().request("/route-hazards")).status).toBe(400);
  });
});

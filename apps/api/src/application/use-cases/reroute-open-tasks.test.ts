import { describe, expect, it } from "vitest";
import { InMemoryPersonLocationRepository, InMemoryTaskRepository } from "../../adapters/out/memory/in-memory-routing-repositories.js";
import { KRNOV_CREW_START, krnovPersonLocations, krnovTasks, REPLAY } from "../../adapters/out/memory/krnov-replay.js";
import { InMemorySignalRepository } from "../../adapters/out/memory/repositories.js";
import { krnovReplaySignals } from "../../adapters/out/signals/krnov-replay-signals.js";
import { FixtureRoutingGateway } from "../../adapters/out/routing/fixture-routing-gateway.js";
import type { RouteRequest, RoutingGateway } from "../ports/out/routing-gateway.js";
import { PlanTaskRouteUseCase } from "./plan-task-route.js";
import { RerouteOpenTasksUseCase } from "./reroute-open-tasks.js";

const replaySignals = await krnovReplaySignals();

async function setup(routing: RoutingGateway = new FixtureRoutingGateway()) {
  const tasks = new InMemoryTaskRepository(krnovTasks());
  const signals = new InMemorySignalRepository();
  await signals.upsert(replaySignals);
  const plan = new PlanTaskRouteUseCase(
    tasks,
    new InMemoryPersonLocationRepository(krnovPersonLocations()),
    signals,
    routing,
    KRNOV_CREW_START,
  );
  return { tasks, plan, reroute: new RerouteOpenTasksUseCase(tasks, signals, plan) };
}

const ROUTED = ["T-KRN-1", "T-KRN-2", "T-KRN-3"];

describe("RerouteOpenTasksUseCase (fixture routing, Krnov replay)", { timeout: 60_000 }, () => {
  it("re-routes every open routed task when the satellite map arrives", async () => {
    const s = await setup();
    for (const taskId of ROUTED) await s.plan.execute({ taskId, now: REPLAY.crewsDispatched });

    const result = await s.reroute.execute({ now: REPLAY.satelliteUpdate });

    expect(result.basis).toBe("observed");
    expect(result.rerouted.map((r) => r.taskId).sort()).toEqual(ROUTED);
    expect(result.failed).toEqual([]);
    for (const r of result.rerouted) {
      expect(r.previousBasis).toBe("forecast");
      expect(r.reason).toMatch(/^Now also avoids Sentinel-1 flood extent, 2024-09-15 \(Copernicus GFM\)$/);
    }
    expect(result.rerouted.find((r) => r.taskId === "T-KRN-2")!.destinationInHazard).toBe(true);

    const t1 = await s.tasks.findById("T-KRN-1");
    expect(t1!.route).toMatchObject({ version: 2, basis: "observed" });
    expect(t1!.route!.rerouteReason).toMatch(/Copernicus GFM/);
  });

  it("keeps the crew's original start point when re-routing", async () => {
    const s = await setup();
    const from: [number, number] = [17.685, 50.096];
    await s.plan.execute({ taskId: "T-KRN-1", now: REPLAY.crewsDispatched, from });
    await s.reroute.execute({ now: REPLAY.satelliteUpdate });
    expect((await s.tasks.findById("T-KRN-1"))!.route!.from).toEqual(from);
  });

  it("leaves routes alone when nothing changed, and never touches done or unrouted tasks", async () => {
    const s = await setup();
    await s.plan.execute({ taskId: "T-KRN-1", now: REPLAY.crewsDispatched });

    const result = await s.reroute.execute({ now: REPLAY.crewsDispatched });

    expect(result.rerouted).toEqual([]);
    expect(result.unchanged).toEqual(["T-KRN-1"]);
    expect((await s.tasks.findById("T-KRN-2"))!.route).toBeNull();
    expect((await s.tasks.findById("T-KRN-4"))!.route).toBeNull();
  });

  it("isolates failures: one task that can't be routed doesn't stop the others", async () => {
    const fixture = new FixtureRoutingGateway();
    let failNext = false;
    const flaky: RoutingGateway = {
      route: async (req: RouteRequest) => {
        if (failNext && req.to[0] === krnovPersonLocations()["P-101"]![0]) throw new Error("router down");
        return fixture.route(req);
      },
    };
    const s = await setup(flaky);
    for (const taskId of ROUTED) await s.plan.execute({ taskId, now: REPLAY.crewsDispatched });
    failNext = true;

    const result = await s.reroute.execute({ now: REPLAY.satelliteUpdate });

    expect(result.failed).toEqual([{ taskId: "T-KRN-1", error: "router down" }]);
    expect(result.rerouted.map((r) => r.taskId).sort()).toEqual(["T-KRN-2", "T-KRN-3"]);
    expect((await s.tasks.findById("T-KRN-1"))!.route!.basis).toBe("forecast");
  });
});

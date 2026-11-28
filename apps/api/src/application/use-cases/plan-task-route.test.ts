import * as turf from "@turf/turf";
import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryPersonLocationRepository, InMemoryTaskRepository } from "../../adapters/out/memory/in-memory-routing-repositories.js";
import { KRNOV_CREW_START, krnovPersonLocations, krnovTasks, REPLAY } from "../../adapters/out/memory/krnov-replay.js";
import { InMemorySignalRepository } from "../../adapters/out/memory/repositories.js";
import {
  KRNOV_FORECAST_SIGNAL_ID,
  KRNOV_OBSERVED_SIGNAL_ID,
  krnovReplaySignals,
} from "../../adapters/out/signals/krnov-replay-signals.js";
import { FixtureRoutingGateway } from "../../adapters/out/routing/fixture-routing-gateway.js";
import type { HazardSignal } from "../../domain/hazard-signal.js";
import { StartInHazardError, TaskClosedError, TaskNotFoundError } from "../../domain/task.js";
import { PlanTaskRouteUseCase } from "./plan-task-route.js";

// The real efas and gfm plugins on data/flood/, as POST /signals/run would store them.
const signals: HazardSignal[] = await krnovReplaySignals();
const areaOf = (id: string) => signals.find((s) => s.id === id)!.area;

async function setup() {
  const tasks = new InMemoryTaskRepository(krnovTasks());
  const repo = new InMemorySignalRepository();
  await repo.upsert(signals);
  const plan = new PlanTaskRouteUseCase(
    tasks,
    new InMemoryPersonLocationRepository(krnovPersonLocations()),
    repo,
    new FixtureRoutingGateway(),
    KRNOV_CREW_START,
  );
  return { tasks, plan };
}

describe("PlanTaskRouteUseCase (fixture routing, Krnov replay)", { timeout: 30_000 }, () => {
  let s: Awaited<ReturnType<typeof setup>>;
  beforeEach(async () => {
    s = await setup();
  });

  it("before any warning, drives straight there and avoids nothing", async () => {
    const task = await s.plan.execute({ taskId: "T-KRN-1", now: REPLAY.normalDay });
    expect(task.route).toMatchObject({ basis: "none", avoidedSignalIds: [], version: 1, rerouteReason: null });
  });

  it("during the forecast window, starts at the fixed Krnov crew start and avoids the predicted zone", async () => {
    const task = await s.plan.execute({ taskId: "T-KRN-1", now: REPLAY.crewsDispatched });
    const route = task.route!;
    expect(route.basis).toBe("forecast");
    expect(route.avoidedSignalIds).toEqual([KRNOV_FORECAST_SIGNAL_ID]);
    expect(route.from).toEqual(KRNOV_CREW_START);
    expect(route.line.coordinates[0]).toEqual(KRNOV_CREW_START);
    expect(turf.booleanIntersects(route.line, areaOf(KRNOV_FORECAST_SIGNAL_ID))).toBe(false);
    expect(route.distanceM).toBeGreaterThan(0);
    expect(route.computedAt).toEqual(REPLAY.crewsDispatched);
  });

  it("once the satellite map is in, avoids the observed water AND keeps avoiding the forecast zone", async () => {
    const task = await s.plan.execute({ taskId: "T-KRN-3", now: REPLAY.satelliteUpdate });
    expect(task.route!.basis).toBe("observed");
    expect(task.route!.avoidedSignalIds).toEqual([KRNOV_FORECAST_SIGNAL_ID, KRNOV_OBSERVED_SIGNAL_ID]);
    expect(turf.booleanIntersects(task.route!.line, areaOf(KRNOV_OBSERVED_SIGNAL_ID))).toBe(false);
    expect(turf.booleanIntersects(task.route!.line, areaOf(KRNOV_FORECAST_SIGNAL_ID))).toBe(false);
  });

  it("when the person is inside the flood zone, drives to the last dry point and reports the rest", async () => {
    const task = await s.plan.execute({ taskId: "T-KRN-2", now: REPLAY.crewsDispatched });
    const route = task.route!;
    expect(route.destinationInHazard).toBe(true);
    expect(route.to).toEqual(krnovPersonLocations()["P-102"]);
    expect(turf.booleanPointInPolygon(route.endPoint, areaOf(KRNOV_FORECAST_SIGNAL_ID))).toBe(false);
    expect(route.line.coordinates.at(-1)).toEqual(route.endPoint);
    expect(route.walkRemainingM).toBeGreaterThan(0);
  });

  it("uses the phone position when one is given", async () => {
    const from: [number, number] = [17.685, 50.096];
    const task = await s.plan.execute({ taskId: "T-KRN-1", now: REPLAY.crewsDispatched, from });
    expect(task.route!.from).toEqual(from);
  });

  it("stores the route on the task and bumps the version on each re-plan", async () => {
    await s.plan.execute({ taskId: "T-KRN-1", now: REPLAY.crewsDispatched });
    await s.plan.execute({ taskId: "T-KRN-1", now: REPLAY.satelliteUpdate, reason: "test" });
    const saved = await s.tasks.findById("T-KRN-1");
    expect(saved!.route).toMatchObject({ version: 2, basis: "observed", rerouteReason: "test" });
  });

  it("refuses a crew start inside the flood zone", async () => {
    const inside = krnovPersonLocations()["P-102"]!;
    await expect(s.plan.execute({ taskId: "T-KRN-1", now: REPLAY.crewsDispatched, from: inside })).rejects.toBeInstanceOf(
      StartInHazardError,
    );
  });

  it("rejects unknown and finished tasks", async () => {
    await expect(s.plan.execute({ taskId: "nope", now: REPLAY.crewsDispatched })).rejects.toBeInstanceOf(TaskNotFoundError);
    await expect(s.plan.execute({ taskId: "T-KRN-4", now: REPLAY.crewsDispatched })).rejects.toBeInstanceOf(TaskClosedError);
  });
});

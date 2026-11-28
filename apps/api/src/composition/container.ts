import { existsSync, readFileSync } from "node:fs";
import { createHttpApp } from "../adapters/in/http/app.js";
import {
  InMemoryHazardSignalRepository,
  InMemoryPersonLocationRepository,
  InMemoryTaskRepository,
} from "../adapters/out/memory/in-memory-routing-repositories.js";
import { krnovPersonLocations, krnovSignals, krnovTasks } from "../adapters/out/memory/krnov-replay.js";
import { createDb } from "../adapters/out/postgres/client.js";
import { PostgresGreetingRepository } from "../adapters/out/postgres/postgres-greeting-repository.js";
import { FixtureRoutingGateway } from "../adapters/out/routing/fixture-routing-gateway.js";
import { OpenRouteServiceRoutingGateway } from "../adapters/out/routing/openrouteservice-routing-gateway.js";
import { RecordedRoutingGateway, type RecordedRoutes } from "../adapters/out/routing/recorded-routes.js";
import type { RoutingGateway } from "../application/ports/out/routing-gateway.js";
import { GetGreetingUseCase } from "../application/use-cases/get-greeting.js";
import { GetRouteHazardsUseCase } from "../application/use-cases/get-route-hazards.js";
import { ListOpenTasksUseCase } from "../application/use-cases/list-open-tasks.js";
import { PlanTaskRouteUseCase } from "../application/use-cases/plan-task-route.js";
import { RerouteOpenTasksUseCase } from "../application/use-cases/reroute-open-tasks.js";
import type { Config, RoutingConfig } from "./config.js";

/**
 * COMPOSITION ROOT: the only place that knows every concrete class.
 * Chooses adapters, injects them into use cases, hands use cases to driving adapters.
 */
export function buildContainer(config: Config) {
  const { db, close } = createDb(config.databaseUrl);

  const greetings = new PostgresGreetingRepository(db);
  const getGreeting = new GetGreetingUseCase(greetings);

  // Crew routing runs on the Krnov replay data in memory until Tasks, people and signals are in Postgres.
  const tasks = new InMemoryTaskRepository(krnovTasks());
  const people = new InMemoryPersonLocationRepository(krnovPersonLocations());
  const signals = new InMemoryHazardSignalRepository(krnovSignals());
  const planTaskRoute = new PlanTaskRouteUseCase(tasks, people, signals, createRoutingGateway(config.routing), config.crewStart);
  const crew = {
    planTaskRoute,
    rerouteOpenTasks: new RerouteOpenTasksUseCase(tasks, signals, planTaskRoute),
    listOpenTasks: new ListOpenTasksUseCase(tasks, people),
    getRouteHazards: new GetRouteHazardsUseCase(signals),
  };

  const http = createHttpApp({ getGreeting, storage: "postgres", webOrigin: config.webOrigin, crew });
  return { http, close };
}

export function createRoutingGateway(routing: RoutingConfig): RoutingGateway {
  switch (routing.kind) {
    case "fixture":
      return new FixtureRoutingGateway();
    case "recorded": {
      const recorded = existsSync(routing.path) ? (JSON.parse(readFileSync(routing.path, "utf8")) as RecordedRoutes) : null;
      if (!recorded) console.warn("ROUTING=recorded but no recorded routes yet (run pnpm routes:record); using the fixture router");
      return new RecordedRoutingGateway(recorded, new FixtureRoutingGateway());
    }
    case "ors":
      return new OpenRouteServiceRoutingGateway(routing);
  }
}

import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createHttpApp } from "../adapters/in/http/app.js";
import { createSessionCodec } from "../adapters/in/http/session.js";
import {
  InMemoryHazardSignalRepository,
  InMemoryPersonLocationRepository,
  InMemoryTaskRepository,
} from "../adapters/out/memory/in-memory-routing-repositories.js";
import { krnovPersonLocations, krnovSignals, krnovTasks } from "../adapters/out/memory/krnov-replay.js";
import { FallbackSubstationGateway } from "../adapters/out/osm/fallback-substation-gateway.js";
import { NominatimAreaGateway } from "../adapters/out/osm/nominatim-area-gateway.js";
import { OverpassSubstationGateway } from "../adapters/out/osm/overpass-substation-gateway.js";
import { SnapshotSubstationGateway } from "../adapters/out/osm/snapshot-substation-gateway.js";
import { createDb } from "../adapters/out/postgres/client.js";
import { PostgresMunicipalityRepository } from "../adapters/out/postgres/municipality-repository.js";
import { PostgresRegisterRepository } from "../adapters/out/postgres/register-repository.js";
import { PostgresSubstationRepository } from "../adapters/out/postgres/substation-repository.js";
import { PostgresUserRepository } from "../adapters/out/postgres/user-repository.js";
import { FixtureRoutingGateway } from "../adapters/out/routing/fixture-routing-gateway.js";
import { OpenRouteServiceRoutingGateway } from "../adapters/out/routing/openrouteservice-routing-gateway.js";
import { RecordedRoutingGateway, type RecordedRoutes } from "../adapters/out/routing/recorded-routes.js";
import type { RoutingGateway } from "../application/ports/out/routing-gateway.js";
import { CreateMunicipalityUseCase } from "../application/use-cases/create-municipality.js";
import { GetCurrentUserUseCase } from "../application/use-cases/get-current-user.js";
import { GetMunicipalitySetupUseCase } from "../application/use-cases/get-municipality-setup.js";
import { GetRouteHazardsUseCase } from "../application/use-cases/get-route-hazards.js";
import { ImportRegisterUseCase } from "../application/use-cases/import-register.js";
import { ImportSubstationsUseCase } from "../application/use-cases/import-substations.js";
import { ListMunicipalitiesUseCase } from "../application/use-cases/list-municipalities.js";
import { ListOpenTasksUseCase } from "../application/use-cases/list-open-tasks.js";
import { ListUsersUseCase } from "../application/use-cases/list-users.js";
import { PlanTaskRouteUseCase } from "../application/use-cases/plan-task-route.js";
import { RerouteOpenTasksUseCase } from "../application/use-cases/reroute-open-tasks.js";
import { SearchAreasUseCase } from "../application/use-cases/search-areas.js";
import { SetMunicipalityAreaUseCase } from "../application/use-cases/set-municipality-area.js";
import type { Config, RoutingConfig } from "./config.js";

/**
 * COMPOSITION ROOT: the only place that knows every concrete class.
 * Chooses adapters, injects them into use cases, hands use cases to driving adapters.
 */
export const buildContainer = (config: Config) => {
  const { db, close } = createDb(config.databaseUrl);

  // driven adapters
  const municipalities = new PostgresMunicipalityRepository(db);
  const substations = new PostgresSubstationRepository(db);
  const register = new PostgresRegisterRepository(db);
  const users = new PostgresUserRepository(db);
  const areas = new NominatimAreaGateway({ baseUrl: config.nominatimUrl, countryCodes: "cz" });
  const substationSource = new FallbackSubstationGateway(
    new OverpassSubstationGateway({ urls: config.overpassUrls }),
    new SnapshotSubstationGateway(config.substationSnapshots),
    (error) => console.warn("Live OSM substations unavailable, using the saved snapshot:", (error as Error).message),
  );
  const clock = () => new Date();
  const newId = () => randomUUID();

  // Crew routing (Flow 4/5) runs on the Krnov replay data in memory until tasks, people and signals are in Postgres.
  const tasks = new InMemoryTaskRepository(krnovTasks());
  const people = new InMemoryPersonLocationRepository(krnovPersonLocations());
  const signals = new InMemoryHazardSignalRepository(krnovSignals());
  const planTaskRoute = new PlanTaskRouteUseCase(tasks, people, signals, createRoutingGateway(config.routing), config.crewStart);

  // use cases
  const repos = { municipalities, substations, register };
  const http = createHttpApp({
    webOrigin: config.webOrigin,
    clock,
    sessions: createSessionCodec({ secret: config.sessionSecret, ttlHours: 12 }),
    demoSignIn: config.demoSignIn,
    getCurrentUser: new GetCurrentUserUseCase({ users }),
    listUsers: new ListUsersUseCase({ users }),
    createMunicipality: new CreateMunicipalityUseCase({ municipalities, users, clock, newId }),
    listMunicipalities: new ListMunicipalitiesUseCase(repos),
    getMunicipalitySetup: new GetMunicipalitySetupUseCase(repos),
    searchAreas: new SearchAreasUseCase(areas),
    setMunicipalityArea: new SetMunicipalityAreaUseCase({ ...repos, areas }),
    importSubstations: new ImportSubstationsUseCase({ ...repos, substationSource }),
    importRegister: new ImportRegisterUseCase({ ...repos, clock, newId }),
    crew: {
      planTaskRoute,
      rerouteOpenTasks: new RerouteOpenTasksUseCase(tasks, signals, planTaskRoute),
      listOpenTasks: new ListOpenTasksUseCase(tasks, people),
      getRouteHazards: new GetRouteHazardsUseCase(signals),
    },
  });

  return { http, close };
};

export const createRoutingGateway = (routing: RoutingConfig): RoutingGateway => {
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
};

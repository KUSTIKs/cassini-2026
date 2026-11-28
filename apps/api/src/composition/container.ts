import { randomUUID } from "node:crypto";
import { createHttpApp } from "../adapters/in/http/app.js";
import { createSessionCodec } from "../adapters/in/http/session.js";
import { FallbackSubstationGateway } from "../adapters/out/osm/fallback-substation-gateway.js";
import { NominatimAreaGateway } from "../adapters/out/osm/nominatim-area-gateway.js";
import { OverpassSubstationGateway } from "../adapters/out/osm/overpass-substation-gateway.js";
import { SnapshotSubstationGateway } from "../adapters/out/osm/snapshot-substation-gateway.js";
import { createDb } from "../adapters/out/postgres/client.js";
import { PostgresMunicipalityRepository } from "../adapters/out/postgres/municipality-repository.js";
import { PostgresRegisterRepository } from "../adapters/out/postgres/register-repository.js";
import { PostgresSubstationRepository } from "../adapters/out/postgres/substation-repository.js";
import { PostgresAlertRepository } from "../adapters/out/postgres/alert-repository.js";
import { PostgresAuditRepository, PostgresContactRepository, PostgresTaskRepository } from "../adapters/out/postgres/flow3-repositories.js";
import { PostgresSignalRepository } from "../adapters/out/postgres/signal-repository.js";
import { PostgresUserRepository } from "../adapters/out/postgres/user-repository.js";
import { CreateMunicipalityUseCase } from "../application/use-cases/create-municipality.js";
import { GetAlertPersonUseCase, SetContactStatusUseCase } from "../application/use-cases/alert-person.js";
import { GetAlertUseCase } from "../application/use-cases/get-alert.js";
import { GetCurrentUserUseCase } from "../application/use-cases/get-current-user.js";
import { GetMunicipalitySetupUseCase } from "../application/use-cases/get-municipality-setup.js";
import { ImportRegisterUseCase } from "../application/use-cases/import-register.js";
import { ImportSubstationsUseCase } from "../application/use-cases/import-substations.js";
import { ListAlertsUseCase } from "../application/use-cases/list-alerts.js";
import { ListMunicipalitiesUseCase } from "../application/use-cases/list-municipalities.js";
import { ListUsersUseCase } from "../application/use-cases/list-users.js";
import { SearchAreasUseCase } from "../application/use-cases/search-areas.js";
import { RunSignalsUseCase } from "../application/use-cases/run-signals.js";
import { SetMunicipalityAreaUseCase } from "../application/use-cases/set-municipality-area.js";
import type { Config } from "./config.js";
import { enabledSignalSources } from "./signals.js";

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
  const signals = new PostgresSignalRepository(db);
  const alerts = new PostgresAlertRepository(db);
  const contacts = new PostgresContactRepository(db);
  const tasks = new PostgresTaskRepository(db);
  const audit = new PostgresAuditRepository(db);
  const sources = enabledSignalSources(config);
  const areas = new NominatimAreaGateway({ baseUrl: config.nominatimUrl, countryCodes: "cz" });
  const substationSource = new FallbackSubstationGateway(
    new OverpassSubstationGateway({ urls: config.overpassUrls }),
    new SnapshotSubstationGateway(config.substationSnapshots),
    (error) => console.warn("Live OSM substations unavailable, using the saved snapshot:", (error as Error).message),
  );
  const clock = () => new Date();
  const newId = () => randomUUID();

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
    runSignals: new RunSignalsUseCase({
      ...repos, sources, signals, alerts, newId,
      onSourceError: (id, error) => console.warn(`Signal source "${id}" failed:`, (error as Error).message),
    }),
    listAlerts: new ListAlertsUseCase({ alerts }),
    getAlert: new GetAlertUseCase({ ...repos, alerts, signals, contacts, tasks, audit, clock, newId }),
    getAlertPerson: new GetAlertPersonUseCase({ ...repos, alerts, contacts, tasks, audit, clock, newId }),
    setContactStatus: new SetContactStatusUseCase({ ...repos, alerts, contacts, tasks, audit, clock, newId }),
  });

  return { http, close };
};

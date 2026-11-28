import { createHttpApp } from "../adapters/in/http/app.js";
import { createDb } from "../adapters/out/postgres/client.js";
import { PostgresGreetingRepository } from "../adapters/out/postgres/postgres-greeting-repository.js";
import { GetGreetingUseCase } from "../application/use-cases/get-greeting.js";
import type { Config } from "./config.js";

/**
 * COMPOSITION ROOT: the only place that knows every concrete class.
 * Chooses adapters, injects them into use cases, hands use cases to driving adapters.
 */
export function buildContainer(config: Config) {
  const { db, close } = createDb(config.databaseUrl);

  const greetings = new PostgresGreetingRepository(db);
  const getGreeting = new GetGreetingUseCase(greetings);

  const http = createHttpApp({ getGreeting, storage: "postgres", webOrigin: config.webOrigin });
  return { http, close };
}

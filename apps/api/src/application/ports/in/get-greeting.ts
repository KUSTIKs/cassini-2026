import type { Greeting } from "../../../domain/greeting.js";

/**
 * DRIVING (inbound) PORT: what the outside world can ask the application.
 * Called by adapters/in/* (HTTP, CLI, jobs, ...).
 */
export interface GetGreeting {
  execute(): Promise<Greeting>;
}

import type { Greeting } from "../../../domain/greeting.js";

/**
 * DRIVEN (outbound) PORT: what the application needs from storage.
 * Implemented by adapters/out/* (Postgres, in-memory, ...).
 */
export interface GreetingRepository {
  findLatest(): Promise<Greeting | null>;
}

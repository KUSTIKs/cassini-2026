import type { HazardSignal } from "../../../domain/hazard-signal.js";

export interface SignalRepository {
  /** Inserts or updates by id (the same id again is an update, never a duplicate). */
  upsert(signals: readonly HazardSignal[]): Promise<void>;
  list(): Promise<HazardSignal[]>;
}

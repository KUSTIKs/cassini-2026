import type { HazardSignal } from "../../../domain/hazard-signal.js";

/** Read side of the stored signals (IngestSignals upserts them; routing only reads). */
export interface HazardSignalRepository {
  findAll(): Promise<HazardSignal[]>;
}

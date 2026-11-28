import { sql } from "drizzle-orm";
import type { SignalRepository } from "../../../application/ports/out/signal-repository.js";
import type { HazardSignal } from "../../../domain/hazard-signal.js";
import type { Db } from "./client.js";
import { hazardSignals } from "./schema.js";

export class PostgresSignalRepository implements SignalRepository {
  constructor(private readonly db: Db) {}

  async upsert(signals: readonly HazardSignal[]) {
    if (signals.length === 0) return;
    await this.db
      .insert(hazardSignals)
      .values(signals.map((s) => ({ ...s })))
      .onConflictDoUpdate({
        target: hazardSignals.id,
        set: {
          kind: sql`excluded.kind`, stage: sql`excluded.stage`, area: sql`excluded.area`, issuedAt: sql`excluded.issued_at`,
          expectedAt: sql`excluded.expected_at`, expiresAt: sql`excluded.expires_at`, confidence: sql`excluded.confidence`,
          provenance: sql`excluded.provenance`,
        },
      });
  }

  async list(): Promise<HazardSignal[]> {
    return this.db.select().from(hazardSignals);
  }
}

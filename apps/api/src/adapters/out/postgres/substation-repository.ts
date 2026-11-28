import { asc, count, eq } from "drizzle-orm";
import type { SubstationRepository } from "../../../application/ports/out/substation-repository.js";
import type { Substation } from "../../../domain/substation.js";
import type { Db } from "./client.js";
import { substations } from "./schema.js";

export class PostgresSubstationRepository implements SubstationRepository {
  constructor(private readonly db: Db) {}

  async replaceForMunicipality(municipalityId: string, items: readonly Substation[]) {
    await this.db.transaction(async (tx) => {
      await tx.delete(substations).where(eq(substations.municipalityId, municipalityId));
      if (items.length === 0) return;
      await tx.insert(substations).values(
        items.map((s) => ({
          municipalityId,
          osmRef: s.osmRef,
          name: s.name,
          voltagesKv: [...s.voltagesKv],
          operator: s.operator,
          lng: s.location.lng,
          lat: s.location.lat,
        })),
      );
    });
  }

  async listByMunicipality(municipalityId: string) {
    const rows = await this.db
      .select()
      .from(substations)
      .where(eq(substations.municipalityId, municipalityId))
      .orderBy(asc(substations.name));
    return rows.map(
      (r): Substation => ({
        osmRef: r.osmRef,
        name: r.name,
        voltagesKv: r.voltagesKv,
        operator: r.operator,
        location: { lng: r.lng, lat: r.lat },
      }),
    );
  }

  async countByMunicipality() {
    const rows = await this.db
      .select({ id: substations.municipalityId, n: count() })
      .from(substations)
      .groupBy(substations.municipalityId);
    return Object.fromEntries(rows.map((r) => [r.id, r.n]));
  }
}

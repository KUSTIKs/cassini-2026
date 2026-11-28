import { and, count, eq, isNull, max } from "drizzle-orm";
import type { RegisterRepository, RegisterStats } from "../../../application/ports/out/register-repository.js";
import type { RegisteredPerson } from "../../../domain/registered-person.js";
import type { SubstationLink } from "../../../domain/substation-assignment.js";
import type { Db } from "./client.js";
import { registeredPeople } from "./schema.js";

export class PostgresRegisterRepository implements RegisterRepository {
  constructor(private readonly db: Db) {}

  async replaceForMunicipality(municipalityId: string, people: readonly RegisteredPerson[], importedAt: Date) {
    await this.db.transaction(async (tx) => {
      await tx.delete(registeredPeople).where(eq(registeredPeople.municipalityId, municipalityId));
      if (people.length === 0) return;
      await tx.insert(registeredPeople).values(
        people.map((p) => ({
          id: p.id,
          municipalityId,
          externalRef: p.externalRef,
          fullName: p.fullName,
          address: p.address,
          lng: p.location.lng,
          lat: p.location.lat,
          device: p.device,
          backupHours: p.backupHours,
          livesAlone: p.livesAlone,
          floor: p.floor,
          mobility: p.mobility,
          phone: p.phone,
          carerName: p.carerName,
          carerPhone: p.carerPhone,
          substationRef: p.substationRef,
          importedAt,
        })),
      );
    });
  }

  async listLocations(municipalityId: string) {
    const rows = await this.db
      .select({ id: registeredPeople.id, lng: registeredPeople.lng, lat: registeredPeople.lat })
      .from(registeredPeople)
      .where(eq(registeredPeople.municipalityId, municipalityId));
    return rows.map((r) => ({ id: r.id, location: { lng: r.lng, lat: r.lat } }));
  }

  async setSubstationLinks(municipalityId: string, links: readonly SubstationLink[]) {
    if (links.length === 0) return;
    await this.db.transaction(async (tx) => {
      for (const link of links) {
        await tx
          .update(registeredPeople)
          .set({ substationRef: link.substationRef })
          .where(and(eq(registeredPeople.municipalityId, municipalityId), eq(registeredPeople.id, link.personId)));
      }
    });
  }

  async stats(municipalityId: string): Promise<RegisterStats> {
    const scope = eq(registeredPeople.municipalityId, municipalityId);
    const [byDevice, bySubstation, [unlinked], [latest]] = await Promise.all([
      this.db.select({ key: registeredPeople.device, n: count() }).from(registeredPeople).where(scope).groupBy(registeredPeople.device),
      this.db.select({ key: registeredPeople.substationRef, n: count() }).from(registeredPeople).where(scope).groupBy(registeredPeople.substationRef),
      this.db.select({ n: count() }).from(registeredPeople).where(and(scope, isNull(registeredPeople.substationRef))),
      this.db.select({ at: max(registeredPeople.importedAt) }).from(registeredPeople).where(scope),
    ]);
    const devices = { ventilator: 0, oxygen_concentrator: 0, other: 0 };
    for (const d of byDevice) devices[d.key] = d.n;
    return {
      total: byDevice.reduce((sum, d) => sum + d.n, 0),
      byDevice: devices,
      bySubstation: Object.fromEntries(bySubstation.filter((s) => s.key !== null).map((s) => [s.key, s.n])),
      unlinked: unlinked?.n ?? 0,
      importedAt: latest?.at ?? null,
    };
  }

  async countByMunicipality() {
    const rows = await this.db
      .select({ id: registeredPeople.municipalityId, n: count() })
      .from(registeredPeople)
      .groupBy(registeredPeople.municipalityId);
    return Object.fromEntries(rows.map((r) => [r.id, r.n]));
  }
}

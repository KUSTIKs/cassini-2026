import { asc, eq } from "drizzle-orm";
import type { MunicipalityRepository } from "../../../application/ports/out/municipality-repository.js";
import type { Municipality, MunicipalityArea } from "../../../domain/municipality.js";
import type { Db } from "./client.js";
import { municipalities } from "./schema.js";

type Row = typeof municipalities.$inferSelect;

const toDomain = (row: Row): Municipality => ({
  id: row.id,
  name: row.name,
  region: row.region,
  contact: { name: row.contactName, phone: row.contactPhone, email: row.contactEmail },
  area:
    row.areaGeometry && row.areaLabel && row.areaOsmRef
      ? { label: row.areaLabel, osmRef: row.areaOsmRef, geometry: row.areaGeometry }
      : null,
  createdAt: row.createdAt,
});

export class PostgresMunicipalityRepository implements MunicipalityRepository {
  constructor(private readonly db: Db) {}

  async create(m: Municipality) {
    await this.db.insert(municipalities).values({
      id: m.id,
      name: m.name,
      region: m.region,
      contactName: m.contact.name,
      contactPhone: m.contact.phone,
      contactEmail: m.contact.email,
      createdAt: m.createdAt,
    });
  }

  async list() {
    const rows = await this.db.select().from(municipalities).orderBy(asc(municipalities.name));
    return rows.map(toDomain);
  }

  async get(id: string) {
    const [row] = await this.db.select().from(municipalities).where(eq(municipalities.id, id)).limit(1);
    return row ? toDomain(row) : null;
  }

  async setArea(id: string, area: MunicipalityArea) {
    await this.db
      .update(municipalities)
      .set({ areaLabel: area.label, areaOsmRef: area.osmRef, areaGeometry: area.geometry })
      .where(eq(municipalities.id, id));
  }
}

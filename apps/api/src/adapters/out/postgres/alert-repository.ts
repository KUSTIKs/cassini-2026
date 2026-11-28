import { and, desc, eq } from "drizzle-orm";
import type { AlertRepository } from "../../../application/ports/out/alert-repository.js";
import type { Alert } from "../../../domain/alert.js";
import type { Db } from "./client.js";
import { alerts } from "./schema.js";

export class PostgresAlertRepository implements AlertRepository {
  constructor(private readonly db: Db) {}

  async findActive(municipalityId: string) {
    const [row] = await this.db.select().from(alerts).where(and(eq(alerts.municipalityId, municipalityId), eq(alerts.status, "active")));
    return row ?? null;
  }

  async get(id: string) {
    const [row] = await this.db.select().from(alerts).where(eq(alerts.id, id));
    return row ?? null;
  }

  async listByMunicipality(municipalityId: string): Promise<Alert[]> {
    return this.db.select().from(alerts).where(eq(alerts.municipalityId, municipalityId)).orderBy(desc(alerts.openedAt));
  }

  async save(alert: Alert) {
    const { id, ...rest } = alert;
    const values = { ...rest, signalIds: [...alert.signalIds], substations: [...alert.substations], people: [...alert.people] };
    await this.db.insert(alerts).values({ id, ...values }).onConflictDoUpdate({ target: alerts.id, set: values });
  }
}

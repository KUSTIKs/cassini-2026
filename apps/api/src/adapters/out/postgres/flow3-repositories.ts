import { and, asc, eq, ne } from "drizzle-orm";
import type { AuditRepository } from "../../../application/ports/out/audit-repository.js";
import type { ContactRepository } from "../../../application/ports/out/contact-repository.js";
import type { TaskRepository } from "../../../application/ports/out/task-repository.js";
import type { AuditEntry } from "../../../domain/audit.js";
import type { Bring, ContactRecord } from "../../../domain/contact.js";
import type { Task } from "../../../domain/task.js";
import type { Db } from "./client.js";
import { auditLog, contactRecords, tasks } from "./schema.js";

/** Persistence for Flow 3: call outcomes, fire-service tasks and the access log. */

export class PostgresContactRepository implements ContactRepository {
  constructor(private readonly db: Db) {}
  async append(r: ContactRecord) {
    await this.db.insert(contactRecords).values({ ...r, bring: [...r.bring] });
  }
  async listByAlert(alertId: string): Promise<ContactRecord[]> {
    const rows = await this.db.select().from(contactRecords).where(eq(contactRecords.alertId, alertId)).orderBy(asc(contactRecords.at));
    return rows.map(({ id: _id, bring, ...r }) => ({ ...r, bring: bring as Bring[] }));
  }
}

const toTask = (row: typeof tasks.$inferSelect): Task => ({ ...row, bring: row.bring as Bring[] });

export class PostgresTaskRepository implements TaskRepository {
  constructor(private readonly db: Db) {}
  async findOpen(alertId: string, personId: string) {
    const [row] = await this.db.select().from(tasks)
      .where(and(eq(tasks.alertId, alertId), eq(tasks.personId, personId), ne(tasks.state, "done")));
    return row ? toTask(row) : null;
  }
  async listByAlert(alertId: string) {
    return (await this.db.select().from(tasks).where(eq(tasks.alertId, alertId))).map(toTask);
  }
  async save(task: Task) {
    const values = { ...task, bring: [...task.bring] };
    await this.db.insert(tasks).values(values).onConflictDoUpdate({ target: tasks.id, set: values });
  }
}

export class PostgresAuditRepository implements AuditRepository {
  constructor(private readonly db: Db) {}
  async append(entry: AuditEntry) {
    await this.db.insert(auditLog).values(entry);
  }
  async listByAlert(alertId: string) {
    return this.db.select().from(auditLog).where(eq(auditLog.alertId, alertId)).orderBy(asc(auditLog.at));
  }
}

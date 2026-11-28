import type { AuditEntry } from "../../../domain/audit.js";

export interface AuditRepository {
  append(entry: AuditEntry): Promise<void>;
  listByAlert(alertId: string): Promise<AuditEntry[]>;
}

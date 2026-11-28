import type { ContactRecord } from "../../../domain/contact.js";

/** Append-only: every call outcome is kept, the latest one is the person's state. */
export interface ContactRepository {
  append(record: ContactRecord): Promise<void>;
  listByAlert(alertId: string): Promise<ContactRecord[]>;
}

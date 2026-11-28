/**
 * Every access to a named person is logged: who, in which role, what, when (TECH.md data model).
 * The log is append-only and is how the town shows the data was used only for the emergency.
 */
export type AuditAction = "view_list" | "view_person" | "status_change" | "export";

export type AuditEntry = {
  readonly id: string;
  readonly at: Date;
  readonly userId: string;
  readonly action: AuditAction;
  readonly alertId: string;
  readonly personId: string | null;
};

import type { Task } from "../../../domain/task.js";

export interface TaskRepository {
  /** The person's task on this alert that isn't done yet, if any. */
  findOpen(alertId: string, personId: string): Promise<Task | null>;
  listByAlert(alertId: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
}

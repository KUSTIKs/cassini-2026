import type { Task } from "../../../domain/task.js";

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  /** Tasks not yet done, optionally for one crew. */
  findOpen(filter?: { crewId?: string }): Promise<Task[]>;
  save(task: Task): Promise<void>;
}

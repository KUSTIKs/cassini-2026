import type { LonLat } from "../../../domain/geo.js";
import type { Task } from "../../../domain/task.js";

export type OpenTaskView = { task: Task; destination: LonLat | null };

/** Crew view: the crew's open tasks with where each person is. */
export interface ListOpenTasks {
  execute(input: { crewId?: string }): Promise<OpenTaskView[]>;
}

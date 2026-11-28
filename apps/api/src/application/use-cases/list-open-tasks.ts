import type { ListOpenTasks, OpenTaskView } from "../ports/in/list-open-tasks.js";
import type { PersonLocationRepository } from "../ports/out/person-location-repository.js";
import type { TaskRepository } from "../ports/out/task-repository.js";

export class ListOpenTasksUseCase implements ListOpenTasks {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly people: PersonLocationRepository,
  ) {}

  async execute({ crewId }: { crewId?: string }): Promise<OpenTaskView[]> {
    const open = await this.tasks.findOpen(crewId === undefined ? {} : { crewId });
    const views = await Promise.all(open.map(async (task) => ({ task, destination: await this.people.findLocation(task.personId) })));
    return views.sort((a, b) => a.task.id.localeCompare(b.task.id));
  }
}

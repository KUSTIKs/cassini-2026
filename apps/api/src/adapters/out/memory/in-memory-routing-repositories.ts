import type { PersonLocationRepository } from "../../../application/ports/out/person-location-repository.js";
import type { TaskRepository } from "../../../application/ports/out/task-repository.js";
import type { LonLat } from "../../../domain/geo.js";
import { isOpen, type Task } from "../../../domain/task.js";

/** DRIVEN ADAPTERS for crew routing in tests and the replay demo (no database). Copies on read and write. */
export class InMemoryTaskRepository implements TaskRepository {
  private readonly items = new Map<string, Task>();

  constructor(tasks: Task[] = []) {
    for (const t of tasks) this.items.set(t.id, structuredClone(t));
  }

  async findById(id: string) {
    const t = this.items.get(id);
    return t ? structuredClone(t) : null;
  }

  async findOpen(filter: { crewId?: string } = {}) {
    return [...this.items.values()]
      .filter((t) => isOpen(t) && (filter.crewId === undefined || t.crewId === filter.crewId))
      .map((t) => structuredClone(t));
  }

  async save(task: Task) {
    this.items.set(task.id, structuredClone(task));
  }
}

export class InMemoryPersonLocationRepository implements PersonLocationRepository {
  constructor(private readonly locations: Record<string, LonLat>) {}

  async findLocation(personId: string) {
    const p = this.locations[personId];
    return p ? ([p[0], p[1]] as LonLat) : null;
  }
}

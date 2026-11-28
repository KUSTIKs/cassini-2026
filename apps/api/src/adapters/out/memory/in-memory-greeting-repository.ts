import type { GreetingRepository } from "../../../application/ports/out/greeting-repository.js";
import { createGreeting, type Greeting } from "../../../domain/greeting.js";

/** DRIVEN ADAPTER for tests and running without a database. */
export class InMemoryGreetingRepository implements GreetingRepository {
  private readonly items: Greeting[];

  constructor(messages: string[] = []) {
    this.items = messages.map(createGreeting);
  }

  async findLatest() {
    return this.items.at(-1) ?? null;
  }
}

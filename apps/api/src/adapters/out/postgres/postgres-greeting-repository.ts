import { desc } from "drizzle-orm";
import type { GreetingRepository } from "../../../application/ports/out/greeting-repository.js";
import { createGreeting } from "../../../domain/greeting.js";
import type { Db } from "./client.js";
import { greetings } from "./schema.js";

/** DRIVEN ADAPTER: implements the repository port with Postgres via Drizzle. */
export class PostgresGreetingRepository implements GreetingRepository {
  constructor(private readonly db: Db) {}

  async findLatest() {
    const [row] = await this.db
      .select({ message: greetings.message })
      .from(greetings)
      .orderBy(desc(greetings.id))
      .limit(1);
    // Map persistence row -> domain object (never leak rows upward).
    return row ? createGreeting(row.message) : null;
  }
}

import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/** Persistence model. Belongs to the Postgres adapter, NOT the domain. */
export const greetings = pgTable("greetings", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

import { loadConfig } from "../../../composition/config.js";
import { createDb } from "./client.js";
import { greetings } from "./schema.js";

const { databaseUrl } = loadConfig();
const { db, close } = createDb(databaseUrl);
await db.insert(greetings).values({ message: "Hello from Postgres 👋" });
await close();
console.log("seeded");

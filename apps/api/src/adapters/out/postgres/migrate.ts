import { migrate } from "drizzle-orm/postgres-js/migrator";
import { loadConfig } from "../../../composition/config.js";
import { createDb } from "./client.js";

const { databaseUrl } = loadConfig();
const { db, close } = createDb(databaseUrl);
await migrate(db, { migrationsFolder: new URL("../../../../drizzle", import.meta.url).pathname });
await close();
console.log("migrations applied");

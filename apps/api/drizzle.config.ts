import { defineConfig } from "drizzle-kit";

try { process.loadEnvFile(); } catch { /* .env is optional */ }

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/adapters/out/postgres/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});

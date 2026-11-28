export type Config = {
  databaseUrl: string;
  port: number;
  webOrigin: string;
};

export function loadConfig(): Config {
  try { process.loadEnvFile(); } catch { /* .env is optional; real env wins */ }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set (see apps/api/.env.example)");
  return {
    databaseUrl,
    port: Number(process.env.PORT ?? 4000),
    webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  };
}

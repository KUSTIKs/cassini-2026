import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { BBox } from "../domain/geo.js";

/** Repo-level data/osm, found by walking up so it works from src/ (tsx) and dist/ (bundled). */
const findOsmDataDir = (): string => {
  if (process.env.OSM_DATA_DIR) return resolve(process.env.OSM_DATA_DIR);
  for (let dir = dirname(fileURLToPath(import.meta.url)); ; dir = dirname(dir)) {
    const candidate = join(dir, "data", "osm");
    if (existsSync(candidate)) return candidate;
    if (dirname(dir) === dir) throw new Error("data/osm not found; set OSM_DATA_DIR");
  }
};

export type Config = {
  databaseUrl: string;
  port: number;
  webOrigin: string;
  nominatimUrl: string;
  overpassUrls: string[];
  /** Signs session tokens. Must be set in production. */
  sessionSecret: string;
  /** Lets anyone sign in as any user, without credentials. For the hackathon demo only. */
  demoSignIn: boolean;
  /** Saved Overpass responses used when live OSM is unavailable. */
  substationSnapshots: Array<{ file: string; coverage: BBox }>;
};

/** The only place that reads process.env. */
export const loadConfig = (): Config => {
  try { process.loadEnvFile(); } catch { /* .env is optional; real env wins */ }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set (see apps/api/.env.example)");
  const production = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET ?? (production ? "" : "dev-only-session-secret-change-me");
  if (sessionSecret.length < 16) throw new Error("SESSION_SECRET must be set to at least 16 characters");
  return {
    databaseUrl,
    sessionSecret,
    demoSignIn: (process.env.DEMO_SIGN_IN ?? "true") === "true",
    port: Number(process.env.PORT ?? 4000),
    webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    nominatimUrl: process.env.NOMINATIM_URL ?? "https://nominatim.openstreetmap.org",
    overpassUrls: (
      process.env.OVERPASS_URLS ??
      "https://overpass-api.de/api/interpreter,https://maps.mail.ru/osm/tools/overpass/api/interpreter,https://overpass.private.coffee/api/interpreter"
    ).split(",").map((u) => u.trim()).filter(Boolean),
    substationSnapshots: [
      {
        file: join(findOsmDataDir(), "krnov-substations.overpass.json"),
        coverage: { south: 50.04, west: 17.58, north: 50.15, east: 17.78 },
      },
      {
        file: join(findOsmDataDir(), "jesenik-substations.overpass.json"),
        coverage: { south: 50.15, west: 17.14, north: 50.27, east: 17.31 },
      },
    ],
  };
};

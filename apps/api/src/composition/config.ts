import { resolve } from "node:path";
import type { LonLat } from "../domain/geo.js";

export type RoutingConfig =
  | { kind: "fixture" }
  | { kind: "recorded"; path: string }
  | { kind: "ors"; apiKey: string; baseUrl?: string; profile?: string };

export type Config = {
  databaseUrl: string;
  port: number;
  webOrigin: string;
  /**
   * ROUTING=fixture (offline schematic, default), ROUTING=recorded (real ORS routes replayed offline,
   * fixture for anything not recorded) or ROUTING=ors (live, needs ORS_API_KEY).
   */
  routing: RoutingConfig;
  /** Where crews start when the phone sends no position (replay). Default: Krnov fire station. */
  crewStart: LonLat;
};

/** [real] fire station, OSM node 13992959691 (JPO 811804), Krnov. See krnov-replay.ts for why not the central one. */
const KRNOV_FIRE_STATION: LonLat = [17.6807149, 50.0944742];

export function loadConfig(): Config {
  try { process.loadEnvFile(); } catch { /* .env is optional; real env wins */ }
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set (see apps/api/.env.example)");
  return {
    databaseUrl,
    port: Number(process.env.PORT ?? 4000),
    webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    routing: routingFromEnv(process.env),
    crewStart: process.env.CREW_START ? parseLonLat(process.env.CREW_START) : KRNOV_FIRE_STATION,
  };
}

export function routingFromEnv(env: NodeJS.ProcessEnv): RoutingConfig {
  const kind = env.ROUTING ?? "fixture";
  if (kind === "fixture") return { kind };
  if (kind === "recorded") return { kind, path: recordedRoutesPath(env) };
  if (kind === "ors") {
    if (!env.ORS_API_KEY) throw new Error("ROUTING=ors needs ORS_API_KEY (see apps/api/.env.example)");
    return {
      kind,
      apiKey: env.ORS_API_KEY,
      ...(env.ORS_BASE_URL ? { baseUrl: env.ORS_BASE_URL } : {}),
      ...(env.ORS_PROFILE ? { profile: env.ORS_PROFILE } : {}),
    };
  }
  throw new Error(`ROUTING must be "fixture", "recorded" or "ors", got "${kind}"`);
}

function parseLonLat(value: string): LonLat {
  const [lon, lat] = value.split(",").map(Number);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) throw new Error(`CREW_START must be "lon,lat", got "${value}"`);
  return [lon!, lat!];
}

/** Where `pnpm routes:record` writes and ROUTING=recorded reads (relative to apps/api by default). */
export function recordedRoutesPath(env: NodeJS.ProcessEnv): string {
  return resolve(env.RECORDED_ROUTES_PATH ?? "src/adapters/out/routing/fixtures/recorded-routes.json");
}

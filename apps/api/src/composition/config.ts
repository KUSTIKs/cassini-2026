import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { BBox, LonLat } from "../domain/geo.js";

/** Repo-level data/osm, found by walking up so it works from src/ (tsx) and dist/ (bundled). */
const findOsmDataDir = (): string => {
  if (process.env.OSM_DATA_DIR) return resolve(process.env.OSM_DATA_DIR);
  for (let dir = dirname(fileURLToPath(import.meta.url)); ; dir = dirname(dir)) {
    const candidate = join(dir, "data", "osm");
    if (existsSync(candidate)) return candidate;
    if (dirname(dir) === dir) throw new Error("data/osm not found; set OSM_DATA_DIR");
  }
};

export type RoutingConfig =
  | { kind: "fixture" }
  | { kind: "recorded"; path: string }
  | { kind: "ors"; apiKey: string; baseUrl?: string; profile?: string };

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
  /**
   * Crew routing: ROUTING=fixture (offline schematic, default), ROUTING=recorded (real ORS routes replayed
   * offline, fixture for anything not recorded) or ROUTING=ors (live, needs ORS_API_KEY).
   */
  routing: RoutingConfig;
  /** Where crews start when the phone sends no position (replay). Default: Krnov fire station. */
  crewStart: LonLat;
};

/** [real] fire station, OSM node 13992959691 (JPO 811804), Krnov. See krnov-replay.ts for why not the central one. */
const KRNOV_FIRE_STATION: LonLat = [17.6807149, 50.0944742];

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
    routing: routingFromEnv(process.env),
    crewStart: process.env.CREW_START ? parseLonLat(process.env.CREW_START) : KRNOV_FIRE_STATION,
  };
};

export const routingFromEnv = (env: NodeJS.ProcessEnv): RoutingConfig => {
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
};

const parseLonLat = (value: string): LonLat => {
  const [lon, lat] = value.split(",").map(Number);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) throw new Error(`CREW_START must be "lon,lat", got "${value}"`);
  return [lon!, lat!];
};

/** Where `pnpm routes:record` writes and ROUTING=recorded reads (relative to apps/api by default). */
export const recordedRoutesPath = (env: NodeJS.ProcessEnv): string =>
  resolve(env.RECORDED_ROUTES_PATH ?? "src/adapters/out/routing/fixtures/recorded-routes.json");

/**
 * Live OpenRouteService check + recorder for the Krnov replay.
 *
 * Routes every open replay task at the forecast stage and again at the satellite stage through the
 * REAL OpenRouteService, prints what happened, and saves the answers so `ROUTING=recorded` can
 * replay real road routes offline at the demo.
 *
 * Usage (from apps/api, with ORS_API_KEY in .env or the environment):
 *   pnpm routes:record
 */
import { writeFileSync } from "node:fs";
import {
  InMemoryHazardSignalRepository,
  InMemoryPersonLocationRepository,
  InMemoryTaskRepository,
} from "../src/adapters/out/memory/in-memory-routing-repositories.js";
import { krnovPersonLocations, krnovSignals, krnovTasks, REPLAY } from "../src/adapters/out/memory/krnov-replay.js";
import { OpenRouteServiceRoutingGateway } from "../src/adapters/out/routing/openrouteservice-routing-gateway.js";
import { RecordingRoutingGateway, type RecordedRoutes } from "../src/adapters/out/routing/recorded-routes.js";
import { PlanTaskRouteUseCase } from "../src/application/use-cases/plan-task-route.js";
import { loadConfig, recordedRoutesPath, routingFromEnv } from "../src/composition/config.js";

try { process.loadEnvFile(); } catch { /* optional */ }
const routing = routingFromEnv({ ...process.env, ROUTING: "ors" });
if (routing.kind !== "ors") throw new Error("unreachable");
const { crewStart } = loadConfig();

const recorder = new RecordingRoutingGateway(new OpenRouteServiceRoutingGateway(routing));
let failures = 0;

for (const [stage, now] of [["forecast", REPLAY.crewsDispatched], ["observed", REPLAY.satelliteUpdate]] as const) {
  const tasks = new InMemoryTaskRepository(krnovTasks());
  const plan = new PlanTaskRouteUseCase(
    tasks,
    new InMemoryPersonLocationRepository(krnovPersonLocations()),
    new InMemoryHazardSignalRepository(krnovSignals()),
    recorder,
    crewStart,
  );
  for (const task of await tasks.findOpen()) {
    try {
      const r = (await plan.execute({ taskId: task.id, now })).route!;
      const tail = r.destinationInHazard ? `, stops at last dry point, ${Math.round(r.walkRemainingM ?? 0)} m on foot/boat` : "";
      console.log(`✓ ${stage.padEnd(8)} ${task.id}: ${(r.distanceM / 1000).toFixed(2)} km, ${Math.round(r.durationS / 60)} min${tail}`);
    } catch (error) {
      failures++;
      console.log(`✗ ${stage.padEnd(8)} ${task.id}: ${error instanceof Error ? `${error.name}: ${error.message}` : error}`);
    }
  }
}

const out: RecordedRoutes = { recordedAt: new Date().toISOString(), provider: "openrouteservice", routes: recorder.recorded };
const file = recordedRoutesPath(process.env);
writeFileSync(file, JSON.stringify(out));
console.log(`\nSaved ${out.routes.length} routes to ${file}${failures ? ` (${failures} failed, see above)` : ""}`);
process.exitCode = failures ? 1 : 0;

import { Hono } from "hono";
import { cors } from "hono/cors";
import { requireUser, type AppEnv } from "./auth.js";
import { handleError } from "./errors.js";
import { areaRoutes } from "./routes/areas.js";
import { authRoutes, type AuthRouteDeps } from "./routes/auth.js";
import { municipalityRoutes, type MunicipalityRouteDeps } from "./routes/municipalities.js";
import { taskRoutes, type CrewRoutingDeps } from "./routes/tasks.js";

export type HttpDeps = MunicipalityRouteDeps &
  Parameters<typeof areaRoutes>[0] &
  AuthRouteDeps & {
    webOrigin: string;
    /** Crew routing (Flow 4/5). Optional so tests of other routes needn't build it. */
    crew?: CrewRoutingDeps;
  };

/**
 * DRIVING ADAPTER: translates HTTP <-> inbound ports.
 * Wire validation, status codes, sessions and DTO mapping live here; business rules do not.
 * Everything except /health and sign-in needs a session.
 */
export const createHttpApp = (deps: HttpDeps) => {
  const signedIn = requireUser(deps);
  const app = new Hono<AppEnv>()
    .use("*", cors({ origin: deps.webOrigin }))
    .onError(handleError)
    .get("/health", (c) => c.json({ ok: true }))
    .route("/", authRoutes(deps))
    .use("/municipalities/*", signedIn)
    .use("/municipalities", signedIn)
    .use("/areas/*", signedIn)
    .route("/municipalities", municipalityRoutes(deps))
    .route("/areas", areaRoutes(deps));
  if (deps.crew) app.use("/tasks/*", signedIn).use("/route-hazards", signedIn).route("/", taskRoutes(deps.crew));
  return app;
};

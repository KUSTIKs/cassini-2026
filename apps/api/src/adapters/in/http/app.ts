import { GreetingResponse } from "@lifeline/contracts";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { GetGreeting } from "../../../application/ports/in/get-greeting.js";
import { createTaskRoutes, type CrewRoutingDeps } from "./task-routes.js";

export type HttpDeps = {
  getGreeting: GetGreeting;
  storage: GreetingResponse["source"];
  webOrigin: string;
  /** Flow 4/5 crew routing; omitted in tests that only need the greeting. */
  crew?: CrewRoutingDeps;
};

/**
 * DRIVING ADAPTER: translates HTTP <-> inbound ports.
 * Validation of the wire format and status codes live here; business rules do not.
 */
export function createHttpApp(deps: HttpDeps) {
  const app = new Hono()
    .use("*", cors({ origin: deps.webOrigin }))
    .get("/health", (c) => c.json({ ok: true }))
    .get("/greeting", async (c) => {
      const greeting = await deps.getGreeting.execute();
      const body = GreetingResponse.parse({
        message: greeting.message,
        source: deps.storage,
        servedAt: new Date().toISOString(),
      });
      return c.json(body);
    });
  if (deps.crew) app.route("/", createTaskRoutes(deps.crew));
  return app;
}

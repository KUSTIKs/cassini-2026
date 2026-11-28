import { GreetingResponse } from "@lifeline/contracts";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { GetGreeting } from "../../../application/ports/in/get-greeting.js";

export type HttpDeps = {
  getGreeting: GetGreeting;
  storage: GreetingResponse["source"];
  webOrigin: string;
};

/**
 * DRIVING ADAPTER: translates HTTP <-> inbound ports.
 * Validation of the wire format and status codes live here; business rules do not.
 */
export function createHttpApp(deps: HttpDeps) {
  return new Hono()
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
}

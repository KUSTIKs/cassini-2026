import { Hono } from "hono";
import type { SearchAreas } from "../../../../application/ports/in/municipality-setup.js";
import type { AppEnv } from "../auth.js";

export const areaRoutes = (deps: { searchAreas: SearchAreas }) =>
  new Hono<AppEnv>().get("/search", async (c) => {
    const items = await deps.searchAreas.execute(c.get("actor"), c.req.query("q") ?? "");
    return c.json({ items });
  });

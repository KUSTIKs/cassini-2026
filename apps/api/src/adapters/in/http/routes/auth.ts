import { DemoSignInRequest } from "@firstreach/contracts";
import { Hono } from "hono";
import type { GetCurrentUser, ListUsers } from "../../../../application/ports/in/access.js";
import { requireUser, type AppEnv } from "../auth.js";
import { BadRequestError } from "../errors.js";
import { toUserSummary } from "../mappers.js";
import type { SessionCodec } from "../session.js";
import { parseWith } from "../validate.js";

export type AuthRouteDeps = {
  sessions: SessionCodec;
  getCurrentUser: GetCurrentUser;
  listUsers: ListUsers;
  clock: () => Date;
  /** Demo sign-in: pick any user, no credentials. Off unless the config turns it on. */
  demoSignIn: boolean;
};

export const authRoutes = (deps: AuthRouteDeps) => {
  const routes = new Hono<AppEnv>()
    .get("/me", requireUser(deps), (c) =>
      c.json({ user: toUserSummary(c.get("actor")), permissions: { createMunicipality: c.get("canCreateMunicipality") } }),
    );
  if (!deps.demoSignIn) return routes;

  return routes
    .get("/auth/demo-users", async (c) => c.json({ items: (await deps.listUsers.execute()).map(toUserSummary) }))
    .post("/auth/demo-sign-in", async (c) => {
      const { userId } = parseWith(DemoSignInRequest, await c.req.json().catch(() => null));
      if (!(await deps.getCurrentUser.execute(userId))) throw new BadRequestError("Unknown user.", { userId: "Unknown user." });
      const { token, expiresAt } = deps.sessions.issue(userId, deps.clock());
      return c.json({ token, expiresAt: expiresAt.toISOString() });
    });
};

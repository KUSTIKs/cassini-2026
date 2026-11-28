import { createMiddleware } from "hono/factory";
import type { GetCurrentUser } from "../../../application/ports/in/access.js";
import type { User } from "../../../domain/access.js";
import { UnauthenticatedError } from "./errors.js";
import type { SessionCodec } from "./session.js";

export type AppEnv = { Variables: { actor: User; canCreateMunicipality: boolean } };

/** Turns "Authorization: Bearer <token>" into the signed-in user, or answers 401. */
export const requireUser = (deps: { sessions: SessionCodec; getCurrentUser: GetCurrentUser; clock: () => Date }) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const header = c.req.header("Authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
    const userId = token ? deps.sessions.verify(token, deps.clock()) : null;
    const current = userId ? await deps.getCurrentUser.execute(userId) : null;
    if (!current) throw new UnauthenticatedError();
    c.set("actor", current.user);
    c.set("canCreateMunicipality", current.canCreateMunicipality);
    await next();
  });

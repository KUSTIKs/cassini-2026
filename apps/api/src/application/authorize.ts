import { can, type Permission, type User } from "../domain/access.js";
import { ForbiddenError } from "./errors.js";

/** Use cases call this first; it throws instead of returning, so a forgotten check fails loudly in tests. */
export const authorize = (actor: User, permission: Permission, municipalityId?: string) => {
  if (!can(actor, permission, municipalityId)) throw new ForbiddenError();
};

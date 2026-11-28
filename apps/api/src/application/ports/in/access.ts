import type { User } from "../../../domain/access.js";

/** Inbound ports for signing in. How a session is carried (cookie, token) is the HTTP adapter's business. */

export type CurrentUser = { user: User; canCreateMunicipality: boolean };
export interface GetCurrentUser {
  /** Null when the user no longer exists, so the session must end. */
  execute(userId: string): Promise<CurrentUser | null>;
}

export interface ListUsers {
  execute(): Promise<User[]>;
}

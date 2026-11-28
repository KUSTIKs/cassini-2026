import type { RoleGrant, User } from "../../../domain/access.js";

export interface UserRepository {
  create(user: User): Promise<void>;
  get(id: string): Promise<User | null>;
  list(): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  /** Adds the grant unless the user already holds it. */
  addGrant(userId: string, grant: RoleGrant): Promise<void>;
}

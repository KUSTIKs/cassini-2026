import { asc, eq, inArray, sql } from "drizzle-orm";
import type { UserRepository } from "../../../application/ports/out/user-repository.js";
import type { RoleGrant, User } from "../../../domain/access.js";
import type { Db } from "./client.js";
import { userRoles, users } from "./schema.js";

type UserRow = typeof users.$inferSelect;
type RoleRow = typeof userRoles.$inferSelect;

const toGrant = (row: RoleRow): RoleGrant | null => {
  if (row.role === "municipality_officer") return row.municipalityId ? { role: row.role, municipalityId: row.municipalityId } : null;
  return { role: row.role, municipalityId: null };
};

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  private async withGrants(rows: UserRow[]): Promise<User[]> {
    if (rows.length === 0) return [];
    const roles = await this.db.select().from(userRoles).where(inArray(userRoles.userId, rows.map((r) => r.id)));
    return rows.map((row) => ({
      ...row,
      grants: roles.filter((r) => r.userId === row.id).map(toGrant).filter((g): g is RoleGrant => g !== null),
    }));
  }

  async create(user: User) {
    await this.db.transaction(async (tx) => {
      await tx.insert(users).values({ id: user.id, name: user.name, email: user.email, organisation: user.organisation });
      if (user.grants.length > 0)
        await tx.insert(userRoles).values(user.grants.map((g) => ({ userId: user.id, role: g.role, municipalityId: g.municipalityId })));
    });
  }

  async get(id: string) {
    const [user] = await this.withGrants(await this.db.select().from(users).where(eq(users.id, id)));
    return user ?? null;
  }

  async list() {
    return this.withGrants(await this.db.select().from(users).orderBy(asc(users.name)));
  }

  async findByEmail(email: string) {
    const [user] = await this.withGrants(
      await this.db.select().from(users).where(sql`lower(${users.email}) = ${email.toLowerCase()}`),
    );
    return user ?? null;
  }

  async addGrant(userId: string, grant: RoleGrant) {
    await this.db.insert(userRoles).values({ userId, role: grant.role, municipalityId: grant.municipalityId }).onConflictDoNothing();
  }
}

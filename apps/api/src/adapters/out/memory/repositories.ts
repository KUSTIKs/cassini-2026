import type { UserRepository } from "../../../application/ports/out/user-repository.js";
import { sameGrant, type RoleGrant, type User } from "../../../domain/access.js";
import type { MunicipalityRepository } from "../../../application/ports/out/municipality-repository.js";
import type { RegisterRepository } from "../../../application/ports/out/register-repository.js";
import type { SubstationRepository } from "../../../application/ports/out/substation-repository.js";
import type { Municipality, MunicipalityArea } from "../../../domain/municipality.js";
import type { RegisteredPerson } from "../../../domain/registered-person.js";
import type { SubstationLink } from "../../../domain/substation-assignment.js";
import type { Substation } from "../../../domain/substation.js";

/** DRIVEN ADAPTERS kept in memory: for tests and for running without a database. */

export class InMemoryMunicipalityRepository implements MunicipalityRepository {
  readonly items = new Map<string, Municipality>();
  async create(m: Municipality) { this.items.set(m.id, m); }
  async list() { return [...this.items.values()].sort((a, b) => a.name.localeCompare(b.name)); }
  async get(id: string) { return this.items.get(id) ?? null; }
  async setArea(id: string, area: MunicipalityArea) {
    const m = this.items.get(id);
    if (m) this.items.set(id, { ...m, area });
  }
}

export class InMemorySubstationRepository implements SubstationRepository {
  readonly items = new Map<string, Substation[]>();
  async replaceForMunicipality(id: string, items: readonly Substation[]) { this.items.set(id, [...items]); }
  async listByMunicipality(id: string) { return this.items.get(id) ?? []; }
  async countByMunicipality() {
    return Object.fromEntries([...this.items].map(([id, list]) => [id, list.length]));
  }
}

export class InMemoryRegisterRepository implements RegisterRepository {
  readonly items = new Map<string, { people: RegisteredPerson[]; importedAt: Date }>();

  async replaceForMunicipality(id: string, people: readonly RegisteredPerson[], importedAt: Date) {
    this.items.set(id, { people: [...people], importedAt });
  }
  async listLocations(id: string) {
    return (this.items.get(id)?.people ?? []).map((p) => ({ id: p.id, location: p.location }));
  }
  async setSubstationLinks(id: string, links: readonly SubstationLink[]) {
    const entry = this.items.get(id);
    if (!entry) return;
    const byPerson = new Map(links.map((l) => [l.personId, l.substationRef]));
    entry.people = entry.people.map((p) =>
      byPerson.has(p.id) ? { ...p, substationRef: byPerson.get(p.id) ?? null } : p,
    );
  }
  async stats(id: string) {
    const entry = this.items.get(id);
    const people = entry?.people ?? [];
    const byDevice = { ventilator: 0, oxygen_concentrator: 0, other: 0 };
    const bySubstation: Record<string, number> = {};
    for (const p of people) {
      byDevice[p.device] += 1;
      if (p.substationRef) bySubstation[p.substationRef] = (bySubstation[p.substationRef] ?? 0) + 1;
    }
    return {
      total: people.length,
      byDevice,
      bySubstation,
      unlinked: people.filter((p) => p.substationRef === null).length,
      importedAt: entry?.importedAt ?? null,
    };
  }
  async countByMunicipality() {
    return Object.fromEntries([...this.items].map(([id, e]) => [id, e.people.length]));
  }
}

export class InMemoryUserRepository implements UserRepository {
  readonly items = new Map<string, User>();
  async create(user: User) { this.items.set(user.id, user); }
  async get(id: string) { return this.items.get(id) ?? null; }
  async list() { return [...this.items.values()]; }
  async findByEmail(email: string) {
    return [...this.items.values()].find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
  }
  async addGrant(userId: string, grant: RoleGrant) {
    const user = this.items.get(userId);
    if (user && !user.grants.some((g) => sameGrant(g, grant))) this.items.set(userId, { ...user, grants: [...user.grants, grant] });
  }
}
